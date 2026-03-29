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
  Target
} from 'lucide-react'

// ─── Pipeline strip (3-step, shown below chatbox) ────────────────────────────

const STEPS: Array<{
  number: string
  label: string
  description: string
  tooltip: string
  color: string
  pill: string
  serviceUrl?: string
  serviceName?: string
}> = [
  {
    number: '01',
    label: 'Understand your offer',
    description:
      'Hermes visits your website and extracts your ICP, positioning, and value prop — so every search and every email is grounded in what you actually sell.',
    tooltip:
      'When you share your website URL, Hermes reads your positioning page to understand who you sell to and what makes you different. This seeds all enrichments that follow.',
    color: 'from-amber-50 to-white',
    pill: 'Website scrape'
  },
  {
    number: '02',
    label: 'Find target businesses',
    description:
      'websets use neural semantic search — not keywords — to find companies that match your ICP across the live web. Custom enrichments derived from your offer ship with every search.',
    tooltip:
      "Exa doesn't rely on keywords. It reads the web by meaning, surfacing companies that fit your criteria even if they'd never self-categorize with your search terms.",
    color: 'from-blue-50 to-white',
    pill: 'Exa Websets',
    serviceUrl: 'https://exa.ai',
    serviceName: 'Exa.ai'
  },
  {
    number: '03',
    label: 'Resolve the decision-maker',
    description:
      'enriches each account — finding the exact contact for your persona, verifying their business email, and pulling fresh signals for the email draft.',
    tooltip:
      'Orangeslice resolves the right person at each company based on your target persona, then verifies their email and extracts personalized signals so your email is specific and credible.',
    color: 'from-emerald-50 to-white',
    pill: 'Orangeslice',
    serviceUrl: 'https://orangeslice.ai',
    serviceName: 'Orangeslice.ai'
  }
]

function PipelineStrip() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <div
          key={i}
          className="relative rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-amber-200 hover:shadow-md cursor-default group"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          {/* tooltip */}
          {hovered === i && (
            <div className="absolute -top-28 left-1/2 -translate-x-1/2 z-30 w-64 rounded-xl border border-gray-200 bg-gray-900 px-4 py-3 text-[12px] leading-relaxed text-gray-100 shadow-2xl">
              {step.tooltip}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-gray-700 bg-gray-900" />
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">{step.number}</span>
            <span className="rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
              {step.pill}
            </span>
          </div>
          <div className="font-bold text-[14px] text-gray-900 mb-2">{step.label}</div>
          <div className="text-[13px] text-gray-500 leading-relaxed">
            {step.serviceUrl ? (
              <>
                <a
                  href={step.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-700 underline decoration-dotted underline-offset-2 hover:text-amber-800 inline-flex items-center gap-0.5 mr-0.5"
                >
                  {step.serviceName} <ExternalLink className="w-2.5 h-2.5" />
                </a>{' '}
              </>
            ) : null}
            {step.description}
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 hidden md:block w-4 h-4 text-gray-300" />
          )}
        </div>
      ))}
    </div>
  )
}

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
  'New Market Entry': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Signal-Based': 'bg-amber-50 text-amber-700 border-amber-100',
  'Competitive': 'bg-rose-50 text-rose-700 border-rose-100',
  'Partnerships': 'bg-emerald-50 text-emerald-700 border-emerald-100'
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
    <div className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6 hover:border-amber-200/70 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50/60 rounded-full blur-[60px] -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${categoryColor}`}>
          {playbook.categoryIcon}
          {playbook.category}
        </span>
      </div>
      <h3 className="text-[17px] font-bold text-gray-900 mb-1">{playbook.title}</h3>
      <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">{playbook.pain}</p>

      {/* Interactive Mad Libs template */}
      <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-4 text-[13px] leading-[2] text-gray-600 mb-5 relative z-10">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Click any field to edit →</div>
        <div className="leading-loose">{renderTemplate()}</div>
      </div>

      <button
        onClick={() => onRun(assemblePrompt(playbook.template, values))}
        className="relative z-10 flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-[13px] font-bold text-white shadow-md hover:bg-amber-700 transition-all duration-200 group/btn"
      >
        Run this →
        <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
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
    <section className="mx-auto mt-6 w-full max-w-[90rem] space-y-20 pb-24 px-4 md:px-8">

      {/* ── How Hermes works ─────────────────────────────────────────── */}
      <div className="pt-8">
        <div className="text-center mb-8">
          <h2 className="font-serif text-[2.2rem] tracking-tight text-gray-900">How Hermes works</h2>
          <p className="text-gray-500 font-medium text-[15px] mt-2">
            Three systems, fully automated. Zero manual research.
          </p>
        </div>
        <PipelineStrip />
      </div>

      {/* ── SDR Playbooks ─────────────────────────────────────────────── */}
      <div>
        <div className="text-center mb-10">
          <h2 className="font-serif text-[2.2rem] tracking-tight text-gray-900">SDR Playbooks</h2>
          <p className="text-gray-500 font-medium text-[15px] mt-2">
            Click any bracket to make it yours. Then hit Run.
          </p>
        </div>

        <div className="space-y-12">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                <span className={`h-px flex-1 bg-gray-200`} />
                {cat}
                <span className="h-px flex-1 bg-gray-200" />
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
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
