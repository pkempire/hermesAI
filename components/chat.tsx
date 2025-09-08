'use client'

import { CHAT_ID } from '@/lib/constants'
import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import { ChatRequestOptions, JSONValue, type UIMessage as Message } from 'ai'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'

// Define section structure
interface ChatSection {
  id: string // User message ID
  userMessage: Message
  assistantMessages: Message[]
}

export function Chat({
  id,
  savedMessages = [],
  query,
  models
}: {
  id: string
  savedMessages?: Message[]
  query?: string
  models?: Model[]
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showProgressTracker, setShowProgressTracker] = useState(false)
  const [currentCampaignStep, setCurrentCampaignStep] = useState(1)
  const [campaignPercent, setCampaignPercent] = useState(20)
  const [totalCampaignSteps, setTotalCampaignSteps] = useState(5)
  const [campaignStepLabel, setCampaignStepLabel] = useState('Configure Prospect Search')
  const [inputValue, setInputValue] = useState('')
  const [uiData, setUiData] = useState<JSONValue[]>([])

  const chatHook = useChat({
    id: CHAT_ID,
    body: {
      id
    },
    onFinish: () => {
      window.history.replaceState({}, '', `/search/${id}`)
      window.dispatchEvent(new CustomEvent('chat-history-updated'))
    },
    onData: (part: any) => {
      try {
        const data = (part as any)?.data ?? part
        if (!data) return
        // Normalize v5 custom chunks to a flat shape in uiData
        if ((part as any)?.type === 'message-metadata' && (part as any)?.messageMetadata?.type === 'tool_call') {
          setUiData(prev => [...prev, { type: 'tool_call', data: (part as any).messageMetadata.data }])
        } else if ((part as any)?.type?.startsWith?.('data-')) {
          const normalizedType = (part as any).type.replace('data-', '')
          setUiData(prev => [...prev, { type: normalizedType, data: (part as any).data }])
        } else if (data) {
          setUiData(prev => [...prev, data])
        }
      } catch {
        // no-op
      }
    },
    onError: (error: any) => {
      console.error('🔧 [Chat] useChat error:', error)
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: false, // Disable extra message fields,
    experimental_throttle: 100
  } as any)

  // AI SDK v5 returns sendMessage, not append - and no input management
  const {
    messages,
    status,
    setMessages,
    stop,
    sendMessage,
    error,
    clearError,
    regenerate,
    addToolResult
  } = chatHook
  
  // Create append alias for compatibility with existing code
  const append = sendMessage
  
  // Manually manage input state (AI SDK v5 doesn't provide this)
  const input = inputValue
  const setInput = setInputValue
  
  // Create handleInputChange for compatibility
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }

  const isLoading = status === 'submitted' || status === 'streaming'
  
  console.log('🔧 [Chat] AI SDK v5 hook values:', { 
    sendMessageExists: typeof sendMessage === 'function',
    inputValue: input,
    setInputExists: typeof setInput === 'function',
    messagesLength: messages.length,
    status,
    isLoading,
    error: error
  })

  // Detect when prospect search tool is being used
  useEffect(() => {
    const hasProspectSearchTool = messages.some((message: any) => 
      message.role === 'assistant' && 
      (message?.annotations)?.some((annotation: any) => 
        annotation?.type === 'tool_call' && 
        annotation?.data?.toolName === 'prospect_search'
      )
    )
    
    if (hasProspectSearchTool && !showProgressTracker) {
      setShowProgressTracker(true)
      setCurrentCampaignStep(1)
      setCampaignPercent(20)
    }

    // Proactive intro for first-time users
    if (messages.length === 1 && messages[0]?.role === 'user') {
      // no-op: rely on model system prompt to introduce; keep UI side-effects minimal
    }
  }, [messages, showProgressTracker])

  // Update campaign progress from pipeline events
  useEffect(() => {
    if (!uiData || !Array.isArray(uiData) || uiData.length === 0) return
    const lastPipeline = [...uiData].reverse().find((d: any) => d?.type === 'pipeline') as any
    if (!lastPipeline) return
    try {
      const payload = lastPipeline.data || lastPipeline
      if (payload?.stepNumber) setCurrentCampaignStep(payload.stepNumber)
      if (payload?.totalSteps) setTotalCampaignSteps(payload.totalSteps)
      if (typeof payload?.percent === 'number') setCampaignPercent(payload.percent)
      if (payload?.label) setCampaignStepLabel(payload.label)
      if (!showProgressTracker) setShowProgressTracker(true)
    } catch {}
  }, [uiData, showProgressTracker])

  // Also listen to window events from sections for progress updates
  useEffect(() => {
    const handler = (e: any) => {
      const d = e?.detail
      if (!d) return
      if (d.stepNumber) setCurrentCampaignStep(d.stepNumber)
      if (d.totalSteps) setTotalCampaignSteps(d.totalSteps)
      if (typeof d.percent === 'number') setCampaignPercent(d.percent)
      if (d.label) setCampaignStepLabel(d.label)
      if (!showProgressTracker) setShowProgressTracker(true)
    }
    window.addEventListener('pipeline-progress', handler as any)
    return () => window.removeEventListener('pipeline-progress', handler as any)
  }, [showProgressTracker])

  // Surface short assistant suggestions emitted by sections
  useEffect(() => {
    const handler = (e: any) => {
      const text = e?.detail?.text
      if (!text) return
      setMessages((prev: any) => ([...prev, { id: crypto.randomUUID?.() || String(Date.now()), role: 'assistant', parts: [{ type: 'text', text }] }]))
    }
    window.addEventListener('chat-system-suggest', handler as any)
    return () => window.removeEventListener('chat-system-suggest', handler as any)
  }, [setMessages])

  // Convert messages array to sections array
  const sections = useMemo<ChatSection[]>(() => {
    const result: ChatSection[] = []
    let currentSection: ChatSection | null = null

    for (const message of messages) {
      if (message.role === 'user') {
        // Start a new section when a user message is found
        if (currentSection) {
          result.push(currentSection)
        }
        currentSection = {
          id: message.id,
          userMessage: message,
          assistantMessages: []
        }
      } else if (
        currentSection && ((message.role as any) === 'assistant' || (message.role as any) === 'tool')
      ) {
        // Add assistant or tool message to the current section
        currentSection.assistantMessages.push(message)
      }
      // Ignore other role types like 'system' for now
    }

    // Add the last section if exists
    if (currentSection) {
      result.push(currentSection)
    }

    return result
  }, [messages])

  // Detect if scroll container is at the bottom
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = 50 // threshold in pixels
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        setIsAtBottom(true)
      } else {
        setIsAtBottom(false)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Set initial state

    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to the section when a new user message is sent
  useEffect(() => {
    if (sections.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        // If the last message is from user, find the corresponding section
        const sectionId = lastMessage.id
        requestAnimationFrame(() => {
          const sectionElement = document.getElementById(`section-${sectionId}`)
          sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  }, [sections, messages])

  useEffect(() => {
    if (savedMessages?.length) setMessages(savedMessages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Restore any saved draft after login
  useEffect(() => {
    try {
      const draft = localStorage.getItem('hermes_draft')
      if (draft && !inputValue) {
        setInputValue(draft)
      }
    } catch {}
  }, [])

  const onQuerySelect = (query: string) => {
    append({ role: 'user', parts: [{ type: 'text', text: query }] } as any)
  }

  const handleUpdateAndReloadMessage = async (
    messageId: string,
    newContent: string
  ) => {
    setMessages(((currentMessages: any) =>
      currentMessages.map((msg: any) =>
        msg.id === messageId
          ? { ...msg, parts: [{ type: 'text', text: newContent }] }
          : msg
      )
    ) as any)

    try {
      const messageIndex = messages.findIndex(msg => msg.id === messageId)
      if (messageIndex === -1) return

      const messagesUpToEdited = messages.slice(0, messageIndex + 1)

      setMessages(messagesUpToEdited)

      // Reload not supported in this v5 setup; no-op
      void 0
    } catch (error) {
      console.error('Failed to reload after message update:', error)
      toast.error(`Failed to reload conversation: ${(error as Error).message}`)
    }
  }

  const handleReloadFrom = async (_messageId: string, _options?: ChatRequestOptions) => {
    return null
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>, messageOverride?: string) => {
    e.preventDefault()
    console.log('🔧 [Frontend] =================== USER SUBMITTED MESSAGE ===================')
    
    // Use messageOverride if provided, otherwise use input value
    const messageToSend = messageOverride || input
    console.log('🔧 [Frontend] Message to send:', messageToSend)
    console.log('🔧 [Frontend] sendMessage function type:', typeof sendMessage)
    
    if (!messageToSend || messageToSend.trim().length === 0) {
      console.log('🔧 [Frontend] No message to submit')
      return
    }
    
    try {
      if (typeof sendMessage === 'function') {
        // If last assistant step is ask_question waiting for input, send as tool result
        try {
          const last = messages[messages.length - 1] as any
          const parts = (last?.parts || []) as any[]
          const lastPart = parts[parts.length - 1]
          const isAsk = lastPart?.type === 'tool-call' && lastPart?.toolName === 'ask_question'
          const toolCallId = isAsk ? lastPart.toolCallId : undefined
          if (isAsk && (chatHook as any)?.addToolResult) {
            ;(chatHook as any).addToolResult({ tool: 'ask_question', toolCallId, output: { type: 'text', value: messageToSend.trim() } })
            if (!messageOverride) setInput('')
            return
          }
        } catch {}

        sendMessage({ role: 'user', parts: [{ type: 'text', text: messageToSend.trim() }] } as any)
        if (!messageOverride) {
          setInput('')
        }
      } else {
        console.error('🔧 [Frontend] sendMessage is not a function:', sendMessage)
        toast.error('Chat functionality not ready, please refresh the page')
      }
    } catch (error) {
      console.error('🔧 [Frontend] Error submitting message:', error)
      toast.error(`Error submitting message: ${error}`)
    }
  }
  
  // Create a wrapper function for template submissions
  const submitTemplateMessage = (message: string) => {
    console.log('🔧 [Frontend] Template message submission:', message)
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>
    onSubmit(fakeEvent, message)
  }

  return (
    <div
      className={cn(
        'relative flex h-full min-w-0 min-h-0 flex-1 overflow-hidden',
        messages.length === 0 ? 'items-center justify-center' : ''
      )}
      data-testid="full-chat"
    >
      {showProgressTracker ? (
        // Campaign layout with compact progress at top; chat takes full width
        <div className="flex h-full relative z-10 flex-1 flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Campaign overview strip */}
            {showProgressTracker && (
              <div className="border-b border-border px-4 py-2 text-xs flex items-center justify-between bg-card/60">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Campaign</span>
                  <span className="text-muted-foreground">Step {currentCampaignStep} of {totalCampaignSteps}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 border rounded">Refresh</button>
                </div>
              </div>
            )}
            <ChatMessages
              sections={sections}
              data={uiData}
              onQuerySelect={onQuerySelect}
              isLoading={isLoading}
              chatId={id}
              addToolResult={({ toolCallId, output, tool }: any) => {
                // Adapter to legacy prop shape { toolCallId, result }
                if (typeof (chatHook as any)?.addToolResult === 'function') {
                  ;(chatHook as any).addToolResult({ tool, toolCallId, output })
                }
              }}
              scrollContainerRef={scrollContainerRef}
              onUpdateMessage={handleUpdateAndReloadMessage}
              reload={handleReloadFrom}
            />
            <ChatPanel
              input={input}
              handleInputChange={handleInputChange}
              setInput={setInput}
              handleSubmit={onSubmit}
              isLoading={isLoading}
              messages={messages}
              setMessages={setMessages}
              stop={stop}
              query={query}
              append={append}
              models={models}
              showScrollToBottomButton={!isAtBottom}
              scrollContainerRef={scrollContainerRef}
              submitTemplateMessage={submitTemplateMessage}
            />
          </div>
        </div>
      ) : (
        // Enhanced default layout with spatial depth
        <div className="flex flex-col flex-1 relative z-10">
          <div className="flex-1 relative overflow-hidden">
            <ChatMessages
              sections={sections}
              data={uiData}
              onQuerySelect={onQuerySelect}
              isLoading={isLoading}
              chatId={id}
              addToolResult={({ toolCallId, output, tool }: any) => {
                if (typeof (chatHook as any)?.addToolResult === 'function') {
                  ;(chatHook as any).addToolResult({ tool, toolCallId, output })
                }
              }}
              scrollContainerRef={scrollContainerRef}
              onUpdateMessage={handleUpdateAndReloadMessage}
              reload={handleReloadFrom}
            />
          </div>
          <div className="relative border-t border-border">
            <ChatPanel
              input={input}
              handleInputChange={handleInputChange}
              setInput={setInput}
              handleSubmit={onSubmit}
              isLoading={isLoading}
              messages={messages}
              setMessages={setMessages}
              stop={stop}
              query={query}
              append={append}
              models={models}
              showScrollToBottomButton={!isAtBottom}
              scrollContainerRef={scrollContainerRef}
              submitTemplateMessage={submitTemplateMessage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
