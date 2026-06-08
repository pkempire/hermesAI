'use client'

import { ArrowRight, Compass, Mail, Radar, Sparkles } from 'lucide-react'

const STARTERS = [
  {
    label: 'Event sponsor sweep',
    prompt:
      'Find 30 companies sponsoring supply chain or manufacturing conferences in the US this quarter. I sell field marketing content production. Reach the VP Marketing, events lead, or demand gen leader and draft a post-event campaign pitch.'
  },
  {
    label: 'Review-pain conquest',
    prompt:
      'Find 30 home service companies in Texas with recent reviews mentioning scheduling delays, missed appointments, or slow follow-up. I sell call answering and booking automation. Reach the owner or operations manager and draft one respectful, evidence-backed email.'
  },
  {
    label: 'Partner referral map',
    prompt:
      'Find 25 boutique college counseling firms in the Bay Area that serve STEM or Ivy-focused students. I run Lucid Academy, an AI and research coaching program for high school students. Reach the founder and draft a referral partnership email.'
  }
]

const SIGNALS = [
  { icon: Radar, label: 'Live web signals' },
  { icon: Compass, label: 'Decision-maker path' },
  { icon: Mail, label: 'Drafts for review' }
]

export function WorkspaceHome({
  onSelectPrompt
}: {
  onSelectPrompt?: (prompt: string) => void
}) {
  return (
    <section className="mx-auto w-full max-w-[920px] px-4 pb-5 pt-6 sm:px-6 md:pt-8">
      <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-end">
        <div className="text-center lg:text-left">
          <div className="mb-4 inline-flex items-center gap-2 border border-[#dfe4ee] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase text-[#315dff]">
            <Sparkles className="h-3.5 w-3.5" />
            New GTM motion
          </div>
          <h1 className="font-serif text-[40px] font-normal leading-[0.98] text-[hsl(var(--ink))] md:text-[56px]">
            Build the outbound engine.
          </h1>
          <p className="mx-auto mt-4 max-w-[650px] text-[14.5px] leading-[1.65] text-[hsl(var(--steel))] lg:mx-0">
            Tell Hermes your offer, target market, buyer, geography, and constraints.
            It reads the site when needed, maps source-backed accounts, enriches
            people, and drafts the first emails for review.
          </p>
        </div>

        <div className="hidden border border-[#dfe4ee] bg-white/72 p-4 shadow-[0_18px_48px_rgba(5,18,47,0.05)] lg:block">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6a7283]">
            Run shape
          </p>
          <div className="space-y-2">
            {SIGNALS.map(({ icon: Icon, label }, index) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center border border-[#dfe4ee] bg-[#f5f7ff] text-[#315dff]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[12.5px] font-medium text-[#071329]">{label}</span>
                {index < SIGNALS.length - 1 && (
                  <span className="ml-auto h-px w-8 bg-[#dfe4ee]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-2 md:grid-cols-3">
        {STARTERS.map(starter => (
          <button
            key={starter.label}
            type="button"
            onClick={() => onSelectPrompt?.(starter.prompt)}
            className="group border border-[#dfe4ee] bg-white/75 p-3 text-left transition-colors hover:border-[#bfc9ff] hover:bg-white"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-semibold text-[#071329]">
                {starter.label}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#8a92a6] transition-colors group-hover:text-[#315dff]" />
            </span>
            <span className="mt-1 block line-clamp-2 text-[11.5px] leading-[1.45] text-[#6a7283]">
              {starter.prompt}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
