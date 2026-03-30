'use client'

import { useState } from 'react'
import { ExternalLink, Globe, Zap, Users } from 'lucide-react'
import Image from 'next/image'

// ─── Animated terminal log ────────────────────────────────────────────────────

function AnimatedLog({ lines }: { lines: { text: string; color?: string }[] }) {
  return (
    <div className="font-mono text-[11px] leading-relaxed space-y-1.5">
      {lines.map((line, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 100}ms` }}
          className={`flex items-start gap-2 opacity-0 animate-[fadeUp_0.35s_ease-out_forwards] ${line.color || 'text-gray-400'}`}
        >
          <span className="shrink-0 text-gray-600 select-none">›</span>
          <span>{line.text}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Step data ────────────────────────────────────────────────────────────────

const steps = [
  {
    id: 'query',
    number: '00',
    phase: 'The Command',
    image: '/images/hermes-pixel-icon.png',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    accent: 'indigo',
    name: 'Your Natural Language Brief',
    description: 'You don\'t build lists; you talk to Hermes. A single prompt like "Find 25 Series A CTOs in NY" triggers the entire autonomous research chain.',
    facts: [
      'Accepts raw, unstructured natural language',
      'Understands intent, filters, and persona',
      'Automatically triggers website analysis',
    ],
    logTitle: 'hermes-input.log',
    logLines: [
      { text: 'USER > "Find 25 B2B SaaS Founders in NY..."', color: 'text-white' },
      { text: 'Analyzing intent...', color: 'text-gray-400' },
      { text: 'Entity: "Founder", Geo: "New York", Type: "B2B SaaS"', color: 'text-indigo-300' },
      { text: 'Intent verified. Pipeline initialized.', color: 'text-emerald-400' },
    ],
  },
  {
    id: 'scrape',
    number: '01',
    phase: 'Offer Intelligence',
    image: '/images/hermes-pixel.png',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    accent: 'amber',
    name: 'Understand your Edge',
    description:
      'Hermes visits your website to extract your ICP, positioning, and value prop. Every subsequent search is grounded in what you actually sell.',
    facts: [
      'Crawls your website for positioning cues',
      'Identifies ICP and unique value propositions',
      'Custom signals seeded for the outreach angle',
    ],
    logTitle: 'hermes-scrape.log',
    logLines: [
      { text: 'GET https://your-site.com → 200 OK', color: 'text-emerald-400' },
      { text: 'Parsing offer context...', color: 'text-gray-400' },
      { text: 'ICP: "B2B SaaS, 50-200 emp"', color: 'text-amber-300' },
      { text: 'Offer: "AI-native GTM infrastructure"', color: 'text-amber-300' },
      { text: 'Brand voice: Professional/Technical ✓', color: 'text-emerald-400' },
    ],
  },
  {
    id: 'exa',
    number: '02',
    phase: 'Semantic Discovery',
    image: '/images/hermes-discovery.png',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    accent: 'blue',
    name: 'Map the Market with Exa',
    description: 'Exa uses neural semantic search—not keywords—to find companies that match your brief across the live web. It finds companies by their actual meaning.',
    facts: [
      'Neural search surfaces meaningful matches',
      'Bypasses keyword limitations',
      '20+ verified practices found in seconds',
    ],
    logTitle: 'exa-webset.log',
    logLines: [
      { text: 'POST /websets/ → nyt_founders_set created', color: 'text-emerald-400' },
      { text: 'query: "B2B SaaS founders in NYC..."', color: 'text-gray-400' },
      { text: 'Status: streaming (25 results)', color: 'text-blue-400' },
      { text: 'Filtering by headcount & recent funding...', color: 'text-gray-400' },
      { text: 'Verified 25 high-fit prospects ✓', color: 'text-emerald-400' },
    ],
  },
  {
    id: 'orangeslice',
    number: '03',
    phase: 'Decision-Maker Resolution',
    image: '/images/hermes-drafter.png',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    accent: 'emerald',
    name: 'Enrich & Draft with Orangeslice',
    description: 'Orangeslice enriches each account to find the specific contact, verify their email, and pull "Signals" to build a hyper-personalized pitch.',
    facts: [
      'Resolves exact "Decision-Maker" contact',
      'Verifies business email with high precision',
      'Drafts personalized emails in your brand voice',
    ],
    logTitle: 'orangeslice-enrich.log',
    logLines: [
      { text: 'person.resolve → "Jane Doe, Founder"', color: 'text-emerald-400' },
      { text: 'person.contact.get → jane@doe-hq.com', color: 'text-amber-300' },
      { text: 'signal.extract → "Recently expanded to EU"', color: 'text-emerald-400' },
      { text: 'email_draft → "Re: European scaling..." ✓', color: 'text-emerald-400' },
      { text: 'Sequence ready for Draft Studio', color: 'text-emerald-400' },
    ],
  },
]

const descriptionJSX: Record<string, React.ReactNode> = {
  exa: (
    <span>
      Exa finds 20 dental practices in Massachusetts that fit your exact criteria. It doesn&apos;t use keywords—it reads the web by meaning to find established practices with 10-50 employees that have been active for over 5 years.
    </span>
  ),
  orangeslice: (
    <span>
      Orangeslice enriches each account to find the Founder, verify their email, and pull the exact technical signals requested—like Google Review counts—to build a hyper-personalized pitch.
    </span>
  ),
}

const accentClasses: Record<string, { dot: string; ring: string; num: string }> = {
  indigo: { dot: 'bg-indigo-400', ring: 'ring-indigo-100', num: 'text-indigo-600' },
  amber: { dot: 'bg-amber-400', ring: 'ring-amber-100', num: 'text-amber-600' },
  blue: { dot: 'bg-blue-400', ring: 'ring-blue-100', num: 'text-blue-600' },
  emerald: { dot: 'bg-emerald-400', ring: 'ring-emerald-100', num: 'text-emerald-600' },
}

// ─── PipelineWalkthrough ──────────────────────────────────────────────────────

export function PipelineWalkthrough() {
  const [activeStep, setActiveStep] = useState<string | null>(null)

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="mb-20 flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-100 bg-amber-50 shadow-xl overflow-hidden group">
          <Image
            src="/images/hermes-pixel-icon.png"
            alt="Hermes"
            width={48}
            height={48}
            className="object-contain transform group-hover:scale-110 transition-transform duration-500"
            unoptimized
          />
        </div>
        <h2 className="font-serif text-[3.2rem] md:text-[3.8rem] leading-[1] tracking-tight text-gray-900 mb-6">
          Autonomous Outreach. <br /><span className="text-gray-400">Zero manual effort.</span>
        </h2>
        <p className="max-w-2xl text-[18px] leading-[1.6] font-medium text-gray-500/80">
          Hermes transforms your natural language brief into a full-scale outbound engine — discovering your market, resolving decision-makers, and drafting individual pitches.
        </p>
      </div>

      {/* Vertical steps */}
      <div className="relative mx-auto max-w-4xl">
        {/* Connector line */}
        <div className="absolute left-[27px] top-12 bottom-12 w-[1px] bg-gradient-to-b from-amber-200 via-gray-200 to-orange-200 hidden md:block" />

        <div className="space-y-6">
          {steps.map((step, idx) => {
            const accent = accentClasses[step.accent]
            const isActive = activeStep === step.id

            return (
              <div
                key={step.id}
                className={`relative flex flex-col md:flex-row gap-6 rounded-[1.75rem] border p-6 md:p-8 transition-all duration-300 cursor-default ${
                  isActive
                    ? 'border-gray-200 bg-white shadow-[0_8px_32px_-4px_rgba(0,0,0,0.08)]'
                    : 'border-gray-100 bg-white/60 hover:border-gray-200 hover:bg-white hover:shadow-sm'
                }`}
                onMouseEnter={() => setActiveStep(step.id)}
                onMouseLeave={() => setActiveStep(null)}
              >
                {/* Number / icon column */}
                <div className="flex shrink-0 flex-col items-center gap-2 md:items-start relative z-10">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${step.iconBg} ring-4 ${accent.ring} shadow-sm overflow-hidden`}>
                    {step.image && (
                      <Image 
                        src={step.image} 
                        alt={step.name} 
                        width={32} 
                        height={32} 
                        className="object-contain"
                        unoptimized
                      />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-4">
                  {/* Phase + number */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${accent.num}`}>
                      {step.number}
                    </span>
                    <span className="text-gray-200 text-xs">·</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                      {step.phase}
                    </span>
                  </div>

                  <h3 className="font-serif text-[1.75rem] leading-tight text-gray-900 tracking-tight">
                    {step.name}
                  </h3>

                  <p className="text-[15px] leading-[1.7] text-gray-500 font-medium">
                    {descriptionJSX[step.id] || step.description}
                  </p>

                  {/* Facts */}
                  <ul className="space-y-2">
                    {step.facts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className={`mt-2 shrink-0 h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                        <span className="text-[13px] font-semibold text-gray-700">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Terminal — shown on hover */}
                <div className={`w-full md:w-[320px] shrink-0 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="h-full rounded-2xl border border-white/10 bg-gray-950 shadow-xl overflow-hidden">
                    {/* Terminal header */}
                    <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
                      <div className="h-2 w-2 rounded-full bg-red-500/60" />
                      <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                      <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
                      <span className="ml-2 text-[10px] font-mono text-gray-500">{step.logTitle}</span>
                    </div>
                    {/* Log content */}
                    <div className="p-4">
                      {isActive ? (
                        <AnimatedLog lines={step.logLines} />
                      ) : (
                        <div className="font-mono text-[11px] text-gray-600 space-y-1.5">
                          {step.logLines.map((l, i) => (
                            <div key={i} className="flex gap-2 opacity-30">
                              <span className="shrink-0">›</span>
                              <span>{l.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-1 font-mono text-[10px]">
                        <span className="inline-block h-3 w-1.5 animate-pulse rounded-sm bg-emerald-400/80" />
                        <span className="text-gray-600">hermes ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
