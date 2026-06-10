'use client'

import { ProspectGrid } from '@/components/prospect-grid'
import { logger } from '@/lib/utils/logger'
import { BadgeCheck, Database, Search } from 'lucide-react'
import { memo, useMemo } from 'react'
import { toast } from 'sonner'
import {
  enrichSelectedContacts,
  markContactsFailed,
  markContactsSearching,
  mergeContactEnrichmentResults
} from './contact-enrichment'
import type { Prospect, ProspectSearchContext } from './types'

export interface ProspectSearchStreamerProps {
  searchStatus: 'idle' | 'running' | 'completed' | 'failed'
  message: string
  prospects: Prospect[]
  targetCount: number
  analyzed?: number
  completion?: number
  companyEnriched?: number
  companyEnrichmentPending?: number
  searchContext?: ProspectSearchContext
  onProspectsUpdate: (updater: (prev: Prospect[]) => Prospect[]) => void
  liveStatusLabel: string
}

/** Live progress strip + animated counter + streaming prospect grid. */
function ProspectSearchStreamerImpl({
  searchStatus,
  message,
  prospects,
  targetCount,
  analyzed = 0,
  completion = 0,
  companyEnriched,
  companyEnrichmentPending,
  searchContext,
  onProspectsUpdate,
  liveStatusLabel
}: ProspectSearchStreamerProps) {
  const percent = useMemo(() => {
    return Math.min((prospects.length / Math.max(1, targetCount)) * 100, 100)
  }, [prospects.length, targetCount])

  const displayPercent = Math.max(percent, completion)

  const enrichedCount = useMemo(() => {
    if (typeof companyEnriched === 'number') return companyEnriched
    return prospects.filter((prospect: any) => {
      const status = prospect.companyEnrichmentStatus
      return status === 'completed' || (!status && prospect.reviewReady)
    }).length
  }, [companyEnriched, prospects])

  const pendingEnrichment = useMemo(() => {
    if (typeof companyEnrichmentPending === 'number') return companyEnrichmentPending
    return Math.max(0, prospects.length - enrichedCount)
  }, [companyEnrichmentPending, enrichedCount, prospects.length])

  const stages = useMemo(
    () => [
      {
        label: 'Discover',
        value: prospects.length > 0
          ? `${prospects.length} found`
          : analyzed > 0
            ? `${analyzed} analyzed`
            : 'searching',
        icon: Search,
        active: searchStatus === 'running'
      },
      {
        label: 'Enrich',
        value: prospects.length > 0
          ? `${enrichedCount}/${prospects.length} company`
          : 'waiting',
        icon: Database,
        active: prospects.length > 0 && pendingEnrichment > 0
      },
      {
        label: 'Review',
        value: searchStatus === 'completed'
          ? 'ready'
          : `${Math.round(displayPercent)}%`,
        icon: BadgeCheck,
        active: searchStatus === 'completed'
      }
    ],
    [analyzed, displayPercent, enrichedCount, pendingEnrichment, prospects.length, searchStatus]
  )

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
      logger.warn('Streamer find-contacts failed:', err)
      toast.error(msg, { id: t })
    }
  }

  return (
    <div className="mt-1 space-y-6">
      <div className="rounded-lg border border-[#dfe4ee] bg-[#fbfcff] p-4">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#cbd4ff] bg-[#edf1ff]">
              <Search className="h-5 w-5 animate-pulse text-[#315dff]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[15px] font-semibold leading-none text-[#071329]">
                {liveStatusLabel}
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-[#6a7283]">{message}</p>
            </div>
          </div>
          <div className="w-fit rounded-md border border-[#cbd4ff] bg-[#edf1ff] px-2.5 py-1 text-[11px] font-bold uppercase text-[#315dff]">
            {prospects.length} extracted
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {stages.map(({ label, value, icon: Icon, active }) => (
            <div
              key={label}
              className={`rounded-md border px-3 py-2 ${
                active
                  ? 'border-[#cbd4ff] bg-white text-[#071329]'
                  : 'border-[#edf0f6] bg-white/60 text-[#6a7283]'
              }`}
            >
              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
                <Icon className={active ? 'h-3.5 w-3.5 text-[#315dff]' : 'h-3.5 w-3.5 text-[#9aa2b4]'} />
                {label}
              </div>
              <div className="text-[12px] font-semibold">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-md bg-[#e8ebf2]">
          <div
            className="h-full rounded-md bg-[#315dff] transition-all duration-700 ease-out"
            style={{ width: `${displayPercent}%` }}
          />
        </div>
      </div>

      {prospects.length > 0 && (
        <ProspectGrid
          prospects={prospects}
          searchContext={searchContext}
          onFindContacts={handleFindContacts}
        />
      )}
    </div>
  )
}

export const ProspectSearchStreamer = memo(ProspectSearchStreamerImpl)
