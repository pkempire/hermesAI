'use client'

import { useState, useRef } from 'react'
import {
  ArrowRight,
  Building2,
  ChevronRight,
  ExternalLink,
  Globe,
  Map,
  TrendingUp,
  Users,
  Zap,
  Search,
  DollarSign,
  Briefcase,
  Target,
  Quote
} from 'lucide-react'
import { PipelineWalkthrough } from './pipeline-walkthrough'
import Image from 'next/image'

// PipelineStrip removed in favor of PipelineWalkthrough

// ─── Interactive Mad Libs playbook ────────────────────────────────────────────

interface Playbook {
  category: string
  categoryIcon: React.ReactNode
  title: string
  pain: string
  template: string  // uses [BRACKET] tokens
  fields: Record<string, string>  // token → default placeholder
  orchestration: string // Tool/workflow summary
}

const PLAYBOOKS: Playbook[] = [
  {
    category: 'New Market Entry',
    categoryIcon: <Map className="w-3.5 h-3.5" />,
    title: 'Regional Expansion',
    pain: 'Find decision-makers in a new geography with specific business constraints.',
    template:
      "Find [TARGET_TYPE] in [REGION] with [SIZE] employees. Get the contact for their [ROLE]. Verify their HQ location.",
    fields: {
      TARGET_TYPE: 'B2B SaaS companies',
      REGION: 'Greater London',
      SIZE: '50-200',
      ROLE: 'founder or head of sales'
    },
    orchestration: 'Exa Website Discovery → Orangeslice Email Verification'
  },
  {
    category: 'New Market Entry',
    categoryIcon: <Map className="w-3.5 h-3.5" />,
    title: 'Vertical Pivot',
    pain: "Find analogous buyers in adjacent markets based on your product-market fit.",
    template:
      "We sell [PRODUCT] to [CURRENT_MARKET]. Find analogous buyers in [NEW_VERTICAL] — similar size and pain. Get the [ROLE].",
    fields: {
      PRODUCT: 'CRM automation',
      CURRENT_MARKET: 'digital agencies',
      NEW_VERTICAL: 'management consultancies',
      ROLE: 'managing partner'
    },
    orchestration: 'Intent Mapping → Persona Resolution'
  },
  {
    category: 'Signal-Based',
    categoryIcon: <Zap className="w-3.5 h-3.5" />,
    title: 'Recent Funding',
    pain: 'Catch companies that just raised Seed or Series A capital.',
    template:
      "Find [COMPANY_TYPE] that raised a [ROUND] in the last [MONTHS] months. Get the [ROLE].",
    fields: {
      COMPANY_TYPE: 'Fintech startups',
      ROUND: 'Series A',
      MONTHS: '3',
      ROLE: 'CTO or Engineering Lead'
    },
    orchestration: 'Funding Feed Polling → LinkedIn Enrichment'
  },
  {
    category: 'Signal-Based',
    categoryIcon: <Zap className="w-3.5 h-3.5" />,
    title: 'Hiring Trends',
    pain: 'Scale into problems revealed by active job postings.',
    template:
      "Find [COMPANY_TYPE] actively hiring [JOB_TITLE]. Reach the [DECISION_MAKER] and pitch [YOUR_OFFER].",
    fields: {
      COMPANY_TYPE: 'Enterprise SaaS',
      JOB_TITLE: 'Account Executives',
      DECISION_MAKER: 'VP of Sales',
      YOUR_OFFER: 'our sales intelligence platform'
    },
    orchestration: 'Job Board Analysis → Outreach Personalization'
  },
  {
    category: 'Competitive',
    categoryIcon: <Target className="w-3.5 h-3.5" />,
    title: 'Competitor Switch',
    pain: "Displace competitors by targeting their existing customers.",
    template:
      "Find companies using [COMPETITOR_TOOL]. Target [ICP_CRITERIA]. Draft an email leading with [DIFFERENTIATOR].",
    fields: {
      COMPETITOR_TOOL: 'Salesforce',
      ICP_CRITERIA: 'Retail brands 100-500 employees',
      DIFFERENTIATOR: 'our 10x faster implementation'
    },
    orchestration: 'Technographic Filtering → Competitive Pitch Drafting'
  },
  {
    category: 'Partnerships',
    categoryIcon: <Users className="w-3.5 h-3.5" />,
    title: 'Referral Build',
    pain: 'Build a channel of partners who serve your exact buyer.',
    template:
      "Find [ADJACENT_INDUSTRY] firms whose clients need [SERVICE]. Pitch a referral arrangement to the [ROLE].",
    fields: {
      ADJACENT_INDUSTRY: 'Web agencies',
      SERVICE: 'SEO auditing',
      ROLE: 'CEO or owner'
    },
    orchestration: 'Partner Mapping → Multi-Step Sequence'
  }
]

const CATEGORY_COLORS: Record<string, string> = {
  'New Market Entry': 'bg-indigo-50/50 text-indigo-700 border-indigo-100/50',
  'Signal-Based': 'bg-amber-50/50 text-amber-700 border-amber-100/50',
  'Competitive': 'bg-rose-50/50 text-rose-700 border-rose-100/50',
  'Partnerships': 'bg-emerald-50/50 text-emerald-700 border-emerald-100/50'
}

function assemblePrompt(template: string, values: Record<string, string>): string {
  let out = template
  for (const [token, value] of Object.entries(values)) {
    out = out.replaceAll(`[${token}]`, value || `[${token}]`)
  }
  return out
}

function PlaybookCard({
  playbook,
  onRun
}: {
  playbook: Playbook
  onRun: (prompt: string) => void
}) {
  const [values, setValues] = useState<Record<string, string>>({ ...playbook.fields })
  const [activeField, setActiveField] = useState<string | null>(null)

  // Render template with editable inline spans
  function renderTemplate() {
    const parts: React.ReactNode[] = []
    let rest = playbook.template
    let idx = 0

    while (rest.length > 0) {
      const start = rest.indexOf('[')
      if (start === -1) {
        parts.push(<span key={`text-${idx++}`}>{rest}</span>)
        break
      }
      const end = rest.indexOf(']', start)
      if (end === -1) {
        parts.push(<span key={`text-${idx++}`}>{rest}</span>)
        break
      }
      if (start > 0) parts.push(<span key={`text-${idx++}`}>{rest.slice(0, start)}</span>)
      const token = rest.slice(start + 1, end)
      const isActive = activeField === token
      parts.push(
        <span
          key={`token-${token}`}
          className={`relative inline-block cursor-text rounded-md px-1.5 py-0.5 text-[13px] font-semibold transition-all ${
            isActive
              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
              : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-800'
          }`}
          onClick={() => setActiveField(token)}
        >
          {values[token] || token}
          {isActive && (
            <input
              autoFocus
              className="absolute inset-0 h-full w-full rounded-md bg-amber-100 px-1.5 text-[13px] font-semibold text-amber-900 outline-none"
              value={values[token] || ''}
              onChange={e => setValues(prev => ({ ...prev, [token]: e.target.value }))}
              onBlur={() => setActiveField(null)}
              onKeyDown={e => e.key === 'Enter' && setActiveField(null)}
              size={Math.max(4, (values[token] || token).length)}
            />
          )}
        </span>
      )
      rest = rest.slice(end + 1)
    }
    return parts
  }

  const categoryColor = CATEGORY_COLORS[playbook.category] || 'bg-gray-50 text-gray-600 border-gray-100'

  return (
    <div className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 hover:border-amber-200/50 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${categoryColor}`}>
          {playbook.categoryIcon}
          {playbook.category}
        </span>
        <div className="h-1.5 w-1.5 rounded-full bg-gray-100 group-hover:bg-amber-400" />
      </div>

      <h3 className="font-serif text-[1.1rem] font-bold text-gray-900 mb-1.5 tracking-tight group-hover:text-amber-700 transition-colors">
        {playbook.title}
      </h3>
      <p className="text-[12px] leading-relaxed text-gray-400 mb-6 font-medium line-clamp-2">
        {playbook.pain}
      </p>

      {/* Orchestration Summary */}
      <div className="mb-6 py-2 px-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Orchestration Flow</div>
        <div className="text-[10px] font-bold text-gray-600 truncate">{playbook.orchestration}</div>
      </div>

      {/* Interactive Mad Libs template */}
      <div className="flex-1 rounded-2xl border border-gray-50 bg-gray-50/20 px-4 py-4 text-[13px] leading-[1.8] text-gray-600 mb-6 relative z-10">
        <div className="font-medium text-gray-700">{renderTemplate()}</div>
      </div>

      <button
        onClick={() => onRun(assemblePrompt(playbook.template, values))}
        className="relative z-10 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-[12px] font-bold text-white shadow-sm hover:bg-amber-600 transition-all duration-300 group/btn"
      >
        Use Strategy
        <ArrowRight className="w-3 h-3 transform group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function HomeCommandCenter({
  onPromptSelect
}: {
  onPromptSelect?: (prompt: string) => void
}) {
  // Group playbooks by category for display
  const categories = Array.from(new Set(PLAYBOOKS.map(p => p.category)))

  return (
    <section className="relative mx-auto mt-6 w-full max-w-[90rem] space-y-32 pb-48 px-4 md:px-8 overflow-visible">
      
      {/* ── Background Elements ─────────────────────────────────────────── */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1000px] opacity-[0.03]">
          <Image 
            src="/images/hermes-pixel.png" 
            alt="" 
            fill 
            className="object-cover object-top filter grayscale"
            priority
          />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent" />
      </div>

      {/* ── How Hermes works ─────────────────────────────────────────── */}
      <div className="pt-20">
        <PipelineWalkthrough />
      </div>

      {/* ── SDR Playbooks ─────────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-50/30 rounded-full blur-[120px] -z-10" />
        
        <div className="text-center mb-16 relative z-10">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-600/70 mb-4">The Playbooks</div>
          <h2 className="font-serif text-[3.2rem] md:text-[3.8rem] leading-[1] tracking-tight text-gray-900 mb-6">
            Elite Outreach <br /><span className="text-gray-400">Tactics on Autopilot.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-[18px] leading-[1.6] font-medium text-gray-500/80">
            Choose a battle-tested strategy. Refine the variables. <br className="hidden md:block" /> Launch your autonomous campaign in one click.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 relative z-10">
          {PLAYBOOKS.map((pb, i) => (
            <PlaybookCard
              key={i}
              playbook={pb}
              onRun={(prompt) => onPromptSelect?.(prompt)}
            />
          ))}
        </div>
      </div>

    </section>
  )
}
