'use client'

import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import type { UIMessage as Message } from 'ai'
import { ArrowUp, ChevronDown, LoaderCircle, Mic, Paperclip, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useArtifact } from './artifact/artifact-context'
import { TemplateMarketplace } from './template-marketplace'
import { WorkspaceHome } from './workspace-home'
import { Button } from './ui/button'

interface ChatPanelProps {
  input: string
  handleInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  setInput?: (value: string) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, messageOverride?: string) => void
  isLoading: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  models?: Model[]
  showScrollToBottomButton: boolean
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  submitTemplateMessage?: (message: string) => void
  signedIn?: boolean
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
  submitTemplateMessage,
  signedIn = true
}: ChatPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false)
  const [enterDisabled, setEnterDisabled] = useState(false)
  const submittingRef = useRef(false)
  const [isListening, setIsListening] = useState(false)
  const [runMode, setRunMode] = useState<'guided' | 'deterministic'>('guided')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { close: closeArtifact } = useArtifact()

  const handleCompositionStart = () => setIsComposing(true)
  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => setEnterDisabled(false), 300)
  }

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

  async function ensureSignedIn(promptToPersist = input): Promise<boolean> {
    try {
      if (promptToPersist && promptToPersist.trim().length > 0) {
        try { localStorage.setItem('hermes_draft', promptToPersist) } catch {}
      }
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!res.ok) return false
      const data = await res.json()
      return !!data?.user?.id
    } catch { return false }
  }

  const isToolInvocationInProgress = () => {
    if (!messages.length) return false
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant' || !(lastMessage as any).parts) return false
    const parts = (lastMessage as any).parts as any[]
    const lastPart = parts[parts.length - 1]
    if (lastPart?.type === 'tool-invocation') {
      const inv = (lastPart as any).toolInvocation || lastPart
      if (inv?.toolName === 'ask_question') return false
      return inv?.state === 'call'
    }
    if (lastPart?.type === 'tool-call') {
      if ((lastPart as any)?.toolName === 'ask_question') return false
      return true
    }
    if (typeof lastPart?.type === 'string' && lastPart.type.startsWith('tool-')) {
      const toolName = lastPart.type.replace(/^tool-/, '')
      if (toolName === 'ask_question') return false
      return lastPart.state === 'input-streaming' || lastPart.state === 'input-available'
    }
    return false
  }

  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({ role: 'user', content: query })
      isFirstRender.current = false
    }
  }, [append, query])

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
    try { localStorage.removeItem('hermes_draft') } catch {}
    const messageOverride =
      runMode === 'deterministic'
        ? `${input.trim()}\n\nRun mode: deterministic. Skip the interactive builder when the brief is clear; start the search directly and ask only for required missing context.`
        : undefined
    handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>, messageOverride)
    if (messageOverride && setInput) setInput('')
    setTimeout(() => { submittingRef.current = false }, 800)
  }

  const loadTemplatePrompt = (prompt: string) => {
    setRunMode('guided')
    if (setInput) setInput(prompt)
    requestAnimationFrame(() => {
      document.getElementById('hermes-input')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      inputRef.current?.focus()
    })
  }

  const runTemplatePrompt = async (prompt: string) => {
    if (submittingRef.current || isLoading) return
    submittingRef.current = true
    const isAuthed = await ensureSignedIn(prompt)
    if (!isAuthed) {
      router.push('/auth/login')
      submittingRef.current = false
      return
    }

    try { localStorage.removeItem('hermes_draft') } catch {}
    const directPrompt = `${prompt.trim()}\n\nRun mode: deterministic. Skip the interactive builder when the brief is clear; start the search directly and ask only for required missing context.`
    handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>, directPrompt)
    if (setInput) setInput('')
    setTimeout(() => { submittingRef.current = false }, 800)
  }

  return (
    <div
      className={cn('w-full group/form-container shrink-0 relative z-10', messages.length > 0 ? 'px-3 sm:px-4 pb-3 sm:pb-5' : 'px-3 sm:px-5 md:px-8 pb-5 sm:pb-8')}
    >
      {messages.length === 0 && (
        <WorkspaceHome onSelectPrompt={loadTemplatePrompt} />
      )}

      <form
        ref={formRef}
        onSubmit={async (e) => { e.preventDefault(); await submitCurrentMessage() }}
        className={cn('max-w-4xl w-full mx-auto relative group/form', messages.length === 0 ? 'mb-5' : '')}
      >
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            type="button" variant="outline" size="icon"
            className="absolute -top-16 right-6 z-20 size-10 rounded-full border border-black/10 bg-white/90 shadow-lg"
            onClick={handleScrollToBottom} title="Jump to latest"
          >
            <ChevronDown size={18} className="text-black/70" />
          </Button>
        )}

        <div className="relative mx-auto w-full max-w-3xl" id="hermes-input">
          <div className={cn(
            'relative z-[5] flex w-full flex-col rounded-lg border border-[#dfe4ee] bg-white/95 shadow-[0_18px_52px_rgba(5,18,47,0.08)] transition-all duration-150',
            'focus-within:border-[#bfc9ff] focus-within:ring-2 focus-within:ring-[#315dff]/10'
          )}>
            <Textarea
              ref={inputRef} name="input"
              rows={2} maxRows={8} tabIndex={0}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder="Find 25 Bay Area private college counselors who specialize in STEM/Ivy applications"
              spellCheck={false} value={input}
              disabled={isLoading || isToolInvocationInProgress()}
              className="min-h-[86px] w-full resize-none border-0 bg-transparent px-5 py-4 text-[15px] leading-relaxed text-[#071329] placeholder:text-[#9aa2b4] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              onChange={e => {
                if (handleInputChange) handleInputChange(e)
                else if (setInput) setInput(e.target.value)
                setShowEmptyScreen(e.target.value.length === 0)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !isComposing && !enterDisabled) {
                  if (!input || input.trim().length === 0) { e.preventDefault(); return }
                  e.preventDefault()
                  void submitCurrentMessage()
                }
              }}
              onFocus={() => setShowEmptyScreen(true)}
              onBlur={() => setShowEmptyScreen(false)}
            />

            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button type="button" size="icon" variant="ghost"
                  className="h-8 w-8 rounded-md text-[#9aa2b4] hover:bg-[#f5f7ff] hover:text-[#315dff]"
                  onClick={() => fileInputRef.current?.click()} title="Attach file">
                  <Paperclip size={16} />
                </Button>
                <div className="mx-1 h-4 w-[1px] bg-[#dfe4ee]" />
                <Button type="button" size="icon"
                  variant={isListening ? 'default' : 'ghost'}
                  className={cn("h-8 w-8 rounded-md hover:bg-[#f5f7ff]", isListening ? "bg-[#edf1ff] text-[#315dff] hover:opacity-90" : "text-[#9aa2b4] hover:text-[#315dff]")}
                  onClick={startVoice} title="Voice input">
                  <Mic size={16} />
                </Button>
                <div className="ml-1 flex h-8 overflow-hidden rounded-md border border-[#dfe4ee] bg-[#f8faff] p-0.5">
                  {(['guided', 'deterministic'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setRunMode(mode)}
                      className={cn(
                        'px-3 text-[11px] font-semibold transition-colors',
                        runMode === mode
                          ? 'bg-white text-[#071329] shadow-sm'
                          : 'text-[#8a92a6] hover:text-[#071329]'
                      )}
                      title={mode === 'guided' ? 'Use the reviewable search builder' : 'Skip the builder when the brief is clear'}
                    >
                      {mode === 'deterministic' ? 'Direct' : 'Review'}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="button" size="icon"
                className={cn(
                  'h-8 w-8 rounded-md transition-colors duration-150',
                  isLoading
                    ? 'bg-[#071329] text-white'
                    : 'bg-[#f5f7ff] text-[#9aa2b4] hover:bg-[#edf1ff] hover:text-[#315dff]',
                  input?.trim() && !isLoading
                    ? 'bg-[#071329] text-white hover:bg-[#102448]'
                    : ''
                )}
                disabled={((!input || input.length === 0) && !isLoading) || isToolInvocationInProgress()}
                onClick={isLoading ? stop : async () => { await submitCurrentMessage() }}>
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
        <TemplateMarketplace
          onSelectPrompt={loadTemplatePrompt}
          onRunPrompt={runTemplatePrompt}
          disabled={isLoading}
        />
      )}

      <input ref={fileInputRef} type="file" className="hidden"
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
