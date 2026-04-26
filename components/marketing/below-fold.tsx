'use client'

/**
 * BelowFold — landing content rendered beneath the chat input on the empty
 * home state. Replaces the old `HomeCommandCenter` (playbook mad-libs +
 * "Hermes World" pitch). Inspired by the Hermes GTM design mocks but rewritten
 * for the SaaS product, not a services agency.
 *
 * Sections, in order:
 *   1. How it works (3-step pipeline)
 *   2. Built for (audience pillars)
 *   3. What's inside (capability grid)
 *   4. Pricing (3 tiers)
 *   5. Final CTA + footer note
 */

import {
  Search,
  Users,
  Mail,
  Database,
  Workflow,
  ShieldCheck,
  Sparkles,
  Globe2,
  Check,
  ArrowRight
} from 'lucide-react'

// ─── 1. Pipeline ─────────────────────────────────────────────────────────────

const PIPELINE = [
  {
    n: '01',
    title: 'Describe your motion',
    body: 'One sentence: who you sell to, who you want to reach, and what you are pitching. No filters. No tables. No spreadsheets.'
  },
  {
    n: '02',
    title: 'Hermes runs the research',
    body: 'Hermes maps your market, resolves the right decision-maker, and pulls only the signals that matter for outreach. Sources are cited.'
  },
  {
    n: '03',
    title: 'Drafts ship to your inbox',
    body: 'Personalised pitches grounded in real evidence per prospect. Connect Gmail and send, or hand off the full sequence to your stack.'
  }
]

// ─── 2. Built For ────────────────────────────────────────────────────────────

const BUILT_FOR = [
  {
    icon: <Users className="h-4 w-4" />,
    label: 'Founders',
    body: 'Founder-led sales without the tool sprawl. Replace Apollo, Clay, and Instantly with one operator.'
  },
  {
    icon: <Workflow className="h-4 w-4" />,
    label: 'Agencies',
    body: 'Run multiple client pipelines from one surface. Less switching, more sends, fewer subscriptions.'
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Recruiters',
    body: 'Source candidates and clients with the same operator. Outbound that compounds across both motions.'
  }
]

// ─── 3. What's inside ────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Search className="h-4 w-4" />,
    title: 'Semantic discovery',
    body: 'Find companies by meaning, not keywords — including the fuzzy ICPs that Apollo filters can\u2019t express.'
  },
  {
    icon: <Database className="h-4 w-4" />,
    title: 'Decision-maker resolution',
    body: 'Identify the right person, verified email, and recent context — no manual list-cleaning.'
  },
  {
    icon: <Mail className="h-4 w-4" />,
    title: 'Evidence-backed drafts',
    body: 'Every email cites something real about the prospect. No generic hooks, no hallucinated facts.'
  },
  {
    icon: <Globe2 className="h-4 w-4" />,
    title: 'Gmail-native sending',
    body: 'Connect once. Send from your real inbox. Replies land where you already work.'
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: 'You own the data',
    body: 'Export your prospects, drafts, and campaigns at any time. No black-box lock-in.'
  },
  {
    icon: <Workflow className="h-4 w-4" />,
    title: 'Workflow that compounds',
    body: 'Saved playbooks, ICP memory, and reusable templates. Every campaign sharpens the next one.'
  }
]

// ─── 4. Pricing ──────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Solo',
    price: '$79',
    period: '/ mo',
    blurb: 'For founders running their own outbound.',
    bullets: [
      '250 prospects / mo',
      '500 sends / mo',
      'Gmail sending',
      'Saved campaigns',
      'Email support'
    ],
    cta: 'Start with Solo',
    featured: false
  },
  {
    name: 'Operator',
    price: '$199',
    period: '/ mo',
    blurb: 'For full-time outbound operators.',
    bullets: [
      '1,500 prospects / mo',
      '3,000 sends / mo',
      'Decision-maker enrichment',
      'CSV import & export',
      'Priority support'
    ],
    cta: 'Start with Operator',
    featured: true
  },
  {
    name: 'Agency',
    price: '$499',
    period: '/ mo',
    blurb: 'For agencies running multiple clients.',
    bullets: [
      '5,000 prospects / mo',
      '10,000 sends / mo',
      'Multi-inbox routing',
      'Multi-client workspaces',
      'Dedicated support'
    ],
    cta: 'Talk to us',
    featured: false
  }
]

// ─── Component ───────────────────────────────────────────────────────────────

interface BelowFoldProps {
  onSelectPrompt?: (prompt: string) => void
}

export function BelowFold({ onSelectPrompt }: BelowFoldProps) {
  return (
    <div className="w-full bg-white">
      {/* Section: How it works */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <SectionEyebrow>The pipeline</SectionEyebrow>
        <SectionHeadline>
          From a single prompt to{' '}
          <span className="italic text-[hsl(var(--hermes-gold-dark))]">
            sent email
          </span>
          .
        </SectionHeadline>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {PIPELINE.map(step => (
            <div key={step.n} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl text-[hsl(var(--hermes-gold-dark))]">
                  {step.n}
                </span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <h3 className="font-serif text-2xl text-gray-900 leading-tight">
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-600">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Built for */}
      <section className="border-t border-gray-100 mx-auto max-w-6xl px-6 py-20">
        <SectionEyebrow>Built for</SectionEyebrow>
        <SectionHeadline>One operator, three motions.</SectionHeadline>
        <div className="mt-12 grid gap-px bg-gray-100 md:grid-cols-3 rounded-xl overflow-hidden border border-gray-100">
          {BUILT_FOR.map(b => (
            <div
              key={b.label}
              className="bg-white p-8 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-500 mb-4">
                {b.icon}
                <span className="text-[11px] uppercase tracking-[0.18em]">
                  {b.label}
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-gray-700">
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Features */}
      <section className="border-t border-gray-100 mx-auto max-w-6xl px-6 py-20">
        <SectionEyebrow>What's inside</SectionEyebrow>
        <SectionHeadline>
          Everything outbound, in one surface.
        </SectionHeadline>

        <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(f => (
            <div key={f.title}>
              <div className="flex items-center gap-2 text-gray-700 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--hermes-gold-light))] text-[hsl(var(--hermes-gold-dark))]">
                  {f.icon}
                </span>
                <h3 className="font-medium text-[15px] text-gray-900">
                  {f.title}
                </h3>
              </div>
              <p className="text-[14px] leading-relaxed text-gray-600 ml-9">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Pricing */}
      <section className="border-t border-gray-100 mx-auto max-w-6xl px-6 py-24">
        <SectionEyebrow>Pricing</SectionEyebrow>
        <SectionHeadline>
          Simple plans. <span className="italic text-[hsl(var(--hermes-gold-dark))]">Real volume.</span>
        </SectionHeadline>
        <p className="mt-4 max-w-xl text-[15px] text-gray-600">
          Start with 25 prospects on us — no card, no signup wall. Upgrade when
          you are ready.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map(p => (
            <div
              key={p.name}
              className={
                'relative flex flex-col rounded-2xl border bg-white p-7 transition-all ' +
                (p.featured
                  ? 'border-gray-900 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.4)]'
                  : 'border-gray-200 hover:border-gray-400')
              }
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-gray-900 px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
                  Most popular
                </span>
              )}
              <div className="font-serif text-2xl text-gray-900">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-5xl text-gray-900">
                  {p.price}
                </span>
                <span className="text-sm text-gray-500">{p.period}</span>
              </div>
              <p className="mt-3 text-[14px] text-gray-600">{p.blurb}</p>
              <ul className="mt-6 space-y-3 text-[14px] text-gray-700">
                {p.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--hermes-gold-dark))]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/auth/sign-up"
                className={
                  'mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ' +
                  (p.featured
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'border border-gray-300 text-gray-900 hover:border-gray-900')
                }
              >
                {p.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Final CTA */}
      <section className="border-t border-gray-100 mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.02em] text-gray-900">
          Ready to retire the tool stack?
        </h2>
        <p className="mt-4 text-[16px] text-gray-600 max-w-xl mx-auto">
          Type your first campaign brief above. Hermes will run it before you
          finish your coffee.
        </p>
        <button
          type="button"
          onClick={() =>
            onSelectPrompt?.(
              'Find 25 B2B SaaS companies on the East Coast doing $1M–$10M ARR. Reach the founder or VP of Sales. I run a fractional GTM consultancy.'
            )
          }
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Try a sample brief
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-12 text-[12px] tracking-[0.18em] uppercase text-gray-400">
          Hermes — your outbound, your inbox, your data.
        </p>
      </section>
    </div>
  )
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-[11px] uppercase tracking-[0.22em] text-gray-500">
      {children}
    </div>
  )
}

function SectionHeadline({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] text-gray-900 max-w-3xl">
      {children}
    </h2>
  )
}
