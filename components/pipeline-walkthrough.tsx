'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

// Animated "log" lines that simulate real system activity
function AnimatedLog({ lines }: { lines: { text: string; color?: string }[] }) {
  return (
    <div className="font-mono text-[11px] leading-relaxed space-y-1.5">
      {lines.map((line, i) => (
        <div key={i} style={{ animationDelay: `${i * 120}ms` }}
          className={`flex items-start gap-2 opacity-0 animate-[fadeUp_0.4s_ease-out_forwards] ${line.color || 'text-gray-400'}`}>
          <span className="shrink-0 text-gray-600">›</span>
          <span>{line.text}</span>
        </div>
      ))}
    </div>
  )
}

const steps = [
  {
    id: 'scrape',
    phase: 'Phase 1',
    role: 'Offer + ICP Extraction',
    name: 'Website Intelligence',
    description:
      "Before searching for anyone, Hermes visits your website. It extracts what you sell, who you sell to, and what makes you different — grounding every downstream search, enrichment, and email in your actual offer.",
    facts: [
      'Scrapes homepage, /about, and /pricing pages',
      'Extracts positioning, ICP, and value prop automatically',
      'Seeds all custom Exa enrichments from your offer',
    ],
    color: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-600',
    logTitle: 'hermes-scrape.log',
    logLines: [
      { text: 'GET https://yourdomain.com → 200 OK', color: 'text-emerald-400' },
      { text: 'Extracting offer context...' },
      { text: 'ICP: "B2B SaaS founders, seed to Series B"', color: 'text-amber-300' },
      { text: 'Offer: "outbound intelligence, 3× reply rates"', color: 'text-amber-300' },
      { text: 'Seeding custom enrichments ✓', color: 'text-emerald-400' },
    ]
  },
  {
    id: 'exa',
    phase: 'Phase 2',
    role: 'Discovery',
    name: 'Exa Neural Search',
    description: (
      <span>
        Hermes creates an{' '}
        <a
          href="https://exa.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline decoration-dotted underline-offset-2 hover:text-amber-700 inline-flex items-center gap-0.5"
        >
          Exa Webset <ExternalLink className="w-3 h-3" />
        </a>{' '}
        — an async semantic search job that finds companies matching your ICP across the live web. Exa searches by meaning, not keywords, so it surfaces companies even if they&apos;d never self-categorize. Each result is verified against your criteria and enriched with the fields your offer actually needs.
      </span>
    ),
    facts: [
      'Neural semantic search — not keyword matching',
      'Companies verified against your specific criteria',
      'Custom enrichments derived from your offer',
    ],
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-600',
    logTitle: 'exa-webset.log',
    logLines: [
      { text: 'POST /websets/ → webset_abc123 created', color: 'text-emerald-400' },
      { text: 'search.query: "B2B SaaS outbound tools..."' },
      { text: 'enrichments[0]: "LinkedIn profile of VP Sales"' },
      { text: 'enrichments[1]: "Does co. use Salesforce?"' },
      { text: 'status: running → idle (47 results found)', color: 'text-blue-400' },
      { text: '42 verified against criteria ✓', color: 'text-emerald-400' },
    ]
  },
  {
    id: 'orangeslice',
    phase: 'Phase 3',
    role: 'Enrichment + Email',
    name: 'Orangeslice Resolver',
    description: (
      <span>
        Each company passes through{' '}
        <a
          href="https://orangeslice.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline decoration-dotted underline-offset-2 hover:text-amber-700 inline-flex items-center gap-0.5"
        >
          Orangeslice <ExternalLink className="w-3 h-3" />
        </a>{' '}
        — which resolves the exact person matching your target persona, verifies their business email, and pulls fresh signals. Hermes then generates a personalized Hermes Take (why they fit, what angle to use, and evidence from the web) and a ready-to-send draft.
      </span>
    ),
    facts: [
      'Resolves decision-maker by persona (CEO, VP Sales, etc.)',
      'Business email verification with waterfall fallback',
      'Hermes Take: why-fit reasoning grounded in real signals',
    ],
    color: 'from-orange-500/20 to-orange-500/5',
    iconColor: 'text-orange-600',
    logTitle: 'orangeslice-enrich.log',
    logLines: [
      { text: 'company.linkedin.enrich → "Acme Corp, 120 emp"', color: 'text-emerald-400' },
      { text: 'person.resolve → "Sarah Kim, VP Sales"', color: 'text-emerald-400' },
      { text: 'person.contact.get → s.kim@acmecorp.com', color: 'text-amber-300' },
      { text: 'hermes_take.whyFit: "Series B, scaling sales..."' },
      { text: 'hermes_take.evidence[0]: "Hired 12 AEs in 6mo"' },
      { text: 'email_draft → ready for review ✓', color: 'text-emerald-400' },
    ]
  }
]

export function PipelineWalkthrough() {
  const [activeStep, setActiveStep] = useState<string | null>(null)

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-20 py-10">
        {steps.map((step, idx) => {
          const isReversed = idx % 2 !== 0
          return (
            <div
              key={step.id}
              className={`flex flex-col lg:flex-row items-center gap-10 lg:gap-20 ${isReversed ? 'lg:flex-row-reverse' : ''}`}
              onMouseEnter={() => setActiveStep(step.id)}
              onMouseLeave={() => setActiveStep(null)}
            >
              {/* Text */}
              <div className="w-full lg:w-1/2 space-y-6 relative z-10">
                <div className={`absolute -inset-x-12 -inset-y-12 blur-[100px] rounded-full bg-gradient-to-br ${step.color} -z-10 transition-opacity duration-500 ${activeStep === step.id ? 'opacity-80' : 'opacity-30'}`} />
                <div className="inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                  <span className="text-[hsl(var(--hermes-gold-dark))]">{step.phase}</span>
                  <span className="text-gray-300">|</span>
                  {step.role}
                </div>

                <h3 className="font-serif text-[2.5rem] lg:text-[3rem] leading-[1.05] text-gray-900 tracking-tight">
                  {step.name}
                </h3>

                <p className="text-[17px] leading-[1.7] font-medium text-gray-600">
                  {step.description}
                </p>

                <ul className="pt-2 space-y-3">
                  {step.facts.map((fact, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full ${step.iconColor.replace('text-', 'bg-')}`} />
                      <span className="text-[14px] font-semibold text-gray-900">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Animated terminal */}
              <div className="w-full lg:w-1/2">
                <div className={`w-full rounded-[2rem] border border-gray-200 bg-gray-950 shadow-2xl overflow-hidden transition-transform duration-300 ${activeStep === step.id ? 'scale-[1.02]' : ''}`}>
                  {/* Header */}
                  <div className="flex items-center px-5 py-3 border-b border-white/5 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    </div>
                    <span className="mx-auto text-[10px] font-mono text-gray-500">{step.logTitle}</span>
                  </div>
                  {/* Log lines */}
                  <div className="p-5">
                    {activeStep === step.id ? (
                      <AnimatedLog lines={step.logLines} />
                    ) : (
                      <div className="font-mono text-[11px] text-gray-600 space-y-1.5">
                        {step.logLines.map((l, i) => (
                          <div key={i} className="flex gap-2 opacity-40">
                            <span className="shrink-0">›</span>
                            <span>{l.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-1 font-mono text-[11px]">
                      <span className="inline-block w-2 h-3 bg-emerald-400 animate-pulse rounded-sm" />
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
  )
}
