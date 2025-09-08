import { tool } from 'ai'
import Exa from 'exa-js'
import { JSDOM } from 'jsdom'
import { z } from 'zod'

const scrapeSchema = z.object({
  url: z.string().url().describe('Root URL to analyze (e.g., https://yourcompany.com)')
})

export function createScrapeSiteTool() {
  return tool({
    description: 'Scrape a company website and return ICP/offer/partner types/geo/keywords/summary using direct fetch + Exa fallback.',
    inputSchema: scrapeSchema,
    execute: async ({ url }) => {
      const apiKey = process.env.EXA_API_KEY
      if (!apiKey) throw new Error('EXA_API_KEY is not set')
      const exa = new Exa(apiKey)

      const host = new URL(url).hostname
      const includeDomains = [host]

      // Try direct fetch of homepage first for speed and resilience
      let summary = ''
      const refs: Array<{ title: string; url: string }> = []
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
        summary = ([title, ...metas].join('\n')).slice(0, 2000)
        refs.push({ title, url })
      } catch {}

      // Fallback/augment with Exa contents for partner/offer pages
      try {
        const query = `site:${host} (partnership|partners|affiliate|pricing|about|solutions|industries|customers)`
        const res = await exa.searchAndContents(query, { numResults: 6, includeDomains })
        const texts = (res.results || []).map((r: any) => `${r.title}\n${r.text || r.highlight || ''}`)
        const joined = texts.join('\n\n').slice(0, 20000)
        summary = (summary + '\n\n' + joined.slice(0, 1800)).slice(0, 2000)
        refs.push(...(res.results || []).slice(0, 6).map((r: any) => ({ title: r.title, url: r.url })))
      } catch {}

      return { site: url, summary, references: refs.slice(0, 10) }
    }
  })
}


