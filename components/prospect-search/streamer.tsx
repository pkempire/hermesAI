'use client'

import { ProspectGrid } from '@/components/prospect-grid'
import { logger } from '@/lib/utils/logger'
import { Search } from 'lucide-react'
import { memo, useMemo } from 'react'
import { toast } from 'sonner'
import type { Prospect, ProspectSearchContext } from './types'

export interface ProspectSearchStreamerProps {
  searchStatus: 'idle' | 'running' | 'completed' | 'failed'
  message: string
  prospects: Prospect[]
  targetCount: number
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
  searchContext,
  onProspectsUpdate,
  liveStatusLabel
}: ProspectSearchStreamerProps) {
  const percent = useMemo(() => {
    return Math.min((prospects.length / Math.max(1, targetCount)) * 100, 100)
  }, [prospects.length, targetCount])

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
      logger.warn('Streamer find-contacts failed:', err)
      toast.error(msg, { id: t })
    }
  }

  return (
    <div className="space-y-6 mt-2">
      <div className="px-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
              <Search className="h-5 w-5 animate-pulse text-[hsl(var(--ink))]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900 leading-none">
                {liveStatusLabel}
              </p>
              <p className="text-[13px] text-gray-500 mt-1.5 font-medium">{message}</p>
            </div>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--hermes-gold-dark))] bg-[hsl(var(--hermes-gold))]/5 px-2.5 py-1 rounded-md shadow-sm border border-[hsl(var(--hermes-gold))]/10">
            {prospects.length} extracted
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-gray-100/80 overflow-hidden shadow-inner mt-5 mix-blend-multiply">
          <div
            className="h-full rounded-full transition-all duration-[800ms] ease-out bg-[hsl(var(--hermes-gold))] bg-gradient-to-r from-[hsl(var(--hermes-gold))]/80 to-[hsl(var(--hermes-gold-dark))]"
            style={{ width: `${percent}%` }}
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
