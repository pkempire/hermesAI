'use client'

/**
 * BelowFold — landing content beneath the chat input on the home empty-state.
 * Structure mirrors the Hermes GTM design mocks (capability menu, process trio,
 * proof tiles, "what you get" 4-up, engagement options/pricing, final CTA),
 * rewritten for the SaaS product (not a services agency).
 *
 * No fake testimonials. No invented metrics. Proof tiles describe verifiable
 * product capabilities — when real customer outcomes exist, swap the body text
 * to those.
 */

import {
  Search,
  Users2,
  GitBranch,
  Mail,
  Workflow,
  ShieldCheck,
  Sparkles,
  Globe2,
  Database,
  Check,
  ArrowRight,
  FileText,
  Code2,
  BookOpen,
  LifeBuoy
} from 'lucide-react'
import Link from 'next/link'

interface BelowFoldProps {
  onSelectPrompt?: (prompt: string) => void
}

export function BelowFold({ onSelectPrompt }: BelowFoldProps) {
  return (
    <div className="w-full bg-[hsl(var(--hermes-cream))]">
      <CapabilitySection />
      <ProcessSection />
      <ProofSection />
      <WhatYouGetSection />
      <PricingSection />
      <FinalCTA onSelectPrompt={onSelectPrompt} />
    </div>
  )
}

/* ───────────────────────────────────────────────────────────── 1. capability */

const CAPABILITY_ITEMS = [
  { icon: <Search className="h-4 w-4" />, label: 'Account research' },
  { icon: <Users2 className="h-4 w-4" />, label: 'Decision-maker resolution' },
  { icon: <GitBranch className="h-4 w-4" />, label: 'Routing & workflow sync' },
  { icon: <Sparkles className="h-4 w-4" />, label: 'Lead scoring' },
  { icon: <Mail className="h-4 w-4" />, label: 'Outbound systems' },
  { icon: <ShieldCheck className="h-4 w-4" />, label: 'Human-in-the-loop review' }
]

function CapabilitySection() {
  return (
    <section className="border-t border-[hsl(var(--hermes-mist))] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Eyebrow>Built around your motion</Eyebrow>
        <Headline>
          <span className="italic">Native</span> across the outbound stack.
        </Headline>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[hsl(var(--hermes-steel))]">
          Hermes is a single operator that handles every layer of the pipeline —
          from sourcing a list to drafting evidence-backed outreach. No tool
          sprawl. No black-box lock-in. You own the data.
        </p>

        <ul className="mt-12 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITY_ITEMS.map(item => (
            <li
              key={item.label}
              className="flex items-center gap-3 border-t border-[hsl(var(--hermes-mist))]/70 pt-5 text-[15px] text-[hsl(var(--hermes-ink))]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--hermes-ink))] text-[hsl(var(--hermes-cream))]">
                {item.icon}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────── 2. process */

const PROCESS = [
  {
    n: '01',
    title: 'Brief',
    body: 'Describe target, offer, and constraints. One sentence is enough — Hermes asks for what it actually needs.',
    outcome: 'Outcome: shared understanding'
  },
  {
    n: '02',
    title: 'Discover',
    body: 'Hermes maps the market through Exa Websets, scores fit, and resolves the right decision-maker per account.',
    outcome: 'Outcome: qualified list'
  },
  {
    n: '03',
    title: 'Engage',
    body: 'Drafts personalised pitches grounded in real evidence per prospect. You review, then send through your inbox.',
    outcome: 'Outcome: live pipeline'
  }
]

function ProcessSection() {
  return (
    <section
      id="how-it-works"
      className="border-t border-[hsl(var(--hermes-mist))] bg-white py-24"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Eyebrow>How it works</Eyebrow>
        <Headline>
          A collaborative build,{' '}
          <span className="italic">from insight to impact.</span>
        </Headline>

        <div className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
          {PROCESS.map((step, i) => (
            <div key={step.n} className="relative flex flex-col">
              <div className="flex items-center gap-4">
                <span className="font-serif text-3xl text-[hsl(var(--hermes-ink))]">
                  {step.n}
                </span>
                <span className="h-px flex-1 bg-[hsl(var(--hermes-mist))]" />
              </div>
              <h3 className="mt-5 font-serif text-[28px] leading-tight text-[hsl(var(--hermes-ink))]">
                {step.title}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--hermes-steel))]">
                {step.body}
              </p>
              <span className="mt-6 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-ink-soft))]">
                {step.outcome}
              </span>
              {i < PROCESS.length - 1 && (
                <ArrowRight
                  className="absolute right-[-32px] top-3 hidden h-4 w-4 text-[hsl(var(--hermes-mist))] md:block"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────── 3. proof */

const PROOF = [
  {
    tag: 'Discovery',
    metric: 'Semantic',
    body: 'Find by meaning, not keywords. Includes ICPs Apollo filters cannot express — "fintech CTOs writing about agent infra," "DTC brands shipping with Klaviyo."'
  },
  {
    tag: 'Resolution',
    metric: 'Decision-maker',
    body: 'Identify the right person at every account, with verified email and recent context. No manual list cleaning, no contact-database scrubbing.'
  },
  {
    tag: 'Outreach',
    metric: 'Evidence-backed',
    body: 'Every email cites something real about the prospect. Generic hooks are blocked at draft time. Deliverability stays high because the messages are not spammy.'
  }
]

function ProofSection() {
  return (
    <section className="border-t border-[hsl(var(--hermes-mist))] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Eyebrow>Proof, not promises</Eyebrow>
        <Headline>
          Built on the parts of outbound that{' '}
          <span className="italic">actually move metrics.</span>
        </Headline>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[hsl(var(--hermes-mist))] bg-[hsl(var(--hermes-mist))] md:grid-cols-3">
          {PROOF.map(p => (
            <div
              key={p.tag}
              className="flex flex-col gap-4 bg-white p-8 transition-colors hover:bg-[hsl(var(--hermes-cream))]"
            >
              <span className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
                {p.tag}
              </span>
              <span className="font-serif text-[44px] leading-none text-[hsl(var(--hermes-ink))]">
                {p.metric}
              </span>
              <p className="text-[14px] leading-relaxed text-[hsl(var(--hermes-steel))]">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────────────── 4. what's inside */

const WHAT_YOU_GET = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'A working system',
    body: 'A live operator that runs your campaigns end to end — discovery, enrichment, drafting, sending.'
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: 'Your own data',
    body: 'Export prospects, drafts, and campaign histories any time. CSV, JSON, or webhook — your call.'
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: 'Playbook memory',
    body: 'Every campaign you run sharpens the next one. ICP, offer, and proof material persist across sessions.'
  },
  {
    icon: <LifeBuoy className="h-5 w-5" />,
    title: 'Operator support',
    body: 'Direct line to the team. We help you tune briefs, calibrate enrichment, and ship sharper outreach.'
  }
]

function WhatYouGetSection() {
  return (
    <section className="border-t border-[hsl(var(--hermes-mist))] bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Eyebrow>What you actually get</Eyebrow>
        <Headline>Everything you need to run and scale.</Headline>

        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {WHAT_YOU_GET.map(item => (
            <div key={item.title} className="flex flex-col gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--hermes-parchment))] text-[hsl(var(--hermes-ink))]">
                {item.icon}
              </span>
              <h3 className="font-serif text-[22px] leading-tight text-[hsl(var(--hermes-ink))]">
                {item.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-[hsl(var(--hermes-steel))]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────────────────── 5. pricing */

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
    href: '/auth/sign-up?plan=solo',
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
    href: '/auth/sign-up?plan=operator',
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
    href: 'mailto:hello@hermesgtm.com?subject=Hermes%20Agency%20plan',
    featured: false
  }
]

function PricingSection() {
  return (
    <section className="border-t border-[hsl(var(--hermes-mist))] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Eyebrow>Engagement options</Eyebrow>
        <Headline>
          Simple plans. <span className="italic">Real volume.</span>
        </Headline>
        <p className="mt-5 max-w-xl text-[15px] text-[hsl(var(--hermes-steel))]">
          Start with 25 prospects on us — no card, no signup wall. Upgrade
          when you are ready.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map(p => (
            <div
              key={p.name}
              className={
                'relative flex flex-col rounded-2xl border bg-white p-7 transition-all ' +
                (p.featured
                  ? 'border-[hsl(var(--hermes-ink))] shadow-[0_28px_70px_-30px_rgba(10,24,53,0.45)]'
                  : 'border-[hsl(var(--hermes-mist))] hover:border-[hsl(var(--hermes-ink-soft))]')
              }
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-[hsl(var(--hermes-ink))] px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(var(--hermes-cream))]">
                  Most popular
                </span>
              )}
              <div className="font-serif text-[24px] text-[hsl(var(--hermes-ink))]">
                {p.name}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-serif text-[52px] leading-none text-[hsl(var(--hermes-ink))]">
                  {p.price}
                </span>
                <span className="text-[13px] text-[hsl(var(--hermes-steel))]">
                  {p.period}
                </span>
              </div>
              <p className="mt-3 text-[14px] text-[hsl(var(--hermes-steel))]">
                {p.blurb}
              </p>
              <ul className="mt-6 space-y-3 text-[14px] text-[hsl(var(--hermes-ink-soft))]">
                {p.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--hermes-ink))]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={
                  'mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ' +
                  (p.featured
                    ? 'bg-[hsl(var(--hermes-ink))] text-[hsl(var(--hermes-cream))] hover:opacity-90'
                    : 'border border-[hsl(var(--hermes-mist))] text-[hsl(var(--hermes-ink))] hover:border-[hsl(var(--hermes-ink))]')
                }
              >
                {p.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────── 6. final CTA */

function FinalCTA({ onSelectPrompt }: BelowFoldProps) {
  return (
    <section className="border-t border-[hsl(var(--hermes-mist))] bg-[hsl(var(--hermes-ink))] py-24">
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <span className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-cream))]/60">
          Stop renting generic outbound software.
        </span>
        <h2 className="mt-4 font-serif text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.04] tracking-[-0.02em] text-[hsl(var(--hermes-cream))]">
          Get a system{' '}
          <span className="italic">built for your exact motion.</span>
        </h2>
        <p className="mt-5 text-[16px] leading-relaxed text-[hsl(var(--hermes-cream))]/75">
          Type your campaign brief — Hermes runs it before you finish your
          coffee.
        </p>
        <button
          type="button"
          onClick={() => {
            onSelectPrompt?.(
              'Find 25 B2B SaaS companies on the East Coast doing $1M–$10M ARR. Reach the founder or VP of Sales. I run a fractional GTM consultancy.'
            )
            ;(document.querySelector(
              'textarea[name="input"]'
            ) as HTMLTextAreaElement | null)?.focus()
          }}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--hermes-cream))] px-6 py-3 text-[14px] font-medium text-[hsl(var(--hermes-ink))] transition-colors hover:bg-white"
        >
          Try a sample brief
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-14 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-cream))]/40">
          Hermes — your outbound, your inbox, your data.
        </p>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────── primitives */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-[11px] uppercase tracking-[0.24em] text-[hsl(var(--hermes-steel))]">
      {children}
    </div>
  )
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.04] tracking-[-0.02em] text-[hsl(var(--hermes-ink))] max-w-3xl">
      {children}
    </h2>
  )
}
