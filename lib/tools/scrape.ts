import { tool } from 'ai'
import Exa from 'exa-js'
import { z } from 'zod'

const scrapeSchema = z.object({
  url: z.string().url().describe('Root URL to analyze (e.g., https://yourcompany.com)')
})

export function createScrapeSiteTool() {
  return tool({
    description: 'Scrape a company website and return ICP/offer/partner types/geo/keywords/summary using Exa searchAndContents.',
    inputSchema: scrapeSchema,
    execute: async ({ url }) => {
      const apiKey = process.env.EXA_API_KEY
      if (!apiKey) throw new Error('EXA_API_KEY is not set')
      const exa = new Exa(apiKey)

      const includeDomains = [new URL(url).hostname]
      const query = `site:${includeDomains[0]} partnerships ICP offer pricing product categories contact about` 
      const res = await exa.searchAndContents(query, {
        numResults: 8,
        includeDomains
      })

      const texts = (res.results || []).map((r: any) => `${r.title}\n${r.text || r.highlight || ''}`)
      const joined = texts.join('\n\n').slice(0, 20000)

      // Lightweight heuristic extraction; the LLM will read this output in-stream anyway
      const references = (res.results || []).map((r: any) => ({ title: r.title, url: r.url })).slice(0, 10)

      return {
        site: url,
        summary: joined.slice(0, 2000),
        references
      }
    }
  })
}


