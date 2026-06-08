import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Database,
  FileText,
  GitBranch,
  Mail,
  Search,
  Send,
  ShieldCheck,
  Users,
  Workflow
} from 'lucide-react'
import Link from 'next/link'

import { LandingChatPreview } from '@/components/landing-chat-preview'
import { Button } from '@/components/ui/button'

const INPUTS = ['Offer', 'ICP', 'Signals', 'CRM data']
const OUTPUTS = ['Accounts', 'Decision-makers', 'Drafts', 'Gmail review']

const QUICK_STARTS = [
  'Bay Area STEM counselors',
  'Conference sponsor lists',
  'Review-pain local services'
]

const STEPS = [
  {
    title: 'Brief',
    body: 'Describe the market, offer, buyer, geography, and constraints in plain English.',
    icon: FileText
  },
  {
    title: 'Discover',
    body: 'Hermes maps live web sources, event pages, directories, reviews, and company signals.',
    icon: Search
  },
  {
    title: 'Resolve',
    body: 'The run enriches likely owners, operators, partners, and buying committee paths.',
    icon: Users
  },
  {
    title: 'Draft',
    body: 'Emails are grounded in evidence and held for human review before launch.',
    icon: Mail
  }
]

const CAPABILITIES = [
  ['Signal discovery', 'Find companies from live buying signals, niche criteria, events, jobs, directories, and review pain.', Search],
  ['Offer-aware crawling', 'Read the user’s site first so ICP, referral hooks, and outreach angles match the real business.', FileText],
  ['Structured enrichment', 'Route account and contact enrichment through deterministic tools with source evidence.', Database],
  ['Workflow orchestration', 'Chain search, scrape, enrichment, draft creation, and review into one repeatable run.', Workflow],
  ['Human review', 'Preview prospects, inspect cards, refine criteria, and create Gmail drafts without blind sending.', ShieldCheck],
  ['Programmatic surface', 'Use Hermes through the product UI now, and expose repeatable operator actions through API/MCP.', GitBranch]
]

const PRICING = [
  ['Trial', '$0', '30 days', 'Try real prospecting work. No card required.'],
  ['Operator', '$40/mo', 'Single seat', 'Monthly prospect credits, website reading, enrichment, and Gmail drafts.'],
  ['Premium', 'Roadmap', 'Invite list', 'LinkedIn sending, phone enrichment, network search, and team workflows.']
]

function SystemDiagram() {
  return (
    <div className="relative border border-[#d7dbe5] bg-white p-5 shadow-[0_24px_70px_rgba(7,19,41,0.06)]">
      <div className="absolute inset-0 opacity-[0.55] [background-image:linear-gradient(#e8ebf2_1px,transparent_1px),linear-gradient(90deg,#e8ebf2_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative grid grid-cols-[1fr_154px_1fr] items-center gap-4">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase text-[#315dff]">Inputs</p>
          {INPUTS.map(item => (
            <div key={item} className="border border-[#dfe4ee] bg-white/90 px-3 py-2 text-[12px] font-medium text-[#46506a]">
              {item}
            </div>
          ))}
        </div>

        <div className="relative flex min-h-[270px] items-center justify-center">
          <div className="absolute inset-y-8 left-1/2 border-l border-dashed border-[#bfc9ff]" />
          <div className="absolute left-[-28px] right-[-28px] top-1/2 border-t border-dashed border-[#bfc9ff]" />
          <div className="relative z-10 border border-[#cbd4ff] bg-[#f8faff] px-5 py-6 text-center shadow-[0_14px_34px_rgba(49,93,255,0.12)]">
            <Compass className="mx-auto h-8 w-8 text-[#315dff]" strokeWidth={1.7} />
            <p className="mt-4 text-[10px] font-semibold uppercase text-[#6a7283]">
              Hermes
            </p>
            <p className="mt-1 text-[14px] font-semibold leading-tight text-[#071329]">
              GTM operator
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase text-[#315dff]">Outputs</p>
          {OUTPUTS.map(item => (
            <div key={item} className="border border-[#dfe4ee] bg-white/90 px-3 py-2 text-[12px] font-medium text-[#46506a]">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#071329]">
      <section className="border-b border-[#dfe2eb] bg-[#fbfaf8]">
        <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
          <div>
            <div className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase text-[#6a7283]">
              <span className="h-px w-9 bg-[#d7dbe5]" />
              AI GTM engineer
            </div>

            <h1 className="max-w-[640px] font-serif text-[54px] font-normal leading-[0.98] text-[#071329] md:text-[82px]">
              Your AI GTM engineer.
            </h1>
            <p className="mt-6 max-w-[560px] text-[16px] leading-[1.7] text-[#46506a] md:text-[17px]">
              Describe who you want to reach. Hermes reads the offer, maps the
              market, resolves decision-makers, and drafts evidence-backed
              outreach for review.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {QUICK_STARTS.map(label => (
                <span
                  key={label}
                  className="border border-[#dfe4ee] bg-white px-3 py-1.5 text-[12px] text-[#5f687a]"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                asChild
                className="min-h-11 rounded-md bg-[#071735] px-6 text-[14px] font-semibold text-white hover:bg-[#102448]"
              >
                <Link href="/auth/sign-up">
                  Start free
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-md border-[#cfd6e4] bg-white px-6 text-[14px] font-semibold text-[#071329] hover:border-[#315dff]"
              >
                <Link href="#product">Try the prompt preview</Link>
              </Button>
            </div>
          </div>

          <SystemDiagram />
        </div>
      </section>

      <section className="border-b border-[#dfe2eb] bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-0 px-5 md:grid-cols-3 md:px-8">
          {[
            ['One prompt', 'From messy GTM idea to structured campaign brief.'],
            ['Live web', 'Fresh market signals with source-backed evidence.'],
            ['Review-first', 'Prospects and Gmail drafts stay approval-first.']
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

      <section id="process" className="border-b border-[#dfe2eb] bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-14 md:px-8">
          <div className="mb-8 grid gap-4 md:grid-cols-[0.72fr_1fr] md:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase text-[#315dff]">
                Workflow
              </p>
              <h2 className="mt-2 font-serif text-[42px] font-normal leading-tight text-[#071329]">
                Natural language in. Reviewable work out.
              </h2>
            </div>
            <p className="max-w-[520px] text-[14px] leading-[1.7] text-[#5f687a] md:justify-self-end">
              Hermes should feel like an operator, not another table. Each step
              is visible enough to trust and structured enough to automate.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <article key={step.title} className="border border-[#d7dbe5] bg-white p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center border border-[#d7dbe5] bg-[#f5f7ff] text-[12px] font-semibold text-[#315dff]">
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
        </div>
      </section>

      <section id="services" className="border-b border-[#dfe2eb] bg-[#f4f6ff]">
        <div className="mx-auto max-w-[1180px] px-5 py-14 md:px-8">
          <div className="mb-8 max-w-[680px]">
            <p className="text-[11px] font-semibold uppercase text-[#315dff]">
              Product surface
            </p>
            <h2 className="mt-2 font-serif text-[42px] font-normal leading-tight text-[#071329]">
              Built for operators who need the first email sent.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(([title, body, icon]) => {
              const Icon = icon as typeof Search
              return (
                <article key={title as string} className="min-h-[146px] border border-[#cbd4f6] bg-white p-5">
                  <Icon className="mb-4 h-5 w-5 text-[#315dff]" />
                  <h3 className="text-[15px] font-semibold text-[#071329]">{title as string}</h3>
                  <p className="mt-2 text-[12.5px] leading-[1.55] text-[#5f687a]">
                    {body as string}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1180px] px-5 py-14 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#315dff]">
              Pricing
            </p>
            <h2 className="mt-2 font-serif text-[42px] font-normal text-[#071329]">
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

      <section id="contact" className="mx-auto max-w-[1180px] px-5 pb-10 md:px-8">
        <div className="border border-[#152645] bg-[#061126] px-6 py-10 text-white md:px-10">
          <div className="grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase text-white/55">
                Ready when the brief is ready
              </p>
              <h2 className="mt-2 max-w-[720px] font-serif text-[38px] font-normal leading-tight">
                Tell Hermes the market. Get to one reviewed, evidence-backed email.
              </h2>
            </div>
            <Button
              asChild
              className="min-h-11 rounded-md bg-white px-6 text-[14px] font-semibold text-[#071329] hover:bg-[#edf1ff]"
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
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-5 py-7 text-[12px] text-[#5f687a] sm:flex-row sm:items-center sm:justify-between md:px-8">
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
