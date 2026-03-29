"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { ProspectCard } from './prospect-card';
import { campaignStore } from '@/lib/store/campaign-store';
import { toast } from 'sonner';

export interface Prospect {
  id: string
  exaItemId?: string
  fullName: string
  jobTitle?: string
  company?: string
  email?: string
  linkedinUrl?: string
  phone?: string
  location?: string
  industry?: string
  companySize?: string
  website?: string
  enrichments?: Record<string, any>
  note?: string
  hermesTake?: {
    whyFit: string
    outreachAngle: string
    evidence: string[]
  }
  reviewReady?: boolean
  avatarUrl?: string
  companyLogoUrl?: string
}

export interface ProspectSearchContext {
  targetPersona?: string
  offer?: string
  originalQuery?: string
}

export function ProspectGrid({
  prospects,
  searchContext,
  onSelectionChange,
  onReviewComplete
}: {
  prospects: Prospect[]
  searchContext?: ProspectSearchContext
  onSelectionChange?: (ids: string[]) => void
  onReviewComplete?: () => void
}) {
  const [current, setCurrent] = useState(0)
  const [feedback, setFeedback] = useState<{ [id: string]: 'good' | 'bad' }>({})
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set())

  const reviewedCount = Object.keys(feedback).length
  const goodCount = Object.values(feedback).filter(f => f === 'good').length
  const progressPercentage = ((current + 1) / Math.max(1, prospects.length)) * 100

  if (!prospects || prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 py-12 shadow-sm">
        <Users className="mb-4 h-12 w-12 text-gray-400" />
        <p className="text-lg font-medium text-gray-900">No prospects yet</p>
        <p className="text-sm text-gray-500">Hermes will stream review-ready matches here.</p>
      </div>
    )
  }

  const prospect = prospects[current]

  const handleFeedback = (type: 'good' | 'bad') => {
    setFeedback({ ...feedback, [prospect.id]: type })
    try {
      const detail = { prospectId: prospect.id, type, prospect }
      window.dispatchEvent(new CustomEvent('prospect-feedback', { detail }))
    } catch {}

    // Auto-save to campaign store if good fit
    if (type === 'good') {
      const currentSaved = campaignStore.getState().savedProspects
      if (!currentSaved.find((p: Prospect) => p.id === prospect.id)) {
        campaignStore.setState({ savedProspects: [...currentSaved, prospect] })
        toast.success(`Saved ${prospect.company || prospect.fullName || 'prospect'} to Draft Studio`)
      }
    }

    if (current < prospects.length - 1) {
      setCurrent(current + 1)
    } else {
      onReviewComplete?.()
    }
  }

  const handleProspectSelect = (prospectId: string, selected: boolean) => {
    const next = new Set(selectedProspects)
    if (selected) next.add(prospectId)
    else next.delete(prospectId)
    setSelectedProspects(next)
    onSelectionChange?.(Array.from(next))
  }

  const navigateProspect = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && current > 0) setCurrent(current - 1)
    if (direction === 'next' && current < prospects.length - 1) setCurrent(current + 1)
  }

  const handleSelectAll = () => {
    if (selectedProspects.size === prospects.length) {
      setSelectedProspects(new Set())
      onSelectionChange?.([])
      return
    }
    const allIds = new Set(prospects.map(item => item.id))
    setSelectedProspects(allIds)
    onSelectionChange?.(Array.from(allIds))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-gray-100/50">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--hermes-gold-dark))]" />
                Review queue
              </div>
              <Badge className="rounded-full border border-gray-200 bg-gray-50 text-gray-600 shadow-none">
                {current + 1} of {prospects.length}
              </Badge>
              <Badge className="rounded-full border border-gray-200 bg-gray-50 text-gray-600 shadow-none">
                {selectedProspects.size} selected
              </Badge>
              {reviewedCount > 0 ? (
                <Badge className="rounded-full border-transparent bg-[hsl(var(--hermes-gold))]/10 text-[hsl(var(--hermes-gold-dark))] font-semibold shadow-none">
                  {goodCount} approved
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-4 font-serif text-[2.35rem] leading-none text-gray-900 tracking-tight">Review one company at a time</h3>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-gray-500 font-medium">
              Hermes only surfaces review-ready matches here. Approve the accounts worth drafting against and skip the noise.
            </p>
          </div>

          <Button
            onClick={handleSelectAll}
            variant="outline"
            className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            {selectedProspects.size === prospects.length ? 'Clear selection' : 'Select all'}
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2 bg-gray-100 [&>div]:bg-sky-500" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
          className="mx-auto max-w-[88rem]"
        >
          <ProspectCard
            prospect={prospect}
            searchContext={searchContext}
            onSelect={(selected) => handleProspectSelect(prospect.id, selected)}
            selected={selectedProspects.has(prospect.id)}
            onFeedback={handleFeedback}
          />
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm">
          {prospects.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setCurrent(index)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                index === current
                  ? 'bg-[hsl(var(--hermes-gold))] shadow-sm'
                  : feedback[item.id]
                    ? feedback[item.id] === 'good'
                      ? 'bg-emerald-500'
                      : 'bg-red-400'
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigateProspect('prev')}
            disabled={current === 0}
            variant="outline"
            className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm rounded-full px-5"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={() => navigateProspect('next')}
            disabled={current === prospects.length - 1}
            variant="outline"
            className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm rounded-full px-5"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
