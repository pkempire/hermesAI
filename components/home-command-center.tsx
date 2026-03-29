'use client'

import { PipelineWalkthrough } from './pipeline-walkthrough'
import { ArrowRight, Sparkles, Target, Zap } from 'lucide-react'

export function HomeCommandCenter({
  onPromptSelect
}: {
  onPromptSelect?: (prompt: string) => void
}) {
  return (
    <section className="mx-auto mt-6 w-full max-w-[90rem] space-y-16 pb-20 px-4 md:px-8">
      {/* Interactive Pipeline Explainer */}
      <div className="pt-8">
        <div className="text-center mb-10">
          <h2 className="font-serif text-[2.5rem] tracking-tight text-gray-900">The Anatomy of Hermes</h2>
          <p className="text-gray-500 font-medium text-[15px] mt-2">A completely autonomous architecture engineered for extreme accuracy.</p>
        </div>
        <PipelineWalkthrough />
        
        <div className="mt-14 flex justify-center w-full">
          <button 
            onClick={() => onPromptSelect?.("Find me B2B SaaS companies that recently raised a Seed round and draft an email to their engineering leaders Pitching our new developer tool.")}
            className="rounded-full bg-[hsl(var(--hermes-gold))] px-8 py-4 text-[15px] font-semibold text-white shadow-xl hover:bg-[hsl(var(--hermes-gold-dark))] transition-all flex items-center gap-2"
          >
            See how it works
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playbooks Section */}
      <div className="max-w-6xl mx-auto pt-10">
        <h2 className="font-serif text-[2rem] text-center text-gray-900 mb-10 tracking-tight">Explore the Playbooks</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Directory Outreach',
              desc: 'Get listed in parent-facing directories, camps guides, and local program roundups automatically.',
              prompt: 'Find parent directories and education aggregators in Texas. Draft an email to content managers asking them to list my business.'
            },
            {
              title: 'Founder Partnerships',
              desc: 'Find founder-led firms, associations, and operators who can refer students or introduce your program.',
              prompt: 'Identify founder-run EdTech or coaching businesses. Draft a partner exploration note to the CEO.'
            },
            {
              title: 'Enterprise B2B',
              desc: 'Build account lists, resolve the exact operator, and prep the first rigorous business proposal note.',
              prompt: 'Find Series A logistics companies in the US. Get me the VP of Operations and draft an enterprise pitch.'
            }
          ].map((playbook) => (
            <button
              key={playbook.title}
              onClick={() => onPromptSelect?.(playbook.prompt)}
              className="flex flex-col text-left rounded-3xl border border-gray-200 bg-white p-8 hover:border-[hsl(var(--hermes-gold))]/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--hermes-gold))]/10 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-[hsl(var(--hermes-gold))]/20 transition-all opacity-0 group-hover:opacity-100" />
              <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 group-hover:scale-[1.15] group-hover:bg-[hsl(var(--hermes-gold))]/5 transition-transform duration-300 shadow-sm relative z-10">
                <Sparkles className="w-6 h-6 text-gray-400 group-hover:text-[hsl(var(--hermes-gold-dark))]" />
              </div>
              <h3 className="text-[20px] font-bold text-gray-900 mb-3 relative z-10">{playbook.title}</h3>
              <p className="text-[15px] font-medium leading-[1.6] text-gray-500 mb-8 flex-1 relative z-10">
                {playbook.desc}
              </p>
              <div className="text-[12px] font-extrabold uppercase tracking-widest text-gray-400 group-hover:text-[hsl(var(--hermes-gold))] flex items-center gap-2 transition-colors relative z-10">
                Try this prompt <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
