import { generateObject, tool } from 'ai'
import Exa from 'exa-js'
import { JSDOM } from 'jsdom'
import { z } from 'zod'
import { getToolCallModel } from '../utils/registry'
import { logger } from '../utils/logger'

const scrapeSchema = z.object({
  url: z.string().url().describe('Root URL to analyze (e.g., https://yourcompany.com)')
})

const snapshotSchema = z.object({
  companyName: z.string().optional(),
  offer: z.string().optional(),
  targetAudience: z.string().optional(),
  whyItMatters: z.string().optional(),
  referralHook: z.string().optional(),
  proofPoints: z.array(z.string()).max(3).optional()
})

export function createScrapeSiteTool() {
  return tool({
    description: 'Scrape a company website and return a compact offer snapshot using Exa content with direct-fetch fallback.',
    inputSchema: scrapeSchema,
    execute: async ({ url }) => {
      const apiKey = process.env.EXA_API_KEY
      if (!apiKey) throw new Error('EXA_API_KEY is not set')
      const exa = new Exa(apiKey)

      const fullUrl = url.startsWith('http') ? url : `https://${url}`
      const urlObj = new URL(fullUrl)
      const host = urlObj.hostname

      let summary = ''
      const refs: Array<{ title: string; url: string }> = []

      try {
        logger.info(`[scrape_site] Direct extraction for: ${fullUrl}`)
        
        // 1. Direct fetch of primary URL content (Homepage)
        const directPromise = exa.getContents([fullUrl], { 
          text: true, 
          livecrawl: 'always' 
        } as any)

        // 2. Parallel discovery of key pages (About, Products, Pricing)
        const discoveryPromise = exa.search(`site:${host} (About OR Products OR Pricing OR Solutions)`, {
          numResults: 5,
          useAutoprompt: false
        })

        const [directRes, discoveryRes] = await Promise.race([
          Promise.all([directPromise, discoveryPromise]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Exa operation timeout')), 45000))
        ]) as [any, any]

        const mainContent = directRes.results?.[0]
        if (mainContent) {
          summary += `HOMEPAGE:\n${mainContent.text || mainContent.highlight || ''}\n\n`
          refs.push({ title: mainContent.title || 'Homepage', url: mainContent.url })
        }

        // Add context from key pages found
        const discoveryItems = discoveryRes.results || []
        if (discoveryItems.length > 0) {
          summary += `ADDITIONAL CONTEXT (from subpages):\n`
          discoveryItems.forEach((r: any) => {
            summary += `- ${r.title}: ${r.url}\n`
            refs.push({ title: r.title, url: r.url })
          })
        }

        summary = summary.slice(0, 10000) // Cap for LLM
      } catch (e) {
        logger.warn('[scrape_site] Exa direct extraction failed, falling back to basic fetch:', e)
        // Basic fallback
        try {
          const resp = await fetch(fullUrl, { headers: { 'User-Agent': 'HermesAI/1.0' } })
          const html = await resp.text()
          const dom = new JSDOM(html)
          const doc = dom.window.document
          const title = doc.querySelector('title')?.textContent || host
          const metas = Array.from(doc.querySelectorAll('meta[name="description"], meta[property="og:description"], h1, h2, p'))
            .slice(0, 50)
            .map(el => el.textContent?.trim() || '')
            .filter(Boolean)
          
          summary = `DIRECT FETCH FALLBACK:\n${[title, ...metas].join('\n')}`.slice(0, 4000)
          refs.push({ title, url: fullUrl })
        } catch (fetchErr) {
          logger.error('[scrape_site] All fetch methods failed:', fetchErr)
        }
      }

      let snapshot: z.infer<typeof snapshotSchema> = {}
      try {
        if (summary) {
          const extractionPromise = generateObject({
            model: getToolCallModel(),
            schema: snapshotSchema,
            system: `Extract a prestige B2B offer snapshot. NO GENERIC MARKETING SLOP.
  
  Focus on:
  - WHAT they actually do (technical/functional)
  - WHO they sell to (ICP/Persona)
  - COMPETITIVE EDGE (Why they win)
  
  Format concisely.`,
            prompt: summary
          })

          const extraction = await Promise.race([
            extractionPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Extraction timeout')), 25000))
          ]) as any
          
          snapshot = extraction.object
        }
      } catch (e) {
        logger.error('[scrape_site] LLM extraction failed:', e)
      }

      return {
        site: fullUrl,
        companyName: snapshot.companyName || host.replace(/^www\./, ''),
        offer: snapshot.offer || 'Consulting/B2B Services',
        targetAudience: snapshot.targetAudience || 'B2B Companies',
        whyItMatters: snapshot.whyItMatters || 'General business interest',
        referralHook: snapshot.referralHook,
        proofPoints: snapshot.proofPoints || [],
        references: refs.slice(0, 8)
      }
    }
  })
}
