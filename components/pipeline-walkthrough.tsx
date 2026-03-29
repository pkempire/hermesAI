'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Mail, Webhook, Zap, UserRound, ArrowRight, PlayCircle, Loader2 } from 'lucide-react'

const steps = [
  {
    id: 'exa',
    name: 'Exa Neural Search',
    role: 'Discovery',
    description: 'Hermes leverages Exa.ai to map the web. Instead of rigid keyword searches, it queries the internet by meaning, surfacing high-signal companies that perfectly match your motion—even if they dont use standard SEO keywords.',
    color: 'from-purple-500/20 to-purple-500/5',
    iconColor: 'text-purple-600',
    logo: <span className="text-xl font-bold tracking-tighter text-purple-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">exa</span>,
    stats: ['100+ accounts identified', 'Deep web semantics', 'Real-time indexing']
  },
  {
    id: 'orangeslice',
    name: 'Orangeslice Enrichment',
    role: 'Resolution',
    description: 'Once companies are found, Hermes hands them to Orangeslice. It instantly resolves the exact decision-maker based on your criteria, verifies their live email address, and pulls their latest signals to give the AI context.',
    color: 'from-orange-500/20 to-orange-500/5',
    iconColor: 'text-orange-600',
    logo: <span className="text-xl font-bold tracking-tight text-orange-600 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">🍊 Orangeslice</span>,
    stats: ['100% verified domains', 'Decision-maker matching', 'Live signal extraction']
  },
  {
    id: 'gpt5',
    name: 'GPT-5 Drafting',
    role: 'Synthesis & Send',
    description: 'Hermes routes the verified contacts, their signals, and your offer into its proprietary prompt architecture. GPT-5 generates brutally concise, hyper-personalized drafts. You review them in the Studio, and fire instantly.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-600',
    logo: <span className="text-xl font-bold tracking-tighter text-emerald-700 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">GPT-5</span>,
    stats: ['Multi-variable context', 'Executive tone matching', 'Zero hallucinations']
  }
]

export function PipelineWalkthrough() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-16 lg:space-y-32 py-10">
        
        {steps.map((step, idx) => {
          const isReversed = idx % 2 !== 0; // Alternate sides
          return (
            <div key={step.id} className={`flex flex-col lg:flex-row items-center gap-10 lg:gap-20 ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
              
              {/* Text content */}
              <div className="w-full lg:w-1/2 space-y-6 relative z-10">
                <div className={`absolute -inset-x-12 -inset-y-12 blur-[100px] rounded-full bg-gradient-to-br ${step.color} -z-10`} />
                <div className="inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                  <span className="text-[hsl(var(--hermes-gold-dark))]">Phase {idx + 1}</span> 
                  <span className="text-gray-300">|</span> 
                  {step.role}
                </div>
                
                <h3 className="font-serif text-[2.5rem] lg:text-[3.25rem] leading-[1.05] text-gray-900 tracking-tight">
                  {step.name}
                </h3>
                
                <p className="text-[17px] leading-[1.7] font-medium text-gray-600">
                  {step.description}
                </p>

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {step.stats.map((stat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`mt-1 bg-white p-1 rounded border border-gray-100 shadow-sm ${step.iconColor}`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[14px] font-semibold text-gray-900 leading-snug">{stat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Placeholder image block */}
              <div className="w-full lg:w-1/2">
                <div className="w-full aspect-video rounded-[2rem] border border-gray-200 bg-white/50 shadow-xl overflow-hidden relative group">
                  {/* Decorative terminal/browser header */}
                  <div className="absolute top-0 inset-x-0 h-12 border-b border-gray-100 flex items-center px-6 gap-2 bg-gradient-to-b from-gray-50/80 to-transparent">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                    </div>
                    <div className="mx-auto rounded-md bg-white border border-gray-100 shadow-sm px-4 py-1 text-[10px] font-semibold text-gray-400">
                      hermes-ai-engine.log
                    </div>
                  </div>
                  
                  {/* Placeholder for real images */}
                  <div className="absolute inset-x-8 top-20 bottom-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30 flex items-center justify-center text-center p-6 group-hover:border-[hsl(var(--hermes-gold))]/30 transition-colors">
                    <div>
                      <div className="text-[hsl(var(--hermes-gold))] bg-[hsl(var(--hermes-gold))]/10 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4">
                        <Webhook className="w-5 h-5" />
                      </div>
                      <div className="text-[14px] font-bold text-gray-400 mb-1">Image Placeholder</div>
                      <div className="text-[12px] text-gray-400 font-medium">Add a screenshot of {step.name} in action here.</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )
        })}

      </div>
    </div>
  )
}
