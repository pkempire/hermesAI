import { requireAuthUser } from '@/lib/auth/require-auth-user'
import { enrichPersonData } from '@/lib/clients/orangeslice'
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
        enrichPersonData(prospect, context).catch(err => {
          failed++
          logger.warn(
            `enrichPersonData failed for ${prospect.company || prospect.id}:`,
            err instanceof Error ? err.message : err
          )
          return { ...prospect, reviewReady: true, enrichmentError: err instanceof Error ? err.message : 'Failed' }
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
  const found = enriched.filter((p: any) =>
    p.email ||
    p.contactEmail ||
    p.phone ||
    p.contactPhone ||
    p.linkedinUrl?.includes?.('linkedin.com/in/') ||
    p.contactLinkedinUrl?.includes?.('linkedin.com/in/') ||
    (p.fullName && p.fullName !== 'Unknown Contact') ||
    p.contactName
  ).length

  logger.debug(
    `/api/enrich/people: attempted=${batch.length} found=${found} failed=${failed}`
  )

  return NextResponse.json({
    enriched,
    stats: { attempted: batch.length, found, failed }
  })
}
