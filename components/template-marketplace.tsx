'use client'

import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
    title: 'Local Services Expansion',
    market: 'Agencies, vertical SaaS, local B2B',
    category: 'Local',
    outcome: 'Find high-fit local businesses and draft owner/operator outreach.',
    prompt:
      'Find 40 multi-location dental clinics in Phoenix with outdated websites or weak online booking. I sell website conversion and appointment-booking improvements. Reach the owner, operations leader, or marketing manager and draft one evidence-backed email.',
    steps: [
      { label: 'Map accounts', tool: 'Exa + maps' },
      { label: 'Inspect sites', tool: 'scrape_site' },
      { label: 'Find owner', tool: 'Orangeslice' },
      { label: 'Draft email', tool: 'Gmail draft' }
    ]
  },
  {
    id: 'hiring-signal-outbound',
    title: 'Hiring Signal Outbound',
    market: 'B2B SaaS, services, recruiting',
    category: 'Signals',
    outcome: 'Turn job openings into timely outbound to the right buyer.',
    prompt:
      'Find 35 B2B software companies hiring customer success managers and implementation specialists. I sell onboarding automation software. Reach the VP Customer Success, Head of Implementation, or COO and draft a concise email tied to the hiring signal.',
    steps: [
      { label: 'Find openings', tool: 'Exa Websets' },
      { label: 'Score fit', tool: 'Hermes AI' },
      { label: 'Resolve buyer', tool: 'Orangeslice' },
      { label: 'Create draft', tool: 'Gmail' }
    ]
  },
  {
    id: 'review-pain-conquest',
    title: 'Review Pain Conquest',
    market: 'Healthcare, home services, SaaS',
    category: 'Signals',
    outcome: 'Use public complaints as evidence for useful, specific outreach.',
    prompt:
      'Find 30 home service companies in Texas with recent reviews mentioning scheduling delays, missed appointments, or slow follow-up. I sell call answering and booking automation. Reach the owner or operations manager and draft one respectful, evidence-backed email.',
    steps: [
      { label: 'Pull reviews', tool: 'Apify optional' },
      { label: 'Extract pain', tool: 'Hermes AI' },
      { label: 'Find contact', tool: 'Hunter/Apollo' },
      { label: 'Draft email', tool: 'Gmail' }
    ]
  },
  {
    id: 'partner-marketplace-finder',
    title: 'Partner Marketplace Finder',
    market: 'Partnerships, integrations, channels',
    category: 'Partners',
    outcome: 'Find companies with partner surfaces and pitch a mutual motion.',
    prompt:
      'Find 25 companies with public integrations or partner marketplaces that serve accounting firms. I sell workflow automation for accounting practices. Reach the partnerships, ecosystem, or alliances owner and draft a partner intro email.',
    steps: [
      { label: 'Find directories', tool: 'Exa Websets' },
      { label: 'Read partner fit', tool: 'scrape_site' },
      { label: 'Find owner', tool: 'Orangeslice' },
      { label: 'Draft intro', tool: 'Gmail' }
    ]
  },
  {
    id: 'funding-and-expansion',
    title: 'Funding And Expansion',
    market: 'Mid-market B2B, agencies, vendors',
    category: 'Signals',
    outcome: 'Use funding, hiring, and expansion news to time outreach.',
    prompt:
      'Find 30 recently funded companies in the US that are hiring sales or revenue operations roles. I sell RevOps implementation services. Reach the CRO, VP Sales, or RevOps leader and draft an email about scaling the revenue engine after funding.',
    steps: [
      { label: 'Find news', tool: 'Exa news' },
      { label: 'Check hiring', tool: 'Exa + jobs' },
      { label: 'Resolve lead', tool: 'Apollo optional' },
      { label: 'Draft note', tool: 'Gmail' }
    ]
  },
  {
    id: 'event-sponsor-followup',
    title: 'Event Sponsor Follow-Up',
    market: 'B2B events, field marketing, agencies',
    category: 'Events',
    outcome: 'Turn sponsor/exhibitor pages into post-event partner outreach.',
    prompt:
      'Find 30 companies sponsoring supply chain or manufacturing conferences in the US this quarter. I sell field marketing content production. Reach the VP Marketing, events lead, or demand gen leader and draft a post-event campaign pitch.',
    steps: [
      { label: 'Scrape events', tool: 'Apify optional' },
      { label: 'Enrich accounts', tool: 'Exa Websets' },
      { label: 'Find marketer', tool: 'Orangeslice' },
      { label: 'Draft pitch', tool: 'Gmail' }
    ]
  },
  {
    id: 'ecommerce-growth-sweep',
    title: 'Ecommerce Growth Sweep',
    market: 'DTC, Shopify apps, agencies',
    category: 'Commerce',
    outcome: 'Find online stores with conversion or retention signals.',
    prompt:
      'Find 35 Shopify brands selling premium pet products that are running paid social and have subscription or reorder potential. I sell SMS retention campaigns. Reach the founder, ecommerce manager, or growth lead and draft one email.',
    steps: [
      { label: 'Find stores', tool: 'Exa + Apify' },
      { label: 'Check offer', tool: 'scrape_site' },
      { label: 'Find buyer', tool: 'Orangeslice' },
      { label: 'Draft email', tool: 'Gmail' }
    ]
  },
  {
    id: 'recruiting-target-map',
    title: 'Recruiting Target Map',
    market: 'Recruiting, agencies, founders',
    category: 'Recruiting',
    outcome: 'Build a targeted company map before candidate or client outreach.',
    prompt:
      'Find 30 companies hiring senior accountants in the US that look understaffed in finance operations. I run a recruiting firm for accounting talent. Reach the CFO, controller, or head of finance and draft one helpful recruiting intro.',
    steps: [
      { label: 'Find jobs', tool: 'Exa Websets' },
      { label: 'Score urgency', tool: 'Hermes AI' },
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

function WorkflowMini({ steps }: { steps: TemplateStep[] }) {
  const tones = ['bg-[#315dff]', 'bg-[#12b981]', 'bg-[#d38a00]', 'bg-[#071329]']

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => (
        <div
          key={`${step.label}-${step.tool}`}
          className="rounded-md border border-[hsl(var(--mist))] bg-[hsl(var(--paper))] p-3 shadow-[0_1px_0_rgba(5,18,47,0.03)]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--steel))]">
              0{index + 1}
            </span>
            <span className={`h-1.5 w-9 rounded-full ${tones[index % tones.length]}`} />
          </div>
          <p className="mt-2 truncate text-[12px] font-semibold text-[hsl(var(--ink))]">
            {step.label}
          </p>
          <p className="mt-0.5 truncate text-[10.5px] text-[hsl(var(--steel))]">
            {step.tool}
          </p>
        </div>
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
  const [selectedId, setSelectedId] = useState(TEMPLATES[0].id)

  const templates = useMemo(() => {
    return activeFilter === 'All'
      ? TEMPLATES
      : TEMPLATES.filter(template => template.category === activeFilter)
  }, [activeFilter])

  const selected = templates.find(template => template.id === selectedId) ?? templates[0] ?? TEMPLATES[0]

  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 pb-10 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--steel))]">
            Templates
          </p>
          <h2 className="text-[1.25rem] font-semibold leading-tight text-[hsl(var(--ink))]">
            Pick a motion.
          </h2>
        </div>

        <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map(filter => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setActiveFilter(filter)
                const next = filter === 'All' ? TEMPLATES[0] : TEMPLATES.find(template => template.category === filter)
                if (next) setSelectedId(next.id)
              }}
              className={cn(
                'inline-flex h-8 shrink-0 items-center rounded-md border px-3 text-[12px] font-medium transition-colors',
                activeFilter === filter
                  ? 'border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-white'
                  : 'border-[hsl(var(--mist))] bg-white text-[hsl(var(--steel))] hover:border-[hsl(var(--ink)/0.35)] hover:text-[hsl(var(--ink))]'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="grid self-start gap-2">
          {templates.map(template => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelectedId(template.id)}
              className={cn(
                'grid min-h-[74px] w-full grid-cols-[1fr_auto] gap-3 rounded-lg border bg-white p-3 text-left transition-colors',
                selected.id === template.id
                  ? 'border-[#315dff] bg-[#fbfcff] shadow-[0_0_0_1px_rgba(49,93,255,0.16),0_14px_34px_rgba(5,18,47,0.06)]'
                  : 'border-[hsl(var(--mist))] hover:border-[#bfc9ff] hover:bg-[#fbfcff]'
              )}
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold leading-tight text-[hsl(var(--ink))]">
                    {template.title}
                  </span>
                  <span className="rounded-md border border-[#edf0f6] bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6a7283]">
                    {template.category}
                  </span>
                </span>
                <span className="mt-1 block text-[11px] leading-[1.45] text-[hsl(var(--steel))]">
                  {template.market}
                </span>
                <span className="mt-1 block truncate text-[11px] leading-[1.45] text-[hsl(var(--ink))]/70">
                  {template.outcome}
                </span>
              </span>
              <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-md border border-[#edf0f6] bg-white">
                <span className="h-2 w-2 rounded-full bg-[#315dff]" />
              </span>
            </button>
          ))}
        </div>

        <article className="rounded-lg border border-[hsl(var(--mist))] bg-white p-4 shadow-[0_18px_48px_rgba(5,18,47,0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--steel))]">
                {selected.category}
              </p>
              <h3 className="mt-1 text-[1.2rem] font-semibold leading-tight text-[hsl(var(--ink))]">
                {selected.title}
              </h3>
              <p className="mt-1 max-w-[620px] text-[12px] leading-[1.45] text-[hsl(var(--steel))]">
                {selected.outcome}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => onSelectPrompt(selected.prompt)}
                className="h-9 rounded-md border-[hsl(var(--mist))] px-3 text-[12px]"
              >
                Load prompt
              </Button>
              <Button
                type="button"
                disabled={disabled || !onRunPrompt}
                onClick={() => onRunPrompt?.(selected.prompt)}
                className="h-9 rounded-md bg-[hsl(var(--ink))] px-3 text-[12px] text-white hover:bg-[hsl(var(--ink)/0.92)]"
              >
                Run direct
              </Button>
            </div>
          </div>

          <div className="mt-5">
            <WorkflowMini steps={selected.steps} />
          </div>

          <div className="mt-3 rounded-md border border-[#edf0f6] bg-[#fbfcff] px-3 py-2">
            <p className="truncate text-[11px] font-medium text-[hsl(var(--steel))]">
              Prompt loads into the composer when selected.
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
