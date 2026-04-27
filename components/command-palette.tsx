'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Command as CommandIcon,
  Send,
  Mail,
  CreditCard,
  BookOpen,
  Clock,
  Sparkles,
  Search as SearchIcon,
  Plus
} from 'lucide-react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'

type Chat = {
  id: string
  title: string
  path?: string
  createdAt?: string | Date
}

type Template = {
  id?: string
  name: string
  description?: string
  message?: string
  category?: string
}

const FALLBACK_TEMPLATES: Template[] = [
  {
    id: 'lucid-counselors',
    name: 'Lucid — Counselors',
    description: 'Reach high-intent counselors and therapists',
    message:
      'Find independent counselors and small therapy practices in the US, then draft a warm intro email about Lucid.'
  },
  {
    id: 'lucid-directories',
    name: 'Lucid — Directories',
    description: 'Pull directory listings into a clean campaign',
    message:
      'Source verified directory pages of US therapists, enrich decision-makers, and prepare an outreach sequence.'
  },
  {
    id: 'startup-fundraisers',
    name: 'Seed-stage founders',
    description: 'Raising right now, recently announced',
    message:
      'Find seed-stage founders who announced funding in the last 90 days and draft a tailored intro from me.'
  }
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [, startTransition] = React.useTransition()
  const [query, setQuery] = React.useState('')
  const [debouncedQuery, setDebouncedQuery] = React.useState('')
  const [chats, setChats] = React.useState<Chat[]>([])
  const [searchResults, setSearchResults] = React.useState<Chat[]>([])
  const [templates, setTemplates] = React.useState<Template[]>(FALLBACK_TEMPLATES)
  const [signedIn, setSignedIn] = React.useState(true)
  const previouslyFocused = React.useRef<HTMLElement | null>(null)

  // Capture focus before opening, restore on close
  React.useEffect(() => {
    if (open) {
      previouslyFocused.current = (typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement | null)
        : null)
    } else {
      const el = previouslyFocused.current
      if (el && typeof el.focus === 'function') {
        try { el.focus() } catch {}
      }
      setQuery('')
    }
  }, [open])

  // Debounce search query (200ms)
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 200)
    return () => clearTimeout(t)
  }, [query])

  // Load recent chats + templates when palette opens
  React.useEffect(() => {
    if (!open) return
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch('/api/chats?limit=8&offset=0', {
            credentials: 'include'
          })
          if (res.ok) {
            const data = await res.json()
            setChats(Array.isArray(data?.chats) ? data.chats : [])
            // If endpoint returns empty *and* nextOffset null we still consider them signed-in;
            // we toggle off the recent group only when fetch is unauthorized.
            setSignedIn(true)
          } else if (res.status === 401) {
            setSignedIn(false)
            setChats([])
          }
        } catch (err) {
          logger.warn('command-palette: failed to load chats', err)
        }

        try {
          const tRes = await fetch('/api/templates', { credentials: 'include' })
          if (tRes.ok) {
            const tData = await tRes.json()
            const list: Template[] = Array.isArray(tData?.templates)
              ? tData.templates
              : []
            if (list.length > 0) setTemplates(list.slice(0, 6))
          }
        } catch (err) {
          logger.debug('command-palette: templates fetch fallback', err)
        }
      })()
    })
  }, [open])

  // Server-side search via /api/chats?q=
  React.useEffect(() => {
    if (!open) return
    if (!debouncedQuery) {
      setSearchResults([])
      return
    }
    const ctrl = new AbortController()
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/chats?q=${encodeURIComponent(debouncedQuery)}&limit=10`,
            { credentials: 'include', signal: ctrl.signal }
          )
          if (res.ok) {
            const data = await res.json()
            setSearchResults(Array.isArray(data?.chats) ? data.chats : [])
          }
        } catch (err) {
          if ((err as any)?.name !== 'AbortError') {
            logger.debug('command-palette: search error', err)
          }
        }
      })()
    })
    return () => ctrl.abort()
  }, [debouncedQuery, open])

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])

  const fireCommand = React.useCallback((id: string, payload?: any) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hermes:command', { detail: { id, payload } })
      )
    }
  }, [])

  const go = React.useCallback(
    (path: string) => {
      router.push(path)
      close()
    },
    [router, close]
  )

  const runQuickAction = React.useCallback(
    (id: string) => {
      switch (id) {
        case 'new-campaign':
          fireCommand('prefill', {
            text:
              'Start a new outbound campaign. Ask me for ICP, then plan, source, enrich, and draft.'
          })
          go('/')
          return
        case 'last-campaign': {
          const last = chats[0]
          if (last) go(last.path || `/search/${last.id}`)
          else go('/campaigns')
          return
        }
        case 'connect-gmail':
          go('/settings/integrations')
          return
        case 'open-billing':
          go('/settings/billing')
          return
        case 'open-docs':
          go('/docs')
          return
      }
    },
    [chats, fireCommand, go]
  )

  const useTemplate = React.useCallback(
    (tpl: Template) => {
      const text =
        tpl.message ||
        `Use the "${tpl.name}" template${tpl.description ? `: ${tpl.description}` : ''}.`
      fireCommand('prefill', { text, templateId: tpl.id })
      go('/')
    },
    [fireCommand, go]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'overflow-hidden p-0 shadow-2xl border-[hsl(var(--hermes-mist))]',
          'bg-[hsl(var(--hermes-cream))] text-[hsl(var(--hermes-ink))]',
          'sm:max-w-[640px] rounded-xl'
        )}
      >
        <VisuallyHidden>
          <DialogTitle>Command palette</DialogTitle>
        </VisuallyHidden>
        <Command
          shouldFilter
          className="bg-[hsl(var(--hermes-cream))] text-[hsl(var(--hermes-ink))] [&_[cmdk-group-heading]]:font-serif [&_[cmdk-group-heading]]:text-[13px] [&_[cmdk-group-heading]]:tracking-[0.04em] [&_[cmdk-group-heading]]:text-[hsl(var(--hermes-ink))]/70 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-item]]:rounded-md [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item][data-selected=true]]:bg-[hsl(var(--hermes-ink))]/[0.06] [&_[cmdk-item][data-selected=true]]:text-[hsl(var(--hermes-ink))]"
        >
          <div className="flex items-center gap-2 border-b border-[hsl(var(--hermes-mist))] px-4">
            <SearchIcon className="h-4 w-4 text-[hsl(var(--hermes-ink))]/50" />
            <CommandInput
              autoFocus
              aria-label="Search commands, campaigns, and templates"
              placeholder="Search commands, campaigns, templates…"
              value={query}
              onValueChange={setQuery}
              className="border-0 bg-transparent text-[15px] text-[hsl(var(--hermes-ink))] placeholder:text-[hsl(var(--hermes-ink))]/40"
            />
            <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[hsl(var(--hermes-mist))] bg-transparent px-1.5 font-mono text-[10px] text-[hsl(var(--hermes-ink))]/60">
              ESC
            </kbd>
          </div>

          <CommandList className="max-h-[420px] px-2 pb-3">
            <CommandEmpty className="py-8 text-center text-sm text-[hsl(var(--hermes-ink))]/60">
              Nothing matches. Try a different word.
            </CommandEmpty>

            <CommandGroup heading="Quick actions">
              <CommandItem
                value="new campaign run brief"
                onSelect={() => runQuickAction('new-campaign')}
              >
                <Plus className="h-4 w-4 text-[hsl(var(--hermes-ink))]/70" />
                <span>Run new campaign</span>
              </CommandItem>
              <CommandItem
                value="open last campaign recent"
                onSelect={() => runQuickAction('last-campaign')}
              >
                <Send className="h-4 w-4 text-[hsl(var(--hermes-ink))]/70" />
                <span>Open last campaign</span>
              </CommandItem>
              <CommandItem
                value="connect gmail integration"
                onSelect={() => runQuickAction('connect-gmail')}
              >
                <Mail className="h-4 w-4 text-[hsl(var(--hermes-ink))]/70" />
                <span>Connect Gmail</span>
              </CommandItem>
              <CommandItem
                value="open billing subscription"
                onSelect={() => runQuickAction('open-billing')}
              >
                <CreditCard className="h-4 w-4 text-[hsl(var(--hermes-ink))]/70" />
                <span>Open billing</span>
              </CommandItem>
              <CommandItem
                value="open docs help"
                onSelect={() => runQuickAction('open-docs')}
              >
                <BookOpen className="h-4 w-4 text-[hsl(var(--hermes-ink))]/70" />
                <span>Open docs</span>
              </CommandItem>
            </CommandGroup>

            {signedIn && chats.length > 0 && (
              <>
                <CommandSeparator className="my-1 bg-[hsl(var(--hermes-mist))]" />
                <CommandGroup heading="Recent campaigns">
                  {chats.slice(0, 6).map(c => (
                    <CommandItem
                      key={c.id}
                      value={`recent ${c.title} ${c.id}`}
                      onSelect={() => go(c.path || `/search/${c.id}`)}
                    >
                      <Clock className="h-4 w-4 text-[hsl(var(--hermes-ink))]/60" />
                      <span className="truncate">
                        {c.title || 'Untitled session'}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {templates.length > 0 && (
              <>
                <CommandSeparator className="my-1 bg-[hsl(var(--hermes-mist))]" />
                <CommandGroup heading="Templates">
                  {templates.map((t, i) => (
                    <CommandItem
                      key={t.id || `${t.name}-${i}`}
                      value={`template ${t.name} ${t.description || ''}`}
                      onSelect={() => useTemplate(t)}
                    >
                      <Sparkles className="h-4 w-4 text-[hsl(var(--hermes-ink))]/60" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[hsl(var(--hermes-ink))]">
                          {t.name}
                        </span>
                        {t.description && (
                          <span className="truncate text-xs text-[hsl(var(--hermes-ink))]/55">
                            {t.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {signedIn && debouncedQuery && searchResults.length > 0 && (
              <>
                <CommandSeparator className="my-1 bg-[hsl(var(--hermes-mist))]" />
                <CommandGroup heading="Past sessions">
                  {searchResults.map(c => (
                    <CommandItem
                      key={`s-${c.id}`}
                      value={`past ${c.title} ${c.id}`}
                      onSelect={() => go(c.path || `/search/${c.id}`)}
                    >
                      <CommandIcon className="h-4 w-4 text-[hsl(var(--hermes-ink))]/60" />
                      <span className="truncate">
                        {c.title || 'Untitled session'}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>

          <div className="flex items-center justify-between border-t border-[hsl(var(--hermes-mist))] bg-[hsl(var(--hermes-parchment),var(--hermes-cream))] px-4 py-2 text-[11px] text-[hsl(var(--hermes-ink))]/55">
            <span className="font-serif italic tracking-wide">Hermes</span>
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-[hsl(var(--hermes-mist))] px-1.5 py-0.5 font-mono">↵</kbd>
              <span>to select</span>
              <kbd className="ml-2 rounded border border-[hsl(var(--hermes-mist))] px-1.5 py-0.5 font-mono">↑↓</kbd>
              <span>navigate</span>
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
