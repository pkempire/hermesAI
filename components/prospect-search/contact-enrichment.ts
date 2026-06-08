'use client'

import type { Prospect, ProspectSearchContext } from './types'

type EnrichmentPayload = {
  enriched?: unknown
  prospects?: unknown
  stats?: {
    attempted?: number
    found?: number
    failed?: number
  }
}

function cleanText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function normalizeContactProspect(raw: any): Prospect {
  const fullName =
    cleanText(raw?.fullName) ||
    cleanText(raw?.contactName) ||
    cleanText(raw?.name) ||
    ''

  return {
    ...raw,
    fullName,
    jobTitle:
      cleanText(raw?.jobTitle) ||
      cleanText(raw?.contactTitle) ||
      cleanText(raw?.title),
    email:
      cleanText(raw?.email) ||
      cleanText(raw?.contactEmail) ||
      cleanText(raw?.workEmail),
    linkedinUrl:
      cleanText(raw?.linkedinUrl) ||
      cleanText(raw?.contactLinkedinUrl) ||
      cleanText(raw?.linkedin_url),
    phone:
      cleanText(raw?.phone) ||
      cleanText(raw?.contactPhone) ||
      cleanText(raw?.mobilePhone)
  }
}

export function contactResolved(prospect: Prospect) {
  return Boolean(
    prospect.email ||
      prospect.phone ||
      prospect.linkedinUrl?.includes('linkedin.com/in/') ||
      (prospect.fullName && prospect.fullName !== 'Unknown Contact')
  )
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
