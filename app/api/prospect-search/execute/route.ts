import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { createOrReuseWebset } from '@/lib/clients/exa-cache'
import { createEnrichmentDescriptionMap, createExaWebsetsClient } from '@/lib/clients/exa-websets'
import { enrichProspectWithOrangeslice } from '@/lib/clients/orangeslice'
import { getCachedProspects } from '@/lib/performance/redis-cache'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { requireQuota } from '@/lib/utils/quota'
import { NextRequest, NextResponse } from 'next/server'
import { ProspectSearchStartPayload } from '@/lib/types/prospecting'

export async function POST(req: NextRequest) {
  try {
    const {
      criteria,
      enrichments,
      entityType,
      targetCount,
      originalQuery,
      targetPersona,
      offer,
      preview = false,
      evidenceMode
    } = await req.json()
    const userId = await getCurrentUserId()
    if (!userId || userId === 'anonymous') {
      return NextResponse.json({ type: 'prospect_search_error', event: 'error', message: 'Unauthorized' }, { status: 401 })
    }
    if (!originalQuery || typeof originalQuery !== 'string') {
      return NextResponse.json({ type: 'prospect_search_error', event: 'error', message: 'Missing query' }, { status: 400 })
    }
    if (targetCount && (typeof targetCount !== 'number' || targetCount < 1)) {
      return NextResponse.json({ type: 'prospect_search_error', event: 'error', message: 'Invalid targetCount' }, { status: 400 })
    }
    
    logger.debug(`${preview ? 'Preview' : 'Full'} search requested:`, {
      criteriaCount: criteria?.length || 0,
      enrichmentsCount: enrichments?.length || 0,
      entityType,
      targetCount,
      preview
    })

    // Check cache first for significant performance boost
    if (!preview) {
      const cachedResults = await getCachedProspects(originalQuery, criteria || [], entityType || 'company')
      if (cachedResults && cachedResults.length >= (targetCount || 25)) {
        logger.debug(`Serving ${cachedResults.length} cached prospects`)
        return NextResponse.json({
          type: 'prospect_search_complete',
          event: 'complete',
          prospects: cachedResults.slice(0, targetCount || 25),
          message: `Found ${cachedResults.length} cached prospects matching your criteria.`,
          searchCriteria: {
            query: originalQuery,
            targetCount,
            entityType,
            criteriaCount: criteria?.length || 0,
            enrichmentsCount: enrichments?.length || 0
          }
        })
      }
    }

    // Quota: cost = number of targets requested (min 1)
    // Bypass quota in development or if SKIP_QUOTA_CHECK is set
    const cost = Math.max(1, preview ? 1 : (targetCount || 25))
    if (process.env.NODE_ENV !== 'development' && process.env.SKIP_QUOTA_CHECK !== 'true') {
      const quota = await requireQuota({ userId, cost, kind: 'prospect_search', idempotencyKey: `ps:${userId}:${originalQuery}:${cost}` })
      if (!quota.ok) {
        return NextResponse.json({ type: 'prospect_search_error', event: 'error', message: quota.reason }, { status: 402 })
      }
    } else {
      logger.debug('Bypassing quota check (development mode)')
    }

    const exa = createExaWebsetsClient()

    let websetId: string
    let isReused = false

    {
      logger.debug('Creating or reusing webset...')
      const result = await createOrReuseWebset({
        query: originalQuery,
        criteria: criteria || [],
        entityType: entityType || 'company',
        enrichments: enrichments || [],
        targetCount: preview ? 1 : targetCount
      }, exa)
      websetId = result.websetId
      isReused = result.isReused
    }

    logger.debug(`Webset ${isReused ? 'reused' : 'created'}:`, websetId)

    // Persist campaign ownership record — required for authenticated stream access
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = (originalQuery || 'Prospect Campaign').slice(0, 80)
        // check if a campaign already exists for this user + webset
        const { data: existing } = await supabase
          .from('campaigns')
          .select('id, settings')
          .eq('user_id', user.id)
          .contains('settings', { exa_webset_id: websetId } as any)
          .maybeSingle()

        if (!existing) {
          const { data: campaign } = await supabase
            .from('campaigns')
            .insert({
              user_id: user.id,
              name,
              status: 'active',
              prospect_query: { query: originalQuery, criteria, targetPersona, offer },
              entity_type: entityType || 'company',
              enrichments: enrichments || [],
              filters: {},
              target_count: targetCount,
              settings: {
                exa_webset_id: websetId,
                reused: isReused,
                evidence_mode: Boolean(evidenceMode),
                target_persona: targetPersona || null,
                offer: offer || null,
                original_query: originalQuery
              }
            })
            .select('id')
            .single()
          if (campaign) {
            logger.debug('Campaign persisted:', campaign.id)
          }
        }
      }
    } catch (persistError) {
      logger.error('Campaign persistence failed:', persistError)
      return NextResponse.json({ type: 'prospect_search_error', event: 'error', message: 'Unable to persist search ownership record.' }, { status: 500 })
    }

    if (preview) {
      // For preview, wait for completion and return results immediately
      logger.debug('Waiting for preview to complete...')

      try {
        const completedWebset = await exa.waitUntilIdle(websetId, {
          timeout: 60000, // 1 minute timeout for preview
          pollInterval: 2000
        })

        const itemsResponse = await exa.listItems(websetId, { limit: 1 })
        const enrichmentDescriptions = createEnrichmentDescriptionMap(completedWebset as any)
        const prospects = await Promise.all(
          itemsResponse.data.map(item =>
            enrichProspectWithOrangeslice(exa.convertToProspect(item, enrichmentDescriptions), {
              originalQuery,
              targetPersona,
              offer
            })
          )
        )

        return NextResponse.json({
          type: 'prospect_search_complete',
          event: 'complete',
          websetId: websetId,
          prospects,
          message: prospects.length > 0
            ? 'Preview complete! Here\'s 1 example prospect that matches your criteria.'
            : 'No prospects found matching your criteria. Consider adjusting your search parameters.',
          summary: {
            query: originalQuery,
            entityType,
            totalFound: prospects.length,
            preview: true,
            criteria: criteria?.length || 0,
            enrichments: enrichments?.length || 0
          }
        })
      } catch (error) {
        logger.error('Preview timeout or error:', error)
        return NextResponse.json({
          type: 'prospect_search_progress',
          event: 'progress',
          websetId: websetId,
          message: 'Preview is taking longer than expected. You can check the full search results or try again.',
          error: error instanceof Error ? error.message : 'Preview timeout'
        })
      }
    } else {
      // For full search, return streaming configuration
      const startPayload: ProspectSearchStartPayload = {
        type: 'prospect_search_start',
        event: 'start',
        websetId: websetId,
        searchCriteria: {
          query: originalQuery,
          targetCount,
          entityType,
          criteriaCount: criteria?.length || 0,
          enrichmentsCount: enrichments?.length || 0
        },
        status: 'created',
        message: `Started searching for ${targetCount} prospects. I'll stream progress updates.`,
        progress: {
          found: 0,
          analyzed: 0,
          completion: 0
        }
      }
      return NextResponse.json(startPayload)
    }

  } catch (err: any) {
    logger.error('Error:', err)
    return NextResponse.json({ 
      type: 'prospect_search_error',
      event: 'error',
      error: err.message,
      message: 'Failed to execute prospect search. Please try again.'
    }, { status: 500 })
  }
}
