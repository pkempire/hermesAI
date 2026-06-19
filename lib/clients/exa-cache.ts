import { createAdminClient, hasSupabaseAdminCredentials } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { ExaWebsetsClient } from './exa-websets'

interface WebsetSearchParams {
  query: string
  criteria: Array<{ label: string; value: string; type: string }>
  entityType: 'person' | 'company'
  enrichments: Array<{ label: string; value: string }>
  targetCount: number
}

interface CreateOrReuseOptions {
  userId?: string
}

function assertDurableCacheConfig(userId?: string) {
  if (!userId) {
    throw new Error('Cannot create Exa Webset without an authenticated user id.')
  }

  if (!hasSupabaseAdminCredentials()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for durable Exa Webset cache.')
  }
}

function generateCacheKey(params: WebsetSearchParams): string {
  const normalizedQuery = params.query.toLowerCase().replace(/\s+/g, ' ').trim()
  const normalizedCriteria = params.criteria
    .map(c => `${c.type}:${c.value.toLowerCase()}`)
    .sort()
    .join('|')

  const normalizedEnrichments = params.enrichments
    .map(e => e.value.toLowerCase())
    .sort()
    .join('|')

  return `${params.entityType}:${normalizedQuery}:${normalizedCriteria}:${normalizedEnrichments}:${params.targetCount}`
}

function deterministicExternalId(params: WebsetSearchParams) {
  const key = generateCacheKey(params)
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i)
    hash |= 0
  }
  return `hermes:webset:${Math.abs(hash).toString(36)}`
}

async function findDurableReusableWebset(
  params: WebsetSearchParams,
  exa: ExaWebsetsClient,
  userId: string
): Promise<{ websetId: string; dashboardUrl?: string | null; externalId?: string | null } | null> {
  const supabase = createAdminClient()
  const cacheKey = generateCacheKey(params)
  const { data, error } = await supabase
    .from('exa_webset_cache')
    .select('webset_id, exa_dashboard_url, exa_external_id, expires_at')
    .eq('user_id', userId)
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error) {
    throw new Error(`Durable Exa cache lookup failed: ${error.message}`)
  }

  if (!data?.webset_id) {
    return null
  }

  const webset = await exa.getWebset(data.webset_id)
  const items = await exa.listItems(data.webset_id, {
    limit: Math.min(params.targetCount, 100)
  })
  const status = String(webset.status)
  const usable =
    status === 'idle' ||
    status === 'completed' ||
    status === 'running' ||
    status === 'pending' ||
    status === 'processing'

  if (!usable) {
    throw new Error(`Cached Exa Webset ${data.webset_id} is not reusable. Status: ${status}.`)
  }

  if ((status === 'idle' || status === 'completed') && items.data.length < params.targetCount) {
    logger.debug('[ExaCache] Durable cache entry is short on results; creating a new Webset.', {
      websetId: data.webset_id,
      currentResults: items.data.length,
      requestedResults: params.targetCount
    })
    return null
  }

  const cacheStatus =
    status === 'idle' || status === 'completed'
      ? 'completed'
      : 'running'

  const { error: updateError } = await supabase
    .from('exa_webset_cache')
    .update({
      last_used_at: new Date().toISOString(),
      status: cacheStatus,
      result_count: items.data.length,
      exa_dashboard_url: (webset as any).dashboardUrl || data.exa_dashboard_url || null,
      exa_external_id: (webset as any).externalId || data.exa_external_id || null
    })
    .eq('user_id', userId)
    .eq('cache_key', cacheKey)

  if (updateError) {
    throw new Error(`Durable Exa cache update failed: ${updateError.message}`)
  }

  return {
    websetId: data.webset_id,
    dashboardUrl: (webset as any).dashboardUrl || data.exa_dashboard_url || null,
    externalId: (webset as any).externalId || data.exa_external_id || null
  }
}

async function persistDurableWebsetCache(
  params: WebsetSearchParams,
  webset: any,
  userId: string
) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('exa_webset_cache').upsert(
    {
      user_id: userId,
      cache_key: generateCacheKey(params),
      webset_id: webset.id,
      exa_external_id: webset.externalId || null,
      exa_dashboard_url: webset.dashboardUrl || null,
      status: webset.status === 'idle' ? 'completed' : 'active',
      entity_type: params.entityType,
      criteria: params.criteria,
      enrichments: params.enrichments,
      target_count: params.targetCount,
      result_count: 0,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      last_used_at: new Date().toISOString()
    },
    { onConflict: 'user_id,cache_key' }
  )

  if (error) {
    throw new Error(`Durable Exa cache persist failed: ${error.message}`)
  }
}

export async function createOrReuseWebset(
  params: WebsetSearchParams,
  exa: ExaWebsetsClient,
  options: CreateOrReuseOptions = {}
): Promise<{ websetId: string; isReused: boolean; webset?: any; dashboardUrl?: string | null; externalId?: string | null }> {
  assertDurableCacheConfig(options.userId)
  const userId = options.userId as string

  const durable = await findDurableReusableWebset(params, exa, userId)
  if (durable) {
    logger.debug('[ExaCache] Reusing durable Webset', { websetId: durable.websetId })
    return {
      websetId: durable.websetId,
      isReused: true,
      dashboardUrl: durable.dashboardUrl,
      externalId: durable.externalId
    }
  }

  const { buildWebsetEnrichments, createProspectSearchCriteria } = await import('./exa-websets')
  const searchCriteria = createProspectSearchCriteria({
    query: params.query,
    targetCount: params.targetCount,
    entityType: params.entityType,
    includeEnrichments: params.enrichments.map(e => e.value),
    allCriteria: params.criteria,
    filters: {}
  })
  const enrichments = buildWebsetEnrichments(params.enrichments)
  const externalId = deterministicExternalId(params)

  const webset = await exa.createWebset({
    externalId,
    search: searchCriteria,
    enrichments,
    metadata: {
      hermes_user_id: userId,
      hermes_cache_key: generateCacheKey(params)
    }
  })

  await persistDurableWebsetCache(params, webset, userId)

  return {
    websetId: webset.id,
    isReused: false,
    webset,
    dashboardUrl: (webset as any).dashboardUrl || null,
    externalId: (webset as any).externalId || externalId
  }
}
