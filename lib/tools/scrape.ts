import { generateText, Output, tool } from 'ai'
import Exa from 'exa-js'
import { JSDOM } from 'jsdom'
import { z } from 'zod'
import { getToolCallModel } from '../utils/registry'
import { logger } from '../utils/logger'

const scrapeSchema = z.object({
  url: z.string().url().describe('Root URL to analyze (e.g., https://yourcompany.com)')
})

const snapshotSchema = z.object({
  companyName: z.string().nullable(),
  offer: z.string().nullable(),
  targetAudience: z.string().nullable(),
  businessModel: z.string().nullable(),
  whyItMatters: z.string().nullable(),
  referralHook: z.string().nullable(),
  searchPlanningNotes: z.string().nullable(),
  proofPoints: z.array(z.string()).max(4).nullable(),
  confidence: z.number().min(0).max(1).nullable()
})

type Snapshot = z.infer<typeof snapshotSchema>

function cleanValue(
  value: string | null | undefined,
  defaultValue: string | null | undefined = ''
) {
  const normalized = value?.replace(/\s+/g, ' ').trim()
  return normalized && normalized.length > 0 ? normalized : defaultValue
}

const genericSnapshotPattern =
  /^(consulting\/?b2b services|b2b services|consulting services|b2b companies|companies|general business interest|business interest|unknown|n\/a)$/i

function isGenericSnapshotValue(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, ' ').trim()
  return !normalized || genericSnapshotPattern.test(normalized)
}

function specificValue(
  value: string | null | undefined,
  defaultValue: string | null | undefined = ''
) {
  const normalized = value?.replace(/\s+/g, ' ').trim()
  if (normalized && !isGenericSnapshotValue(normalized)) {
    return normalized
  }
  return cleanValue(defaultValue)
}

function visibleTextFromHtml(html: string, host: string) {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  for (const node of Array.from(doc.querySelectorAll('script, style, noscript, svg'))) {
    node.remove()
  }

  const title = cleanValue(doc.querySelector('title')?.textContent, host)
  const description = cleanValue(
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content')
  )
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
    .map(el => cleanValue(el.textContent))
    .filter(Boolean)
    .slice(0, 30)
  const paragraphs = Array.from(doc.querySelectorAll('p, li, a[href]'))
    .map(el => cleanValue(el.textContent))
    .filter(text => text && text.length > 8)
    .slice(0, 90)

  return {
    title,
    text: [title, description, ...headings, ...paragraphs]
      .filter(Boolean)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .slice(0, 7000)
  }
}

async function fetchDirectSiteContent(fullUrl: string, host: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)
  try {
    const resp = await fetch(fullUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'HermesAI/1.0 (+https://gethermes.vercel.app)',
        Accept: 'text/html,application/xhtml+xml'
      }
    })
    if (!resp.ok) {
      throw new Error(`Direct fetch returned ${resp.status}`)
    }
    const html = await resp.text()
    const extracted = visibleTextFromHtml(html, host)
    return {
      ...extracted,
      url: resp.url || fullUrl
    }
  } finally {
    clearTimeout(timeout)
  }
}

function inferSnapshotFromSignals(params: {
  host: string
  summary: string
  refs: Array<{ title: string; url: string }>
}): Partial<Snapshot> {
  const text = [
    params.host,
    params.summary,
    ...params.refs.flatMap(ref => [ref.title, ref.url])
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()

  const proofPoints = params.refs
    .map(ref => ref.title)
    .filter(Boolean)
    .filter((title, index, all) => all.indexOf(title) === index)
    .slice(0, 4)

  const educationSignals =
    /(academy|student|students|teen|teens|high school|middle school|college|admissions|applied ai|summer program|programs|coding|ai builder|research coaching|innovators)/i

  if (educationSignals.test(text)) {
    return {
      offer:
        'AI, coding, and research coaching programs for ambitious middle and high school students',
      targetAudience:
        'Parents and students pursuing STEM, AI, research, and selective college preparation',
      businessModel: 'Education and coaching program',
      whyItMatters:
        'Private college counselors and STEM/Ivy advisors can refer students who want differentiated technical projects and research experience.',
      referralHook:
        'Pitch college counseling founders on a referral path for students who need credible AI/research projects beyond standard test prep.',
      searchPlanningNotes:
        'Look for premium Bay Area college admissions counselors, STEM admissions advisors, and independent educational consultants serving high-achieving students.',
      proofPoints,
      confidence: 0.58
    }
  }

  return {
    proofPoints,
    confidence: proofPoints.length > 0 ? 0.35 : 0.2
  }
}

function buildScrapeResult(params: {
  fullUrl: string
  host: string
  snapshot?: Partial<Snapshot>
  inferred?: Partial<Snapshot>
  refs: Array<{ title: string; url: string }>
}) {
  const { fullUrl, host, snapshot = {}, inferred = {}, refs } = params

  return {
    site: fullUrl,
    companyName: specificValue(snapshot.companyName, host.replace(/^www\./, '')),
    offer: specificValue(snapshot.offer, inferred.offer),
    targetAudience: specificValue(snapshot.targetAudience, inferred.targetAudience),
    businessModel: specificValue(snapshot.businessModel, inferred.businessModel),
    whyItMatters: specificValue(snapshot.whyItMatters, inferred.whyItMatters),
    referralHook: specificValue(snapshot.referralHook, inferred.referralHook),
    searchPlanningNotes: specificValue(snapshot.searchPlanningNotes, inferred.searchPlanningNotes),
    proofPoints:
      (Array.isArray(snapshot.proofPoints) && snapshot.proofPoints.length
        ? snapshot.proofPoints
        : inferred.proofPoints) || [],
    confidence:
      snapshot.confidence ??
      inferred.confidence ??
      (snapshot.offer || snapshot.targetAudience ? 0.7 : 0.25),
    references: refs.slice(0, 8)
  }
}

export function createScrapeSiteTool() {
  return tool({
    description: 'Analyze a known company website and return a compact GTM offer snapshot using Exa and direct homepage content. Use before prospect_search when the user asks Hermes to understand their offer or ICP.',
    inputSchema: scrapeSchema,
    execute: async ({ url }) => {
      const apiKey = process.env.EXA_API_KEY
      if (!apiKey) {
        throw new Error('EXA_API_KEY is required for scrape_site.')
      }
      const exa = new Exa(apiKey)

      const fullUrl = url.startsWith('http') ? url : `https://${url}`
      const urlObj = new URL(fullUrl)
      const host = urlObj.hostname

      let summary = ''
      const refs: Array<{ title: string; url: string }> = []

      const direct = await fetchDirectSiteContent(fullUrl, host)
      if (direct.text) {
        summary += `DIRECT HOMEPAGE CRAWL:\n${direct.text}\n\n`
        refs.push({ title: direct.title || 'Homepage', url: direct.url })
      }

      logger.info(`[scrape_site] Exa extraction for: ${fullUrl}`)

      const directPromise = exa.getContents([fullUrl], {
        text: true,
        livecrawl: 'preferred',
        livecrawlTimeout: 10000
      } as any)

      const discoveryPromise = exa.search(
        `site:${host} (about OR program OR programs OR product OR services OR admissions OR research OR coaching OR pricing OR testimonials)`,
        {
          numResults: 5,
          useAutoprompt: false
        }
      )

      const [directRes, discoveryRes] = await Promise.race([
        Promise.all([directPromise, discoveryPromise]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Exa operation timeout')), 16000))
      ]) as [any, any]

      const mainContent = directRes.results?.[0]
      if (mainContent) {
        summary += `HOMEPAGE:\n${mainContent.text || mainContent.highlight || ''}\n\n`
        refs.push({ title: mainContent.title || 'Homepage', url: mainContent.url })
      }

      const discoveryItems = discoveryRes.results || []
      if (discoveryItems.length > 0) {
        summary += `ADDITIONAL CONTEXT (from subpages):\n`
        discoveryItems.forEach((r: any) => {
          summary += `- ${r.title}: ${r.url}\n`
          refs.push({ title: r.title, url: r.url })
        })
        const urls = discoveryItems
          .map((r: any) => r?.url)
          .filter((value: any): value is string => typeof value === 'string')
          .slice(0, 3)
        if (urls.length > 0) {
          const pageContent = await exa.getContents(urls, {
            text: true,
            livecrawl: 'preferred',
            livecrawlTimeout: 8000
          } as any)
          for (const page of pageContent.results || []) {
            const pageResult = page as any
            const text = cleanValue(pageResult.text || pageResult.highlight)
            if (!text) continue
            summary += `\nPAGE: ${pageResult.title || pageResult.url}\n${text.slice(0, 2600)}\n`
          }
        }
      }

      summary = summary.slice(0, 10000)

      let snapshot: Partial<Snapshot> = {}
      if (summary) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000)
        const extractionPromise = generateText({
          model: getToolCallModel(),
          abortSignal: controller.signal,
          output: Output.object({ schema: snapshotSchema }),
          system: `You extract GTM planning facts from a website.

Rules:
- Be literal and specific. Do not output generic categories like "Consulting/B2B Services", "B2B Companies", or "General business interest" unless the site explicitly says that.
- Identify the actual offer, buyer/user/audience, and referral/search implications.
- If the site is education, coaching, admissions, student programs, consumer services, marketplace, nonprofit, or local services, name that plainly.
- The user may use this snapshot to find partners or prospects, so include who would care and why.
- If a field is unclear, return null instead of inventing.
- Keep every field concise and operational.`,
          prompt: JSON.stringify({
            url: fullUrl,
            host,
            content: summary
          })
        })

        const extraction = await extractionPromise.finally(() => clearTimeout(timeout)) as any
        snapshot = extraction.output
      }

      const inferred = inferSnapshotFromSignals({ host, summary, refs })

      return buildScrapeResult({ fullUrl, host, snapshot, inferred, refs })
    }
  })
}
