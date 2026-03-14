'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import type { UIMessage as Message } from 'ai'
import { ArrowUp, ChevronDown, Mic, Paperclip, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useArtifact } from './artifact/artifact-context'
import { EmptyScreen } from './empty-screen'
import { RotatingText } from './rotating-text'
import { Button } from './ui/button'

function RotatingHeroText() {
  const useCases = [
    'AI sales engineer',
    'partnership finder',
    'prospect researcher',
    'email copywriter',
    'channel partner scout',
    'event speaker finder',
    'competitor intelligence',
    'lead enrichment engine'
  ]

  return (
    <>
      Find your next{' '}
      <RotatingText
        words={useCases}
        className="inline-block text-[hsl(var(--hermes-gold-dark))]"
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

  return (
    <div
      className={cn(
        'w-full group/form-container shrink-0 relative z-10',
        messages.length > 0 ? 'px-3 sm:px-4 pb-3 sm:pb-5' : 'px-3 sm:px-5 md:px-8 pb-6 sm:pb-10'
      )}
    >
      {messages.length === 0 && (
        <div className={cn('mx-auto mb-6 w-full max-w-4xl rounded-[2rem] border border-black/5 bg-white/65 px-6 py-8 shadow-[0_24px_80px_rgba(62,45,18,0.08)] backdrop-blur-sm md:px-8 md:py-10')}>
          <div className="mb-4 text-[11px] uppercase tracking-[0.32em] text-black/40">Roman messenger for outbound teams</div>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight text-gray-950 sm:text-5xl md:text-6xl">
            <RotatingHeroText />
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-black/65 sm:text-base">
            Describe who you need to reach. Hermes researches the market, verifies details, and drafts sharp outreach without making the workflow feel heavy.
          </p>
        </div>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (submittingRef.current) return
          submittingRef.current = true
          // require sign-in before sending
          const isAuthed = await ensureSignedIn()
          if (!isAuthed) {
            router.push('/auth/login')
            submittingRef.current = false
            return
          }
          try {
            localStorage.removeItem('hermes_draft')
          } catch {}
          handleSubmit(e)
          // simple debounce window to avoid multi-fire
          setTimeout(() => { submittingRef.current = false }, 800)
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

        <div className="relative">
          <div className={cn(
            'hermes-panel relative z-[5] flex w-full items-end rounded-[1.75rem] border border-black/10 transition-all duration-200',
            'focus-within:border-[hsl(var(--hermes-gold))]/40 focus-within:shadow-[0_24px_64px_rgba(203,126,40,0.16)]'
          )}>
            <div className="z-[10] flex items-center gap-1 p-2.5 sm:gap-2 sm:p-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 w-9 rounded-full border-black/10 bg-white/85 sm:h-10 sm:w-10"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
              >
                <Paperclip size={16} />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isListening ? 'destructive' : 'outline'}
                className="h-9 w-9 rounded-full border-black/10 bg-white/85 sm:h-10 sm:w-10"
                onClick={startVoice}
                title="Voice input"
              >
                <Mic size={16} />
              </Button>
            </div>
            <Textarea
              ref={inputRef}
              name="input"
              rows={1}
              maxRows={6}
              tabIndex={0}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder="Describe your ideal prospects..."
              spellCheck={false}
              value={input}
              disabled={isLoading || isToolInvocationInProgress()}
              className="w-full resize-none border-0 bg-transparent px-3 py-4 text-sm text-gray-900 placeholder:text-black/35 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[64px] sm:px-6 sm:text-base"
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

            <div className="z-[10] p-2.5 sm:p-3">
              <Button
                type="button"
                size="sm"
                className={cn(
                  'h-10 w-10 rounded-full bg-black text-white shadow-[0_16px_32px_rgba(17,17,17,0.18)] sm:h-11 sm:w-11',
                  'disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed',
                  (!input || input.length === 0) && !isLoading && 'opacity-50 scale-95',
                  isLoading && 'animate-pulse bg-[hsl(var(--hermes-gold-dark))] text-white'
                )}
                disabled={
                  ((!input || input.length === 0) && !isLoading) ||
                  isToolInvocationInProgress()
                }
                onClick={isLoading ? stop : async () => {
                  if (submittingRef.current) return
                  submittingRef.current = true
                  const isAuthed = await ensureSignedIn()
                  if (!isAuthed) {
                    router.push('/auth/login')
                    submittingRef.current = false
                    return
                  }
                  const form = document.querySelector('form')
                  if (form) {
                    form.requestSubmit()
                  }
                  setTimeout(() => { submittingRef.current = false }, 800)
                }}
              >
                {isLoading ? (
                  <Square size={18} />
                ) : (
                  <ArrowUp size={18} />
                )}
              </Button>
            </div>
          </div>
        </div>

      </form>

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

      {/* Templates under the input when empty */}
      {messages.length === 0 && (
        <div className="mt-6">
          <EmptyScreen
            hideHeader
            submitMessage={message => {
              // Load playbook into input vs auto-sending
              if (setInput) {
                setInput(message)
              }
              // Focus the input for immediate editing
              try { inputRef.current?.focus() } catch {}
            }}
          />
        </div>
      )}
    </div>
  )
}
