'use client'

/**
 * Hero — empty-state landing block shown above the chat input when there are
 * no messages yet. Replaces the previous "BUILD A NEW CAMPAIGN" gold/Socrates
 * splash. Aim: editorial, restrained, B2B-credible.
 */

import { ArrowRight } from 'lucide-react'

interface HeroProps {
  /** Push a prompt into the chat input below. Does NOT submit. */
  onSelectPrompt?: (prompt: string) => void
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

export function Hero({ onSelectPrompt }: HeroProps) {
  return (
    <section className="relative w-full mx-auto max-w-5xl px-6 pt-16 md:pt-24 pb-8">
      {/* Eyebrow */}
      <div className="flex justify-center mb-6">
        <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-gray-500">
          <span className="h-px w-8 bg-gray-300" />
          AI Outbound Operator
          <span className="h-px w-8 bg-gray-300" />
        </span>
      </div>

      {/* Headline */}
      <h1 className="font-serif text-center text-[clamp(2.6rem,6vw,4.5rem)] leading-[0.95] tracking-[-0.02em] text-gray-900 max-w-4xl mx-auto">
        Own your{' '}
        <span className="italic text-[hsl(var(--hermes-gold-dark))]">
          outbound engine.
        </span>
      </h1>

      {/* Subhead */}
      <p className="mt-6 text-center text-[17px] md:text-[18px] leading-relaxed text-gray-600 max-w-2xl mx-auto">
        Describe your ICP in one line. Hermes finds the right companies,
        resolves the decision-maker, drafts a pitch grounded in real evidence,
        and sends through your Gmail. No Apollo. No Clay. No Instantly.
      </p>

      {/* Quick-starts */}
      <div className="mt-12 flex flex-wrap justify-center gap-2">
        <span className="text-[12px] uppercase tracking-[0.18em] text-gray-400 mr-2 self-center">
          Try
        </span>
        {QUICK_STARTS.map(qs => (
          <button
            key={qs.label}
            type="button"
            onClick={() => onSelectPrompt?.(qs.prompt)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[13px] font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            {qs.label}
            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </button>
        ))}
      </div>
    </section>
  )
}
