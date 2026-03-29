import { requireAuthUser } from '@/lib/auth/require-auth-user'
import { enrichPersonData } from '@/lib/clients/orangeslice'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/enrich/people
 * On-demand person enrichment for the two-step UX.
 *
 * Body: { prospects: Prospect[], context?: { targetPersona, offer, originalQuery } }
 * Returns: { enriched: Prospect[] }
 *
 * Each prospect is enriched in parallel (up to CONCURRENT_LIMIT at a time).
 * Failed enrichments return the original prospect with reviewReady: true.
 */

const CONCURRENT_LIMIT = 6

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser()
  if (!auth.ok) return auth.response

  let body: { prospects?: any[]; context?: any }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { prospects, context } = body
  if (!Array.isArray(prospects) || prospects.length === 0) {
    return NextResponse.json({ error: 'prospects array required' }, { status: 400 })
  }

  // Limit payload size
  const batch = prospects.slice(0, 50)

  // Process in chunks to avoid overwhelming Orangeslice API
  const results: any[] = []

  for (let i = 0; i < batch.length; i += CONCURRENT_LIMIT) {
    const chunk = batch.slice(i, i + CONCURRENT_LIMIT)
    const settled = await Promise.allSettled(
      chunk.map(prospect =>
        enrichPersonData(prospect, context).catch(err => {
          logger.warn(`enrichPersonData failed for ${prospect.company}:`, err)
          return { ...prospect, reviewReady: true }
        })
      )
    )
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        // Should not happen due to inner catch, but safety net
        results.push(null)
      }
    }
  }

  return NextResponse.json({ enriched: results.filter(Boolean) })
}
