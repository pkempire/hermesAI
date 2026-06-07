import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Compass,
  FileText,
  Mail,
  Search,
  Send,
  Users
} from 'lucide-react'
import Link from 'next/link'

import { LandingChatPreview } from '@/components/landing-chat-preview'
import { Button } from '@/components/ui/button'

const QUICK_STARTS = [
  'Bay Area STEM counselors',
  'Conference sponsor lists',
  'Local operators with review pain'
]

const STEPS = [
  {
    title: 'Read the brief',
    body: 'Hermes extracts the offer, target market, buyer, geography, and constraints from plain English.',
    icon: FileText
  },
  {
    title: 'Find the market',
    body: 'Live web discovery builds a source-backed company list instead of pulling stale database rows.',
    icon: Search
  },
  {
    title: 'Resolve people',
    body: 'Each account is enriched with the most likely owner, operator, partner lead, or buying committee path.',
    icon: Users
  },
  {
    title: 'Draft for review',
    body: 'Hermes writes outreach from evidence and creates Gmail-ready drafts only after you approve the run.',
    icon: Mail
  }
]

const CAPABILITIES = [
  ['Signal discovery', 'Search by live buying signals, niche criteria, event pages, directories, jobs, and review pain.'],
  ['Offer-aware crawling', 'Read the user’s site first so ICP, referral hooks, and outreach angles match the real business.'],
  ['Structured enrichment', 'Route account and contact enrichment through deterministic tools with source evidence.'],
  ['Review-first outbound', 'Preview prospects, inspect cards, refine criteria, and create drafts without blind sending.'],
  ['Operator templates', 'Start from real GTM motions for local services, partnerships, events, recruiting, and commerce.'],
  ['MCP/API surface', 'Run Hermes as a product UI or programmatic GTM operator for repeatable workflows.']
]

const PRICING = [
  ['Trial', '$0', '30 days', 'Try real prospecting work. No card required.'],
  ['Operator', '$40/mo', 'Single seat', 'Monthly prospect credits, website reading, enrichment, and Gmail drafts.'],
  ['Premium', 'Roadmap', 'Invite list', 'LinkedIn sending, phone enrichment, network search, and team workflows.']
]

function HeroConsole() {
  return (
    <div className="border border-white/12 bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff7a90]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5df2a8]" />
        </div>
        <p className="text-[11px] text-white/45">hermes-run.log</p>
      </div>
      <div className="space-y-4 p-5 font-mono text-[12px] leading-relaxed text-white/70">
        <p>
          <span className="text-[#8ea2ff]">query:</span>{' '}
          <span className="text-white">
            Find founder-led college counselors in the Bay Area who serve STEM/Ivy applicants.
          </span>
        </p>
        <div className="grid gap-2 border border-white/10 bg-[#071329] p-4">
          <p className="text-[#5df2a8]">site crawl: lucid-education.com</p>
          <p>offer: AI and research coaching for high school students</p>
          <p>persona: founder / independent educational consultant</p>
          <p>next: search, enrich, draft partner referral email</p>
        </div>
        <p className="text-white/45">
          review mode on · zero emails sent without approval
        </p>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f8f8fb] text-[#071329]">
      <section className="relative overflow-hidden bg-[#061126] text-white">
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto grid max-w-[1160px] gap-12 px-5 pb-16 pt-16 md:px-8 md:pb-20 md:pt-24 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-9 bg-white/30" />
              <span className="text-[11px] font-semibold uppercase text-white/55">
                AI GTM engineer
              </span>
            </div>

            <h1 className="max-w-[650px] text-[48px] font-semibold leading-[1.02] text-white md:text-[72px]">
              Who do you want to reach?
            </h1>
            <p className="mt-6 max-w-[560px] text-[16px] leading-[1.7] text-white/68 md:text-[17px]">
              Hermes turns a natural-language GTM brief into a reviewable
              outbound workflow: crawl the offer, discover accounts, enrich
              decision-makers, and draft evidence-backed emails.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {QUICK_STARTS.map(label => (
                <span
                  key={label}
                  className="border border-white/14 bg-white/[0.06] px-3 py-1.5 text-[12px] text-white/62"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                className="min-h-11 rounded-[3px] bg-white px-6 text-[14px] font-semibold text-[#071329] hover:bg-[#edf1ff]"
              >
                <Link href="/auth/sign-up">
                  Start free
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-[3px] border-white/18 bg-transparent px-6 text-[14px] font-semibold text-white hover:bg-white/8 hover:text-white"
              >
                <Link href="#product">Try the prompt preview</Link>
              </Button>
            </div>
          </div>

          <HeroConsole />
        </div>
      </section>

      <section className="border-b border-[#dfe2eb] bg-white">
        <div className="mx-auto grid max-w-[1160px] gap-0 px-5 md:grid-cols-3 md:px-8">
          {[
            ['1 prompt', 'From messy GTM idea to structured campaign brief.'],
            ['Live web', 'Fresh market signals with source-backed evidence.'],
            ['Human review', 'Prospects and Gmail drafts stay approval-first.']
          ].map(([title, body]) => (
            <div
              key={title}
              className="border-b border-[#dfe2eb] py-7 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
            >
              <p className="text-[22px] font-semibold text-[#071329]">{title}</p>
              <p className="mt-2 max-w-[250px] text-[13px] leading-[1.55] text-[#5f687a]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <LandingChatPreview />

      <section id="process" className="mx-auto max-w-[1160px] px-5 py-12 md:px-8">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#6a7283]">
              Workflow
            </p>
            <h2 className="mt-2 text-[30px] font-semibold leading-tight text-[#071329]">
              Natural language in. Reviewable GTM work out.
            </h2>
          </div>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center text-[13px] font-semibold text-[#315dff]"
          >
            Start a run <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <article key={step.title} className="border border-[#d7dbe5] bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center border border-[#d7dbe5] bg-[#f1f4ff] text-[12px] font-semibold text-[#315dff]">
                    {index + 1}
                  </span>
                  <Icon className="h-5 w-5 text-[#6a7283]" />
                </div>
                <h3 className="text-[15px] font-semibold text-[#071329]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[12.5px] leading-[1.55] text-[#5f687a]">
                  {step.body}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <section id="services" className="border-y border-[#dfe2eb] bg-[#eef2ff]">
        <div className="mx-auto max-w-[1160px] px-5 py-12 md:px-8">
          <div className="mb-7 max-w-[650px]">
            <p className="text-[11px] font-semibold uppercase text-[#5d6b95]">
              Product surface
            </p>
            <h2 className="mt-2 text-[30px] font-semibold leading-tight text-[#071329]">
              Built for operators who need the first email sent, not another dashboard.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(([title, body]) => (
              <article key={title} className="min-h-[132px] border border-[#cbd4f6] bg-white p-5">
                <CheckCircle2 className="mb-4 h-5 w-5 text-[#315dff]" />
                <h3 className="text-[15px] font-semibold text-[#071329]">{title}</h3>
                <p className="mt-2 text-[12.5px] leading-[1.55] text-[#5f687a]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1160px] px-5 py-12 md:px-8">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#6a7283]">
              Pricing
            </p>
            <h2 className="mt-2 text-[30px] font-semibold text-[#071329]">
              Launch pricing for early operators.
            </h2>
          </div>
          <BadgeCheck className="hidden h-8 w-8 text-[#315dff] sm:block" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PRICING.map(([name, price, timing, body], index) => (
            <article
              key={name}
              className={`border bg-white p-6 ${
                index === 1 ? 'border-[#315dff] shadow-[0_0_0_1px_#315dff]' : 'border-[#d7dbe5]'
              }`}
            >
              <div className="mb-5 flex min-h-6 items-center justify-between">
                <p className="text-[15px] font-semibold text-[#071329]">{name}</p>
                {index === 1 && (
                  <span className="bg-[#edf1ff] px-2 py-1 text-[10px] font-semibold uppercase text-[#315dff]">
                    Core
                  </span>
                )}
              </div>
              <p className="text-[38px] font-semibold leading-none text-[#315dff]">
                {price}
              </p>
              <p className="mt-2 text-[12px] font-semibold text-[#071329]">
                {timing}
              </p>
              <p className="mt-5 text-[13px] leading-[1.55] text-[#5f687a]">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-[1160px] px-5 pb-10 md:px-8">
        <div className="border border-[#152645] bg-[#061126] px-6 py-10 text-white md:px-10">
          <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase text-white/50">
                Ready when the brief is ready
              </p>
              <h2 className="mt-2 max-w-[690px] text-[32px] font-semibold leading-tight">
                Tell Hermes the market. Get to one reviewed, evidence-backed email.
              </h2>
            </div>
            <Button
              asChild
              className="min-h-11 rounded-[3px] bg-white px-6 text-[14px] font-semibold text-[#071329] hover:bg-[#edf1ff]"
            >
              <Link href="/auth/sign-up">
                Start free
                <Send className="ml-3 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dfe2eb] bg-white">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-4 px-5 py-7 text-[12px] text-[#5f687a] sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div className="flex items-center gap-3 text-[#071329]">
            <Compass className="h-5 w-5" />
            <span className="font-semibold">Hermes GTM</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="#services">Product</Link>
            <Link href="#process">Workflow</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="/auth/login">Login</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
