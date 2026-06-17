import { createExaWebsetsClient } from '@/lib/clients/exa-websets'
import { logger } from '@/lib/utils/logger'
import {
  enrichStoredCompanyProspect,
  getRunByWebsetId,
  getWebsetIdFromExaEvent,
  recordRunEvent,
  updateCampaignRunProgress,
  upsertRunProspect
} from '@/lib/workflows/prospect-run-store'
import { createHmac, timingSafeEqual } from 'crypto'
import { after, NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function verifyExaSignature(payload: string, signatureHeader: string | null, secret?: string) {
  if (!secret) {
    throw new Error('EXA_WEBHOOK_SECRET is required for Exa webhook verification.')
  }
  if (!signatureHeader) return false

  try {
    const pairs = signatureHeader.split(',').map(pair => pair.split('='))
    const timestamp = pairs.find(([key]) => key === 't')?.[1]
    const signatures = pairs
      .filter(([key]) => key === 'v1')
      .map(([, value]) => value)
      .filter(Boolean)

    if (!timestamp || signatures.length === 0) return false

    const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp))
    if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false

    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex')
    const expectedBuffer = Buffer.from(expected, 'hex')

    return signatures.some(signature => {
      try {
        const actualBuffer = Buffer.from(signature, 'hex')
        return actualBuffer.length === expectedBuffer.length &&
          timingSafeEqual(actualBuffer, expectedBuffer)
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

function exaProgressFromWebset(webset: any) {
  const search = webset?.searches?.[0]
  const progress = search?.progress || {}
  return {
    analyzed: progress.analyzed || 0,
    found: progress.found || 0,
    completion: progress.completion || 0,
    searchStatus: search?.status || webset?.status
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signatureHeader = req.headers.get('exa-signature')

  try {
    if (!verifyExaSignature(rawBody, signatureHeader, process.env.EXA_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Invalid Exa webhook signature' }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = String(event?.type || 'unknown')
  const websetId = getWebsetIdFromExaEvent(event)

  if (!websetId) {
    return NextResponse.json({
      error: 'Exa webhook event did not include a webset id.',
      eventType,
      eventId: event?.id || null
    }, { status: 422 })
  }

  const run = await getRunByWebsetId({ websetId, preferAdmin: true })
  await recordRunEvent({
    userId: run?.user_id || null,
    runId: run?.id || null,
    websetId,
    provider: 'exa',
    externalEventId: event?.id || null,
    eventType,
    payload: event,
    preferAdmin: true
  })

  if (!run) {
    return NextResponse.json({
      error: 'No Hermes campaign run exists for this Exa webset id.',
      websetId,
      eventType,
      eventId: event?.id || null
    }, { status: 409 })
  }

  try {
    const data = event?.data || {}

    if (eventType === 'webset.item.created' || eventType === 'webset.item.enriched') {
      const exa = createExaWebsetsClient()
      const webset = await exa.getWebset(websetId)
      await upsertRunProspect({
        userId: run.user_id,
        runId: run.id,
        campaignId: run.campaign_id,
        websetId,
        item: data,
        webset: webset as any,
        status: 'discovered',
        preferAdmin: true
      })

      after(async () => {
        await enrichStoredCompanyProspect({
          userId: run.user_id,
          websetId,
          exaItemId: data.id,
          preferAdmin: true
        })
      })
    }

    if (
      eventType === 'webset.created' ||
      eventType === 'webset.search.created' ||
      eventType === 'webset.search.updated' ||
      eventType === 'webset.search.completed' ||
      eventType === 'webset.idle'
    ) {
      const status =
        eventType === 'webset.idle'
          ? 'idle'
          : eventType === 'webset.search.completed'
            ? 'running'
            : data.status === 'failed'
              ? 'failed'
              : 'running'

      await updateCampaignRunProgress({
        userId: run.user_id,
        websetId,
        status,
        progress: exaProgressFromWebset(data),
        exaDashboardUrl: data.dashboardUrl || run.exa_dashboard_url || null,
        exaExternalId: data.externalId || run.exa_external_id || null,
        lastEventId: event?.id || null,
        lastEventAt: event?.createdAt || new Date().toISOString(),
        completedAt: eventType === 'webset.idle' ? new Date().toISOString() : undefined,
        preferAdmin: true
      })
    }

    return NextResponse.json({ ok: true, eventType, websetId, runId: run.id })
  } catch (error) {
    logger.error('Exa webhook processing failed:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: 'exa',
    events: [
      'webset.search.updated',
      'webset.search.completed',
      'webset.item.created',
      'webset.item.enriched',
      'webset.idle'
    ],
    signatureHeader: 'Exa-Signature'
  })
}
