import { canAccessWebset } from '@/lib/auth/authorize-webset-access'
import { requireAuthUser } from '@/lib/auth/require-auth-user'
import { convertToProspect, createEnrichmentDescriptionMap } from '@/lib/clients/exa-websets'
import { enrichCompanyData } from '@/lib/clients/orangeslice'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import Exa from 'exa-js'
import { NextRequest } from 'next/server'

let cachedExa: Exa | null = null

async function getStoredSearchContext(userId: string, websetId: string) {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('campaigns')
      .select('prospect_query, settings')
      .eq('user_id', userId)
      .contains('settings', { exa_webset_id: websetId } as any)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return {
      originalQuery:
        data?.prospect_query?.query ||
        data?.settings?.original_query ||
        undefined,
      targetPersona:
        data?.prospect_query?.targetPersona ||
        data?.settings?.target_persona ||
        undefined,
      offer:
        data?.prospect_query?.offer ||
        data?.settings?.offer ||
        undefined
    }
  } catch (error) {
    logger.warn('Unable to load stored search context:', error)
    return undefined
  }
}

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
  const storedSearchContext = await getStoredSearchContext(auth.userId, websetId)

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let pollCount = 0
      let isClosed = false
      let timeoutId: NodeJS.Timeout | null = null
      const maxPolls = 600
      const seenProspectSignatures = new Map<string, string>()
      const enrichmentPromises = new Map<string, Promise<void>>()
      const enrichedProspects = new Map<string, any>()
      const enrichmentKeys = new Map<string, string>()
      let allProspects: any[] = []

      const asQueuedProspect = (prospect: any) => ({
        ...prospect,
        reviewReady: false,
        companyEnrichmentStatus: 'queued'
      })

      const getCompanyEnrichmentCounts = (prospects: any[]) => {
        const companyEnriched = prospects.filter(
          (prospect: any) => prospect.companyEnrichmentStatus === 'completed'
        ).length
        const companyEnrichmentPending = prospects.filter((prospect: any) => {
          const status = prospect.companyEnrichmentStatus
          return status !== 'completed' && status !== 'failed'
        }).length

        return { companyEnriched, companyEnrichmentPending }
      }

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
          const enrichmentDescriptions = createEnrichmentDescriptionMap(webset as any)

          const search = webset.searches?.[0]
          const analyzed = search?.progress?.analyzed || 0
          const found = search?.progress?.found || 0
          const completion = search?.progress?.completion || 0

          let prospects: any[] = allProspects
          let changedProspects: any[] = []
          try {
            const itemsResponse = await exa.websets.items.list(websetId, {
              limit: Math.max(targetCount || 25, 25)
            })
            const rawItems = itemsResponse.data || []
            const latestProspects = rawItems
              .map((item: any) => ({
                prospect: convertToProspect(item, enrichmentDescriptions)
              }))
              .filter(({ prospect }: any) => prospect.fullName || prospect.company || prospect.website)

            for (const { prospect } of latestProspects) {
              const enrichmentKey = JSON.stringify({
                company: prospect.company,
                website: prospect.website,
                linkedinUrl: prospect.linkedinUrl,
                summary: (prospect as any).summary,
                targetPersona: storedSearchContext?.targetPersona,
                offer: storedSearchContext?.offer
              })

              const hasChanged = enrichmentKeys.get(prospect.id) !== enrichmentKey
              if (hasChanged) {
                enrichmentKeys.set(prospect.id, enrichmentKey)
                enrichedProspects.set(prospect.id, asQueuedProspect(prospect))
              }

              if (!enrichmentPromises.has(prospect.id)) {
                enrichmentPromises.set(
                  prospect.id,
                  enrichCompanyData(prospect, storedSearchContext)
                    .then(enriched => {
                      enrichedProspects.set(prospect.id, {
                        ...enriched,
                        reviewReady: true,
                        companyEnrichmentStatus: 'completed'
                      })
                    })
                    .catch(error => {
                      logger.warn('Company enrichment failed:', error)
                      enrichedProspects.set(prospect.id, {
                        ...prospect,
                        reviewReady: true,
                        companyEnrichmentStatus: 'failed',
                        companyEnrichmentError: error instanceof Error ? error.message : 'Failed'
                      })
                    })
                    .finally(() => {
                      enrichmentPromises.delete(prospect.id)
                    })
                )
              }
            }

            const streamableProspects = latestProspects
              .map(({ prospect }) => enrichedProspects.get(prospect.id) || asQueuedProspect(prospect))
              .filter((prospect: any): prospect is any => Boolean(prospect) && Boolean(prospect.id))

            changedProspects = streamableProspects
              .filter((prospect: any) => {
                const signature = JSON.stringify(prospect)
                if (seenProspectSignatures.get(prospect.id) === signature) return false
                seenProspectSignatures.set(prospect.id, signature)
                return true
              })

            allProspects = streamableProspects
            prospects = allProspects
          } catch (itemsError) {
            logger.error('Error listing stream items:', itemsError)
          }

          const { companyEnriched, companyEnrichmentPending } = getCompanyEnrichmentCounts(prospects)

          send({
            type: 'prospect_search_progress',
            event: 'progress',
            websetId,
            status: webset.status,
            analyzed,
            found: Math.max(found, prospects.length),
            completion,
            totalProspects: prospects.length,
            companyEnriched,
            companyEnrichmentPending,
            prospects: changedProspects,
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
            if (enrichmentPromises.size > 0) {
              await Promise.race([
                Promise.allSettled(Array.from(enrichmentPromises.values())),
                // Discovery should never feel blocked by auxiliary company enrichment.
                new Promise(resolve => setTimeout(resolve, 12000))
              ])
              prospects = allProspects.map(prospect => enrichedProspects.get(prospect.id) || prospect)
            }

            const { companyEnriched, companyEnrichmentPending } = getCompanyEnrichmentCounts(prospects)

            send({
              type: 'prospect_search_complete',
              event: 'complete',
              websetId,
              status: status === 'idle' ? 'completed' : status,
              analyzed,
              found: prospects.length,
              completion: 100,
              totalProspects: prospects.length,
              companyEnriched,
              companyEnrichmentPending,
              prospects,
              message: `Search completed with ${prospects.length} prospects.`
            })
            cleanup()
            return
          }

          if (targetCount && prospects.length >= targetCount) {
            try {
              await exa.websets.cancel(websetId)
            } catch (cancelError) {
              logger.warn('Failed to cancel webset after target reached:', cancelError)
            }

            const { companyEnriched, companyEnrichmentPending } = getCompanyEnrichmentCounts(prospects)

            send({
              type: 'prospect_search_complete',
              event: 'complete',
              websetId,
              status: 'completed',
              analyzed,
              found: prospects.length,
              completion: 100,
              totalProspects: prospects.length,
              companyEnriched,
              companyEnrichmentPending,
              prospects,
              reason: 'target_reached',
              message: 'Target reached. Search stopped.'
            })
            cleanup()
            return
          }

          if (pollCount < maxPolls && !isClosed) {
            timeoutId = setTimeout(poll, 1500)
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
        } catch (error: any) {
          logger.error('Error while polling prospect stream:', error)
          if (!isClosed) {
            const message = error instanceof Error ? error.message : String(error)
            const displayMessage = 
              (message.includes('rs_') || message.includes('not found') || message.includes('websetId'))
                ? 'The research session for this campaign has expired. Please start a new brief.'
                : message

            send({
              type: 'prospect_search_error',
              event: 'error',
              websetId,
              status: 'failed',
              message: displayMessage
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
