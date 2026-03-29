'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import type { UIMessage as Message } from 'ai'
import { ArrowUp, ChevronDown, LoaderCircle, Mic, Paperclip, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useArtifact } from './artifact/artifact-context'
import { HomeCommandCenter } from './home-command-center'
import { RotatingText } from './rotating-text'
import { Button } from './ui/button'

function RotatingHeroText() {
  const useCases = [
    'partner list',
    'contact path',
    'directory listing',
    'founder campaign',
    'outreach draft'
  ]

  return (
    <>
      Run Hermes for your{' '}
      <RotatingText
        words={useCases}
        className="inline-block text-[hsl(var(--hermes-gold-light))]"
        interval={2500}
      />
    </>
  )
}

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
  const formRef = useRef<HTMLFormElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  const submittingRef = useRef(false)
  const [isListening, setIsListening] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { close: closeArtifact } = useArtifact()

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  // Voice input (browser Web Speech API where available)
  const startVoice = () => {
    try {
      const w = window as any
      const Rec = w.SpeechRecognition || w.webkitSpeechRecognition
      if (!Rec) return
      const recognition = new Rec()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript
        if (!transcript) return
        if (setInput) setInput((input ? input + ' ' : '') + transcript)
        try { inputRef.current?.focus() } catch {}
      }
      recognition.start()
    } catch {}
  }

  // File upload (CSV import supported, other files inserted as a note in input)
  const onFilePicked = async (file: File) => {
    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        const form = new FormData()
        form.append('file', file)
        form.append('name', `Imported from ${file.name}`)
        form.append('entityType', 'company')
        const res = await fetch('/api/import', { method: 'POST', body: form })
        const json = await res.json().catch(() => ({}))
        const imported = json?.imported || ''
        const msg = imported
          ? `I uploaded a CSV with ${imported} rows. Please enrich contacts and show results.`
          : `I uploaded a CSV file (${file.name}). Please enrich contacts and show results.`
        if (setInput) setInput(msg)
      } else {
        // Read a snippet and place into input for context
        const text = await file.text()
        const snippet = text.slice(0, 2000)
        if (setInput) setInput((input ? input + '\n' : '') + `Attached file ${file.name} contents (snippet):\n${snippet}`)
      }
      try { inputRef.current?.focus() } catch {}
    } catch {}
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

  const submitCurrentMessage = async () => {
    if (submittingRef.current) return
    if ((!input || input.trim().length === 0) && !isLoading) return

    submittingRef.current = true
    const isAuthed = await ensureSignedIn()
    if (!isAuthed) {
      router.push('/auth/login')
      submittingRef.current = false
      return
    }

    try {
      localStorage.removeItem('hermes_draft')
    } catch {}

    handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)
    setTimeout(() => {
      submittingRef.current = false
    }, 800)
  }

  return (
    <div
      className={cn('w-full group/form-container shrink-0 relative z-10', messages.length > 0 ? 'px-3 sm:px-4 pb-3 sm:pb-5' : 'px-3 sm:px-5 md:px-8 pb-6 sm:pb-10')}
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto pt-4 md:pt-12 mb-10">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-[0_8px_30px_rgba(214,157,74,0.15)] border border-[hsl(var(--hermes-gold))]/30 mb-8 bg-black flex items-center justify-center">
            <img src="/hermes-chat-avatar.png" alt="Hermes AI" className="h-full w-full object-cover" />
          </div>
          
          <h1 className="font-serif text-[4rem] md:text-[6.5rem] leading-[0.95] text-gray-900 tracking-tight mb-8">
            Hermes
          </h1>
          
          <p className="text-[17px] md:text-[20px] font-medium leading-[1.6] text-gray-500 max-w-3xl">
            Say goodbye to juggling twenty different sales tools. Tell Hermes what your offer is, and it will deploy neural networks across the open web to find exact-match companies, resolve decision-makers, and draft executive-grade emails instantly.
          </p>
        </div>
      )}
      
      {/* The form sits here immediately, all visual splash/empty states are deferred to HomeCommandCenter */}
      <form
        ref={formRef}
        onSubmit={async (e) => {
          e.preventDefault()
          await submitCurrentMessage()
        }}
        className={cn('max-w-4xl w-full mx-auto relative group/form', messages.length === 0 ? 'mb-6' : '')}
      >
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -top-16 right-6 z-20 size-10 rounded-full border border-black/10 bg-white/90 shadow-lg"
            onClick={handleScrollToBottom}
            title="Jump to latest"
          >
            <ChevronDown size={18} className="text-black/70" />
          </Button>
        )}

        <div className="relative mx-auto w-full max-w-3xl">
          <div className={cn(
            'relative z-[5] flex w-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200',
            'focus-within:border-[hsl(var(--hermes-gold))] focus-within:shadow-[0_8px_30px_rgba(214,157,74,0.12)]'
          )}>
            <Textarea
              ref={inputRef}
              name="input"
              rows={2}
              maxRows={8}
              tabIndex={0}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder="Example: Find 20 Fintech CTOs in New York. Pitch them my fractional dev-ops offering."
              spellCheck={false}
              value={input}
              disabled={isLoading || isToolInvocationInProgress()}
              className="w-full resize-none border-0 bg-transparent px-5 py-4 text-[15px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[85px]"
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
                  void submitCurrentMessage()
                }
              }}
              onFocus={() => setShowEmptyScreen(true)}
              onBlur={() => setShowEmptyScreen(false)}
            />

            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <Paperclip size={16} />
                </Button>
                <div className="mx-1 h-4 w-[1px] bg-gray-200"></div>
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? 'default' : 'ghost'}
                  className={cn("h-8 w-8 rounded-full hover:bg-gray-100", isListening ? "bg-[hsl(var(--hermes-gold-light))] text-[hsl(var(--hermes-gold-dark))] hover:opacity-80" : "text-gray-400 hover:text-gray-700")}
                  onClick={startVoice}
                  title="Voice input"
                >
                  <Mic size={16} />
                </Button>
              </div>
              
              <Button
                type="button"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-full transition-all duration-200',
                  isLoading ? 'bg-[hsl(var(--hermes-gold))] text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700',
                  input?.trim() && !isLoading ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md' : '',
                  (!input || input.trim().length === 0) && !isLoading && 'scale-95 opacity-80'
                )}
                disabled={
                  ((!input || input.length === 0) && !isLoading) ||
                  isToolInvocationInProgress()
                }
                onClick={isLoading ? stop : async () => {
                  await submitCurrentMessage()
                }}
              >
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <ArrowUp size={16} strokeWidth={2.5} />
                )}
              </Button>
            </div>
          </div>
        </div>

      </form>

      {messages.length === 0 && (
        <HomeCommandCenter
          onPromptSelect={(prompt) => {
            // Only set input and allow user to edit, NO auto-submit!
            if (setInput) {
              setInput(prompt)
            }
            try {
              inputRef.current?.focus()
            } catch {}
          }}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".csv,.txt,.md,.json,.yaml,.yml,.pdf"
        onChange={async (e) => {
          const f = (e.target as HTMLInputElement).files?.[0]
          if (!f) return
          await onFilePicked(f)
          ;(e.target as HTMLInputElement).value = ''
        }}
      />
    </div>
  )
}
