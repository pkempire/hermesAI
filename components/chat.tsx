'use client'

import { CHAT_ID } from '@/lib/constants'
import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import { ChatRequestOptions, type UIMessage as Message } from 'ai'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CampaignProgressTracker } from './campaign-progress-tracker'
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

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    stop,
    append,
    data,
    setData,
    addToolResult,
    reload
  } = useChat({
    initialMessages: savedMessages,
    id: CHAT_ID,
    body: {
      id
    },
    onFinish: () => {
      window.history.replaceState({}, '', `/search/${id}`)
      window.dispatchEvent(new CustomEvent('chat-history-updated'))
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: false, // Disable extra message fields,
    experimental_throttle: 100
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Detect when prospect search tool is being used
  useEffect(() => {
    const hasProspectSearchTool = messages.some(message => 
      message.role === 'assistant' && 
      message.annotations?.some((annotation: any) => 
        annotation?.type === 'tool_call' && 
        annotation?.data?.toolName === 'prospect_search'
      )
    )
    
    if (hasProspectSearchTool && !showProgressTracker) {
      setShowProgressTracker(true)
      setCurrentCampaignStep(1)
    }
  }, [messages, showProgressTracker])

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
      } else if (currentSection && message.role === 'assistant') {
        // Add assistant message to the current section
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
    setMessages(savedMessages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const handleUpdateAndReloadMessage = async (
    messageId: string,
    newContent: string
  ) => {
    setMessages(currentMessages =>
      currentMessages.map(msg =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    )

    try {
      const messageIndex = messages.findIndex(msg => msg.id === messageId)
      if (messageIndex === -1) return

      const messagesUpToEdited = messages.slice(0, messageIndex + 1)

      setMessages(messagesUpToEdited)

      setData(undefined)

      await reload({
        body: {
          chatId: id,
          regenerate: true
        }
      })
    } catch (error) {
      console.error('Failed to reload after message update:', error)
      toast.error(`Failed to reload conversation: ${(error as Error).message}`)
    }
  }

  const handleReloadFrom = async (
    messageId: string,
    options?: ChatRequestOptions
  ) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex !== -1) {
      const userMessageIndex = messages
        .slice(0, messageIndex)
        .findLastIndex(m => m.role === 'user')
      if (userMessageIndex !== -1) {
        const trimmedMessages = messages.slice(0, userMessageIndex + 1)
        setMessages(trimmedMessages)
        return await reload(options)
      }
    }
    return await reload(options)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('🔧 [Frontend] =================== USER SUBMITTED MESSAGE ===================')
    console.log('🔧 [Frontend] Input value:', input)
    console.log('🔧 [Frontend] Current messages count:', messages.length)
    setData(undefined)
    handleSubmit(e)
  }

  return (
    <div
      className={cn(
        'relative flex h-full min-w-0 flex-1 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden',
        messages.length === 0 ? 'items-center justify-center' : ''
      )}
      data-testid="full-chat"
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_20%,rgba(120,200,219,0.1),rgba(255,255,255,0))]" />
      
      {showProgressTracker ? (
        // Campaign layout with enhanced visual hierarchy
        <div className="flex h-full relative z-10">
          <div className="w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-xl shadow-slate-200/20">
            <div className="p-6 border-b border-slate-200/60 bg-gradient-to-b from-white/90 to-white/60">
              <h3 className="font-semibold text-slate-900 mb-1">Campaign Builder</h3>
              <p className="text-xs text-slate-600">AI-powered prospect discovery</p>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-5rem)]">
              <CampaignProgressTracker 
                currentStep={currentCampaignStep}
                campaignTitle="Cold Email Campaign"
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-white/20 backdrop-blur-sm">
            <ChatMessages
              sections={sections}
              data={data}
              onQuerySelect={onQuerySelect}
              isLoading={isLoading}
              chatId={id}
              addToolResult={addToolResult}
              scrollContainerRef={scrollContainerRef}
              onUpdateMessage={handleUpdateAndReloadMessage}
              reload={handleReloadFrom}
            />
            <ChatPanel
              input={input}
              handleInputChange={handleInputChange}
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
            />
          </div>
        </div>
      ) : (
        // Enhanced default layout with spatial depth
        <div className="flex flex-col flex-1 relative z-10">
          <div className="flex-1 relative overflow-hidden">
            <ChatMessages
              sections={sections}
              data={data}
              onQuerySelect={onQuerySelect}
              isLoading={isLoading}
              chatId={id}
              addToolResult={addToolResult}
              scrollContainerRef={scrollContainerRef}
              onUpdateMessage={handleUpdateAndReloadMessage}
              reload={handleReloadFrom}
            />
          </div>
          <div className="relative bg-white/60 backdrop-blur-xl border-t border-slate-200/50 shadow-lg shadow-slate-200/10">
            <ChatPanel
              input={input}
              handleInputChange={handleInputChange}
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
            />
          </div>
        </div>
      )}
    </div>
  )
}
