'use client'

import { ArrowRight, CheckCircle2, Compass, Mail, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Button } from './ui/button'
import { createClient } from '@/lib/supabase/client'

/* ── Quick-start templates ─────────────────────────────────────────── */

const QUICK_STARTS = [
  { label: 'Bay Area STEM counselors' },
  { label: 'Boston STEM directories' },
  { label: 'DTC beauty agency' }
]

/* ── Pipeline steps ────────────────────────────────────────────────── */

const PIPELINE = [
  {
    n: '01',
    title: 'Describe',
    body: 'One sentence about who you want to reach. We ask only for what we need.',
    icon: Sparkles
  },
  {
    n: '02',
    title: 'Discover',
    body: 'We map the market via semantic search and verify each match against your criteria.',
    icon: Search
  },
  {
    n: '03',
    title: 'Resolve',
    body: 'We find the right decision-maker per account and verify their email.',
    icon: Compass
  },
  {
    n: '04',
    title: 'Send',
    body: 'Review the drafts. Send from your real Gmail inbox, with reply tracking.',
    icon: Mail
  }
]

/* ── Feature cards ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    title: 'Semantic market discovery',
    body: 'Exa-powered web search understands meaning, not just keywords. Finds companies that match your ICP even if they describe themselves differently.'
  },
  {
    title: 'Decision-maker resolution',
    body: 'Every company gets enriched with the actual contact — name, title, LinkedIn, verified email. No more guesswork.'
  },
  {
    title: 'Evidence-backed drafts',
    body: 'Every pitch cites real signals from their website, recent news, and job postings. Grounded, not generic.'
  },
  {
    title: 'Send from your Gmail',
    body: 'Connect your inbox once. Drafts stay in Drafts until you review. Sends come from your real address with reply tracking.'
  }
]

/* ── Component ──────────────────────────────────────────────────────── */

export function LandingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/oauth?next=/`,
          scopes:
            'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send',
          queryParams: { access_type: 'offline', prompt: 'select_account consent' }
        }
      })
      if (e) throw e
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--paper))]">
      {/* ═══ HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[hsl(var(--ink))]">
        {/* Subtle gradient blobs for depth */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-white/[0.03] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-20 md:pb-20 md:pt-28">
          {/* Eyebrow */}
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-8 bg-white/25" />
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
              Outbound, ground-truth
            </span>
          </div>

          {/* Headline */}
          <h1 className="max-w-3xl text-[clamp(2.2rem,5vw,3.2rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-white">
            Who do you want to reach?
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-[1.55] text-white/60">
            Describe one sentence. Outfield finds the companies, resolves the
            decision-maker, drafts a pitch grounded in real evidence, and sends
            from your Gmail.
          </p>

          {/* Quick-start chips */}
          <div className="mt-7 flex flex-wrap gap-1.5">
            {QUICK_STARTS.map(q => (
              <span
                key={q.label}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[12.5px] text-white/55"
              >
                {q.label}
              </span>
            ))}
          </div>

          {/* CTA card */}
          <div className="mt-10 max-w-md rounded-xl border border-white/[0.10] bg-white/[0.04] p-5 backdrop-blur-sm">
            <div className="flex items-baseline gap-2 text-white/50">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
                Start free
              </span>
            </div>
            <h2 className="mt-1 text-[20px] font-semibold text-white">
              7 days free, then $40/mo
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-white/45">
              No card required. Connect Gmail, send your first sequence today.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                onClick={signIn}
                disabled={loading}
                className="h-11 px-6 rounded-lg bg-white text-[hsl(var(--ink))] hover:bg-white/90 text-[14px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              >
                {loading ? 'Redirecting…' : 'Continue with Google'}
              </Button>
              {error && (
                <span className="text-[12px] text-red-300">{error}</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom fade — transitions hero into paper */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[hsl(var(--paper))] to-transparent" />
      </section>

      {/* ═══ HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 md:pb-20 md:pt-28">
        <p className="mx-auto mb-2 max-w-4xl text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--steel))]">
          How it works
        </p>
        <h2 className="mx-auto max-w-4xl text-center text-[clamp(1.6rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.01em] text-[hsl(var(--ink))]">
          From a single brief to live pipeline.
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((step, i) => {
            const Icon = step.icon
            return (
              <article
                key={step.n}
                className="group relative flex flex-col rounded-xl border border-[hsl(var(--mist))] bg-white p-5 transition-shadow hover:shadow-[0_4px_20px_rgba(5,18,47,0.06)]"
              >
                {/* Step number + connector */}
                <div className="mb-4 flex items-center gap-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--ink))] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  {i < PIPELINE.length - 1 && (
                    <div className="ml-2 hidden h-px flex-1 bg-[hsl(var(--mist))] lg:block" />
                  )}
                </div>
                <Icon
                  className="mb-3 h-5 w-5 text-[hsl(var(--steel))]"
                  strokeWidth={1.75}
                />
                <h3 className="text-[15px] font-semibold text-[hsl(var(--ink))]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-[hsl(var(--steel))]">
                  {step.body}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      {/* ═══ WHAT YOU GET ─────────────────────────────────────────── */}
      <section className="bg-[hsl(var(--soft))]">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-20 md:pb-20 md:pt-28">
          <p className="mx-auto mb-2 max-w-4xl text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--steel))]">
            What you get
          </p>
          <h2 className="mx-auto max-w-4xl text-center text-[clamp(1.6rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.01em] text-[hsl(var(--ink))]">
            Everything you need to run outbound.
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="flex items-start gap-4 rounded-xl border border-[hsl(var(--mist))] bg-white p-5"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ink))]"
                  strokeWidth={1.75}
                />
                <div>
                  <h3 className="text-[14px] font-semibold text-[hsl(var(--ink))]">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-[1.55] text-[hsl(var(--steel))]">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <Button
              type="button"
              onClick={signIn}
              disabled={loading}
              className="h-12 px-8 rounded-lg bg-[hsl(var(--ink))] text-white hover:bg-[hsl(var(--ink)/0.92)] text-[15px] font-semibold shadow-[0_2px_12px_rgba(5,18,47,0.15)]"
            >
              {loading ? 'Redirecting…' : 'Start free — 7 days, no card'}
            </Button>
            {error && (
              <span className="text-[12px] text-red-600">{error}</span>
            )}
            <p className="text-[12px] text-[hsl(var(--steel))]">
              $40/mo after trial. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-[hsl(var(--mist))]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-[12px] text-[hsl(var(--steel))]">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[hsl(var(--ink))] text-[9px] font-bold text-white">
              O
            </span>
            <span className="font-semibold text-[hsl(var(--ink))]">Outfield</span>
          </div>
          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
