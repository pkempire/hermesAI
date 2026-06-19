import { Prospect } from '@/components/prospect-grid'
import {
  Webset,
  WebsetItem,
  convertToProspect,
  createEnrichmentDescriptionMap
} from '@/lib/clients/exa-websets'
import { enrichCompanyData } from '@/lib/clients/orangeslice'
import { createAdminClient, hasSupabaseAdminCredentials } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type SupabaseLike = Awaited<ReturnType<typeof createClient>>

export type CampaignRunStatus =
  | 'created'
  | 'running'
  | 'idle'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface CampaignRunRecord {
  id: string
  user_id: string
  campaign_id: string | null
  webset_id: string
  exa_external_id: string | null
  exa_dashboard_url: string | null
  source: string
  status: CampaignRunStatus
  entity_type: string
  target_count: number
  original_query: string | null
  target_persona: string | null
  offer: string | null
  progress: Record<string, any>
  settings: Record<string, any>
  last_event_id: string | null
  last_event_at: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface RunSnapshot {
  run: CampaignRunRecord | null
  prospects: Prospect[]
}

function canUseAdmin() {
  return hasSupabaseAdminCredentials()
}

async function getDb(preferAdmin = false): Promise<SupabaseLike> {
  if (preferAdmin) {
    if (!canUseAdmin()) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin workflow operations.')
    }
    return createAdminClient() as any
  }
  return createClient()
}

export function getWebsetIdFromExaEvent(event: any): string | null {
  const data = event?.data || {}
  return (
    data.websetId ||
    data.webset_id ||
    data.webset?.id ||
    data.webset?.websetId ||
    (String(event?.type || '').startsWith('webset.') && data.id ? data.id : null)
  )
}

export async function getRunByWebsetId(params: {
  userId?: string
  websetId: string
  preferAdmin?: boolean
}): Promise<CampaignRunRecord | null> {
  const db = await getDb(params.preferAdmin)
  let query = db
    .from('campaign_runs')
    .select('*')
    .eq('webset_id', params.websetId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (params.userId) {
    query = query.eq('user_id', params.userId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(`campaign_runs lookup failed: ${error.message}`)
  return (data as CampaignRunRecord) || null
}

export async function upsertCampaignRun(params: {
  userId: string
  campaignId?: string | null
  websetId: string
  exaExternalId?: string | null
  exaDashboardUrl?: string | null
  source?: string
  status?: CampaignRunStatus
  entityType?: string
  targetCount?: number
  originalQuery?: string | null
  targetPersona?: string | null
  offer?: string | null
  progress?: Record<string, any>
  settings?: Record<string, any>
  preferAdmin?: boolean
}): Promise<CampaignRunRecord | null> {
  const db = await getDb(params.preferAdmin)
  const payload = {
    user_id: params.userId,
    campaign_id: params.campaignId || null,
    webset_id: params.websetId,
    exa_external_id: params.exaExternalId || null,
    exa_dashboard_url: params.exaDashboardUrl || null,
    source: params.source || 'app',
    status: params.status || 'created',
    entity_type: params.entityType || 'company',
    target_count: params.targetCount || 25,
    original_query: params.originalQuery || null,
    target_persona: params.targetPersona || null,
    offer: params.offer || null,
    progress: params.progress || {},
    settings: params.settings || {}
  }

  const { data, error } = await db
    .from('campaign_runs')
    .upsert(payload as any, { onConflict: 'user_id,webset_id' })
    .select('*')
    .single()

  if (error) throw new Error(`campaign_runs upsert failed: ${error.message}`)
  return data as CampaignRunRecord
}

export async function updateCampaignRunProgress(params: {
  userId?: string
  websetId: string
  status?: CampaignRunStatus
  progress?: Record<string, any>
  exaDashboardUrl?: string | null
  exaExternalId?: string | null
  lastEventId?: string | null
  lastEventAt?: string | null
  completedAt?: string | null
  preferAdmin?: boolean
}) {
  const db = await getDb(params.preferAdmin)
  const update: Record<string, any> = {}
  if (params.status) update.status = params.status
  if (params.progress) update.progress = params.progress
  if (params.exaDashboardUrl !== undefined) update.exa_dashboard_url = params.exaDashboardUrl
  if (params.exaExternalId !== undefined) update.exa_external_id = params.exaExternalId
  if (params.lastEventId !== undefined) update.last_event_id = params.lastEventId
  if (params.lastEventAt !== undefined) update.last_event_at = params.lastEventAt
  if (params.completedAt !== undefined) update.completed_at = params.completedAt

  let query = db.from('campaign_runs').update(update).eq('webset_id', params.websetId)
  if (params.userId) query = query.eq('user_id', params.userId)
  const { error } = await query
  if (error) throw new Error(`campaign_runs progress update failed: ${error.message}`)
}

export async function recordRunEvent(params: {
  userId?: string | null
  runId?: string | null
  websetId?: string | null
  provider?: string
  externalEventId?: string | null
  eventType: string
  payload: Record<string, any>
  preferAdmin?: boolean
}) {
  const db = await getDb(params.preferAdmin)
  let runId = params.runId || null
  let userId = params.userId || null

  if ((!runId || !userId) && params.websetId) {
    const run = await getRunByWebsetId({
      websetId: params.websetId,
      preferAdmin: params.preferAdmin
    })
    runId = runId || run?.id || null
    userId = userId || run?.user_id || null
  }

  const payload = {
    run_id: runId,
    user_id: userId,
    provider: params.provider || 'exa',
    external_event_id: params.externalEventId || null,
    event_type: params.eventType,
    payload: params.payload,
    processed_at: new Date().toISOString()
  }

  if (payload.external_event_id) {
    const { error } = await db
      .from('campaign_run_events')
      .upsert(payload as any, { onConflict: 'provider,external_event_id' })
    if (error) throw new Error(`campaign_run_events upsert failed: ${error.message}`)
  } else {
    const { error } = await db.from('campaign_run_events').insert(payload as any)
    if (error) throw new Error(`campaign_run_events insert failed: ${error.message}`)
  }
}

function withStatus(prospect: Prospect, status: string): Prospect {
  return {
    ...prospect,
    reviewReady: status === 'company_enriched',
    companyEnrichmentStatus:
      status === 'company_enriched'
        ? 'completed'
        : status === 'failed'
          ? 'failed'
          : 'queued'
  } as Prospect
}

export async function upsertRunProspect(params: {
  userId: string
  runId: string
  campaignId?: string | null
  websetId: string
  item: WebsetItem
  webset?: Pick<Webset, 'enrichments'> | null
  status?: 'discovered' | 'company_enriched' | 'failed'
  preferAdmin?: boolean
}) {
  const db = await getDb(params.preferAdmin)
  const enrichmentDescriptions = createEnrichmentDescriptionMap(params.webset || null)
  const prospect = withStatus(
    convertToProspect(params.item, enrichmentDescriptions),
    params.status || 'discovered'
  )
  const companyStatus =
    params.status === 'company_enriched'
      ? 'completed'
      : params.status === 'failed'
        ? 'failed'
        : 'queued'

  const { error } = await db
    .from('campaign_run_prospects')
    .upsert(
      {
        run_id: params.runId,
        user_id: params.userId,
        campaign_id: params.campaignId || null,
        webset_id: params.websetId,
        exa_item_id: params.item.id,
        status: params.status || 'discovered',
        company_enrichment_status: companyStatus,
        source_url: (prospect as any).sourceUrl || prospect.website || null,
        fit_score: typeof (prospect as any).fitScore === 'number' ? (prospect as any).fitScore : null,
        prospect,
        raw_payload: params.item
      } as any,
      { onConflict: 'run_id,exa_item_id' }
    )

  if (error) throw new Error(`campaign_run_prospects upsert failed: ${error.message}`)
}

export async function getRunSnapshot(params: {
  userId: string
  websetId: string
  preferAdmin?: boolean
}): Promise<RunSnapshot> {
  const run = await getRunByWebsetId({
    userId: params.userId,
    websetId: params.websetId,
    preferAdmin: params.preferAdmin
  })

  if (!run) return { run: null, prospects: [] }

  const db = await getDb(params.preferAdmin)
  const { data, error } = await db
    .from('campaign_run_prospects')
    .select('prospect, status, company_enrichment_status, contact_enrichment_status, draft_status')
    .eq('run_id', run.id)
    .order('discovered_at', { ascending: true })

  if (error) throw new Error(`campaign_run_prospects snapshot failed: ${error.message}`)

  const prospects = (data || [])
    .map((row: any) => ({
      ...(row.prospect || {}),
      companyEnrichmentStatus: row.company_enrichment_status,
      contactLookupStatus: row.contact_enrichment_status === 'completed'
        ? 'found'
        : row.contact_enrichment_status === 'failed'
          ? 'failed'
          : (row.prospect || {}).contactLookupStatus
    }))
    .filter((prospect: any) => prospect?.id)

  return { run, prospects }
}

export async function enrichStoredCompanyProspect(params: {
  userId: string
  websetId: string
  exaItemId: string
  preferAdmin?: boolean
}) {
  const startedAt = Date.now()
  const db = await getDb(params.preferAdmin)

  const { data: row, error } = await db
    .from('campaign_run_prospects')
    .select('*, campaign_runs(original_query,target_persona,offer)')
    .eq('user_id', params.userId)
    .eq('webset_id', params.websetId)
    .eq('exa_item_id', params.exaItemId)
    .maybeSingle()

  if (error || !row) {
    if (error) throw new Error(`campaign_run_prospects enrichment load failed: ${error.message}`)
    throw new Error(`No stored prospect found for Exa item ${params.exaItemId}.`)
  }

  if (row.company_enrichment_status === 'completed' || row.company_enrichment_status === 'running') {
    return
  }

  await db
    .from('campaign_run_prospects')
    .update({ status: 'company_enriching', company_enrichment_status: 'running' } as any)
    .eq('id', row.id)

  const { data: providerCall } = await db
    .from('provider_calls')
    .insert({
      run_id: row.run_id,
      prospect_id: row.id,
      user_id: params.userId,
      provider: 'orangeslice',
      operation: 'company.linkedin.enrich',
      status: 'running',
      request: {
        company: row.prospect?.company,
        website: row.prospect?.website
      }
    } as any)
    .select('id')
    .maybeSingle()

  try {
    const context = {
      originalQuery: row.campaign_runs?.original_query || undefined,
      targetPersona: row.campaign_runs?.target_persona || undefined,
      offer: row.campaign_runs?.offer || undefined
    }
    const enriched = await enrichCompanyData(row.prospect as Prospect, context)

    await db
      .from('campaign_run_prospects')
      .update({
        prospect: {
          ...enriched,
          reviewReady: true,
          companyEnrichmentStatus: 'completed'
        },
        status: 'company_enriched',
        company_enrichment_status: 'completed',
        fit_score: typeof (enriched as any).fitScore === 'number' ? (enriched as any).fitScore : row.fit_score
      } as any)
      .eq('id', row.id)

    if (providerCall?.id) {
      await db
        .from('provider_calls')
        .update({
          status: 'succeeded',
          latency_ms: Date.now() - startedAt,
          response: { ok: true },
          completed_at: new Date().toISOString()
        } as any)
        .eq('id', providerCall.id)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db
      .from('campaign_run_prospects')
      .update({
        status: 'failed',
        company_enrichment_status: 'failed',
        error: message
      } as any)
      .eq('id', row.id)

    if (providerCall?.id) {
      await db
        .from('provider_calls')
        .update({
          status: 'failed',
          latency_ms: Date.now() - startedAt,
          error: message,
          completed_at: new Date().toISOString()
        } as any)
        .eq('id', providerCall.id)
    }
  }
}
