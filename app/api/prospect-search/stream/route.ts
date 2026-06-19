import { canAccessWebset } from '@/lib/auth/authorize-webset-access'
import { requireAuthUser } from '@/lib/auth/require-auth-user'
import { logger } from '@/lib/utils/logger'
import {
  getRunSnapshot,
  updateCampaignRunProgress
} from '@/lib/workflows/prospect-run-store'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const STREAM_INTERVAL_MS = 2000
const EXA_EVENT_STALE_MS = 20000
const MAX_TICKS = 38

export async function GET(req: NextRequest) {
  const auth = await requireAuthUser()
  if (!auth.ok) {
    return auth.response
  }

  const { searchParams } = new URL(req.url!)
  const websetId = searchParams.get('websetId')
  const targetParam = searchParams.get('target')
  const targetCount = targetParam ? Number(targetParam) : undefined

  if (!websetId) {
    return new Response('Missing websetId', { status: 400 })
  }

  const allowed = await canAccessWebset(auth.userId, websetId)
  if (!allowed) {
    return new Response('Forbidden', { status: 403 })
  }

  let cleanupStream = () => {}

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let isClosed = false
      let timeoutId: NodeJS.Timeout | null = null
      let tickCount = 0
      const seenProspectSignatures = new Map<string, string>()

      const send = (data: Record<string, any>) => {
        if (isClosed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          logger.error('Error sending prospect stream message:', error)
        }
      }

      const cleanup = () => {
        isClosed = true
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        try {
          controller.close()
        } catch {}
      }
      cleanupStream = cleanup

      const emitSnapshot = async () => {
        if (isClosed) return
        tickCount += 1

        try {
          const snapshot = await getRunSnapshot({
            userId: auth.userId,
            websetId
          })
          const { run, prospects } = snapshot

          if (!run) {
            send({
              type: 'prospect_search_error',
              event: 'error',
              websetId,
              status: 'failed',
              message: 'The research run could not be found. Please start a new campaign.'
            })
            cleanup()
            return
          }

          const targetTotal = Math.max(1, targetCount || run.target_count || 25)
          const progress = run.progress || {}
          const found = Math.max(
            prospects.length,
            typeof progress.found === 'number' ? progress.found : 0
          )
          const analyzed = typeof progress.analyzed === 'number' ? progress.analyzed : 0
          const completion =
            run.status === 'idle' || run.status === 'completed'
              ? 100
              : Math.max(
                  typeof progress.completion === 'number' ? progress.completion : 0,
                  Math.min(99, Math.round((found / targetTotal) * 100))
                )

          const changedProspects = prospects.filter((prospect: any) => {
            const signature = JSON.stringify(prospect)
            if (seenProspectSignatures.get(prospect.id) === signature) return false
            seenProspectSignatures.set(prospect.id, signature)
            return true
          })

          const companyEnriched = prospects.filter(
            (prospect: any) =>
              prospect.companyEnrichmentStatus === 'completed' ||
              prospect.companyEnrichmentStatus === 'company_enriched'
          ).length
          const companyEnrichmentPending = Math.max(0, prospects.length - companyEnriched)

          const terminalStatus =
            run.status === 'idle' ||
            run.status === 'completed' ||
            run.status === 'failed' ||
            run.status === 'cancelled'

          const lastEventAt = run.last_event_at ? Date.parse(run.last_event_at) : 0
          const hasReceivedExaEvent = Number.isFinite(lastEventAt) && lastEventAt > 0
          const noWebhookEventsYet =
            !terminalStatus &&
            !hasReceivedExaEvent &&
            Date.now() - Date.parse(run.created_at) > EXA_EVENT_STALE_MS

          if (noWebhookEventsYet) {
            send({
              type: 'prospect_search_error',
              event: 'error',
              websetId,
              runId: run.id,
              status: 'failed',
              source: 'durable',
              message:
                'No Exa webhook events have reached Hermes for this run. Configure the Exa webhook and EXA_WEBHOOK_SECRET, then start a new campaign.'
            })
            cleanup()
            return
          }

          if (targetCount && prospects.length >= targetCount && !terminalStatus) {
            await updateCampaignRunProgress({
              userId: auth.userId,
              websetId,
              status: 'completed',
              progress: {
                ...progress,
                found: prospects.length,
                completion: 100,
                reason: 'target_reached'
              },
              completedAt: new Date().toISOString()
            })
          }

          if (terminalStatus || (targetCount && prospects.length >= targetCount)) {
            send({
              type: 'prospect_search_complete',
              event: 'complete',
              websetId,
              runId: run.id,
              dashboardUrl: run.exa_dashboard_url,
              status: run.status === 'idle' ? 'completed' : run.status,
              analyzed,
              found: prospects.length,
              completion: 100,
              totalProspects: prospects.length,
              companyEnriched,
              companyEnrichmentPending,
              prospects,
              source: 'durable',
              message: `Search completed with ${prospects.length} prospects.`
            })
            cleanup()
            return
          }

          send({
            type: 'prospect_search_progress',
            event: 'progress',
            websetId,
            runId: run.id,
            dashboardUrl: run.exa_dashboard_url,
            status: run.status,
            analyzed,
            found,
            completion,
            totalProspects: prospects.length,
            companyEnriched,
            companyEnrichmentPending,
            prospects: changedProspects,
            source: 'durable',
            message:
              prospects.length > 0
                ? `${prospects.length} matches found so far.`
                : 'Waiting for Exa to publish matching prospects.'
          })

          if (tickCount < MAX_TICKS && !isClosed) {
            timeoutId = setTimeout(emitSnapshot, STREAM_INTERVAL_MS)
          } else {
            send({
              type: 'prospect_search_progress',
              event: 'progress',
              websetId,
              runId: run.id,
              status: 'running',
              analyzed,
              found,
              completion,
              totalProspects: prospects.length,
              companyEnriched,
              companyEnrichmentPending,
              prospects,
              source: 'durable',
              message: 'Search is still running. Reopen the campaign to refresh live results.'
            })
            cleanup()
          }
        } catch (error: any) {
          logger.error('Error while streaming durable prospect run:', error)
          if (!isClosed) {
            const message = error instanceof Error ? error.message : String(error)
            send({
              type: 'prospect_search_error',
              event: 'error',
              websetId,
              status: 'failed',
              message:
                message.includes('rs_') || message.includes('not found') || message.includes('websetId')
                  ? 'The research session for this campaign has expired. Please start a new brief.'
                  : message
            })
            cleanup()
          }
        }
      }

      send({
        type: 'prospect_search_start',
        event: 'start',
        websetId,
        status: 'running',
        source: 'durable',
        message: 'Streaming durable campaign state.'
      })

      emitSnapshot()
    },
    cancel() {
      cleanupStream()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
