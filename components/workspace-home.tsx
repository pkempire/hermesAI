'use client'

/**
 * WorkspaceHome — the ONLY home page surface (above the chat input).
 *
 * Calm editorial header that doesn't fight the chat input below it.
 * No serif slab, no pixel watermark — just a tight greeting + a thin row
 * of pre-baked prompts.
 */

import {
  ArrowRight,
  Clock,
  Compass,
  Mail,
  Search as SearchIcon,
  Sparkles
} from 'lucide-react'
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

const QUICK_STARTS: { label: string; prompt: string }[] = [
  {
    label: 'Bay Area STEM counselors',
    prompt:
      'Find 25 founder-led private college counseling firms in the Bay Area that specialize in STEM/Ivy admissions. Skip Crimson, IvyWise, C2, Princeton Review and other large franchises. I want to refer their high-school students to Lucid Academy (lucid-education.com) — read the homepage first to understand the offer, then design enrichments and outreach.'
  },
  {
    label: 'Boston STEM directories',
    prompt:
      'Find 15 Massachusetts / Greater Boston directories that list student STEM summer programs for parents. I want to get Lucid Academy (lucid-education.com) listed in their directory — find the editor or partnerships contact and draft a short pitch with a paste-ready listing blurb.'
  },
  {
    label: 'DTC beauty agency',
    prompt:
      'Find 25 e-commerce DTC brands in beauty doing $500k–$5M ARR — pitch them my Meta ads agency. I want to reach the founder or marketing lead.'
  }
]

const PIPELINE = [
  {
    n: '01',
    title: 'Brief',
    body: 'Describe target, offer, constraints in one sentence. Hermes asks only for what it actually needs.',
    icon: Sparkles
  },
  {
    n: '02',
    title: 'Discover',
    body: 'Hermes maps the market with Exa Websets, scores fit, and resolves the right decision-maker per account.',
    icon: Compass
  },
  {
    n: '03',
    title: 'Decide',
    body: 'You review the qualified list with cited evidence per prospect. Edit criteria, drop bad fits, lock in your sequence.',
    icon: SearchIcon
  },
  {
    n: '04',
    title: 'Send',
    body: 'Drafts personalised pitches grounded in real evidence. Connect Gmail and send from your real inbox.',
    icon: Mail
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
    <section className="mx-auto w-full max-w-3xl px-6 pt-10 pb-2 md:pt-14">
      <h1 className="text-[26px] md:text-[30px] font-medium leading-[1.15] tracking-[-0.015em] text-[hsl(var(--hermes-ink))]">
        What are we running today?
      </h1>
      <p className="mt-1.5 text-[14px] text-[hsl(var(--hermes-ink-soft))]">
        Drop a brief in the box below — or pick a starting point.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {QUICK_STARTS.map(qs => (
          <button
            key={qs.label}
            type="button"
            onClick={() => onSelectPrompt?.(qs.prompt)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--hermes-ink)/0.12)] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[hsl(var(--hermes-ink-soft))] transition-colors hover:border-[hsl(var(--hermes-ink)/0.4)] hover:text-[hsl(var(--hermes-ink))]"
          >
            {qs.label}
          </button>
        ))}
      </div>

      {loaded && recent.length > 0 ? (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--hermes-ink-soft))]">
              Recent
            </h2>
            <Link
              href="/campaigns"
              className="text-[12px] text-[hsl(var(--hermes-ink-soft))] hover:text-[hsl(var(--hermes-ink))]"
            >
              All campaigns →
            </Link>
          </div>
          <ul className="divide-y divide-[hsl(var(--hermes-ink)/0.08)] rounded-xl border border-[hsl(var(--hermes-ink)/0.1)] bg-white">
            {recent.map(chat => (
              <li key={chat.id}>
                <Link
                  href={chat.path || `/search/${chat.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-[13.5px] text-[hsl(var(--hermes-ink))] hover:bg-[hsl(var(--hermes-cream))]"
                >
                  <Clock className="h-3.5 w-3.5 text-[hsl(var(--hermes-ink-soft))]" />
                  <span className="truncate flex-1">
                    {chat.title || 'Untitled campaign'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--hermes-ink-soft))]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

/**
 * PipelineSection — kept for the signed-out CTA block; signed-in users see
 * the dark TemplateGallery instead.
 */
export function PipelineSection() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 pt-4 pb-10">
      <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-ink-soft))]">
        How it works
      </div>
      <h2 className="text-[22px] md:text-[26px] font-medium leading-tight tracking-[-0.01em] text-[hsl(var(--hermes-ink))]">
        From a single brief to live pipeline.
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {PIPELINE.map(step => {
          const Icon = step.icon
          return (
            <article key={step.n} className="relative flex flex-col">
              <div className="flex items-baseline gap-3">
                <span className="text-[20px] font-medium leading-none text-[hsl(var(--hermes-ink))]">
                  {step.n}
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-[hsl(var(--hermes-ink)/0.12)]"
                />
                <Icon
                  className="h-4 w-4 text-[hsl(var(--hermes-ink-soft))]"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-3 text-[16px] font-medium leading-tight text-[hsl(var(--hermes-ink))]">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[hsl(var(--hermes-ink-soft))]">
                {step.body}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
