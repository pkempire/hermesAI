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
}

const PLAYBOOKS: Playbook[] = [
  {
    category: 'New Market Entry',
    categoryIcon: <Map className="w-3.5 h-3.5" />,
    title: 'Regional Expansion',
    pain: 'Breaking into a new geo cold, with no relationships and no warm list.',
    template:
      "I run [YOUR_COMPANY]. Find [TARGET_TYPE] in [REGION] with [SIZE] employees that have been in business for more than [YEARS] years. Get me the contact for their [ROLE].",
    fields: {
      YOUR_COMPANY: 'DentalSaaS.com',
      TARGET_TYPE: 'private dental practices',
      REGION: 'Massachusetts',
      SIZE: '10-50',
      YEARS: '5',
      ROLE: 'founder or owner'
    }
  },
  {
    category: 'New Market Entry',
    categoryIcon: <Map className="w-3.5 h-3.5" />,
    title: 'Vertical Pivot',
    pain: "You've saturated your current vertical. Similar buyers exist in adjacent markets.",
    template:
      "We sell [PRODUCT] to [CURRENT_MARKET]. Find analogous buyers in [NEW_VERTICAL] we haven't tapped — similar size, similar pain. Get the [ROLE].",
    fields: {
      PRODUCT: 'our practice management software',
      CURRENT_MARKET: 'dental practices',
      NEW_VERTICAL: 'veterinary clinics',
      ROLE: 'practice owner or office manager'
    }
  },
  {
    category: 'Signal-Based',
    categoryIcon: <Zap className="w-3.5 h-3.5" />,
    title: 'Recent Funding',
    pain: 'Funded companies are spending. Catch them before their stack is locked.',
    template:
      "Find [COMPANY_TYPE] that raised a Seed or Series A in the last [MONTHS] months. Get the [ROLE] — they're building something new and have budget.",
    fields: {
      COMPANY_TYPE: 'B2B SaaS companies',
      MONTHS: '6',
      ROLE: 'VP of Sales or CRO'
    }
  },
  {
    category: 'Signal-Based',
    categoryIcon: <Zap className="w-3.5 h-3.5" />,
    title: 'Hiring as Signal',
    pain: 'A company hiring for a specific role is scaling into exactly the problem you solve.',
    template:
      "Find [COMPANY_TYPE] actively hiring [JOB_TITLE] right now. That means they're scaling [FUNCTION]. Reach the [DECISION_MAKER] and pitch [YOUR_OFFER] as a force multiplier.",
    fields: {
      COMPANY_TYPE: 'Series B enterprise SaaS companies',
      JOB_TITLE: 'SDRs or BDRs',
      FUNCTION: 'outbound',
      DECISION_MAKER: 'VP of Sales',
      YOUR_OFFER: 'our outbound intelligence platform'
    }
  },
  {
    category: 'Competitive',
    categoryIcon: <Target className="w-3.5 h-3.5" />,
    title: 'Competitor Displacement',
    pain: "Your competitor's customers are your best-fit prospects — they already have the problem.",
    template:
      "Find companies using [COMPETITOR_TOOL]. Target [ICP_CRITERIA]. We offer [DIFFERENTIATOR]. Draft an email leading with why we're the better switch.",
    fields: {
      COMPETITOR_TOOL: 'Apollo.io or Outreach',
      ICP_CRITERIA: 'B2B SaaS, 50-500 employees',
      DIFFERENTIATOR: 'AI-native enrichment with higher contact accuracy'
    }
  },
  {
    category: 'Partnerships',
    categoryIcon: <Users className="w-3.5 h-3.5" />,
    title: 'Referral Channel Build',
    pain: 'The best leads come through people who already serve your exact buyer.',
    template:
      "Find [ADJACENT_INDUSTRY] firms whose clients need [SERVICE_YOU_PROVIDE]. Pitch a referral arrangement to the [ROLE].",
    fields: {
      ADJACENT_INDUSTRY: 'accounting or bookkeeping',
      SERVICE_YOU_PROVIDE: 'CFO advisory or fractional finance',
      ROLE: 'founder or managing partner'
    }
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
    <div className="flex flex-col rounded-[2rem] border border-gray-100 bg-white p-8 hover:border-amber-200/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-500 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/40 rounded-full blur-[80px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${categoryColor}`}>
          {playbook.categoryIcon}
          {playbook.category}
        </span>
        <div className="h-2 w-2 rounded-full bg-gray-100 group-hover:bg-amber-400 transition-colors" />
      </div>

      <h3 className="font-serif text-[1.4rem] font-medium text-gray-900 mb-2 tracking-tight">
        {playbook.title}
      </h3>
      <p className="text-[14px] leading-relaxed text-gray-500 mb-8 font-medium">
        {playbook.pain}
      </p>

      {/* Interactive Mad Libs template */}
      <div className="flex-1 rounded-2xl border border-gray-50 bg-gray-50/40 px-5 py-6 text-[14px] leading-[2.2] text-gray-600 mb-8 relative z-10 backdrop-blur-sm">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
          <Quote className="w-3 h-3" />
          The Strategy
        </div>
        <div className="font-medium text-gray-700">{renderTemplate()}</div>
      </div>

      <button
        onClick={() => onRun(assemblePrompt(playbook.template, values))}
        className="relative z-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-6 py-4 text-[14px] font-bold text-white shadow-lg hover:bg-amber-600 hover:shadow-amber-200/40 transition-all duration-300 group/btn"
      >
        Execute Playbook
        <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
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

        <div className="space-y-24">
          {categories.map(cat => (
            <div key={cat} className="relative">
              <div className="sticky top-24 z-20 mb-8 backdrop-blur-sm">
                <h3 className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400/80">
                  <span className="h-px w-8 bg-amber-200/50" />
                  {cat}
                  <span className="h-px flex-1 bg-gray-100" />
                </h3>
              </div>
              
              <div className="grid gap-8 md:grid-cols-2 relative z-10">
                {PLAYBOOKS.filter(p => p.category === cat).map((pb, i) => (
                  <PlaybookCard
                    key={i}
                    playbook={pb}
                    onRun={(prompt) => onPromptSelect?.(prompt)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}
