'use client'

import { ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { logger } from '@/lib/utils/logger'

interface WorkspaceHomeProps {
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

export function WorkspaceHome({ onSelectPrompt }: WorkspaceHomeProps) {
  const [recent, setRecent] = useState<RecentChat[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/chats?limit=5', { cache: 'no-store' })
        if (!res.ok) { if (!cancelled) setLoaded(true); return }
        const data = await res.json()
        const chats: RecentChat[] = Array.isArray(data?.chats) ? data.chats.slice(0, 5) : []
        if (!cancelled) { setRecent(chats); setLoaded(true) }
      } catch (err) {
        logger.warn('WorkspaceHome: failed to load recent chats', err)
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-12 pb-2 md:pt-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--steel))] mb-3">New campaign</p>
      <h1 className="text-[clamp(1.6rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.01em] text-[hsl(var(--ink))]">
        Who do you want to reach?
      </h1>
      <p className="mt-2 text-[14px] leading-[1.5] text-[hsl(var(--steel))]">
        Describe one sentence. Outfield finds the companies, resolves the
        decision-maker, drafts a pitch, and sends from your Gmail.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {QUICK_STARTS.map(qs => (
          <button
            key={qs.label} type="button"
            onClick={() => onSelectPrompt?.(qs.prompt)}
            className="inline-flex items-center rounded-full border border-[hsl(var(--mist))] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[hsl(var(--steel))] transition-colors hover:border-[hsl(var(--ink)/0.4)] hover:text-[hsl(var(--ink))] hover:bg-[hsl(var(--soft))]"
          >
            {qs.label}
          </button>
        ))}
      </div>

      {loaded && recent.length > 0 ? (
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--steel))]">Recent</p>
            <Link href="/campaigns" className="text-[12px] text-[hsl(var(--steel))] hover:text-[hsl(var(--ink))]">All →</Link>
          </div>
          <ul className="divide-y divide-[hsl(var(--mist))] rounded-xl border border-[hsl(var(--mist))] bg-white">
            {recent.map(chat => (
              <li key={chat.id}>
                <Link href={chat.path || `/search/${chat.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-[13.5px] text-[hsl(var(--ink))] hover:bg-[hsl(var(--soft))]">
                  <Clock className="h-3.5 w-3.5 text-[hsl(var(--steel))]" />
                  <span className="truncate flex-1">{chat.title || 'Untitled campaign'}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--steel))]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
