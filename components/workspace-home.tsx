'use client'

/**
 * WorkspaceHome — the ONLY home page surface.
 *
 * Renders identically for signed-in and signed-out users:
 *   - editorial title + subtitle
 *   - the chat input (rendered by parent ChatPanel) sits between this header
 *     and the pipeline section
 *   - a 4-step pipeline strip explaining the product
 *   - signed-in users also see Recent campaigns
 *
 * Signed-out users get the chat textbox visually disabled and a single
 * "Start 7-day trial — Continue with Google" button below it. No marketing
 * scroll, no nav, no pricing wall. The trial is no-card-required: we
 * provision the trial row at first sign-in (see app/auth/oauth/route.ts).
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
    <section className="mx-auto w-full max-w-4xl px-6 pt-12 pb-6 md:pt-16">
      {/* Title */}
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
        <span className="h-px w-6 bg-[hsl(var(--hermes-mist))]" />
        Hermes — outbound operator
      </div>
      <h1 className="font-serif text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.02em] text-[hsl(var(--hermes-ink))]">
        What are we running today?
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] text-[hsl(var(--hermes-steel))]">
        Drop a campaign brief in the box below — or pick a starting point.
      </p>

      {/* Quick-starts (signed-in: prefill input. signed-out: same — they'll
          land here after Google sign-in and the prompt will already be set.) */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
          Try
        </span>
        {QUICK_STARTS.map(qs => (
          <button
            key={qs.label}
            type="button"
            onClick={() => onSelectPrompt?.(qs.prompt)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--hermes-mist))] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[hsl(var(--hermes-ink-soft))] transition-colors hover:border-[hsl(var(--hermes-ink))] hover:text-[hsl(var(--hermes-ink))]"
          >
            {qs.label}
          </button>
        ))}
      </div>

      {/* Recent campaigns — only when populated */}
      {loaded && recent.length > 0 ? (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
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

/**
 * PipelineSection — the 4-step explainer rendered BELOW the chat textbox.
 * Same component used on both signed-in and signed-out homes so the visual
 * doesn't shift after sign-in. Kept editorial: serif numerals, hairline
 * dividers, no fake terminal logs, no brand-leaking vendor names in headers.
 */
export function PipelineSection() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 pt-4 pb-16 md:pb-24">
      <div className="mt-6 mb-8 flex items-center gap-3 text-[hsl(var(--hermes-mist))]">
        <span className="h-px flex-1 bg-current" />
        <span className="block h-1.5 w-1.5 rotate-45 bg-[hsl(var(--hermes-gold))]" />
        <span className="h-px flex-1 bg-current" />
      </div>

      <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
        How it works
      </div>
      <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.4rem)] leading-[1.05] tracking-[-0.01em] text-[hsl(var(--hermes-ink))]">
        From a single brief to{' '}
        <span className="italic">live pipeline.</span>
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12 md:gap-y-12 lg:grid-cols-4 lg:gap-8">
        {PIPELINE.map((step, i) => {
          const Icon = step.icon
          return (
            <article key={step.n} className="relative flex flex-col">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-[28px] leading-none text-[hsl(var(--hermes-ink))]">
                  {step.n}
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-[hsl(var(--hermes-mist))]"
                />
                <Icon
                  className="h-4 w-4 text-[hsl(var(--hermes-ink-soft))]"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-4 font-serif text-[20px] leading-tight text-[hsl(var(--hermes-ink))]">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.55] text-[hsl(var(--hermes-steel))]">
                {step.body}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
