'use client'

import { ArrowRight, BadgeCheck, Compass, Mail, Radar, Sparkles } from 'lucide-react'

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
  { icon: Radar, label: 'Live web signals', detail: 'Events, reviews, jobs, directories' },
  { icon: Compass, label: 'Decision-maker path', detail: 'Owner, operator, buyer, partner' },
  { icon: Mail, label: 'Drafts for review', detail: 'Evidence-backed, never blind send' }
]

const RUN_FACTS = [
  ['1', 'brief'],
  ['live', 'sources'],
  ['review', 'gate']
]

export function WorkspaceHome({
  onSelectPrompt
}: {
  onSelectPrompt?: (prompt: string) => void
}) {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 pb-6 pt-6 sm:px-6 md:pt-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="text-center lg:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#dfe4ee] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#315dff] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            New GTM motion
          </div>
          <h1 className="max-w-[760px] font-serif text-[42px] font-normal leading-[0.96] text-[hsl(var(--ink))] md:text-[60px]">
            Build the outbound engine.
          </h1>
          <p className="mx-auto mt-4 max-w-[650px] text-[14.5px] leading-[1.65] text-[hsl(var(--steel))] lg:mx-0">
            Tell Hermes your offer, target market, buyer, geography, and constraints.
            It reads the site when needed, maps source-backed accounts, enriches
            people, and drafts the first emails for review.
          </p>
        </div>

        <div className="hidden rounded-lg border border-[#dfe4ee] bg-white/80 p-4 shadow-[0_18px_48px_rgba(5,18,47,0.06)] lg:block">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6a7283]">
              Run shape
            </p>
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-3">
            {SIGNALS.map(({ icon: Icon, label, detail }, index) => (
              <div key={label} className="flex items-center gap-3 rounded-md border border-[#edf0f6] bg-[#fbfcff] p-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#dfe4ee] bg-white text-[#315dff]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold text-[#071329]">{label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-[#6a7283]">
                    {detail}
                  </span>
                </span>
                {index < SIGNALS.length - 1 && (
                  <span className="ml-auto hidden h-px w-8 bg-[#dfe4ee] xl:block" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {RUN_FACTS.map(([value, label]) => (
              <div key={label} className="rounded-md border border-[#edf0f6] bg-white px-3 py-2 text-center">
                <div className="text-[13px] font-semibold text-[#071329]">{value}</div>
                <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a92a6]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-3 md:grid-cols-3">
        {STARTERS.map(starter => (
          <button
            key={starter.label}
            type="button"
            onClick={() => onSelectPrompt?.(starter.prompt)}
            className="group min-h-[118px] rounded-lg border border-[#dfe4ee] bg-white/80 p-4 text-left shadow-[0_10px_28px_rgba(5,18,47,0.04)] transition-colors hover:border-[#bfc9ff] hover:bg-white"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-semibold text-[#071329]">
                {starter.label}
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#edf0f6] bg-[#fbfcff] transition-colors group-hover:border-[#bfc9ff]">
                <ArrowRight className="h-3.5 w-3.5 text-[#8a92a6] transition-colors group-hover:text-[#315dff]" />
              </span>
            </span>
            <span className="mt-2 block line-clamp-3 text-[11.5px] leading-[1.5] text-[#6a7283]">
              {starter.prompt}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
