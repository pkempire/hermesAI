'use client'

import { ProspectGrid } from '@/components/prospect-grid'
import { ProspectPreviewCard } from '@/components/prospect-preview-card'
import { logger } from '@/lib/utils/logger'
import { AlertCircle } from 'lucide-react'
import { memo } from 'react'
import { toast } from 'sonner'
import type { Prospect, ProspectSearchContext } from './types'

interface ProspectSearchResultsProps {
  prospects: Prospect[]
  searchSummary?: any
  searchContext?: ProspectSearchContext
  onProspectsUpdate: (updater: (prev: Prospect[]) => Prospect[]) => void
  onRefine: (message: string) => void
  errorMessage?: string
  isError?: boolean
  onRetry?: () => void
}

function PreviewBlock({
  prospect,
  searchSummary,
  onRefine
}: {
  prospect: Prospect
  searchSummary: any
  onRefine: (message: string) => void
}) {
  return (
    <ProspectPreviewCard
      prospect={prospect}
      searchSummary={searchSummary}
      onApprove={() =>
        onRefine('Great! Ready to run the full search with these criteria.')
      }
      onReject={feedback =>
        onRefine(
          `I understand this isn't what you're looking for. Let's refine the search criteria based on your feedback: "${feedback}"`
        )
      }
      onRefineSearch={feedback =>
        onRefine(
          `Let's refine the search based on your feedback: "${feedback}". I'll suggest some adjustments.`
        )
      }
    />
  )
}

function ResultsGrid({
  prospects,
  searchContext,
  onProspectsUpdate
}: {
  prospects: Prospect[]
  searchContext?: ProspectSearchContext
  onProspectsUpdate: (updater: (prev: Prospect[]) => Prospect[]) => void
}) {
  const handleFindContacts = async (ids: string[]) => {
    const toEnrich = prospects.filter(p => ids.includes(p.id))
    if (toEnrich.length === 0) {
      toast.warning('Select at least one company first')
      return
    }
    const t = toast.loading(`Finding contacts for ${toEnrich.length} ${toEnrich.length === 1 ? 'company' : 'companies'}…`)
    try {
      const storedContext = sessionStorage.getItem('hermes-search-context')
      const ctx = storedContext ? JSON.parse(storedContext) : searchContext
      const res = await fetch('/api/enrich/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects: toEnrich, context: ctx })
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        let detail = `${res.status}`
        try {
          const j = JSON.parse(text)
          if (j?.error) detail = j.error
        } catch {
          if (text) detail = text.slice(0, 120)
        }
        throw new Error(`Enrichment failed (${detail})`)
      }
      const { enriched } = await res.json()
      const enrichedCount = Array.isArray(enriched) ? enriched.filter((p: any) => p.contactName || p.contactEmail).length : 0
      onProspectsUpdate(prev => {
        const byId = new Map(prev.map(p => [p.id, p]))
        for (const p of enriched) byId.set(p.id, p)
        return Array.from(byId.values())
      })
      toast.success(`Found ${enrichedCount} of ${toEnrich.length} contacts`, { id: t })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      logger.warn('Results find-contacts failed:', err)
      toast.error(msg, { id: t })
    }
  }

  const stripeUrl =
    process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL ||
    'https://buy.stripe.com/cNi00i7UMc0xgLCfk56sw03'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-100 shadow-sm">
          <img
            src="/images/hermes-pixel.png"
            alt="Complete"
            className="h-4 w-4 object-contain"
          />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-gray-900">
            {prospects.length} prospects found
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Select companies and click <span className="font-semibold">Find Contacts</span>{' '}
            to resolve decision-makers and email addresses.
          </p>
        </div>
      </div>

      <ProspectGrid
        prospects={prospects}
        searchContext={searchContext}
        onFindContacts={handleFindContacts}
      />

      <div className="flex justify-end">
        <a
          href={stripeUrl}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-sm transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          Unlock Hermes Premium
        </a>
      </div>
    </div>
  )
}

function ProspectSearchResultsImpl({
  prospects,
  searchSummary,
  searchContext,
  onProspectsUpdate,
  onRefine,
  errorMessage,
  isError,
  onRetry
}: ProspectSearchResultsProps) {
  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg border border-red-100 shadow-sm">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900">Search failed</p>
              <p className="mt-0.5 text-[13px] font-medium text-red-700">
                {errorMessage || 'An error occurred during the search'}
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[13px] font-semibold text-red-600 underline hover:text-red-800"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (prospects.length === 1 && searchSummary?.preview === true) {
    return (
      <PreviewBlock
        prospect={prospects[0]}
        searchSummary={searchSummary}
        onRefine={onRefine}
      />
    )
  }

  if (prospects.length === 0) return null

  return (
    <ResultsGrid
      prospects={prospects}
      searchContext={searchContext}
      onProspectsUpdate={onProspectsUpdate}
    />
  )
}

export const ProspectSearchResults = memo(ProspectSearchResultsImpl)
