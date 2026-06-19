'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type TemplateStep = {
  label: string
  tool: string
}

type GtmTemplate = {
  id: string
  title: string
  market: string
  category: string
  outcome: string
  prompt: string
  steps: TemplateStep[]
}

const TEMPLATES: GtmTemplate[] = [
  {
    id: 'local-services-expansion',
    title: 'Local services expansion',
    market: 'Agencies, vertical SaaS, local B2B',
    category: 'Local',
    outcome: 'Find high-fit local businesses and draft owner/operator outreach.',
    prompt:
      'Find 40 multi-location dental clinics in Phoenix with outdated websites or weak online booking. I sell website conversion and appointment-booking improvements. Reach the owner, operations leader, or marketing manager and draft one evidence-backed email.',
    steps: [
      { label: 'Map accounts', tool: 'Exa' },
      { label: 'Inspect sites', tool: 'Scrape' },
      { label: 'Find owner', tool: 'Orangeslice' },
      { label: 'Draft email', tool: 'Gmail' }
    ]
  },
  {
    id: 'hiring-signal-outbound',
    title: 'Hiring signal outbound',
    market: 'B2B SaaS, services, recruiting',
    category: 'Signals',
    outcome: 'Turn job openings into timely outbound to the right buyer.',
    prompt:
      'Find 35 B2B software companies hiring customer success managers and implementation specialists. I sell onboarding automation software. Reach the VP Customer Success, Head of Implementation, or COO and draft a concise email tied to the hiring signal.',
    steps: [
      { label: 'Find openings', tool: 'Exa' },
      { label: 'Score fit', tool: 'Hermes' },
      { label: 'Resolve buyer', tool: 'Orangeslice' },
      { label: 'Create draft', tool: 'Gmail' }
    ]
  },
  {
    id: 'review-pain-conquest',
    title: 'Review pain conquest',
    market: 'Healthcare, home services, SaaS',
    category: 'Signals',
    outcome: 'Use public complaints as evidence for useful, specific outreach.',
    prompt:
      'Find 30 home service companies in Texas with recent reviews mentioning scheduling delays, missed appointments, or slow follow-up. I sell call answering and booking automation. Reach the owner or operations manager and draft one respectful, evidence-backed email.',
    steps: [
      { label: 'Pull reviews', tool: 'Apify' },
      { label: 'Extract pain', tool: 'Hermes' },
      { label: 'Find contact', tool: 'Enrich' },
      { label: 'Draft email', tool: 'Gmail' }
    ]
  },
  {
    id: 'partner-marketplace-finder',
    title: 'Partner marketplace finder',
    market: 'Partnerships, integrations, channels',
    category: 'Partners',
    outcome: 'Find companies with partner surfaces and pitch a mutual motion.',
    prompt:
      'Find 25 companies with public integrations or partner marketplaces that serve accounting firms. I sell workflow automation for accounting practices. Reach the partnerships, ecosystem, or alliances owner and draft a partner intro email.',
    steps: [
      { label: 'Find directories', tool: 'Exa' },
      { label: 'Read fit', tool: 'Scrape' },
      { label: 'Find owner', tool: 'Orangeslice' },
      { label: 'Draft intro', tool: 'Gmail' }
    ]
  },
  {
    id: 'funding-and-expansion',
    title: 'Funding and expansion',
    market: 'Mid-market B2B, agencies, vendors',
    category: 'Signals',
    outcome: 'Use funding, hiring, and expansion news to time outreach.',
    prompt:
      'Find 30 recently funded companies in the US that are hiring sales or revenue operations roles. I sell RevOps implementation services. Reach the CRO, VP Sales, or RevOps leader and draft an email about scaling the revenue engine after funding.',
    steps: [
      { label: 'Find news', tool: 'Exa' },
      { label: 'Check hiring', tool: 'Jobs' },
      { label: 'Resolve lead', tool: 'Enrich' },
      { label: 'Draft note', tool: 'Gmail' }
    ]
  },
  {
    id: 'event-sponsor-followup',
    title: 'Event sponsor follow-up',
    market: 'B2B events, field marketing, agencies',
    category: 'Events',
    outcome: 'Turn sponsor/exhibitor pages into post-event partner outreach.',
    prompt:
      'Find 30 companies sponsoring supply chain or manufacturing conferences in the US this quarter. I sell field marketing content production. Reach the VP Marketing, events lead, or demand gen leader and draft a post-event campaign pitch.',
    steps: [
      { label: 'Scrape events', tool: 'Apify' },
      { label: 'Enrich accounts', tool: 'Exa' },
      { label: 'Find marketer', tool: 'Orangeslice' },
      { label: 'Draft pitch', tool: 'Gmail' }
    ]
  },
  {
    id: 'ecommerce-growth-sweep',
    title: 'Commerce growth sweep',
    market: 'DTC, Shopify apps, agencies',
    category: 'Commerce',
    outcome: 'Find online stores with conversion or retention signals.',
    prompt:
      'Find 35 Shopify brands selling premium pet products that are running paid social and have subscription or reorder potential. I sell SMS retention campaigns. Reach the founder, ecommerce manager, or growth lead and draft one email.',
    steps: [
      { label: 'Find stores', tool: 'Exa' },
      { label: 'Check offer', tool: 'Scrape' },
      { label: 'Find buyer', tool: 'Orangeslice' },
      { label: 'Draft email', tool: 'Gmail' }
    ]
  },
  {
    id: 'recruiting-target-map',
    title: 'Recruiting target map',
    market: 'Recruiting, agencies, founders',
    category: 'Recruiting',
    outcome: 'Build a targeted company map before candidate or client outreach.',
    prompt:
      'Find 30 companies hiring senior accountants in the US that look understaffed in finance operations. I run a recruiting firm for accounting talent. Reach the CFO, controller, or head of finance and draft one helpful recruiting intro.',
    steps: [
      { label: 'Find jobs', tool: 'Exa' },
      { label: 'Score urgency', tool: 'Hermes' },
      { label: 'Resolve CFO', tool: 'Orangeslice' },
      { label: 'Draft intro', tool: 'Gmail' }
    ]
  }
]

const FILTERS = ['All', 'Local', 'Signals', 'Partners', 'Events', 'Commerce', 'Recruiting'] as const

interface TemplateMarketplaceProps {
  onSelectPrompt: (prompt: string) => void
  onRunPrompt?: (prompt: string) => void
  disabled?: boolean
}

function StepLine({ steps }: { steps: TemplateStep[] }) {
  return (
    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-medium text-[#6a7283]">
      {steps.map((step, index) => (
        <span key={`${step.label}-${step.tool}`} className="inline-flex items-center gap-2">
          {index > 0 ? <span className="h-px w-3 bg-[#dfe4ee]" /> : null}
          <span>{step.tool}</span>
        </span>
      ))}
    </div>
  )
}

export function TemplateMarketplace({
  onSelectPrompt,
  onRunPrompt,
  disabled = false
}: TemplateMarketplaceProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All')

  const templates = useMemo(() => {
    return activeFilter === 'All'
      ? TEMPLATES
      : TEMPLATES.filter(template => template.category === activeFilter)
  }, [activeFilter])

  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-4 sm:px-6">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a92a6]">
            Motions
          </p>
          <h2 className="text-[1.15rem] font-semibold leading-tight text-[hsl(var(--ink))]">
            Start from a proven GTM pattern.
          </h2>
        </div>

        <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map(filter => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[12px] font-medium transition-colors',
                activeFilter === filter
                  ? 'border-[#071329] bg-[#071329] text-white'
                  : 'border-[#dfe4ee] bg-white text-[#6a7283] hover:border-[#aebcff] hover:text-[#071329]'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {templates.map(template => (
          <article
            key={template.id}
            className="flex min-h-[176px] flex-col rounded-lg border border-[#dfe4ee] bg-white/92 p-3.5 shadow-[0_12px_30px_rgba(5,18,47,0.04)]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8a92a6]">
                    {template.category}
                  </p>
                  <h3 className="mt-1 text-[13px] font-semibold leading-tight text-[#071329]">
                    {template.title}
                  </h3>
                </div>
                <span className="shrink-0 rounded-full border border-[#edf0f6] px-2 py-0.5 text-[10px] font-medium text-[#6a7283]">
                  {template.steps.length} steps
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-[1.45] text-[#6a7283]">
                {template.market}
              </p>
              <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-[1.45] text-[#071329]/75">
                {template.outcome}
              </p>
              <StepLine steps={template.steps} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => onSelectPrompt(template.prompt)}
                className="h-8 rounded-md border-[#dfe4ee] px-2 text-[12px] font-semibold"
              >
                Load
              </Button>
              <Button
                type="button"
                disabled={disabled || !onRunPrompt}
                onClick={() => onRunPrompt?.(template.prompt)}
                className="h-8 rounded-md bg-[#071329] px-2 text-[12px] font-semibold text-white hover:bg-[#102448]"
              >
                Run
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
