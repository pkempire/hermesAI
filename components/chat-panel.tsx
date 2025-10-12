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
        messages.length > 0 ? 'px-4 pb-4' : 'px-4 sm:px-8 pb-8'
      )}
    >
      {/* Title header (only when there is no conversation yet) */}
      {messages.length === 0 && (
        <div className={cn('max-w-4xl w-full mx-auto mb-4 mt-2')}>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Hermes — Prospecting Copilot</h2>
          <p className="text-sm text-muted-foreground mt-1">Describe who you want to reach. I’ll research, rank prospects, and help draft outreach.</p>
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
        {/* Divine scroll to bottom button */}
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -top-16 right-6 z-20 size-10 rounded-full bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 hover:bg-gradient-to-br hover:from-amber-100 hover:to-yellow-100 hover:border-amber-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-200"
            onClick={handleScrollToBottom}
            title="Return to divine messages"
          >
            <ChevronDown size={18} className="text-amber-600" />
          </Button>
        )}

        <div className="relative">
          {/* Divine messenger input container */}
          <div className={cn(
            'relative z-[5] flex items-end w-full bg-white rounded-2xl border border-border shadow-sm transition-all duration-200',
            'focus-within:border-primary focus-within:shadow-md hover:shadow-md'
          )}>
            <div className="p-3 z-[10] flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-10 h-10 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
              >
                <Paperclip size={16} />
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isListening ? 'destructive' : 'outline'}
                className="w-10 h-10 rounded-xl"
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
              placeholder="Tell me who you seek to reach, and I shall find them swiftly..."
              spellCheck={false}
              value={input}
              disabled={isLoading || isToolInvocationInProgress()}
              className="resize-none w-full min-h-[60px] bg-transparent border-0 px-6 py-4 text-base text-gray-900 placeholder:text-amber-600/60 placeholder:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* Divine send button */}
            <div className="p-3 z-[10]">
              <Button
                type="button"
                size="sm"
                className={cn(
                  'w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-sm',
                  'disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed',
                  (!input || input.length === 0) && !isLoading && 'opacity-50 scale-95',
                  isLoading && 'bg-gradient-to-r from-amber-400 to-yellow-400 animate-pulse'
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
