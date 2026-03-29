'use client'

import { Model } from '@/lib/types/models'
import { useChat } from '@ai-sdk/react'
import { ChatRequestOptions, DefaultChatTransport, JSONValue, type UIMessage as Message } from 'ai'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
  const stepsBrief = [
    'Configure Prospect Search',
    'Finding companies',
    'Discovery complete',
    'Draft emails',
    'Review & next steps'
  ]
  const [inputValue, setInputValue] = useState('')
  const [uiData, setUiData] = useState<JSONValue[]>([])

  const chatHook = useChat({
    id: id, // Use the actual chat ID from the URL, not a constant
    messages: savedMessages?.length ? savedMessages : undefined, // v5: renamed from initialMessages
    transport: new DefaultChatTransport({
      api: '/api/chat', // v5: use transport instead of direct api prop
    }),
    body: {
      id
    },
    onFinish: () => {
      // Keep the active workspace stable after a streamed response.
      // Saved chats can still be reopened from history without forcing
      // an immediate route change that depends on persistence timing.
      try {
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
      } catch {}
    },
    onData: (part: any) => {
      try {
        const data = (part as any)?.data ?? part
        if (!data) return
        // Handle custom data parts (pipeline events, etc.)
        // Tool-call and tool-result parts are handled automatically by useChat hook
        if ((part as any)?.type?.startsWith?.('data-')) {
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
      if (process.env.NODE_ENV !== 'production') {
        console.error('🔧 [Chat] useChat error:', error)
      }
      toast.error(`Error in chat: ${error?.message || 'An unexpected error occurred'}`)
    },
    // v5: sendExtraMessageFields removed - handled automatically
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
  
  // Detect when prospect search tool is being used
  useEffect(() => {
    const hasProspectSearchTool = messages.some((message: any) => {
      if (message.role !== 'assistant') return false

      const annotationMatch = (message?.annotations)?.some(
        (annotation: any) =>
          annotation?.type === 'tool_call' &&
          annotation?.data?.toolName === 'prospect_search'
      )

      if (annotationMatch) return true

      const parts = Array.isArray(message?.parts) ? message.parts : []
      return parts.some((part: any) => {
        if (part?.type === 'tool-call') {
          return part.toolName === 'prospect_search'
        }

        if (part?.type === 'tool-invocation') {
          return part?.toolInvocation?.toolName === 'prospect_search'
        }

        return false
      })
    })
    
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

  // Sync saved messages immediately on mount if useChat hook didn't load them
  const hasInitializedRef = useRef(false)
  useEffect(() => {
    if (hasInitializedRef.current) return
    // Wait a tick to ensure useChat has initialized
    const timer = setTimeout(() => {
      if (savedMessages?.length && messages.length === 0) {
        // useChat's initialMessages might not have loaded yet, force sync
        setMessages(savedMessages)
        hasInitializedRef.current = true
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [messages.length, savedMessages, setMessages]) // Include dependencies for ESLint, but use ref to prevent re-runs

  // Also sync when savedMessages change (e.g., after navigation or refresh)
  useEffect(() => {
    if (savedMessages?.length) {
      // Only update if messages are empty or if savedMessages has more content
      if (messages.length === 0 || (savedMessages.length > messages.length)) {
        setMessages(savedMessages)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedMessages])

  // Restore any saved draft after login
  useEffect(() => {
    try {
      const draft = localStorage.getItem('hermes_draft')
      if (draft && !inputValue) {
        setInputValue(draft)
      }
    } catch {}
  }, [inputValue])

  const onQuerySelect = (query: string) => {
    // Gate to sign-up if not authed
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d?.user?.id) {
          window.location.href = '/auth/sign-up'
          return
        }
        sendMessage({ text: query }) // v5: simplified message format
      })
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
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to reload after message update:', error)
      }
      toast.error(`Failed to reload conversation: ${(error as Error)?.message || 'Unknown error'}`)
    }
  }

  const handleReloadFrom = async (_messageId: string, _options?: ChatRequestOptions) => {
    return null
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>, messageOverride?: string) => {
    e.preventDefault()

    // Use messageOverride if provided, otherwise use input value
    const messageToSend = messageOverride || input

    if (!messageToSend || messageToSend.trim().length === 0) {
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
            // Treat short confirmations like "continue" as acceptance to proceed
            const normalized = messageToSend.trim().toLowerCase()
            const value = ['continue', 'proceed', 'go ahead', 'yes', 'yep', 'ok', 'okay'].includes(normalized)
              ? 'continue'
              : messageToSend.trim()
            ;(chatHook as any).addToolResult({ tool: 'ask_question', toolCallId, output: { type: 'text', value } })
            if (!messageOverride) setInput('')
            return
          }
        } catch {}

        sendMessage({ text: messageToSend.trim() }) // v5: simplified message format
        if (!messageOverride) {
          setInput('')
        }
      } else {
        toast.error('Chat functionality not ready, please refresh the page')
      }
    } catch (error) {
      toast.error(`Error submitting message: ${error}`)
    }
  }
  
  // Create a wrapper function for template submissions
  const submitTemplateMessage = (message: string) => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>
    onSubmit(fakeEvent, message)
  }

  return (
    <div
      className="relative flex min-w-0 min-h-0 flex-1 overflow-hidden bg-gray-50 pt-0 h-full"
      data-testid="full-chat"
    >
      {showProgressTracker ? (
        // Campaign layout with compact progress at top; chat takes full width
        <div className="flex h-full relative z-10 flex-1 flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Minimal campaign progress indicator */}
            {showProgressTracker && (
              <div className="border-b border-border/50 px-3 py-1.5 text-[10px] flex items-center justify-between bg-background/40 backdrop-blur-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-foreground/70 truncate">{stepsBrief[Math.min(currentCampaignStep-1, stepsBrief.length-1)]}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-24 h-0.5 bg-muted/50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full transition-all duration-300" style={{ width: `${campaignPercent}%` }} />
                  </div>
                  <span className="text-muted-foreground/60 tabular-nums">{Math.round(campaignPercent)}%</span>
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
        <div className={cn("flex flex-col flex-1 relative z-10 min-h-0", messages.length === 0 ? "overflow-y-auto" : "")}>
          <div className={cn("flex-1 relative min-h-0", messages.length === 0 ? "hidden" : "overflow-hidden")}>
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
          <div className={cn("relative", messages.length === 0 ? "min-h-full py-12" : "border-t border-border")}>
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
