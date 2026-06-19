'use client'

import { ProspectGrid } from '@/components/prospect-grid'
import { ProspectPreviewCard } from '@/components/prospect-preview-card'
import { logger } from '@/lib/utils/logger'
import { memo } from 'react'
import { toast } from 'sonner'
import {
  enrichSelectedContacts,
  markContactsFailed,
  markContactsSearching,
  mergeContactEnrichmentResults
} from './contact-enrichment'
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
    onProspectsUpdate(prev => markContactsSearching(prev, ids))
    const t = toast.loading(`Finding contacts for ${toEnrich.length} ${toEnrich.length === 1 ? 'company' : 'companies'}…`)
    try {
      const result = await enrichSelectedContacts({
        prospects,
        ids,
        searchContext
      })
      onProspectsUpdate(prev => mergeContactEnrichmentResults(prev, ids, result.enriched))
      const message =
        result.found > 0
          ? `Resolved ${result.found} of ${result.attempted} contacts`
          : `No verified contacts found for ${result.attempted} selected ${result.attempted === 1 ? 'company' : 'companies'}`
      toast[result.found > 0 ? 'success' : 'warning'](
        result.failed > 0 ? `${message}; ${result.failed} failed` : message,
        { id: t }
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      onProspectsUpdate(prev => markContactsFailed(prev, ids, msg))
      logger.warn('Results find-contacts failed:', err)
      toast.error(msg, { id: t })
    }
  }

  const stripeUrl =
    process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL ||
    'https://buy.stripe.com/cNi00i7UMc0xgLCfk56sw03'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#dfe4ee] bg-[#fbfcff] px-4 py-2.5">
        <p className="text-[13px] font-bold text-[#071329]">{prospects.length} prospects found</p>
        <p className="text-[12px] font-semibold text-[#6a7283]">
          Contacts resolve automatically; select rows for retries or saving.
        </p>
      </div>

      <ProspectGrid
        prospects={prospects}
        searchContext={searchContext}
        onFindContacts={handleFindContacts}
        autoFindContacts
      />

      <div className="flex justify-end">
        <a
          href={stripeUrl}
          className="rounded-md border border-[#dfe4ee] bg-white px-4 py-2 text-[12px] font-semibold text-[#6a7283] shadow-sm transition-colors hover:border-[#bfc9ff] hover:bg-[#fbfcff] hover:text-[#071329]"
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
      <div className="rounded-lg border border-red-100 bg-red-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-[14px] font-bold text-[#071329]">Search failed</p>
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
