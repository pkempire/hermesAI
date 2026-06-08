'use client'

import { ProspectGrid } from '@/components/prospect-grid'
import { ProspectPreviewCard } from '@/components/prospect-preview-card'
import { logger } from '@/lib/utils/logger'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { memo } from 'react'
import { toast } from 'sonner'
import { enrichSelectedContacts } from './contact-enrichment'
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
      const result = await enrichSelectedContacts({
        prospects,
        ids,
        searchContext
      })
      onProspectsUpdate(prev => {
        const byId = new Map(prev.map(p => [p.id, p]))
        for (const p of result.enriched) byId.set(p.id, p)
        return Array.from(byId.values())
      })
      toast.success(`Found ${result.found} of ${result.attempted} contacts`, { id: t })
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
      <div className="flex items-center gap-3 rounded-lg border border-[#dfe4ee] bg-[#fbfcff] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100 bg-white shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#071329]">
            {prospects.length} prospects found
          </p>
          <p className="mt-0.5 text-[12px] text-[#6a7283]">
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
      <div className="rounded-lg border border-red-100 bg-red-50 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-md border border-red-100 bg-white p-2 shadow-sm">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#071329]">Search failed</p>
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
