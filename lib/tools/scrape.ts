import { generateObject, tool } from 'ai'
import Exa from 'exa-js'
import { JSDOM } from 'jsdom'
import { z } from 'zod'
import { getToolCallModel } from '../utils/registry'

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
      const host = new URL(fullUrl).hostname
      const includeDomains = [host]

      let summary = ''
      const refs: Array<{ title: string; url: string }> = []

      // Prefer Exa contents first for a cleaner, more stable offer snapshot.
      try {
        const res = await exa.searchAndContents(`site:${host}`, {
          numResults: 6,
          includeDomains,
          livecrawl: 'always'
        } as any)
        const texts = (res.results || []).map((r: any) => `${r.title}\n${r.text || r.highlight || ''}`)
        const joined = texts.join('\n\n').slice(0, 30000)
        summary = joined.slice(0, 4000)
        refs.push(...(res.results || []).slice(0, 6).map((r: any) => ({ title: r.title, url: r.url })))
      } catch {}

      if (!summary) {
        try {
          const resp = await fetch(url, { headers: { 'User-Agent': 'HermesAI/1.0' } })
          const html = await resp.text()
          const dom = new JSDOM(html)
          const doc = dom.window.document
          const title = doc.querySelector('title')?.textContent || host
          const metas = Array.from(doc.querySelectorAll('meta[name="description"], meta[property="og:description"], h1, h2, p'))
            .slice(0, 60)
            .map(el => el.textContent?.trim() || '')
            .filter(Boolean)
          summary = ([title, ...metas].join('\n')).slice(0, 4000)
          refs.push({ title, url })
        } catch {}
      }

      let snapshot: z.infer<typeof snapshotSchema> = {}
      try {
        const extraction = await generateObject({
          model: getToolCallModel(),
          schema: snapshotSchema,
          system: `Extract a compact offer snapshot from a company website.

Rules:
- Keep every field concise.
- Focus on what helps Hermes understand the actual offer before prospecting.
- Prefer the real offer and audience over generic marketing fluff.
- "offer" should be the clearest one-sentence description of what the company actually sells or delivers.
- "whyItMatters" should explain in one sentence why that offer matters for prospecting or partnerships.
- proofPoints should be short, distinct bullets if present.`,
          prompt: summary.slice(0, 5000)
        })
        snapshot = extraction.object
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[scrape_site] Failed to generate offer snapshot:', e)
        }
      }

      const companyName = snapshot.companyName || host.replace(/^www\./, '')
      return {
        site: fullUrl,
        summary,
        companyName,
        offer: snapshot.offer,
        targetAudience: snapshot.targetAudience,
        whyItMatters: snapshot.whyItMatters,
        referralHook: snapshot.referralHook,
        proofPoints: snapshot.proofPoints || [],
        references: refs.slice(0, 10)
      }
    }
  })
}
