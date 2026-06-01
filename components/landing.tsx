import {
  ArrowRight,
  BarChart3,
  Code2,
  Compass,
  Crosshair,
  Lock,
  Orbit,
  Plane,
  Radio,
  RefreshCcw,
  Search,
  Send,
  Shield,
  Sparkles,
  UserRound,
  Workflow
} from 'lucide-react'
import Link from 'next/link'

import { LandingChatPreview } from '@/components/landing-chat-preview'
import { Button } from '@/components/ui/button'

const CAPABILITIES = [
  {
    title: 'Signal-based sourcing',
    body: 'Find in-market accounts using intent, behavior, and custom signals.',
    icon: Radio
  },
  {
    title: 'Account research',
    body: 'Deep, automated research that surfaces what matters — fast.',
    icon: Search
  },
  {
    title: 'Lead scoring',
    body: 'Score and prioritize leads based on fit, intent, and timing.',
    icon: Crosshair
  },
  {
    title: 'Outbound systems',
    body: 'Multi-channel sequences, personalization, and sending infrastructure.',
    icon: Plane
  },
  {
    title: 'CRM & workflow sync',
    body: 'Clean data, smart routing, and workflows that just work.',
    icon: RefreshCcw
  },
  {
    title: 'Human-in-the-loop review',
    body: 'Keep humans in control with review queues and feedback loops.',
    icon: UserRound
  }
]

const TRUST = [
  {
    title: 'Natural-language campaigns',
    body: 'Describe the motion once. Hermes turns it into structured GTM work.',
    icon: Compass
  },
  {
    title: 'Fresh signal, verified data',
    body: 'Combine live search, enrichment, and source-backed evidence.',
    icon: Code2
  },
  {
    title: 'Review before sending',
    body: 'You approve the prospects, copy, and channel before outreach moves.',
    icon: Lock
  }
]

const OUTCOMES = [
  ['1', 'brief becomes a campaign', 'Plain-English setup', 'Turn an ICP, offer, and target persona into a structured prospecting run.'],
  ['50', 'prospects ready to review', 'Evidence-backed lists', 'Preview, enrich, and inspect the sources before committing credits.'],
  ['0', 'emails sent without approval', 'Human control', 'Draft in Gmail and keep outreach review-first while you iterate.']
]

const MODELS = [
  ['Trial', 'Try Hermes on real prospecting work. No card required.', '$0', '30 days', 'Preview + Gmail drafts', Search],
  ['Operator', 'Run focused outbound experiments with monthly prospect credits.', '$40/mo', 'Single seat', 'Search + enrich + draft', Sparkles],
  ['Premium', 'Team workflows, deeper enrichment, and channel expansion as they ship.', 'Roadmap', 'Invite list', 'LinkedIn + phone', Workflow]
]

function EngineDiagram() {
  const left = [
    'Intent Signals',
    'Firmographics',
    'Technographics',
    'Web Behavior',
    'CRM Data',
    'Third-Party Data'
  ]
  const right = [
    ['ROUTE', 'to CRM / SDR'],
    ['OUTREACH', 'Multi-channel'],
    ['WORKFLOW', 'Automate'],
    ['INSIGHTS', 'Measure & Learn']
  ]

  return (
    <div className="relative hidden min-h-[350px] lg:block">
      <div className="absolute inset-0 opacity-[0.46] [background-image:radial-gradient(#9aa6d6_1px,transparent_1px)] [background-size:18px_18px]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 580 360"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flow" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#4d73ff" />
            <stop offset="1" stopColor="#a35bff" />
          </linearGradient>
        </defs>
        <ellipse cx="314" cy="178" rx="150" ry="112" stroke="#aeb9ea" strokeDasharray="4 5" />
        <ellipse cx="314" cy="178" rx="112" ry="84" stroke="#c8cef0" strokeDasharray="3 6" />
        {left.map((_, i) => {
          const y = 62 + i * 42
          return (
            <path
              key={i}
              d={`M118 ${y} C198 ${y}, 208 178, 270 178`}
              stroke="url(#flow)"
              strokeWidth="1.25"
              strokeDasharray="4 5"
            />
          )
        })}
        {right.map((_, i) => {
          const y = 76 + i * 58
          return (
            <path
              key={i}
              d={`M360 178 C430 178, 418 ${y}, 492 ${y}`}
              stroke="url(#flow)"
              strokeWidth="1.3"
            />
          )
        })}
        <path d="M314 72 V118" stroke="#0b1732" strokeDasharray="4 5" />
        <path d="M314 238 V286" stroke="#0b1732" strokeDasharray="4 5" />
        <circle cx="270" cy="178" r="3" fill="#6d58ff" />
        <circle cx="360" cy="178" r="3" fill="#4d73ff" />
      </svg>

      <div className="absolute left-[42px] top-[38px] space-y-[18px]">
        {left.map((label, index) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-24 text-right text-[11px] text-[#343d59]">{label}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#cdd2df] bg-white">
              <Orbit className="h-3.5 w-3.5 text-[#6f7aa0]" />
            </span>
          </div>
        ))}
      </div>

      <div className="absolute left-[262px] top-[117px] flex h-[116px] w-[116px] flex-col items-center justify-center border border-[#cdd2df] bg-white shadow-[0_16px_38px_rgba(8,24,58,0.04)]">
        <div className="mb-2 text-[#5a6eff]">
          <Send className="h-6 w-6" />
        </div>
        <div className="text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-[#0b1732]">
          Hermes
          <br />
          GTM Engine
        </div>
      </div>

      <div className="absolute left-[286px] top-[34px] flex h-11 w-[150px] items-center gap-2 border border-[#cdd2df] bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#0b1732]">
        <Search className="h-3.5 w-3.5 text-[#8890aa]" />
        Enrich & Research
      </div>
      <div className="absolute left-[286px] bottom-[28px] flex h-11 w-[150px] items-center gap-2 border border-[#cdd2df] bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#0b1732]">
        <BarChart3 className="h-3.5 w-3.5 text-[#8890aa]" />
        Score & Prioritize
      </div>

      <div className="absolute right-0 top-[63px] space-y-6">
        {right.map(([title, body]) => (
          <div key={title} className="flex h-12 w-[144px] items-center gap-3 border border-[#cdd2df] bg-white px-4">
            <UserRound className="h-4 w-4 text-[#858da7]" />
            <div>
              <div className="text-[10px] font-semibold uppercase text-[#0b1732]">{title}</div>
              <div className="text-[9px] text-[#697086]">{body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#faf9f8] text-[#0b1732]">
      <section className="border-b border-[#dfe2eb]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-10 px-5 py-16 md:px-8 lg:grid-cols-[0.98fr_1.02fr] lg:gap-12 lg:py-[78px]">
          <div>
            <h1
              aria-label="Own your growth engine."
              className="max-w-[650px] font-serif text-[56px] font-normal leading-[0.94] tracking-[-0.03em] text-[#0b1732] md:text-[82px]"
            >
              Own your
              <br />
              <span className="md:whitespace-nowrap">growth engine.</span>
            </h1>
            <p className="mt-7 max-w-[410px] text-[17px] leading-[1.58] text-[#313c5a]">
              Hermes is an AI GTM engineer for prospecting, research,
              enrichment, and outreach drafting. Tell it the market you want,
              then review the campaign before it runs.
            </p>

            <div className="mt-8 flex flex-wrap items-stretch gap-3 sm:gap-5">
              <Button asChild className="min-h-[48px] rounded-[3px] bg-[#071735] px-8 text-[14px] font-medium text-white shadow-[0_12px_26px_rgba(7,23,53,0.16)] hover:bg-[#102448] sm:px-9">
                <Link href="/auth/sign-up">Start Free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="min-h-[48px] rounded-[3px] border-[#6c83ff] bg-white px-6 text-[14px] font-medium text-[#315dff] hover:bg-[#f7f8ff] sm:px-8"
              >
                <Link href="#process" className="inline-flex items-center">
                  See How It Works
                  <ArrowRight className="ml-3 h-4 w-4 sm:ml-5" />
                </Link>
              </Button>
            </div>

            <div className="mt-9 flex items-start gap-4">
              <span className="mt-0.5 h-[28px] w-px bg-[#5c74ff]" />
              <p className="max-w-[340px] text-[10px] font-semibold uppercase leading-[1.75] tracking-[0.12em] text-[#66708b]">
                Custom infrastructure for
                <br />
                founders, lean sales teams, and technical B2B companies.
              </p>
            </div>
          </div>

          <EngineDiagram />
        </div>
      </section>

      <section className="border-b border-[#dfe2eb]">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 px-5 md:grid-cols-3 md:px-8">
          {TRUST.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="grid grid-cols-[38px_1fr] gap-5 border-b border-[#dfe2eb] py-9 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#bfc5d4] bg-white">
                  <Icon className="h-4 w-4 text-[#0b1732]" />
                </span>
                <div>
                  <h2 className="font-serif text-[19px] leading-tight text-[#0b1732]">{item.title}</h2>
                  <p className="mt-2 max-w-[230px] text-[12px] leading-[1.55] text-[#46506a]">{item.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <LandingChatPreview />

      <section id="services" className="mx-auto max-w-[1160px] px-5 py-10 md:px-8">
        <div className="mb-7 flex items-center justify-between">
          <h2 className="font-serif text-[30px] font-normal text-[#0b1732]">What Hermes runs</h2>
          <a href="#services" className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-[#365cff] md:inline-flex">
            Explore product <ArrowRight className="ml-3 h-3 w-3" />
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {CAPABILITIES.map(item => {
            const Icon = item.icon
            return (
              <article key={item.title} className="min-h-[124px] border border-[#d7dbe5] bg-white p-7">
                <Icon className="mb-5 h-7 w-7 text-[#4d6dff]" strokeWidth={1.5} />
                <h3 className="font-serif text-[20px] leading-tight text-[#0b1732]">{item.title}</h3>
                <p className="mt-3 max-w-[250px] text-[12px] leading-[1.55] text-[#313c5a]">{item.body}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section id="process" className="mx-auto max-w-[1160px] px-5 pb-12 pt-1 md:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-[30px] font-normal text-[#0b1732]">How it works</h2>
          <a href="#process" className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-[#365cff] md:inline-flex">
            Workflow <ArrowRight className="ml-3 h-3 w-3" />
          </a>
        </div>
        <div className="relative grid gap-8 border-t border-[#0b1732] pt-8 md:grid-cols-4 md:gap-10">
          <ArrowRight className="absolute right-0 top-[-8px] hidden h-4 w-4 text-[#0b1732] md:block" />
          {[
            ['1', 'Describe the motion', 'Give Hermes the ICP, offer, persona, and any constraints in plain English.'],
            ['2', 'Preview the run', 'Review criteria, enrichments, and one sample prospect before scaling up.'],
            ['3', 'Enrich and score', 'Pull live signals, company context, contacts, and source-backed evidence.'],
            ['4', 'Draft and review', 'Generate personalized outreach and create Gmail drafts only after approval.']
          ].map(([n, title, body]) => (
            <div key={n} className="relative text-center">
              <span className="mx-auto -mt-[50px] mb-7 flex h-8 w-8 items-center justify-center rounded-full border border-[#0b1732] bg-[#faf9f8] font-serif text-[17px]">
                {n}
              </span>
              <h3 className="font-serif text-[18px] text-[#0b1732]">{title}</h3>
              <p className="mx-auto mt-3 max-w-[180px] text-[12px] leading-[1.55] text-[#313c5a]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="work" className="mx-auto max-w-[1160px] border-t border-[#dfe2eb] px-5 py-8 md:px-8">
        <div className="mb-7 flex items-center justify-between">
          <h2 className="font-serif text-[30px] font-normal text-[#0b1732]">Selected outcomes</h2>
          <a href="#work" className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-[#365cff] md:inline-flex">
            View examples <ArrowRight className="ml-3 h-3 w-3" />
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {OUTCOMES.map(([value, label, company, body]) => (
            <article key={value} className="grid min-h-[124px] grid-cols-1 gap-5 border border-[#d7dbe5] bg-white p-6 sm:grid-cols-[0.78fr_1fr] sm:gap-0">
              <div className="border-b border-[#d7dbe5] pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5">
                <p className="font-serif text-[58px] leading-none tracking-[-0.03em] text-[#0b1732]">{value}</p>
                <p className="mt-3 text-[12px] leading-tight text-[#313c5a]">{label}</p>
              </div>
              <div className="sm:pl-6">
                <h3 className="text-[12px] font-semibold text-[#0b1732]">{company}</h3>
                <p className="mt-3 text-[12px] leading-[1.55] text-[#313c5a]">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1160px] px-5 pb-8 pt-2 md:px-8">
        <div className="mb-7 flex items-center justify-between">
          <h2 className="font-serif text-[30px] font-normal text-[#0b1732]">Software pricing</h2>
          <a href="/pricing" className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-[#365cff] md:inline-flex">
            Compare options <ArrowRight className="ml-3 h-3 w-3" />
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {MODELS.map(([name, body, price, timing, deliverable, Icon], index) => {
            const ModelIcon = Icon as typeof Search
            return (
              <article
                key={name as string}
                className={`relative min-h-[210px] border bg-white p-7 ${
                  index === 1 ? 'border-[#496dff] shadow-[0_0_0_1px_#496dff]' : 'border-[#d7dbe5]'
                }`}
              >
                <div className="mb-5 flex min-h-6 items-center justify-between gap-3">
                  {index === 1 ? (
                    <span className="rounded-sm bg-[#edf1ff] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#496dff]">
                      Most popular
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </div>
                <div className="flex items-center gap-5">
                  <ModelIcon className="h-6 w-6 text-[#66708b]" strokeWidth={1.5} />
                  <h3 className="font-serif text-[25px] text-[#0b1732]">{name as string}</h3>
                </div>
                <p className="mt-4 max-w-[255px] text-[12px] leading-[1.55] text-[#313c5a]">{body as string}</p>
                <p className="mt-5 font-serif text-[38px] leading-none text-[#315dff]">{price as string}</p>
                <p className="mt-6 text-[11px] text-[#313c5a]">
                  {timing as string}
                  <span className="mx-3">•</span>
                  Deliverable: {deliverable as string}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-[1160px] px-5 pb-8 pt-1 md:px-8">
        <div className="relative overflow-hidden bg-[#071735] px-6 py-11 text-center text-white md:px-10">
          <div className="pointer-events-none absolute -left-14 bottom-3 h-40 w-72 rounded-[100%] border border-[#5d66ff]/40" />
          <div className="pointer-events-none absolute -right-14 top-3 h-40 w-72 rounded-[100%] border border-[#5d66ff]/40" />
          <h2 className="relative font-serif text-[33px] font-normal leading-tight">Launch outbound from one serious prompt.</h2>
          <p className="relative mt-3 text-[14px] text-white/78">
            Use Hermes to find the right accounts, draft from real evidence, and keep humans in control.
          </p>
          <Button asChild className="relative mt-7 min-h-11 rounded-[3px] bg-white px-8 text-[13px] font-medium text-[#071735] hover:bg-[#f4f6ff]">
            <Link href="/auth/sign-up" className="inline-flex items-center">
              Start Free
              <ArrowRight className="ml-5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#dfe2eb]">
        <div className="mx-auto grid max-w-[1160px] gap-8 px-5 py-8 text-[11px] text-[#313c5a] md:grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr] md:px-8">
          <div className="flex items-center gap-3 text-[#0b1732]">
            <Shield className="h-7 w-7" />
            <span className="font-serif text-[22px]">Hermes <span className="text-[#8b8d96]">GTM</span></span>
          </div>
          <p className="max-w-[250px] leading-[1.65]">
            AI GTM engineering software for founders, lean sales teams, and technical B2B companies.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a href="#services">Product</a>
            <a href="#pricing">Pricing</a>
            <a href="#process">Workflow</a>
            <a href="#work">Examples</a>
          </div>
          <div className="leading-[1.65]">
            <p>hello@hermesgtm.com</p>
            <p>San Francisco, CA</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
