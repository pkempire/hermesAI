'use client'

import type { Prospect, ProspectSearchContext } from './types'
import {
  getProspectContactFields,
  normalizeProspectContact
} from '@/lib/prospects/contact-fields'

type EnrichmentPayload = {
  enriched?: unknown
  prospects?: unknown
  stats?: {
    attempted?: number
    found?: number
    failed?: number
  }
}

export function normalizeContactProspect(raw: any): Prospect {
  return normalizeProspectContact(raw, raw?.contactLookupStatus) as Prospect
}

export function contactResolved(prospect: Prospect) {
  return getProspectContactFields(prospect).hasAnyContact
}

export function markContactsSearching(prospects: Prospect[], ids: string[]) {
  const selectedIds = new Set(ids)
  return prospects.map(prospect =>
    selectedIds.has(prospect.id)
      ? {
          ...prospect,
          contactLookupStatus: 'searching' as const,
          contactLookupMessage: 'Resolving decision-maker and verified email'
        }
      : prospect
  )
}

export function markContactsFailed(prospects: Prospect[], ids: string[], message: string) {
  const selectedIds = new Set(ids)
  return prospects.map(prospect =>
    selectedIds.has(prospect.id)
      ? {
          ...prospect,
          contactLookupStatus: 'failed' as const,
          contactLookupMessage: message,
          enrichmentError: message
        }
      : prospect
  )
}

export function mergeContactEnrichmentResults(
  prospects: Prospect[],
  ids: string[],
  enriched: Prospect[]
) {
  const selectedIds = new Set(ids)
  const byId = new Map(enriched.map(prospect => [prospect.id, prospect]))

  return prospects.map(prospect => {
    if (!selectedIds.has(prospect.id)) return prospect
    return (
      byId.get(prospect.id) || {
        ...prospect,
        contactLookupStatus: 'failed' as const,
        contactLookupMessage: 'No enrichment result returned for this prospect',
        enrichmentError: 'No enrichment result returned'
      }
    )
  })
}

export async function enrichSelectedContacts(params: {
  prospects: Prospect[]
  ids: string[]
  searchContext?: ProspectSearchContext
}) {
  const toEnrich = params.prospects.filter(prospect => params.ids.includes(prospect.id))
  if (toEnrich.length === 0) {
    return {
      attempted: 0,
      found: 0,
      failed: 0,
      enriched: [] as Prospect[]
    }
  }

  const storedContext =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem('hermes-search-context')
      : null
  const context = storedContext
    ? JSON.parse(storedContext)
    : params.searchContext

  const res = await fetch('/api/enrich/people', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prospects: toEnrich, context })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let detail = `${res.status}`
    try {
      const parsed = JSON.parse(text)
      if (parsed?.error) detail = parsed.error
    } catch {
      if (text) detail = text.slice(0, 160)
    }
    throw new Error(`Enrichment failed (${detail})`)
  }

  const payload = (await res.json()) as EnrichmentPayload
  const rows = Array.isArray(payload.enriched)
    ? payload.enriched
    : Array.isArray(payload.prospects)
      ? payload.prospects
      : []
  const enriched = rows.map(normalizeContactProspect)

  return {
    attempted: payload.stats?.attempted ?? toEnrich.length,
    found: payload.stats?.found ?? enriched.filter(contactResolved).length,
    failed: payload.stats?.failed ?? 0,
    enriched
  }
}
