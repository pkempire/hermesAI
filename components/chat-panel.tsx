'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import type { UIMessage as Message } from 'ai'
import { ArrowUp, ChevronDown, MessageCirclePlus, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useArtifact } from './artifact/artifact-context'
import { EmptyScreen } from './empty-screen'
import { Button } from './ui/button'
import { Mail } from 'lucide-react'

interface ChatPanelProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  models?: Model[]
  /** Whether to show the scroll to bottom button */
  showScrollToBottomButton: boolean
  /** Reference to the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>
}

export function ChatPanel({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  setMessages,
  query,
  stop,
  append,
  models,
  showScrollToBottomButton,
  scrollContainerRef
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  const { close: closeArtifact } = useArtifact()

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  const handleNewChat = () => {
    setMessages([])
    closeArtifact()
    router.push('/')
  }

  const isToolInvocationInProgress = () => {
    if (!messages.length) return false

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant' || !lastMessage.parts) return false

    const parts = lastMessage.parts
    const lastPart = parts[parts.length - 1]

    return (
      lastPart?.type === 'tool-invocation' &&
      lastPart?.toolInvocation?.state === 'call'
    )
  }

  // if query is not empty, submit the query
  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({
        role: 'user',
        content: query
      })
      isFirstRender.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // Scroll to the bottom of the container
  const handleScrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div
      className={cn(
        'w-full group/form-container shrink-0 relative',
        messages.length > 0 ? 'px-4 pb-4' : 'px-8 pb-8'
      )}
    >
      {messages.length === 0 && (
        <div className="mb-16 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-bounce delay-1000 shadow-lg"></div>
          </div>
          <div className="text-center space-y-4 max-w-2xl">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
              Find Your Next Customer
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              AI-powered prospect discovery and personalized outreach. Just tell me who you're looking for.
            </p>
          </div>
        </div>
      )}
      
      <form
        onSubmit={handleSubmit}
        className={cn('max-w-4xl w-full mx-auto relative group/form')}
      >
        {/* Enhanced scroll to bottom button */}
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -top-16 right-6 z-20 size-10 rounded-full shadow-lg bg-white/80 backdrop-blur-sm border-slate-200/60 hover:bg-white hover:scale-105 transition-all duration-200"
            onClick={handleScrollToBottom}
            title="Scroll to bottom"
          >
            <ChevronDown size={18} className="text-slate-600" />
          </Button>
        )}

        <div className="relative">
          {/* Input container with enhanced styling */}
          <div className={cn(
            'relative flex flex-col w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200/50 transition-all duration-300',
            'group-focus-within/form:shadow-2xl group-focus-within/form:shadow-blue-500/20 group-focus-within/form:border-blue-300/50',
            'hover:shadow-xl hover:shadow-slate-300/50'
          )}>
            {/* Typing indicator background glow */}
            <div className={cn(
              'absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-xl transition-opacity duration-300',
              isLoading ? 'opacity-100 animate-pulse' : 'opacity-0'
            )} />
            
            <div className="relative">
              <Textarea
                ref={inputRef}
                name="input"
                rows={1}
                maxRows={8}
                tabIndex={0}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder={messages.length === 0 ? "Find prospects at Series A SaaS companies in San Francisco..." : "Ask a follow-up question..."}
                spellCheck={false}
                value={input}
                disabled={isLoading || isToolInvocationInProgress()}
                className="resize-none w-full min-h-16 bg-transparent border-0 px-6 pt-6 pb-4 text-base placeholder:text-slate-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                onChange={e => {
                  handleInputChange(e)
                  setShowEmptyScreen(e.target.value.length === 0)
                }}
                onKeyDown={e => {
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    !isComposing &&
                    !enterDisabled
                  ) {
                    if (input.trim().length === 0) {
                      e.preventDefault()
                      return
                    }
                    e.preventDefault()
                    const textarea = e.target as HTMLTextAreaElement
                    textarea.form?.requestSubmit()
                  }
                }}
                onFocus={() => setShowEmptyScreen(true)}
                onBlur={() => setShowEmptyScreen(false)}
              />

              {/* Enhanced action buttons */}
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {isLoading && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  )}
                  {!isLoading && input.length > 0 && (
                    <span className="animate-in fade-in slide-in-from-left-2 duration-200">
                      Press Enter to send • Shift+Enter for new line
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNewChat}
                      className="shrink-0 rounded-full group hover:bg-slate-100 transition-all duration-200"
                      type="button"
                      disabled={isLoading || isToolInvocationInProgress()}
                    >
                      <MessageCirclePlus className="size-4 group-hover:rotate-12 transition-transform duration-200 mr-2" />
                      <span className="text-sm">New chat</span>
                    </Button>
                  )}
                  
                  <Button
                    type={isLoading ? 'button' : 'submit'}
                    size="default"
                    className={cn(
                      'rounded-full px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200',
                      isLoading && 'animate-pulse',
                      (input.length === 0 && !isLoading) && 'opacity-50 cursor-not-allowed hover:scale-100'
                    )}
                    disabled={
                      (input.length === 0 && !isLoading) ||
                      isToolInvocationInProgress()
                    }
                    onClick={isLoading ? stop : undefined}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Square size={16} className="animate-pulse" />
                        <span>Stop</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ArrowUp size={16} />
                        <span>Send</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="mt-8">
            <EmptyScreen
              submitMessage={message => {
                handleInputChange({
                  target: { value: message }
                } as React.ChangeEvent<HTMLTextAreaElement>)
              }}
              className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500"
            />
          </div>
        )}
      </form>
    </div>
  )
}
