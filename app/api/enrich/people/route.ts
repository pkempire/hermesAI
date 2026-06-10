import { requireAuthUser } from '@/lib/auth/require-auth-user'
import { enrichPersonData } from '@/lib/clients/orangeslice'
import { getProspectContactFields, normalizeProspectContact } from '@/lib/prospects/contact-fields'
import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/enrich/people
 * On-demand person enrichment for the two-step UX.
 *
 * Body: { prospects: Prospect[], context?: { targetPersona, offer, originalQuery } }
 * Returns: { enriched: Prospect[], stats: { attempted, found, failed } }
 *
 * Each prospect is enriched in parallel (up to CONCURRENT_LIMIT at a time).
 * Failed enrichments return the original prospect with reviewReady: true so
 * the UI can still render them with a "no contact found" badge.
 */

const CONCURRENT_LIMIT = 6

function markLookupComplete(prospect: any, failedMessage?: string) {
  const normalized = normalizeProspectContact(prospect, failedMessage ? 'failed' : undefined)
  const fields = getProspectContactFields(normalized)
  const status = failedMessage ? 'failed' : fields.hasAnyContact ? 'found' : 'no_contact'

  return {
    ...normalized,
    contactLookupStatus: status,
    contactLookupCompletedAt: new Date().toISOString(),
    contactLookupMessage:
      failedMessage ||
      normalized.contactLookupMessage ||
      (status === 'found'
        ? fields.email
          ? 'Email resolved'
          : 'Decision-maker resolved without a verified email'
        : 'No verified email or person match returned')
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser()
  if (!auth.ok) return auth.response

  if (!process.env.ORANGESLICE_API_KEY) {
    logger.error('/api/enrich/people: ORANGESLICE_API_KEY is not set')
    return NextResponse.json(
      { error: 'Contact enrichment is not configured. Set ORANGESLICE_API_KEY in env.' },
      { status: 503 }
    )
  }

  let body: { prospects?: any[]; context?: any }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { prospects, context } = body
  if (!Array.isArray(prospects) || prospects.length === 0) {
    return NextResponse.json(
      { error: 'prospects array required' },
      { status: 400 }
    )
  }

  // Limit payload size
  const batch = prospects.slice(0, 50)

  const results: any[] = []
  let failed = 0

  for (let i = 0; i < batch.length; i += CONCURRENT_LIMIT) {
    const chunk = batch.slice(i, i + CONCURRENT_LIMIT)
    const settled = await Promise.allSettled(
      chunk.map(prospect =>
        enrichPersonData(prospect, context).then(markLookupComplete).catch(err => {
          failed++
          logger.warn(
            `enrichPersonData failed for ${prospect.company || prospect.id}:`,
            err instanceof Error ? err.message : err
          )
          const message = err instanceof Error ? err.message : 'Failed'
          return markLookupComplete(
            { ...prospect, reviewReady: true, enrichmentError: message },
            message
          )
        })
      )
    )
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        // Should not happen due to inner catch, but safety net
        failed++
      }
    }
  }

  const enriched = results.filter(Boolean)
  const found = enriched.filter((p: any) => getProspectContactFields(p).hasAnyContact).length

  logger.debug(
    `/api/enrich/people: attempted=${batch.length} found=${found} failed=${failed}`
  )

  return NextResponse.json({
    enriched,
    stats: { attempted: batch.length, found, failed }
  })
}
