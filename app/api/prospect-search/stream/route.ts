import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'
import Exa from 'exa-js'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

let cachedExa: Exa | null = null

async function ensureWebsetOwnership(websetId: string, userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', userId)
    .contains('settings', { exa_webset_id: websetId } as any)
    .limit(1)

  if (error) {
    logger.error('Ownership lookup failed:', error)
    return false
  }

  return Boolean(data && data.length > 0)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const websetId = searchParams.get('websetId')
  const targetParam = searchParams.get('target')
  const targetCount = targetParam ? Number(targetParam) : undefined

  if (!websetId) {
    return new Response('Missing websetId', { status: 400 })
  }

  const userId = await getCurrentUserId()
  if (!userId || userId === 'anonymous') {
    return new Response('Unauthorized', { status: 401 })
  }

  const ownsWebset = await ensureWebsetOwnership(websetId, userId)
  if (!ownsWebset) {
    return new Response('Forbidden', { status: 403 })
  }

  if (!cachedExa) {
    cachedExa = new Exa(process.env.EXA_API_KEY!)
  }
  const exa = cachedExa

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let lastItemCount = 0
      let pollCount = 0
      const maxPolls = 600

      const send = (data: Record<string, any>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send({
        type: 'prospect_search_start',
        event: 'start',
        websetId,
        status: 'running',
        message: 'Streaming search progress started.'
      })

      const poll = async () => {
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
            prospects = itemsResponse.data?.map((item: any) => ({
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

          if (webset.status === 'completed' || webset.status === 'failed') {
            send({
              type: webset.status === 'completed' ? 'prospect_search_complete' : 'prospect_search_error',
              event: webset.status === 'completed' ? 'complete' : 'error',
              websetId,
              status: webset.status,
              analyzed,
              found: Math.max(found, prospects.length),
              completion,
              totalProspects: prospects.length,
              prospects,
              message: webset.status === 'completed' ? 'Search completed.' : 'Search failed.'
            })
            controller.close()
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
            controller.close()
            return
          }

          if (pollCount < maxPolls) {
            setTimeout(poll, 500)
          } else {
            send({
              type: 'prospect_search_error',
              event: 'error',
              websetId,
              status: 'timeout',
              message: 'Search stream timed out.'
            })
            controller.close()
          }
        } catch (error) {
          logger.error('Error while polling prospect stream:', error)
          send({
            type: 'prospect_search_error',
            event: 'error',
            websetId,
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown stream error'
          })
          controller.close()
        }
      }

      poll()
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
