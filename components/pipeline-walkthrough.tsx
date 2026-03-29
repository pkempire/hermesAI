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
    id: 'scrape',
    number: '01',
    phase: 'Offer Intelligence',
    image: '/images/hermes-helmet.png',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    accent: 'amber',
    name: 'Read your offer',
    description:
      'Hermes visits your website first. It extracts your positioning, who you sell to, and what makes you different. This seeds every search and every email that follows.',
    facts: [
      'Visits dentalsaas.com to extract offer context',
      'Identifies ICP: Regional private dental practices',
      'Detects value prop: Scaling patient acquisition in MA',
    ],
    logTitle: 'hermes-scrape.log',
    logLines: [
      { text: 'GET https://dentalsaas.com → 200 OK', color: 'text-emerald-400' },
      { text: 'Parsing offer context...' },
      { text: 'ICP: "Private Dental Practices, 10-50 emp"', color: 'text-amber-300' },
      { text: 'Offer: "Scaling patient acquisition with SaaS"', color: 'text-amber-300' },
      { text: 'Custom signals seeded for MA market ✓', color: 'text-emerald-400' },
    ],
  },
  {
    id: 'exa',
    number: '02',
    phase: 'Company Discovery',
    image: '/images/hermes-discovery.png',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    accent: 'blue',
    name: 'Map the market with Exa',
    description: null, // JSX below
    facts: [
      'Neural semantic search finds 20 practices in MA',
      'Filter: "between 10-50 employees"',
      'Signal: "active for more than 5 years"',
    ],
    logTitle: 'exa-webset.log',
    logLines: [
      { text: 'POST /websets/ → dental_ma_set created', color: 'text-emerald-400' },
      { text: 'query: "private dental practices in MA, 10-50 emp..."' },
      { text: 'filter: "presence_on_web > 5 years"' },
      { text: 'enrichments: "LinkedIn URL of Founder"' },
      { text: 'status: running → idle (20 results)', color: 'text-blue-400' },
      { text: '20 verified against criteria ✓', color: 'text-emerald-400' },
    ],
  },
  {
    id: 'orangeslice',
    number: '03',
    phase: 'Person Enrichment',
    image: '/images/hermes-drafter.png',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    accent: 'orange',
    name: 'Resolve the Decision-Maker',
    description: null, // JSX below
    facts: [
      'Resolves exact contact: "Founder"',
      'Extracts requested signal: "Google Reviews count"',
      'Verifies email with waterfall fallback',
    ],
    logTitle: 'orangeslice.log',
    logLines: [
      { text: 'company.linkedin.enrich → "Beacon Dental, MA"', color: 'text-emerald-400' },
      { text: 'person.resolve → "Dr. Marcus Chen, Founder"', color: 'text-emerald-400' },
      { text: 'person.contact.get → m.chen@beacondental.com', color: 'text-amber-300' },
      { text: 'signal.extract → "Google Reviews: 156"', color: 'text-emerald-400' },
      { text: 'hermes_take: "Scaling since 2018, 150+ reviews..."' },
      { text: 'email_draft → ready for review ✓', color: 'text-emerald-400' },
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
  amber: { dot: 'bg-amber-400', ring: 'ring-amber-100', num: 'text-amber-600' },
  blue: { dot: 'bg-blue-400', ring: 'ring-blue-100', num: 'text-blue-600' },
  orange: { dot: 'bg-orange-400', ring: 'ring-orange-100', num: 'text-orange-600' },
}

// ─── PipelineWalkthrough ──────────────────────────────────────────────────────

export function PipelineWalkthrough() {
  const [activeStep, setActiveStep] = useState<string | null>(null)

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="mb-14 flex flex-col items-center text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 shadow-sm">
          <Image
            src="/images/hermes-helmet.png"
            alt="Hermes"
            width={28}
            height={28}
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600/70 mb-3">How it works</div>
        <h2 className="font-serif text-[2.8rem] leading-[1.05] tracking-tight text-gray-900 mb-4">
          Three steps. Zero guesswork.
        </h2>
        <p className="max-w-xl text-[16px] leading-[1.7] font-medium text-gray-500">
          From your website URL to a ready-to-send, hyper-personalized email sequence — automated end to end.
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
