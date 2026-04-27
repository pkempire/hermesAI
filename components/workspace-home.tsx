'use client'

/**
 * Workspace home — what signed-in users see when they have no messages yet.
 *
 * Strict app surface. NO marketing copy, NO pricing, NO "what's inside" grid.
 * Just: title, three quick-start chips that prefill the chat input below,
 * and a list of the user's recent campaigns. Clean and focused.
 */

import { ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { logger } from '@/lib/utils/logger'

interface WorkspaceHomeProps {
  /** Push a prompt into the chat input below. Does NOT submit. */
  onSelectPrompt?: (prompt: string) => void
}

interface RecentChat {
  id: string
  title: string
  path?: string
  createdAt?: string | Date
}

const QUICK_STARTS: { label: string; sub: string; prompt: string }[] = [
  {
    label: 'Bay Area STEM/Ivy counselors',
    sub: 'Refer Lucid Academy to founder-led counseling firms.',
    prompt:
      'Find 25 founder-led private college counseling firms in the Bay Area that specialize in STEM/Ivy admissions. Skip Crimson, IvyWise, C2, Princeton Review and other large franchises. I want to refer their high-school students to Lucid Academy (lucid-education.com) — read the homepage first to understand the offer, then design enrichments and outreach.'
  },
  {
    label: 'Boston STEM directories',
    sub: 'Get Lucid listed in MA/Greater Boston parent directories.',
    prompt:
      'Find 15 Massachusetts / Greater Boston directories that list student STEM summer programs for parents. I want to get Lucid Academy (lucid-education.com) listed in their directory — find the editor or partnerships contact and draft a short pitch with a paste-ready listing blurb.'
  },
  {
    label: 'DTC beauty agency outreach',
    sub: 'Pitch a Meta ads agency to growing beauty brands.',
    prompt:
      'Find 25 e-commerce DTC brands in beauty doing $500k–$5M ARR — pitch them my Meta ads agency. I want to reach the founder or marketing lead.'
  }
]

export function WorkspaceHome({ onSelectPrompt }: WorkspaceHomeProps) {
  const [recent, setRecent] = useState<RecentChat[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/chats?limit=5', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setLoaded(true)
          return
        }
        const data = await res.json()
        const chats: RecentChat[] = Array.isArray(data?.chats)
          ? data.chats.slice(0, 5)
          : []
        if (!cancelled) {
          setRecent(chats)
          setLoaded(true)
        }
      } catch (err) {
        logger.warn('WorkspaceHome: failed to load recent chats', err)
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mx-auto w-full max-w-4xl px-6 pt-12 pb-6 md:pt-16">
      {/* Eyebrow + title */}
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
        <span className="h-px w-6 bg-[hsl(var(--hermes-mist))]" />
        Workspace
      </div>
      <h1 className="font-serif text-[clamp(2.2rem,4.6vw,3.4rem)] leading-[1.02] tracking-[-0.02em] text-[hsl(var(--hermes-ink))]">
        What are we running today?
      </h1>
      <p className="mt-3 text-[15px] text-[hsl(var(--hermes-steel))] max-w-2xl">
        Drop a campaign brief in the box below — or pick a starting point.
      </p>

      {/* Quick-starts */}
      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {QUICK_STARTS.map(qs => (
          <button
            key={qs.label}
            type="button"
            onClick={() => onSelectPrompt?.(qs.prompt)}
            className="group flex flex-col gap-2 rounded-2xl border border-[hsl(var(--hermes-mist))] bg-white p-5 text-left transition-all hover:border-[hsl(var(--hermes-ink))] hover:shadow-[0_18px_40px_-30px_rgba(10,24,53,0.4)]"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--hermes-steel))]">
              Quick start
            </span>
            <span className="font-serif text-[18px] leading-tight text-[hsl(var(--hermes-ink))]">
              {qs.label}
            </span>
            <span className="text-[13px] leading-relaxed text-[hsl(var(--hermes-steel))]">
              {qs.sub}
            </span>
            <span className="mt-auto inline-flex items-center gap-1.5 text-[12px] font-medium text-[hsl(var(--hermes-ink))]">
              Use brief
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>

      {/* Recent campaigns — only render when we have data, never a hollow box */}
      {loaded && recent.length > 0 ? (
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[12px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
              Recent
            </h2>
            <Link
              href="/campaigns"
              className="text-[12px] text-[hsl(var(--hermes-ink-soft))] hover:text-[hsl(var(--hermes-ink))]"
            >
              All campaigns →
            </Link>
          </div>
          <ul className="divide-y divide-[hsl(var(--hermes-mist))] rounded-xl border border-[hsl(var(--hermes-mist))] bg-white">
            {recent.map(chat => (
              <li key={chat.id}>
                <Link
                  href={chat.path || `/search/${chat.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-[14px] text-[hsl(var(--hermes-ink))] hover:bg-[hsl(var(--hermes-cream))]"
                >
                  <Clock className="h-3.5 w-3.5 text-[hsl(var(--hermes-steel))]" />
                  <span className="truncate flex-1">
                    {chat.title || 'Untitled campaign'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--hermes-steel))]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
