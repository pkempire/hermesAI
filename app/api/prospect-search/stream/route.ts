import { canAccessWebset } from '@/lib/auth/authorize-webset-access'
import { requireAuthUser } from '@/lib/auth/require-auth-user'
import { logger } from '@/lib/utils/logger'
import Exa from 'exa-js'
import { NextRequest } from 'next/server'

let cachedExa: Exa | null = null

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

  if (!cachedExa) {
    cachedExa = new Exa(process.env.EXA_API_KEY!)
  }
  const exa = cachedExa
  let cleanupStream = () => {}

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let lastItemCount = 0
      let pollCount = 0
      let isClosed = false
      let timeoutId: NodeJS.Timeout | null = null
      const maxPolls = 600

      const send = (data: Record<string, any>) => {
        if (isClosed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          logger.error('Error sending stream message:', error)
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

      send({
        type: 'prospect_search_start',
        event: 'start',
        websetId,
        status: 'running',
        message: 'Streaming search progress started.'
      })

      const poll = async () => {
        if (isClosed) return

        try {
          pollCount += 1
          const webset = await exa.websets.get(websetId)

          const search = webset.searches?.[0]
          const analyzed = search?.progress?.analyzed || 0
          const found = search?.progress?.found || 0
          const completion = search?.progress?.completion || 0

          let prospects: any[] = []
          try {
            const itemsResponse = await exa.websets.items.list(websetId, { limit: 100 })
            prospects =
              itemsResponse.data?.map((item: any) => ({
                id: item.id,
                exaItemId: item.id,
                fullName: item.title || 'Profile Found',
                company: 'Unknown',
                jobTitle: 'Unknown',
                linkedinUrl: item.url || undefined,
                website: item.url,
                enrichments: item.enrichments || []
              })) || []
          } catch (itemsError) {
            logger.error('Error listing stream items:', itemsError)
          }

          const newProspects = prospects.slice(lastItemCount)
          lastItemCount = prospects.length

          send({
            type: 'prospect_search_progress',
            event: 'progress',
            websetId,
            status: webset.status,
            analyzed,
            found: Math.max(found, prospects.length),
            completion,
            totalProspects: prospects.length,
            prospects: newProspects,
            message: `Analyzed ${analyzed} records and found ${Math.max(found, prospects.length)} matches.`
          })

          const status = String(webset.status)
          if (
            status === 'idle' ||
            status === 'completed' ||
            status === 'failed' ||
            status === 'cancelled' ||
            status === 'canceled'
          ) {
            send({ type: 'complete', status: webset.status })
            cleanup()
            return
          }

          if (targetCount && prospects.length >= targetCount) {
            try {
              await exa.websets.cancel(websetId)
            } catch (cancelError) {
              logger.warn('Failed to cancel webset after target reached:', cancelError)
            }

            send({
              type: 'prospect_search_complete',
              event: 'complete',
              websetId,
              status: 'completed',
              analyzed,
              found: prospects.length,
              completion: 100,
              totalProspects: prospects.length,
              prospects,
              reason: 'target_reached',
              message: 'Target reached. Search stopped.'
            })
            cleanup()
            return
          }

          if (pollCount < maxPolls && !isClosed) {
            timeoutId = setTimeout(poll, 500)
          } else if (!isClosed) {
            send({
              type: 'prospect_search_error',
              event: 'error',
              websetId,
              status: 'timeout',
              message: 'Search stream timed out.'
            })
            cleanup()
          }
        } catch (error) {
          logger.error('Error while polling prospect stream:', error)
          if (!isClosed) {
            send({
              type: 'prospect_search_error',
              event: 'error',
              websetId,
              status: 'failed',
              message: error instanceof Error ? error.message : 'Unknown stream error'
            })
            cleanup()
          }
        }
      }

      poll()
    },
    cancel() {
      cleanupStream()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  })
}
