'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Mail, Radar, SearchCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const samplePrompts = [
  'Find founder-led fintech infra companies in New York and draft concise first-touch emails.',
  'Build a list of private college counselors in California who could refer students to Lucid Academy.',
  'Identify VP Marketing prospects at B2B SaaS companies launching a new product this quarter.'
]

const pillars = [
  {
    icon: Radar,
    title: 'Brief the target',
    body: 'Give Hermes the market, contact, offer, and constraints in plain English.'
  },
  {
    icon: SearchCheck,
    title: 'Hermes runs the search',
    body: 'Hermes decides what to source, what to enrich, and what evidence matters.'
  },
  {
    icon: Mail,
    title: 'Launch from Gmail',
    body: 'Review the shortlist, approve the draft, and send from the inbox you already trust.'
  }
]

export function LandingPage() {
  const router = useRouter()
  const [brief, setBrief] = useState('')

  const startCampaign = (prompt?: string) => {
    const value = (prompt ?? brief).trim()
    if (value) {
      try {
        localStorage.setItem('hermes_draft', value)
      } catch {}
    }
    router.push('/auth/sign-up')
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[linear-gradient(180deg,#fffdf8_0%,#fbf5ea_100%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-16 pt-10 md:px-10 md:pb-24 md:pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-amber-700">
              AI messenger for outbound
            </div>
            <h1 className="mt-6 font-serif text-5xl leading-[1.04] text-gray-950 sm:text-6xl md:text-7xl">
              Brief Hermes. Launch the campaign.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-black/66 md:text-lg">
              Tell Hermes who you want to reach and what you are selling. It should find the right companies, surface the right contact, and turn the best matches into usable outreach.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-black/46">
              <span className="rounded-full border border-black/8 bg-white/70 px-3 py-2">Websets-backed discovery</span>
              <span className="rounded-full border border-black/8 bg-white/70 px-3 py-2">Evidence-first research</span>
              <span className="rounded-full border border-black/8 bg-white/70 px-3 py-2">Gmail-native launch path</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(251,246,237,0.92))] p-5 shadow-[0_30px_90px_rgba(62,45,18,0.1)] md:p-6">
            <div className="mb-3 text-[11px] uppercase tracking-[0.28em] text-black/40">Start with the brief</div>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Find Bay Area private college counselors who could refer students to Lucid Academy."
              className="min-h-[180px] w-full resize-none rounded-[1.5rem] border border-black/8 bg-[#0f0f10] px-5 py-5 text-base leading-7 text-white placeholder:text-white/35 focus:border-amber-400/45 focus:outline-none"
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-black/56">
                Hermes will ask you to sign in before it runs the workflow.
              </p>
              <Button
                onClick={() => startCampaign()}
                className="h-11 rounded-full bg-black px-5 text-white hover:bg-black/90"
              >
                Continue with Google
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {samplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => startCampaign(prompt)}
              className="rounded-[1.5rem] border border-black/6 bg-white/74 p-5 text-left text-sm leading-7 text-black/68 shadow-[0_18px_48px_rgba(62,45,18,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/60 hover:shadow-[0_28px_64px_rgba(62,45,18,0.08)]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="rounded-[1.7rem] border border-black/6 bg-white/72 p-6 shadow-[0_22px_60px_rgba(62,45,18,0.05)]"
              >
                <div className="inline-flex rounded-2xl bg-amber-50 p-2.5 text-amber-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-serif text-3xl leading-tight text-gray-950">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-7 text-black/64">{pillar.body}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-[2rem] border border-black/6 bg-[#111111] px-6 py-7 text-white md:flex-row md:items-center md:px-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">What Hermes is for</div>
            <div className="mt-2 max-w-3xl font-serif text-3xl leading-tight md:text-4xl">
              One clean surface for prospecting, enrichment, drafting, and launch.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-white/70 hover:text-white">
              Sign in
            </Link>
            <Button asChild className="rounded-full bg-[hsl(var(--hermes-gold))] px-5 text-black hover:bg-[hsl(var(--hermes-gold-dark))] hover:text-white">
              <Link href="/auth/sign-up">Create workspace</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
