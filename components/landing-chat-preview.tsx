'use client'

import { ArrowRight, CheckCircle2, Lock, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

const DEFAULT_PROMPT =
  'Find 30 companies sponsoring supply chain conferences this quarter, identify the marketing lead, then draft one evidence-backed field marketing email.'

const PREVIEW_STEPS = [
  'Parse ICP, offer, and target persona',
  'Create a preview list with source evidence',
  'Enrich decision-makers and contact paths',
  'Draft Gmail-ready outreach for review'
]

export function LandingChatPreview() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)

  function start() {
    const cleanPrompt = prompt.trim() || DEFAULT_PROMPT
    try {
      localStorage.setItem('hermes_draft', cleanPrompt)
    } catch {}
    window.location.href = '/auth/sign-up'
  }

  return (
    <section id="product" className="border-b border-[#dfe2eb]">
      <div className="mx-auto grid max-w-[1160px] gap-8 px-5 py-10 md:px-8 lg:grid-cols-[0.84fr_1.16fr]">
        <div className="self-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#66708b]">
            Product preview
          </p>
          <h2 className="mt-3 font-serif text-[34px] font-normal leading-tight text-[#0b1732]">
            Tell Hermes the motion.
            <br />
            Review the engine before it runs.
          </h2>
          <p className="mt-4 max-w-[390px] text-[14px] leading-[1.65] text-[#313c5a]">
            Start from a plain-English brief. Hermes turns it into a structured
            prospecting run, shows the first results, and keeps every email in
            review before anything is sent.
          </p>
        </div>

        <div className="border border-[#d7dbe5] bg-white shadow-[0_18px_44px_rgba(8,24,58,0.04)]">
          <div className="flex items-center justify-between border-b border-[#d7dbe5] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8cef0] bg-[#f8f9ff]">
                <Sparkles className="h-4 w-4 text-[#496dff]" />
              </span>
              <div>
                <p className="text-[12px] font-semibold text-[#0b1732]">Hermes prompt</p>
                <p className="text-[10px] text-[#66708b]">Sign in required to run</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7dbe5] px-3 py-1 text-[10px] font-semibold text-[#46506a]">
              <Lock className="h-3 w-3" />
              Review-first
            </span>
          </div>

          <div className="grid gap-0 md:grid-cols-[1fr_230px]">
            <div className="p-5">
              <textarea
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
                className="min-h-[128px] w-full resize-none border border-[#d7dbe5] bg-[#faf9f8] px-4 py-3 text-[14px] leading-[1.55] text-[#0b1732] outline-none transition-colors placeholder:text-[#8c94aa] focus:border-[#496dff]"
                placeholder={DEFAULT_PROMPT}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-[330px] text-[11px] leading-[1.5] text-[#66708b]">
                  Your prompt is saved through sign-up, then opened in the
                  workspace as a draft.
                </p>
                <Button
                  type="button"
                  onClick={start}
                  className="min-h-10 rounded-[3px] bg-[#071735] px-5 text-[13px] font-medium text-white hover:bg-[#102448]"
                >
                  Sign in to run
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="border-t border-[#d7dbe5] bg-[#faf9f8] p-5 md:border-l md:border-t-0">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#66708b]">
                Hermes will
              </p>
              <div className="space-y-3">
                {PREVIEW_STEPS.map(step => (
                  <div key={step} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#496dff]" strokeWidth={1.8} />
                    <p className="text-[12px] leading-[1.45] text-[#313c5a]">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
