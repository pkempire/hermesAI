'use client'

/**
 * TemplateGallery — dark cinematic carousel of campaign templates.
 *
 * Two horizontal marquee rows (opposite directions) over a #08080a slab with
 * blurred white blobs and edge fades. Each card is a real Hermes prompt the
 * user can click to load into the chat input. Center cards are brighter,
 * outer cards fade via gradient overlays.
 *
 * Renders below the chat input on the home screen for both signed-in and
 * signed-out states. Click → onSelect(prompt) for signed-in, no-op for
 * signed-out (the page-level CTA handles auth).
 */

import { ArrowUpRight } from 'lucide-react'
import { useMemo } from 'react'

interface Template {
  category: string
  categoryColor: string
  title: string
  description: string
  prompt: string
  highlighted?: boolean
}

const TEMPLATES: Template[] = [
  {
    category: 'College counseling',
    categoryColor: 'text-violet-300',
    title: 'Bay Area STEM/Ivy counselors',
    description:
      'Find founder-led private counseling firms specialising in STEM admissions and pitch a referral partnership.',
    prompt:
      'Find 25 founder-led private college counseling firms in the Bay Area that specialize in STEM/Ivy admissions. Skip Crimson, IvyWise, C2, Princeton Review and other large franchises. I want to refer their students to Lucid Academy (lucid-education.com).'
  },
  {
    category: 'Listings outreach',
    categoryColor: 'text-sky-300',
    title: 'Get listed in 15 STEM directories',
    description:
      'Find regional directories that list student summer programs, then pitch the editor a paste-ready listing blurb.',
    prompt:
      'Find 15 Massachusetts / Greater Boston directories that list student STEM summer programs for parents. Find the editor or partnerships contact and draft a short pitch with a paste-ready listing blurb for Lucid Academy.'
  },
  {
    category: 'DTC sales',
    categoryColor: 'text-emerald-300',
    title: 'DTC beauty brands $500k–$5M ARR',
    description:
      'Map e-commerce DTC beauty brands at the right revenue band and pitch the founder or marketing lead on Meta ads.',
    prompt:
      'Find 25 e-commerce DTC brands in beauty doing $500k–$5M ARR — pitch them my Meta ads agency. I want to reach the founder or marketing lead.'
  },
  {
    category: 'Recruiting',
    categoryColor: 'text-amber-300',
    title: 'Series A founders hiring AI engineers',
    description:
      'Find Series A startups posting senior AI engineer roles and pitch the founder a curated shortlist.',
    prompt:
      'Find 30 Series A startups in the US that posted a senior AI/ML engineer job in the last 60 days. I want to reach the founder/CTO and pitch a curated shortlist of candidates from my network.',
    highlighted: true
  },
  {
    category: 'B2B SaaS',
    categoryColor: 'text-blue-300',
    title: 'Enterprise SaaS using competitor X',
    description:
      'Find companies running a specific competitor and reach the buyer with a switch-pitch grounded in real evidence.',
    prompt:
      'Find 40 mid-market US companies (200–2000 employees) currently using Outreach.io. Reach the VP Sales or Director of Sales Ops with a pitch for switching to my product.'
  },
  {
    category: 'Local services',
    categoryColor: 'text-rose-300',
    title: 'Med spas missing Google Ads',
    description:
      'Identify local med spas with weak paid presence and pitch a 30-day Google Ads pilot to the owner.',
    prompt:
      'Find 25 med spas in Austin TX that rank organically but are NOT running Google Ads. Reach the owner with a pitch for a 30-day paid search pilot.'
  },
  {
    category: 'Partnerships',
    categoryColor: 'text-cyan-300',
    title: 'Podcast guesting matchmaker',
    description:
      'Find podcasts whose audience matches your ICP and pitch the host a guest spot framed around their last 5 episodes.',
    prompt:
      'Find 20 active business podcasts (>10k listeners/episode) where the host interviews B2B SaaS founders. Pitch each host a guest spot for me, framed around their last 5 episodes.'
  },
  {
    category: 'Investor outreach',
    categoryColor: 'text-purple-300',
    title: 'Pre-seed AI investors who replied recently',
    description:
      'Find pre-seed AI investors actively replying on Twitter and warm-intro your deck through their public signals.',
    prompt:
      'Find 30 pre-seed AI/dev-tools investors who have publicly replied or quote-tweeted founders in the last 30 days. Draft a personalised cold email that references one of their recent posts.'
  }
]

interface Props {
  onSelect?: (prompt: string) => void
}

export function TemplateGallery({ onSelect }: Props) {
  // Duplicate so the marquee loops seamlessly.
  const looped = useMemo(() => [...TEMPLATES, ...TEMPLATES], [])
  // Offset row 2 so the columns don't visually align with row 1.
  const loopedRotated = useMemo(() => {
    const offset = Math.ceil(TEMPLATES.length / 2)
    const rotated = [...TEMPLATES.slice(offset), ...TEMPLATES.slice(0, offset)]
    return [...rotated, ...rotated]
  }, [])

  const handle = (t: Template) => {
    if (onSelect) onSelect(t.prompt)
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#08080a] py-20 md:py-24">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[10%] h-72 w-[28rem] rounded-full bg-white/[0.07] blur-3xl" />
        <div className="absolute right-[-5%] top-[5%] h-64 w-72 rounded-full bg-white/[0.05] blur-3xl" />
        <div className="absolute left-[40%] bottom-[10%] h-64 w-80 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#08080a] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08080a] to-transparent" />
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="flex w-max gap-4 animate-tg-marquee-left will-change-transform">
          {looped.map((t, i) => (
            <Card key={`r1-${i}`} t={t} onClick={() => handle(t)} />
          ))}
        </div>
        <div className="mt-4 flex w-max gap-4 animate-tg-marquee-right will-change-transform">
          {loopedRotated.map((t, i) => (
            <Card key={`r2-${i}`} t={t} onClick={() => handle(t)} />
          ))}
        </div>

        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-32 md:w-48 bg-gradient-to-r from-[#08080a] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-32 md:w-48 bg-gradient-to-l from-[#08080a] to-transparent" />
      </div>

      {/* Heading below */}
      <div className="relative mx-auto mt-20 max-w-3xl px-6 text-center">
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-white">
          What can Hermes run for you?
        </h2>
        <p className="mt-3 text-[14px] text-white/55">
          Tap any card to load it into the brief box. Edit, refine, send.
        </p>
      </div>
    </section>
  )
}

function Card({ t, onClick }: { t: Template; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group relative flex w-[360px] md:w-[400px] shrink-0 flex-col justify-between rounded-xl px-5 py-4 text-left transition',
        'border backdrop-blur-md',
        t.highlighted
          ? 'border-white/55 bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_60px_-30px_rgba(255,255,255,0.25)]'
          : 'border-white/10 bg-[rgba(10,10,12,0.75)] hover:border-white/40 hover:bg-white/[0.04]'
      ].join(' ')}
      style={{ height: 132 }}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-medium uppercase tracking-[0.12em] ${t.categoryColor}`}>
          {t.category}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-white/55 group-hover:text-white/85">
          Run <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
        </span>
      </div>
      <h3 className="mt-2 line-clamp-1 text-[15px] font-medium text-white">
        {t.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-white/55">
        {t.description}
      </p>
    </button>
  )
}
