'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import type { UIMessage as Message } from 'ai'
import { ArrowUp, ChevronDown, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useArtifact } from './artifact/artifact-context'
import { EmptyScreen } from './empty-screen'
import { Button } from './ui/button'

interface ChatPanelProps {
  input: string
  handleInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  setInput?: (value: string) => void
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
  /** Function to submit template messages directly */
  submitTemplateMessage?: (message: string) => void
}

export function ChatPanel({
  input,
  handleInputChange,
  setInput,
  handleSubmit,
  isLoading,
  messages,
  setMessages,
  query,
  stop,
  append,
  models,
  showScrollToBottomButton,
  scrollContainerRef,
  submitTemplateMessage
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

  // Quick auth check helper
  async function ensureSignedIn(): Promise<boolean> {
    try {
      // Save draft before auth redirect
      if (input && input.trim().length > 0) {
        try {
          localStorage.setItem('hermes_draft', input)
        } catch {}
      }
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!res.ok) return false
      const data = await res.json()
      return !!data?.user?.id
    } catch {
      return false
    }
  }

  const isToolInvocationInProgress = () => {
    if (!messages.length) return false

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant' || !(lastMessage as any).parts) return false

    const parts = (lastMessage as any).parts as any[]
    const lastPart = parts[parts.length - 1]

    // Support both legacy and v5 shapes
    if (lastPart?.type === 'tool-invocation') {
      const inv = (lastPart as any).toolInvocation || lastPart
      // Do not block input for ask_question; allow inline answering
      if (inv?.toolName === 'ask_question') return false
      return inv?.state === 'call'
    }
    if (lastPart?.type === 'tool-call') {
      if ((lastPart as any)?.toolName === 'ask_question') return false
      return true
    }
    return false
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
        messages.length > 0 ? 'px-4 pb-4' : 'px-4 sm:px-8 pb-8'
      )}
    >
      {/* Title header only */}
      {messages.length === 0 && (
        <div className="text-center py-6">
          <h1 className="text-3xl font-semibold">Find your <span className="text-primary">AI sales engineer</span></h1>
        </div>
      )}
      
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          // require sign-in before sending
          const isAuthed = await ensureSignedIn()
          if (!isAuthed) {
            router.push('/auth/login')
            return
          }
          try {
            localStorage.removeItem('hermes_draft')
          } catch {}
          handleSubmit(e)
        }}
        className={cn('max-w-4xl w-full mx-auto relative group/form', messages.length === 0 ? 'mb-6' : '')}
      >
        {/* Enhanced scroll to bottom button */}
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -top-16 right-6 z-20 size-10 rounded-full bg-card border border-border hover:bg-muted hover:scale-105 transition-all duration-200"
            onClick={handleScrollToBottom}
            title="Scroll to bottom"
          >
            <ChevronDown size={18} className="text-foreground" />
          </Button>
        )}

        <div className="relative">
          {/* Enhanced input container */}
          <div className={cn(
            'relative flex flex-col w-full bg-card rounded-xl border border-border transition-all duration-200',
            'group-focus-within/form:border-primary/50',
            'hover:border-border/80'
          )}>
            
            <div className="relative">
              <Textarea
                ref={inputRef}
                name="input"
                rows={1}
                maxRows={8}
                tabIndex={0}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder="Describe your ideal prospects..."
                spellCheck={false}
                value={input}
                disabled={isLoading || isToolInvocationInProgress()}
                className="resize-none w-full min-h-12 bg-transparent border-0 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                onChange={e => {
                  if (handleInputChange) {
                    handleInputChange(e)
                  } else if (setInput) {
                    setInput(e.target.value)
                  }
                  setShowEmptyScreen(e.target.value.length === 0)
                }}
                onKeyDown={e => {
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    !isComposing &&
                    !enterDisabled
                  ) {
                    if (!input || input.trim().length === 0) {
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

              {/* Action area with submit button */}
              <div className="flex items-center justify-end px-3 pb-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'rounded-lg p-2 h-8 w-8 text-primary hover:bg-muted transition-all duration-200',
                      (!input || input.length === 0) && !isLoading && 'opacity-30 cursor-not-allowed',
                      isLoading && 'text-muted-foreground'
                    )}
                    disabled={
                      ((!input || input.length === 0) && !isLoading) ||
                      isToolInvocationInProgress()
                    }
                    onClick={isLoading ? stop : async () => {
                      console.log('🔧 [ChatPanel] Send button clicked')
                      const isAuthed = await ensureSignedIn()
                      if (!isAuthed) {
                        router.push('/auth/login')
                        return
                      }
                      const form = document.querySelector('form')
                      if (form) {
                        form.requestSubmit()
                      }
                    }}
                  >
                    {isLoading ? (
                      <Square size={16} />
                    ) : (
                      <ArrowUp size={16} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Templates under the input when empty */}
        {messages.length === 0 && (
          <div className="mt-6">
            <EmptyScreen
              hideHeader
              submitMessage={message => {
                if (submitTemplateMessage) submitTemplateMessage(message)
              }}
            />
          </div>
        )}
      </form>
    </div>
  )
}
