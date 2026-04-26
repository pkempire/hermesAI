'use client'

/**
 * Hero — landing hero block, modeled after the Hermes GTM design mocks.
 * Layout: split column. Left = eyebrow + giant serif headline + body + CTA pair
 * + capability pills row. Right = quiet illustration plate (kept simple — text
 * comes first). On mobile the right plate hides.
 *
 * No ornamental gold. No fake terminal logs. Editorial weight only.
 */

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface HeroProps {
  /** Push a prompt into the chat input below. Does NOT submit. */
  onSelectPrompt?: (prompt: string) => void
}

export function Hero({ onSelectPrompt }: HeroProps) {
  return (
    <section className="relative w-full">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-16 pb-12 md:grid-cols-[1.15fr_1fr] md:gap-16 md:px-10 md:pt-24">
        {/* LEFT */}
        <div className="flex flex-col">
          <span className="mb-6 inline-flex w-fit items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
            <span className="h-px w-8 bg-[hsl(var(--hermes-mist))]" />
            AI Outbound Operator
          </span>

          <h1 className="font-serif text-[clamp(3rem,7vw,5.6rem)] leading-[0.94] tracking-[-0.02em] text-[hsl(var(--hermes-ink))]">
            Own your{' '}
            <span className="italic">outbound engine.</span>
          </h1>

          <p className="mt-7 max-w-xl text-[17px] leading-[1.55] text-[hsl(var(--hermes-steel))]">
            Describe your ICP in one line. Hermes maps the market, resolves the
            decision-maker, drafts pitches grounded in real evidence, and sends
            through your Gmail. One operator instead of Apollo + Clay +
            Instantly + glue.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById('hermes-input')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                ;(document.querySelector(
                  'textarea[name="input"]'
                ) as HTMLTextAreaElement | null)?.focus()
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--hermes-ink))] px-6 py-3 text-[14px] font-medium text-[hsl(var(--hermes-cream))] transition-colors hover:opacity-90"
            >
              Run a campaign
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--hermes-mist))] bg-transparent px-6 py-3 text-[14px] font-medium text-[hsl(var(--hermes-ink))] transition-colors hover:border-[hsl(var(--hermes-ink))]"
            >
              See how it works
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Try chips */}
          <div className="mt-10 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
              Try
            </span>
            {QUICK_STARTS.map(qs => (
              <button
                key={qs.label}
                type="button"
                onClick={() => onSelectPrompt?.(qs.prompt)}
                className="rounded-full border border-[hsl(var(--hermes-mist))] bg-white px-3.5 py-1.5 font-medium text-[hsl(var(--hermes-ink-soft))] transition-colors hover:border-[hsl(var(--hermes-ink))] hover:text-[hsl(var(--hermes-ink))]"
              >
                {qs.label}
              </button>
            ))}
          </div>

          {/* Capability pills (mock-style: 3 short proofs with bullet) */}
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[hsl(var(--hermes-ink-soft))]">
            {CAPABILITIES.map(c => (
              <span
                key={c}
                className="inline-flex items-center gap-2 before:block before:h-1 before:w-1 before:rounded-full before:bg-[hsl(var(--hermes-ink))]"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT — quiet illustration plate */}
        <div className="relative hidden md:block">
          <PlateIllustration />
        </div>
      </div>
    </section>
  )
}

const QUICK_STARTS: { label: string; prompt: string }[] = [
  {
    label: 'Recruiters',
    prompt:
      'Find Series A–B fintech CTOs hiring senior engineers in NYC. I help with retained search.'
  },
  {
    label: 'Agencies',
    prompt:
      'Find 25 e-commerce DTC brands in beauty doing $500k–$5M ARR — pitch them my Meta ads agency.'
  },
  {
    label: 'Founders',
    prompt:
      'Find devtool startups whose CEOs wrote about agent infra in the last 6 months. Pitching my open-source agent framework.'
  }
]

const CAPABILITIES = [
  'Account research',
  'Decision-maker resolution',
  'Outbound systems',
  'Lead scoring',
  'Gmail-native sending'
]

/**
 * PlateIllustration — vector "plate" that evokes the hero composition in the
 * design mocks (a quiet abstract object with depth) without shipping a
 * megabyte JPG. Pure SVG, scales infinitely, themable.
 */
function PlateIllustration() {
  return (
    <div className="relative aspect-square w-full max-w-[480px] mx-auto">
      <svg
        viewBox="0 0 480 480"
        className="h-full w-full"
        aria-hidden="true"
        role="img"
      >
        {/* outer warm parchment plate */}
        <defs>
          <radialGradient id="plate" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="hsl(35 35% 96%)" />
            <stop offset="60%" stopColor="hsl(35 35% 88%)" />
            <stop offset="100%" stopColor="hsl(35 35% 80%)" />
          </radialGradient>
          <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(222 71% 18%)" />
            <stop offset="100%" stopColor="hsl(222 71% 8%)" />
          </linearGradient>
        </defs>
        <circle cx="240" cy="240" r="220" fill="url(#plate)" />
        {/* concentric rings */}
        <circle
          cx="240"
          cy="240"
          r="180"
          fill="none"
          stroke="hsl(222 22% 76%)"
          strokeWidth="0.8"
          opacity="0.55"
        />
        <circle
          cx="240"
          cy="240"
          r="140"
          fill="none"
          stroke="hsl(222 22% 70%)"
          strokeWidth="0.8"
          opacity="0.45"
        />
        {/* ink coin centerpiece */}
        <circle cx="240" cy="240" r="92" fill="url(#ink)" />
        <circle
          cx="240"
          cy="240"
          r="92"
          fill="none"
          stroke="hsl(36 50% 48%)"
          strokeWidth="1.2"
          opacity="0.5"
        />
        {/* serif H mark */}
        <text
          x="240"
          y="262"
          textAnchor="middle"
          fontFamily="var(--font-serif), Cormorant Garamond, serif"
          fontSize="112"
          fontStyle="italic"
          fontWeight="500"
          fill="hsl(35 35% 92%)"
        >
          H
        </text>
        {/* trajectory line */}
        <path
          d="M 90 360 Q 240 120 410 360"
          fill="none"
          stroke="hsl(222 71% 12%)"
          strokeWidth="1"
          strokeDasharray="4 6"
          opacity="0.4"
        />
        <circle cx="90" cy="360" r="3" fill="hsl(222 71% 12%)" />
        <circle cx="410" cy="360" r="3" fill="hsl(36 50% 48%)" />
      </svg>
    </div>
  )
}
