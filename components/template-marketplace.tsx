'use client'

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  Filter,
  Mail,
  MapPin,
  Newspaper,
  Search,
  Sparkles,
  Star,
  Store,
  Users
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type TemplateStep = {
  label: string
  tool: string
  icon: typeof Search
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
      { label: 'Map accounts', tool: 'Exa + Maps actor', icon: MapPin },
      { label: 'Inspect sites', tool: 'scrape_site', icon: FileText },
      { label: 'Find owner', tool: 'Orangeslice', icon: Users },
      { label: 'Draft email', tool: 'Gmail draft', icon: Mail }
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
      { label: 'Find openings', tool: 'Exa Websets', icon: Search },
      { label: 'Score fit', tool: 'Hermes AI', icon: Sparkles },
      { label: 'Resolve buyer', tool: 'Orangeslice', icon: Users },
      { label: 'Create draft', tool: 'Gmail', icon: Mail }
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
      { label: 'Pull reviews', tool: 'Apify optional', icon: Star },
      { label: 'Extract pain', tool: 'Hermes AI', icon: Sparkles },
      { label: 'Find contact', tool: 'Hunter/Apollo', icon: BadgeCheck },
      { label: 'Draft email', tool: 'Gmail', icon: Mail }
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
      { label: 'Find directories', tool: 'Exa Websets', icon: Store },
      { label: 'Read partner fit', tool: 'scrape_site', icon: FileText },
      { label: 'Find owner', tool: 'Orangeslice', icon: Users },
      { label: 'Draft intro', tool: 'Gmail', icon: Mail }
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
      { label: 'Find news', tool: 'Exa news', icon: Newspaper },
      { label: 'Check hiring', tool: 'Exa + jobs', icon: Search },
      { label: 'Resolve lead', tool: 'Apollo optional', icon: Building2 },
      { label: 'Draft note', tool: 'Gmail', icon: Mail }
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
      { label: 'Scrape event pages', tool: 'Apify optional', icon: Store },
      { label: 'Enrich accounts', tool: 'Exa Websets', icon: Search },
      { label: 'Find marketer', tool: 'Orangeslice', icon: Users },
      { label: 'Draft pitch', tool: 'Gmail', icon: Mail }
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
      { label: 'Find stores', tool: 'Exa + Apify', icon: Store },
      { label: 'Check offer', tool: 'scrape_site', icon: FileText },
      { label: 'Find buyer', tool: 'Orangeslice', icon: Users },
      { label: 'Draft email', tool: 'Gmail', icon: Mail }
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
      { label: 'Find jobs', tool: 'Exa Websets', icon: Search },
      { label: 'Score urgency', tool: 'Hermes AI', icon: Sparkles },
      { label: 'Resolve CFO', tool: 'Orangeslice', icon: Users },
      { label: 'Draft intro', tool: 'Gmail', icon: Mail }
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
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
      {steps.map((step, index) => {
        const Icon = step.icon
        return (
          <div key={`${step.label}-${step.tool}`} className="contents">
            <div className="min-h-[74px] border border-[hsl(var(--mist))] bg-[hsl(var(--paper))] p-3">
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ink))]" />
                <p className="min-w-0 truncate text-[11px] font-semibold text-[hsl(var(--ink))]">
                  {step.label}
                </p>
              </div>
              <p className="text-[10.5px] leading-[1.35] text-[hsl(var(--steel))]">
                {step.tool}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className="hidden items-center justify-center sm:flex">
                <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--steel))]" />
              </div>
            )}
          </div>
        )
      })}
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
    <section className="mx-auto w-full max-w-6xl px-3 pb-10 sm:px-5 md:px-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--steel))]">
            Template marketplace
          </p>
          <h2 className="text-[1.15rem] font-semibold leading-tight text-[hsl(var(--ink))]">
            Start from a proven GTM motion.
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
                'inline-flex h-8 shrink-0 items-center gap-1.5 border px-3 text-[12px] font-medium transition-colors',
                activeFilter === filter
                  ? 'border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-white'
                  : 'border-[hsl(var(--mist))] bg-white text-[hsl(var(--steel))] hover:border-[hsl(var(--ink)/0.35)] hover:text-[hsl(var(--ink))]'
              )}
            >
              {filter === 'All' && <Filter className="h-3.5 w-3.5" />}
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-2">
          {templates.map(template => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelectedId(template.id)}
              className={cn(
                'grid min-h-[92px] w-full grid-cols-[1fr_auto] gap-4 border bg-white p-4 text-left transition-colors',
                selected.id === template.id
                  ? 'border-[hsl(var(--ink))] shadow-[0_0_0_1px_hsl(var(--ink))]'
                  : 'border-[hsl(var(--mist))] hover:border-[hsl(var(--ink)/0.35)]'
              )}
            >
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight text-[hsl(var(--ink))]">
                  {template.title}
                </span>
                <span className="mt-1 block text-[11px] leading-[1.45] text-[hsl(var(--steel))]">
                  {template.market}
                </span>
                <span className="mt-2 block text-[12px] leading-[1.45] text-[hsl(var(--ink))]/80">
                  {template.outcome}
                </span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 text-[hsl(var(--steel))]" />
            </button>
          ))}
        </div>

        <article className="border border-[hsl(var(--mist))] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--steel))]">
                {selected.category}
              </p>
              <h3 className="mt-2 text-[1.35rem] font-semibold leading-tight text-[hsl(var(--ink))]">
                {selected.title}
              </h3>
              <p className="mt-2 max-w-[680px] text-[13px] leading-[1.55] text-[hsl(var(--steel))]">
                {selected.outcome}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => onSelectPrompt(selected.prompt)}
                className="h-9 rounded-none border-[hsl(var(--mist))] px-3 text-[12px]"
              >
                Load prompt
              </Button>
              <Button
                type="button"
                disabled={disabled || !onRunPrompt}
                onClick={() => onRunPrompt?.(selected.prompt)}
                className="h-9 rounded-none bg-[hsl(var(--ink))] px-3 text-[12px] text-white hover:bg-[hsl(var(--ink)/0.92)]"
              >
                Run direct
              </Button>
            </div>
          </div>

          <div className="mt-5">
            <WorkflowMini steps={selected.steps} />
          </div>

          <div className="mt-5 border border-[hsl(var(--mist))] bg-[hsl(var(--soft))] p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--steel))]">
              Prompt
            </p>
            <p className="text-[13px] leading-[1.55] text-[hsl(var(--ink))]">
              {selected.prompt}
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
