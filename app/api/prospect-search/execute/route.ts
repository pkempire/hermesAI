import { createExaWebsetsClient, createProspectSearchCriteria } from '@/lib/clients/exa-websets'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { criteria, enrichments, entityType, targetCount, originalQuery, preview = false } = await req.json()
    
    console.log(`🔍 [POST /api/prospect-search/execute] ${preview ? 'Preview' : 'Full'} search requested:`, {
      criteriaCount: criteria?.length || 0,
      enrichmentsCount: enrichments?.length || 0,
      entityType,
      targetCount,
      preview
    })

    const exa = createExaWebsetsClient()
    
    // Convert our detailed criteria format to Exa format
    const searchCriteria = {
      query: originalQuery,
      targetCount: preview ? 1 : targetCount,
      entityType: entityType || 'person',
      includeEnrichments: enrichments?.map((e: any) => e.value) || [],
      // Pass through ALL extracted criteria for Exa
      allCriteria: criteria || [],
      filters: {
        // Group criteria by type for backward compatibility
        jobTitles: criteria?.filter((c: any) => c.type === 'job_title')?.map((c: any) => c.value) || [],
        industry: criteria?.filter((c: any) => c.type === 'industry')?.map((c: any) => c.value) || [],
        location: criteria?.filter((c: any) => c.type === 'location')?.map((c: any) => c.value) || [],
        technologies: criteria?.filter((c: any) => c.type === 'technology')?.map((c: any) => c.value) || [],
        activities: criteria?.filter((c: any) => c.type === 'activity')?.map((c: any) => c.value) || [],
        other: criteria?.filter((c: any) => c.type === 'other')?.map((c: any) => c.value) || []
      }
    }

    // Create Exa webset search config
    const websetSearchConfig = createProspectSearchCriteria(searchCriteria)
    
    // Create enrichments for Exa
    const enrichmentMapping: Record<string, string> = {
      'email': 'email address',
      'linkedin': 'LinkedIn profile URL',
      'phone': 'phone number',
      'location': 'location',
      'job_title': 'job title',
      'company_info': 'company name',
      'full_name': 'full name'
    }

    const websetEnrichmentsUncapped = enrichments?.map((e: any) => {
      // Handle both string and object formats
      const enrichmentKey = typeof e === 'string' ? e : e.value || e.label?.toLowerCase()
      const enrichmentLabel = enrichmentMapping[enrichmentKey] || enrichmentKey
      
      return {
        description: `Extract the person's ${enrichmentLabel}`,
        format: 'text' as const,
        instructions: `Look for and extract the ${enrichmentLabel} from the profile or page content.`
      }
    }).filter(Boolean) || []

    // De-duplicate by description and cap at 10 per Exa limits
    const seen = new Set<string>()
    const websetEnrichments: { description: string; format: 'text'; instructions: string }[] = []
    for (const e of websetEnrichmentsUncapped) {
      if (!seen.has(e.description)) {
        websetEnrichments.push(e)
        seen.add(e.description)
      }
      if (websetEnrichments.length >= 10) break
    }

    console.log('🔧 [POST /api/prospect-search/execute] Creating webset with config:', {
      search: websetSearchConfig,
      enrichments: websetEnrichments.length
    })

    // Create the webset
    const webset = await exa.createWebset({
      search: websetSearchConfig,
      enrichments: websetEnrichments
    })

    console.log('✅ [POST /api/prospect-search/execute] Webset created:', webset.id)

    // Persist minimal campaign record (best-effort)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = (originalQuery || 'Prospect Campaign').slice(0, 80)
        const { data: campaign } = await supabase
          .from('campaigns')
          .insert({
            user_id: user.id,
            name,
            status: 'active',
            prospect_query: { query: originalQuery, criteria },
            entity_type: entityType || 'person',
            enrichments: enrichments || [],
            filters: searchCriteria.filters || {},
            target_count: targetCount,
            settings: { exa_webset_id: webset.id }
          })
          .select('id')
          .single()
        if (campaign) {
          console.log('🗂️ [POST /api/prospect-search/execute] Campaign persisted:', campaign.id)
        }
      }
    } catch (persistError) {
      console.warn('⚠️ [POST /api/prospect-search/execute] Campaign persistence skipped:', persistError)
    }

    if (preview) {
      // For preview, wait for completion and return results immediately
      console.log('⏳ [POST /api/prospect-search/execute] Waiting for preview to complete...')
      
      try {
        const completedWebset = await exa.waitUntilIdle(webset.id, {
          timeout: 60000, // 1 minute timeout for preview
          pollInterval: 2000
        })

        const itemsResponse = await exa.listItems(webset.id, { limit: 1 })
        const prospects = itemsResponse.data.map(item => exa.convertToProspect(item))

        return NextResponse.json({
          type: 'preview_result',
          websetId: webset.id,
          prospects,
          message: prospects.length > 0 
            ? 'Preview complete! Here\'s 1 example prospect that matches your criteria.'
            : 'No prospects found matching your criteria. Consider adjusting your search parameters.',
          summary: {
            query: originalQuery,
            entityType,
            totalFound: prospects.length,
            criteria: criteria?.length || 0,
            enrichments: enrichments?.length || 0
          }
        })
      } catch (error) {
        console.error('❌ [POST /api/prospect-search/execute] Preview timeout or error:', error)
        return NextResponse.json({
          type: 'preview_timeout',
          websetId: webset.id,
          message: 'Preview is taking longer than expected. You can check the full search results or try again.',
          error: error instanceof Error ? error.message : 'Preview timeout'
        })
      }
    } else {
      // For full search, return streaming configuration
      return NextResponse.json({
        type: 'streaming_search',
        websetId: webset.id,
        searchCriteria: {
          query: originalQuery,
          targetCount,
          entityType,
          criteriaCount: criteria?.length || 0,
          enrichmentsCount: enrichments?.length || 0
        },
        status: 'created',
        message: `Started searching for ${targetCount} prospects. I'll show you results as they come in.`,
        progress: {
          found: 0,
          analyzed: 0,
          completion: 0
        }
      })
    }

  } catch (err: any) {
    console.error('❌ [POST /api/prospect-search/execute] Error:', err)
    return NextResponse.json({ 
      type: 'error',
      error: err.message,
      message: 'Failed to execute prospect search. Please try again.'
    }, { status: 500 })
  }
}