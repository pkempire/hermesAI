'use server'

import { CampaignSettings, EmailSequence, ProspectCriteria } from '@/components/campaign-builder'
import { Prospect } from '@/components/prospect-grid'
import {
  createProspectEnrichments,
  createProspectSearchCriteria,
  getExaWebsetsClient
} from '@/lib/clients/exa-websets'
import { optimizeProspectSearchQuery } from '@/lib/clients/openai-query-optimizer'
import { createClient } from '@/lib/supabase/server'

export interface ProspectSearchResult {
  success: boolean
  websetId?: string
  prospects: Prospect[]
  totalFound: number
  status: 'running' | 'completed' | 'failed'
  error?: string
}

/**
 * Start a prospect search using Exa Websets API
 */
export async function startProspectSearch(
  criteria: ProspectCriteria,
  emailSequence: EmailSequence[],
  settings: CampaignSettings
): Promise<ProspectSearchResult> {
  console.log('🚀 [startProspectSearch] Starting prospect search...')
  console.log('📋 [startProspectSearch] Criteria:', JSON.stringify(criteria, null, 2))
  
  try {
    // Check if API keys are configured
    if (!process.env.EXA_API_KEY) {
      console.error('❌ [startProspectSearch] EXA_API_KEY not configured')
      throw new Error('EXA_API_KEY not configured. Please add your Exa API key to environment variables.')
    }

    console.log('✅ [startProspectSearch] EXA_API_KEY found')

    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ [startProspectSearch] OPENAI_API_KEY not configured. Query optimization will be skipped.')
    } else {
      console.log('✅ [startProspectSearch] OPENAI_API_KEY found')
    }

    // Optimize the search query using OpenAI
    let optimizedQuery = criteria.query
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('🔧 [startProspectSearch] Optimizing query with OpenAI...')
        optimizedQuery = await optimizeProspectSearchQuery(criteria)
        console.log('📝 [startProspectSearch] Original query:', criteria.query)
        console.log('📝 [startProspectSearch] Optimized query:', optimizedQuery)
      } catch (error) {
        console.warn('⚠️ [startProspectSearch] Query optimization failed, using original query:', error)
      }
    }

    // Create optimized criteria with the enhanced query
    const optimizedCriteria = {
      ...criteria,
      query: optimizedQuery
    }

    console.log('🔧 [startProspectSearch] Creating Exa Websets configuration...')

    // Convert to Exa Websets format
    const searchConfig = createProspectSearchCriteria(optimizedCriteria)
    const enrichments = createProspectEnrichments()

    console.log('📋 [startProspectSearch] Search config:', JSON.stringify(searchConfig, null, 2))
    console.log('📋 [startProspectSearch] Enrichments:', JSON.stringify(enrichments, null, 2))

    // Create Webset with search and enrichments
    console.log('🔗 [startProspectSearch] Creating Exa Websets client...')
    const exaClient = getExaWebsetsClient()
    
    console.log('📡 [startProspectSearch] Creating Webset with Exa API...')
    const webset = await exaClient.createWebset({
      externalId: `campaign_${Date.now()}`,
      search: searchConfig,
      enrichments: enrichments,
      metadata: {
        campaignName: settings.name,
        criteria: optimizedCriteria,
        settings: settings,
        createdAt: new Date().toISOString()
      }
    })

    console.log('✅ [startProspectSearch] Created Webset:', webset.id)
    console.log('📊 [startProspectSearch] Webset status:', webset.status)

    // Return initial response with webset ID
    return {
      success: true,
      websetId: webset.id,
      prospects: [], // Will be populated as search progresses
      totalFound: 0,
      status: 'running'
    }

  } catch (error) {
    console.error('💥 [startProspectSearch] Error starting prospect search:', error)
    return {
      success: false,
      prospects: [],
      totalFound: 0,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Check the status of a prospect search and get results
 */
export async function checkProspectSearchStatus(
  websetId: string
): Promise<ProspectSearchResult> {
  console.log(`🔄 [checkProspectSearchStatus] Checking status for webset: ${websetId}`)
  
  try {
    const exaClient = getExaWebsetsClient()
    
    // Get current Webset status
    console.log('📡 [checkProspectSearchStatus] Fetching webset status...')
    const webset = await exaClient.getWebset(websetId)
    
    console.log('📊 [checkProspectSearchStatus] Webset status:', webset.status)
    console.log('📊 [checkProspectSearchStatus] Searches:', webset.searches.length)
    
    // Get current items/prospects
    console.log('📡 [checkProspectSearchStatus] Fetching webset items...')
    const itemsResponse = await exaClient.listItems(websetId, { limit: 1000 })
    
    console.log('📊 [checkProspectSearchStatus] Items found:', itemsResponse.data.length)
    console.log('📊 [checkProspectSearchStatus] Has more:', itemsResponse.hasMore)
    
    // Convert Webset items to our Prospect format
    const prospects = itemsResponse.data.map(item => 
      exaClient.convertToProspect(item)
    )

    console.log('👥 [checkProspectSearchStatus] Converted prospects:', prospects.length)

    // Determine overall status
    let status: 'running' | 'completed' | 'failed' = 'running'
    if (webset.status === 'idle') {
      status = 'completed'
    } else if (webset.status === 'failed') {
      status = 'failed'
    }

    // Get total found from search progress
    const totalFound = webset.searches.reduce((total, search) => 
      total + (search.progress?.found || 0), 0
    )

    console.log('📊 [checkProspectSearchStatus] Total found from progress:', totalFound)
    console.log('📊 [checkProspectSearchStatus] Final status:', status)

    return {
      success: true,
      websetId: websetId,
      prospects: prospects,
      totalFound: Math.max(totalFound, prospects.length),
      status: status
    }

  } catch (error) {
    console.error('💥 [checkProspectSearchStatus] Error checking prospect search status:', error)
    return {
      success: false,
      prospects: [],
      totalFound: 0,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Save campaign and prospects to database
 */
export async function saveCampaignToDatabase(
  criteria: ProspectCriteria,
  emailSequence: EmailSequence[],
  settings: CampaignSettings,
  websetId: string,
  prospects: Prospect[]
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  console.log('💾 [saveCampaignToDatabase] Saving campaign to database...')
  
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ [saveCampaignToDatabase] User not authenticated:', userError)
      throw new Error('User not authenticated')
    }

    console.log('✅ [saveCampaignToDatabase] User authenticated:', user.id)

    // Insert campaign
    console.log('📝 [saveCampaignToDatabase] Inserting campaign...')
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: settings.name,
        status: 'draft',
        prospect_query: criteria,
        entity_type: criteria.entityType,
        enrichments: criteria.includeEnrichments,
        filters: criteria.filters,
        target_count: criteria.targetCount,
        email_sequence: emailSequence,
        settings: settings,
        exa_webset_id: websetId
      })
      .select()
      .single()

    if (campaignError) {
      console.error('❌ [saveCampaignToDatabase] Campaign insert error:', campaignError)
      throw campaignError
    }

    console.log('✅ [saveCampaignToDatabase] Campaign saved:', campaign.id)

    // Insert prospects
    if (prospects.length > 0) {
      console.log(`📝 [saveCampaignToDatabase] Inserting ${prospects.length} prospects...`)
      
      const prospectInserts = prospects.map(prospect => ({
        id: prospect.id,
        email: prospect.email,
        first_name: prospect.fullName?.split(' ')[0] || '',
        last_name: prospect.fullName?.split(' ').slice(1).join(' ') || '',
        company: prospect.company,
        job_title: prospect.jobTitle,
        linkedin_url: prospect.linkedinUrl,
        location: prospect.location,
        industry: prospect.industry,
        company_size: prospect.companySize,
        website: prospect.website,
        phone: undefined, // Not available in current Prospect interface
        properties: prospect.enrichments || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        verification_status: 'pending' // Default status
      }));

      const { error: prospectsError } = await supabase
        .from('prospects')
        .insert(prospectInserts)

      if (prospectsError) {
        console.error('❌ [saveCampaignToDatabase] Prospects insert error:', prospectsError)
        // Don't fail the entire operation if prospect saving fails
      } else {
        console.log('✅ [saveCampaignToDatabase] Prospects saved successfully')
      }
    }

    console.log('✅ [saveCampaignToDatabase] Campaign and prospects saved successfully')
    return {
      success: true,
      campaignId: campaign.id
    }

  } catch (error) {
    console.error('💥 [saveCampaignToDatabase] Error saving campaign to database:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Cancel a running prospect search
 */
export async function cancelProspectSearch(websetId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`🚫 [cancelProspectSearch] Canceling webset: ${websetId}`)
  
  try {
    const exaClient = getExaWebsetsClient()
    await exaClient.cancelWebset(websetId)
    console.log('✅ [cancelProspectSearch] Webset canceled successfully')
    return { success: true }
  } catch (error) {
    console.error('💥 [cancelProspectSearch] Error canceling prospect search:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 