import Exa from 'exa-js'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

// Cache Exa client to avoid recreating on each request
let cachedExa: Exa | null = null

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url!)
  const websetId = searchParams.get('websetId')
  const targetParam = searchParams.get('target')
  const targetCount = targetParam ? Number(targetParam) : undefined

  if (!websetId) {
    return new Response('Missing websetId', { status: 400 })
  }

  // Reuse cached Exa client for speed
  if (!cachedExa) {
    cachedExa = new Exa(process.env.EXA_API_KEY!)
  }
  const exa = cachedExa

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let lastItemCount = 0
      let pollCount = 0
      const maxPolls = 600 // 5 minutes at 500ms intervals

      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      const poll = async () => {
        try {
          pollCount++
          
          // Get webset status
          const webset = await exa.websets.get(websetId)
          
          // Progress info from searches
          let analyzed = 0
          let found = 0
          if (webset.searches && webset.searches.length > 0) {
            const search = webset.searches[0]
            analyzed = search.progress?.analyzed || 0
            found = search.progress?.found || 0
          }

          // Get items
          let prospects: any[] = []
          try {
            const itemsResponse = await exa.websets.items.list(websetId, { limit: 100 })
            
            if (itemsResponse.data && itemsResponse.data.length > 0) {
              prospects = itemsResponse.data.map((item: any) => {
                // Extract basic info
                let extractedName = 'Profile Found'
                let extractedTitle = 'Unknown'
                let extractedCompany = 'Unknown'
                
                // Try to extract from LinkedIn URL
                if (item.url && item.url.includes('linkedin.com/in/')) {
                  const urlPath = item.url.split('/in/')[1]?.split('/')[0]
                  if (urlPath) {
                    extractedName = urlPath.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                  }
                }
                
                // Try to extract from title
                if (item.title) {
                  extractedName = item.title
                  const titleParts = item.title.split(' - ')
                  if (titleParts.length > 1) {
                    extractedName = titleParts[0]
                    const roleCompany = titleParts[1]
                    if (roleCompany.includes(' at ')) {
                      const [role, company] = roleCompany.split(' at ')
                      extractedTitle = role.trim()
                      extractedCompany = company.trim()
                    }
                  }
                }
                
                const prospect: any = {
                  id: item.id,
                  exaItemId: item.id,
                  fullName: extractedName,
                  jobTitle: extractedTitle,
                  company: extractedCompany,
                  email: undefined,
                  linkedinUrl: item.url || undefined,
                  website: item.url,
                  enrichments: item.enrichments || []
                }
                
                // Extract enriched data
                if (item.enrichments) {
                  if (Array.isArray(item.enrichments)) {
                    item.enrichments.forEach((enrichment: any) => {
                      if (enrichment.status === 'completed' && enrichment.result) {
                        const value = Array.isArray(enrichment.result) ? enrichment.result[0] : enrichment.result
                        const desc = (enrichment.description || '').toLowerCase()
                        
                        if (value && value !== 'null' && value !== 'None') {
                          if (desc.includes('email') || String(value).includes('@')) {
                            prospect.email = String(value)
                          } else if (desc.includes('linkedin') || String(value).includes('linkedin.com')) {
                            prospect.linkedinUrl = String(value)
                          } else if (desc.includes('company')) {
                            prospect.company = String(value)
                          } else if (desc.includes('location')) {
                            prospect.location = String(value)
                          } else if (desc.includes('industry')) {
                            prospect.industry = String(value)
                          } else if (desc.includes('size') || desc.includes('employee')) {
                            prospect.companySize = String(value)
                          }
                        }
                      }
                    })
                  }
                }
                
                return prospect
              })
            }
          } catch (itemsError) {
            logger.error('Error getting items:', itemsError)
          }

          // Send update
          send({
            prospects: prospects.slice(lastItemCount), // Only send new prospects
            analyzed,
            found: Math.max(found, prospects.length),
            status: webset.status,
            totalProspects: prospects.length
          })

          lastItemCount = prospects.length

          // Check if complete or failed
          if (webset.status === 'completed' || webset.status === 'failed') {
            send({ type: 'complete', status: webset.status })
            controller.close()
            return
          }

          // Check if target reached
          if (targetCount && prospects.length >= targetCount) {
            try {
              await exa.websets.cancel(websetId)
              send({ type: 'complete', status: 'completed', reason: 'target_reached' })
              controller.close()
              return
            } catch (e) {
              logger.warn('Failed to cancel webset:', e)
            }
          }

          // Continue polling
          if (pollCount < maxPolls) {
            setTimeout(poll, 500) // Poll every 500ms
          } else {
            send({ type: 'timeout', status: 'timeout' })
            controller.close()
          }
        } catch (error) {
          logger.error('Error polling webset:', error)
          send({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
          controller.close()
        }
      }

      // Start polling
      poll()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

