/**
 * Exa Websets API Client for HermesAI
 * Handles prospect research, enrichment, and data extraction using official exa-js SDK
 */

import { ProspectCriteria } from '@/lib/types/prospecting'
import { Prospect } from '@/components/prospect-grid'
import { logger } from '@/lib/utils/logger'
import Exa from 'exa-js'

// Exa Websets API Types (matching official SDK)
export interface WebsetSearchConfig {
  query: string
  count?: number
  entity?: {
    type: 'company' | 'person' | 'mixed'
  }
  criteria?: Array<{
    description: string
    successRate?: number
  }>
  behavior?: 'override' | 'append'
  exclude?: Array<{
    source: string
    id: string
  }>
  scope?: Array<{
    source: string
    id: string
  }>
}

export interface WebsetEnrichment {
  description: string
  format: 'text' | 'json' | 'structured' | 'number'
  options?: Array<{
    label: string
  }>
  instructions?: string
}

export interface CreateWebsetParams {
  externalId?: string
  search?: WebsetSearchConfig
  enrichments?: WebsetEnrichment[]
  metadata?: Record<string, any>
}

export interface WebsetItem {
  id: string
  object: string
  websetId: string
  url: string
  title?: string
  text?: string
  enrichments?: Record<string, any>
  properties?: Record<string, any>
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Webset {
  id: string
  object: string
  status: string // Use broader string type to match SDK
  title?: string
  externalId?: string
  searches: Array<{
    id: string
    status: string
    progress?: {
      found: number
      analyzed: number
      completion: number
      timeLeft?: number
    }
  }>
  enrichments: Array<WebsetEnrichment & { id: string; status: string }>
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

type EnrichmentDescriptionMap = Record<string, string>

export interface ListItemsResponse {
  data: WebsetItem[]
  object: string
  hasMore: boolean
  nextCursor?: string
}

export type CanonicalProspectEnrichment = {
  label: string
  value: string
  required: boolean
}

const CANONICAL_ENRICHMENT_DEFINITIONS: Record<string, { description: string; instructions: string }> = {
  company_name: {
    description: 'Extract the company name',
    instructions: 'Return the official company or firm name.'
  },
  company_domain: {
    description: 'Extract the company domain',
    instructions: 'Return the canonical website domain for the firm.'
  },
  company_linkedin: {
    description: 'Extract the company LinkedIn URL',
    instructions: 'Return the LinkedIn company page URL if available.'
  },
  location: {
    description: 'Extract the company location',
    instructions: 'Return the primary city, metro, or region for the firm.'
  },
  industry: {
    description: 'Extract the company specialization',
    instructions: 'Describe the company specialization, niche, or core market.'
  },
  company_size: {
    description: 'Estimate the company size',
    instructions: 'Return a concise company size or team-size estimate if available.'
  },
  decision_maker_name: {
    description: 'Find the primary decision maker name',
    instructions: 'Identify the founder, owner, CEO, or most relevant operator likely to evaluate partnerships.'
  },
  decision_maker_title: {
    description: 'Find the primary decision maker title',
    instructions: 'Return the title of the founder, owner, CEO, or most relevant operator likely to evaluate partnerships.'
  },
  decision_maker_linkedin: {
    description: 'Find the primary decision maker LinkedIn URL',
    instructions: 'Return the LinkedIn profile URL for the founder, owner, CEO, or most relevant operator likely to evaluate partnerships.'
  },
  decision_maker_email: {
    description: 'Find the primary decision maker email',
    instructions: 'Return a direct or best available business email for the primary decision maker if confidently available.'
  },
  email: {
    description: 'Find a business email address',
    instructions: 'Return a business email address if confidently available.'
  }
}

export function buildCanonicalProspectEnrichments(targetPersona?: string): CanonicalProspectEnrichment[] {
  return [
    { label: 'Company Name', value: 'company_name', required: true },
    { label: 'Company Domain', value: 'company_domain', required: true },
    { label: 'Company LinkedIn', value: 'company_linkedin', required: false },
    { label: 'Location', value: 'location', required: false },
    { label: 'Decision Maker Name', value: 'decision_maker_name', required: true },
    { label: 'Decision Maker Title', value: 'decision_maker_title', required: true },
    { label: 'Decision Maker LinkedIn', value: 'decision_maker_linkedin', required: true },
    { label: 'Decision Maker Email', value: 'decision_maker_email', required: false }
  ].map(enrichment => ({
    ...enrichment,
    label:
      enrichment.value === 'decision_maker_name' && targetPersona
        ? `${targetPersona} Name`
        : enrichment.value === 'decision_maker_title' && targetPersona
        ? `${targetPersona} Title`
        : enrichment.label
  }))
}

export function buildWebsetEnrichments(
  enrichments: Array<string | { value?: string; label?: string; description?: string }>
): WebsetEnrichment[] {
  const seen = new Set<string>()
  const result: WebsetEnrichment[] = []

  for (const enrichment of enrichments) {
    const key =
      typeof enrichment === 'string'
        ? enrichment
        : enrichment.value || enrichment.label || enrichment.description || ''

    const normalizedKey = key.toLowerCase().trim()
    if (!normalizedKey || seen.has(normalizedKey)) continue

    const definition = CANONICAL_ENRICHMENT_DEFINITIONS[normalizedKey]
    const displayLabel =
      (typeof enrichment === 'object' && enrichment.label?.trim()) ||
      definition?.description
        ?.replace(/^Extract\s+/i, '')
        .replace(/^Find\s+/i, '')
        .replace(/^Estimate\s+/i, '')
        .trim() ||
      humanizePropertyKey(normalizedKey)

    result.push({
      description:
        displayLabel,
      format: 'text',
      instructions:
        (typeof enrichment === 'object' && enrichment.description?.trim()) ||
        definition?.instructions ||
        (typeof enrichment === 'object' && enrichment.label
          ? `Return ${enrichment.label.toLowerCase()} if confidently available.`
          : `Look for and extract ${normalizedKey.replace(/_/g, ' ')} from the source content.`)
    })
    seen.add(normalizedKey)
  }

  return result.slice(0, 10)
}

function toCleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'None' || trimmed === 'Unknown') {
    return undefined
  }
  return trimmed
}

function toFirstString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return toCleanString(value.find(entry => typeof entry === 'string'))
  }
  return toCleanString(value)
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncateText(value: string, max = 220): string {
  if (value.length <= max) return value
  return `${value.slice(0, max).trim()}…`
}

function looksLikeDomain(value: string): boolean {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)
}

function looksLikePhone(value: string): boolean {
  return /\+?\d[\d\s().-]{7,}/.test(value)
}

function looksLikeJobTitle(value: string): boolean {
  return /\b(founder|ceo|cto|coo|chief|director|manager|lead|head|partner|president|vp|engineer|marketer|sales|growth|recruiter)\b/i.test(value)
}

function looksLikePersonName(value: string): boolean {
  const clean = value.trim()
  if (!clean) return false
  if (clean.length > 60) return false
  if (/\b(inc|llc|corp|company|college|university|school|education|consulting|admissions|academy|group|partners|firm)\b/i.test(clean)) {
    return false
  }

  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length < 2 || parts.length > 4) return false

  return parts.every(part => /^[A-Z][a-z.'-]+$/.test(part))
}

function looksLikeOrganizationName(value: string): boolean {
  return /\b(inc|llc|corp|company|college|university|school|education|consulting|admissions|academy|group|partners|firm|directory|network|association|foundation|community)\b/i.test(
    value
  )
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function inferCompanyFromUrl(url?: string): string | undefined {
  const clean = toCleanString(url)
  if (!clean) return undefined

  try {
    const hostname = new URL(clean.startsWith('http') ? clean : `https://${clean}`).hostname
      .replace(/^www\./, '')
      .split('.')
      .slice(0, -1)
      .join(' ')
    return hostname ? titleCaseFromSlug(hostname) : undefined
  } catch {
    return undefined
  }
}

function humanizePropertyKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function extractCompanyFromDescription(value?: string): string | undefined {
  const clean = toCleanString(value)
  if (!clean) return undefined

  const normalized = stripHtml(clean)
  const match = normalized.match(/^([A-Z][A-Za-z0-9&.,'’\- ]{1,80}?)\s+(?:is|offers|provides|helps|serves)\b/)
  return toCleanString(match?.[1])
}

function cleanLongText(value?: string): string | undefined {
  const clean = toCleanString(value)
  if (!clean) return undefined
  const stripped = stripHtml(clean)
  if (!stripped) return undefined
  return truncateText(stripped, 240)
}

const EXCLUDED_PROPERTY_KEYS = new Set([
  'id',
  'object',
  'websetid',
  'type',
  'url',
  'urls',
  'content',
  'text',
  'html',
  'title',
  'name',
  'description',
  'createdat',
  'updatedat',
  'metadata',
  'source',
  'search',
  'query',
  'raw',
  'image',
  'avatar',
  'logo'
])

const CORE_PROPERTY_KEYS = new Set([
  'company_name',
  'company',
  'organization',
  'company_domain',
  'website',
  'company_linkedin',
  'decision_maker_name',
  'decision_maker_title',
  'decision_maker_linkedin',
  'decision_maker_email',
  'email',
  'location',
  'industry',
  'company_size',
  'phone'
])

function normalizePropertyEnrichments(rawProperties: unknown): Array<{ title: string; value: string; result: string; format?: string }> {
  if (!rawProperties || typeof rawProperties !== 'object' || Array.isArray(rawProperties)) return []

  return Object.entries(rawProperties as Record<string, any>)
    .map(([key, value]) => {
      const normalizedKey = key.toLowerCase().trim()
      if (!normalizedKey || EXCLUDED_PROPERTY_KEYS.has(normalizedKey) || CORE_PROPERTY_KEYS.has(normalizedKey)) {
        return null
      }

      const result = toFirstString(value)
      if (!result) return null
      if (result.length > 280) return null

      return {
        title: humanizePropertyKey(key),
        value: result,
        result
      }
    })
    .filter(Boolean) as Array<{ title: string; value: string; result: string; format?: string }>
}

function parseItemTitle(title?: string): Partial<Prospect> {
  const cleanTitle = toCleanString(title)
  if (!cleanTitle) return {}

  const dashParts = cleanTitle.split(' - ')
  if (dashParts.length >= 2) {
    const fullName = dashParts[0]?.trim()
    const roleCompany = dashParts.slice(1).join(' - ').trim()

    if (roleCompany.includes(' at ')) {
      const [jobTitle, company] = roleCompany.split(' at ')
      return {
        fullName: toCleanString(fullName),
        jobTitle: toCleanString(jobTitle),
        company: toCleanString(company)
      }
    }

    return {
      fullName: toCleanString(fullName),
      jobTitle: toCleanString(roleCompany)
    }
  }

  if (looksLikePersonName(cleanTitle)) {
    return { fullName: cleanTitle }
  }

  return { company: cleanTitle }
}

function buildSummary(company?: string, industry?: string, companySize?: string): string | undefined {
  const parts = [company, industry, companySize ? `${companySize} employees` : undefined].filter(Boolean)
  return parts.length > 0 ? parts.join(' • ') : undefined
}

function normalizeStructuredEnrichments(
  rawEnrichments: unknown,
  enrichmentDescriptions?: EnrichmentDescriptionMap
): Array<{ title: string; value: string; result: string; format?: string }> {
  if (!rawEnrichments) return []

  if (Array.isArray(rawEnrichments)) {
    return rawEnrichments
      .filter((entry: any) => entry?.status === 'completed')
      .map((entry: any, index) => {
        const result = toFirstString(entry?.result)
        if (!result) return null

        const title =
          toCleanString(entry?.description) ||
          toCleanString(entry?.enrichmentId ? enrichmentDescriptions?.[entry.enrichmentId] : undefined) ||
          toCleanString(entry?.enrichmentId) ||
          `Enrichment ${index + 1}`

        return {
          title,
          value: result,
          result,
          format: toCleanString(entry?.format)
        }
      })
      .filter(Boolean) as Array<{ title: string; value: string; result: string; format?: string }>
  }

  if (typeof rawEnrichments === 'object') {
    return Object.entries(rawEnrichments as Record<string, any>)
      .map(([key, value]) => {
        if (value && typeof value === 'object') {
          if (value.status && value.status !== 'completed') return null
          const result = toFirstString(value.result ?? value.value)
          if (!result) return null
          return {
            title: toCleanString(value.description) || key,
            value: result,
            result,
            format: toCleanString(value.format)
          }
        }

        const result = toCleanString(value)
        if (!result) return null
        return { title: key, value: result, result }
      })
      .filter(Boolean) as Array<{ title: string; value: string; result: string; format?: string }>
  }

  return []
}

function mergeEnrichmentSources(
  sources: unknown[],
  enrichmentDescriptions?: EnrichmentDescriptionMap
): Array<{ title: string; value: string; result: string; format?: string }> {
  const seen = new Set<string>()
  const merged: Array<{ title: string; value: string; result: string; format?: string }> = []

  for (const source of sources) {
    const entries = normalizeStructuredEnrichments(source, enrichmentDescriptions)
    for (const entry of entries) {
      const key = `${entry.title.toLowerCase().trim()}:${entry.result.toLowerCase().trim()}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(entry)
    }
  }

  return merged
}

function extractProspectFields(
  item: WebsetItem,
  structuredEnrichments: Array<{ title: string; value: string; result: string; format?: string }>
): Partial<Prospect> & { summary?: string } {
  const base = parseItemTitle(item.title)
  const inferredCompany = inferCompanyFromUrl(item.url)
  const descriptionText =
    cleanLongText(toFirstString(item.properties?.description)) ||
    cleanLongText(item.text) ||
    cleanLongText(item.title)
  const descriptionCompany = extractCompanyFromDescription(descriptionText)
  const inferredFromUrl = item.url?.includes('linkedin.com/in/')
    ? titleCaseFromSlug(item.url.split('/in/')[1]?.split('/')[0] || '')
    : undefined

  const prospect: Partial<Prospect> & { summary?: string } = {
    fullName:
      toFirstString(item.properties?.decision_maker_name) ||
      toFirstString(item.properties?.name) ||
      (base.fullName && looksLikePersonName(base.fullName) ? base.fullName : undefined) ||
      inferredFromUrl,
    jobTitle:
      toFirstString(item.properties?.decision_maker_title) ||
      base.jobTitle,
    company:
      toFirstString(item.properties?.company_name) ||
      toFirstString(item.properties?.company) ||
      toFirstString(item.properties?.organization) ||
      base.company ||
      descriptionCompany ||
      inferredCompany,
    linkedinUrl:
      toFirstString(item.properties?.decision_maker_linkedin) ||
      toFirstString(item.properties?.company_linkedin) ||
      (item.url?.includes('linkedin.com') ? item.url : undefined),
    website:
      toFirstString(item.properties?.company_domain) ||
      toFirstString(item.properties?.website) ||
      item.url,
    avatarUrl: toCleanString(item.metadata?.image) || toCleanString(item.metadata?.avatar),
    companyLogoUrl: toCleanString(item.metadata?.logo),
    summary: descriptionText
  }

  for (const enrichment of structuredEnrichments) {
    const title = enrichment.title.toLowerCase()
    const value = enrichment.result
    const valueLower = value.toLowerCase()

    if (!prospect.email && (title.includes('email') || value.includes('@'))) {
      prospect.email = value
      continue
    }
    if (!prospect.linkedinUrl && (title.includes('linkedin') || valueLower.includes('linkedin.com'))) {
      prospect.linkedinUrl = value
      continue
    }
    if (!prospect.phone && (title.includes('phone') || looksLikePhone(value))) {
      prospect.phone = value
      continue
    }
    if (!prospect.location && title.includes('location')) {
      prospect.location = value
      continue
    }
    if (!prospect.industry && (title.includes('industry') || title.includes('specialization') || title.includes('offering') || title.includes('description'))) {
      prospect.industry = value
      continue
    }
    if (!prospect.companySize && (title.includes('employee') || title.includes('company size') || title.includes('headcount'))) {
      prospect.companySize = value
      continue
    }
    if (!prospect.website && (title.includes('domain') || title.includes('website') || looksLikeDomain(value))) {
      prospect.website = value.startsWith('http') ? value : `https://${value}`
      continue
    }
    if (!prospect.jobTitle && (title.includes('job title') || title === 'title' || looksLikeJobTitle(value))) {
      prospect.jobTitle = value
      continue
    }
    if (!prospect.company && (title.includes('company') || title.includes('organization') || title.includes('firm'))) {
      prospect.company = value
      continue
    }
    if ((!prospect.fullName || prospect.fullName === inferredCompany) && (title.includes('name') || title.includes('decision maker'))) {
      prospect.fullName = value
    }
  }

  if (
    prospect.fullName &&
    ((prospect.company && prospect.fullName.trim().toLowerCase() === prospect.company.trim().toLowerCase()) ||
      looksLikeOrganizationName(prospect.fullName))
  ) {
    prospect.fullName = undefined
  }

  if (
    prospect.jobTitle &&
    prospect.company &&
    prospect.jobTitle.trim().toLowerCase() === prospect.company.trim().toLowerCase()
  ) {
    prospect.jobTitle = undefined
  }

  return prospect
}

function buildFitScore(prospect: Prospect): number {
  const scoreSignals = [
    prospect.email ? 25 : 0,
    prospect.linkedinUrl ? 20 : 0,
    prospect.company && prospect.company !== 'Unknown' ? 15 : 0,
    prospect.jobTitle && prospect.jobTitle !== 'Unknown' ? 10 : 0,
    prospect.companySize ? 10 : 0,
    prospect.industry ? 10 : 0,
    prospect.website ? 10 : 0,
  ]

  return Math.min(100, scoreSignals.reduce((sum, value) => sum + value, 0))
}

function normalizeProspect(item: WebsetItem): Prospect {
  const structuredEnrichments = mergeEnrichmentSources(
    [item.enrichments, normalizePropertyEnrichments(item.properties)],
    undefined
  )
  const fields = extractProspectFields(item, structuredEnrichments)
  const inferredCompany = inferCompanyFromUrl(item.url)
  const resolvedCompany = fields.company || inferredCompany || ''

  const prospect: Prospect = {
    id: item.id,
    exaItemId: item.id,
    fullName: fields.fullName || '',
    jobTitle: fields.jobTitle,
    company: resolvedCompany,
    email: fields.email,
    linkedinUrl: fields.linkedinUrl,
    phone: fields.phone,
    location: fields.location,
    industry: fields.industry,
    companySize: fields.companySize,
    website:
      fields.website && looksLikeDomain(fields.website)
        ? `https://${fields.website}`
        : fields.website || item.url,
    enrichments: structuredEnrichments,
    avatarUrl: fields.avatarUrl,
    companyLogoUrl: fields.companyLogoUrl
  }

  ;(prospect as any).fitScore = buildFitScore(prospect)
  ;(prospect as any).summary =
    fields.summary ||
    buildSummary(prospect.company, prospect.industry, prospect.companySize)

  return prospect
}

function normalizeProspectWithDescriptions(
  item: WebsetItem,
  enrichmentDescriptions?: EnrichmentDescriptionMap
): Prospect {
  const structuredEnrichments = mergeEnrichmentSources(
    [item.enrichments, normalizePropertyEnrichments(item.properties)],
    enrichmentDescriptions
  )
  const fields = extractProspectFields(item, structuredEnrichments)
  const inferredCompany = inferCompanyFromUrl(item.url)
  const resolvedCompany = fields.company || inferredCompany || ''

  const prospect: Prospect = {
    id: item.id,
    exaItemId: item.id,
    fullName: fields.fullName || '',
    jobTitle: fields.jobTitle,
    company: resolvedCompany,
    email: fields.email,
    linkedinUrl: fields.linkedinUrl,
    phone: fields.phone,
    location: fields.location,
    industry: fields.industry,
    companySize: fields.companySize,
    website:
      fields.website && looksLikeDomain(fields.website)
        ? `https://${fields.website}`
        : fields.website || item.url,
    enrichments: structuredEnrichments,
    avatarUrl: fields.avatarUrl,
    companyLogoUrl: fields.companyLogoUrl
  }

  ;(prospect as any).fitScore = buildFitScore(prospect)
  ;(prospect as any).summary =
    fields.summary ||
    buildSummary(prospect.company, prospect.industry, prospect.companySize)

  return prospect
}

export function createEnrichmentDescriptionMap(webset?: Pick<Webset, 'enrichments'> | null): EnrichmentDescriptionMap {
  if (!webset?.enrichments) return {}
  return webset.enrichments.reduce<EnrichmentDescriptionMap>((acc, enrichment) => {
    if (enrichment?.id && enrichment?.description) {
      acc[enrichment.id] = enrichment.description
    }
    return acc
  }, {})
}

export class ExaWebsetsClient {
  private exa: Exa
  private useFastApi: boolean

  constructor(apiKey: string, options?: { fastApi?: boolean }) {
    if (!apiKey) {
      throw new Error('EXA_API_KEY is required')
    }
    this.exa = new Exa(apiKey)
    this.useFastApi = options?.fastApi ?? true // Default to fast API for speed
  }

  /**
   * Preview a Webset configuration from a natural language query.
   * Uses Exa Websets Preview API to extract entity type, criteria, and enrichments.
   */
  async previewWebset(query: string, entity?: 'person' | 'company') {
    const apiKey = (this.exa as any).apiKey || process.env.EXA_API_KEY
    if (!apiKey) {
      throw new Error('EXA_API_KEY is required for preview')
    }
    const body: any = { query }
    if (entity) body.entity = { type: entity }

    const res = await fetch('https://api.exa.ai/websets/v0/websets/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Exa preview failed: ${res.status} ${text}`)
    }
    const json = await res.json()
    return json as {
      search?: { entity?: { type?: 'person' | 'company' }; criteria?: Array<{ description: string }> }
      enrichments?: Array<{ description: string; format?: string; options?: Array<{ label: string }> }>
    }
  }

  /**
   * Create a new Webset with search and enrichments
   */
  async createWebset(params: CreateWebsetParams): Promise<Webset> {
    try {
      logger.debug('[ExaWebsetsClient] Creating webset', {
        query: params.search?.query,
        entityType: params.search?.entity?.type,
        criteriaCount: params.search?.criteria?.length || 0,
        enrichmentsCount: params.enrichments?.length || 0
      })
      const result = await this.exa.websets.create(params as any) as any
      logger.debug('[ExaWebsetsClient] Webset created', result.id)
      return result
    } catch (error) {
      logger.error('[ExaWebsetsClient] Error creating webset:', error)
      throw error
    }
  }

  /**
   * Get Webset by ID
   */
  async getWebset(websetId: string): Promise<Webset> {
    try {
      const result = await this.exa.websets.get(websetId) as any
      return result
    } catch (error) {
      logger.error('[ExaWebsetsClient] Error getting webset:', error)
      throw error
    }
  }

  /**
   * Wait until Webset completes processing
   */
  async waitUntilIdle(websetId: string, options?: {
    timeout?: number
    pollInterval?: number
    onPoll?: (status: string) => void
  }): Promise<Webset> {
    try {
      const result = await this.exa.websets.waitUntilIdle(websetId, options) as any
      return result
    } catch (error) {
      logger.error('[ExaWebsetsClient] Error waiting for webset to be idle:', error)
      throw error
    }
  }

  /**
   * List items in a Webset
   */
  async listItems(websetId: string, options?: {
    limit?: number
    cursor?: string
  }): Promise<ListItemsResponse> {
    try {
      const result = await this.exa.websets.items.list(websetId, options) as any
      return result
    } catch (error) {
      logger.error('[ExaWebsetsClient] Error listing items:', error)
      throw error
    }
  }

  /**
   * Cancel a running Webset
   */
  async cancelWebset(websetId: string): Promise<void> {
    try {
      await this.exa.websets.cancel(websetId) as any
    } catch (error) {
      logger.error('[ExaWebsetsClient] Error canceling webset:', error)
      throw error
    }
  }

  /**
   * Convert Webset item to our Prospect format
   */
  convertToProspect(item: WebsetItem, enrichmentDescriptions?: EnrichmentDescriptionMap): Prospect {
    return enrichmentDescriptions
      ? normalizeProspectWithDescriptions(item, enrichmentDescriptions)
      : normalizeProspect(item)
  }
}

/**
 * Create optimized search criteria for prospect research
 */
export function createProspectSearchCriteria(
  criteria: ProspectCriteria & { allCriteria?: Array<{ label: string; value: string; type: string }> }
): WebsetSearchConfig {
  logger.debug('[createProspectSearchCriteria] Creating search criteria for:', criteria.query)
  
  const entityType = criteria.entityType || 'company'
  
  // Build verification criteria from ALL extracted criteria
  const verificationCriteria: Array<{ description: string; successRate?: number }> = []
  
  // If we have detailed criteria from the AI extraction, use those
  if (criteria.allCriteria?.length) {
    logger.debug('[createProspectSearchCriteria] Using detailed AI-extracted criteria:', criteria.allCriteria.length)
    
    // Websets performs best with a small number of strong verification criteria.
    const prioritizedCriteria = criteria.allCriteria
      .map((criterion) => {
        let successRate = 70 // Default success rate
        let priority = 50 // Default priority for sorting
        
        // Set success rates and priority based on criterion type
        switch (criterion.type) {
          case 'job_title':
            successRate = 85
            priority = 90
            break
          case 'industry':
            successRate = 75
            priority = 80
            break
          case 'technology':
            successRate = 65
            priority = 70
            break
          case 'activity':
            successRate = 60
            priority = 60
            break
          case 'location':
            successRate = 80
            priority = 75
            break
          case 'company_type':
            successRate = 70
            priority = 85
            break
          case 'other':
            successRate = 60
            priority = 50
            break
          default:
            successRate = 65
            priority = 55
        }
        
        return {
          description: criterion.label,
          successRate,
          priority
        }
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
    
    logger.debug(`[createProspectSearchCriteria] Limited to top ${prioritizedCriteria.length} criteria`)
    
    prioritizedCriteria.forEach((criterion) => {
      verificationCriteria.push({
        description: criterion.description,
        successRate: criterion.successRate
      })
    })
  } else {
    // Fallback to basic filter-based criteria
    logger.debug('[createProspectSearchCriteria] Using basic filter criteria')
    
    if (criteria.filters.jobTitles?.length) {
      verificationCriteria.push({
        description: `Person has one of these job titles: ${criteria.filters.jobTitles.join(', ')}`,
        successRate: 80
      })
    }
    
    if (criteria.filters.industry?.length) {
      verificationCriteria.push({
        description: `Company operates in one of these industries: ${criteria.filters.industry.join(', ')}`,
        successRate: 70
      })
    }
    
    if (criteria.filters.technologies?.length) {
      verificationCriteria.push({
        description: `Uses or works with these technologies: ${criteria.filters.technologies.join(', ')}`,
        successRate: 65
      })
    }
    
    if (criteria.filters.activities?.length) {
      verificationCriteria.push({
        description: `Recent activity includes: ${criteria.filters.activities.join(', ')}`,
        successRate: 60
      })
    }
    
    if (criteria.filters.location?.length) {
      verificationCriteria.push({
        description: `Person or company is located in: ${criteria.filters.location.join(', ')}`,
        successRate: 75
      })
    }
    
    if (criteria.filters.companySize) {
      verificationCriteria.push({
        description: `Company has employee count in range: ${criteria.filters.companySize}`,
        successRate: 60
      })
    }
  }

  if (verificationCriteria.length > 3) {
    logger.warn(`Too many criteria (${verificationCriteria.length}), trimming to 3`)
    verificationCriteria.splice(3)
  }

  const searchConfig: WebsetSearchConfig = {
    query: criteria.query,
    count: Math.max(1, Math.min(criteria.targetCount || 100, 1000)), // Respect API limits (1-1000)
    entity: { type: entityType },
    criteria: verificationCriteria,
    behavior: 'override'
  }
  
  logger.debug('Search config created', { 
    criteriaCount: verificationCriteria.length,
    targetCount: searchConfig.count,
    entityType
  })
  return searchConfig
}

/**
 * Create enrichments for prospect data
 */
export function createProspectEnrichments(): WebsetEnrichment[] {
  const enrichments = buildWebsetEnrichments(
    buildCanonicalProspectEnrichments().map(enrichment => enrichment.value)
  )
  logger.debug('Created enrichments', { count: enrichments.length })
  return enrichments
}

export function convertToProspect(
  item: WebsetItem,
  enrichmentDescriptions?: EnrichmentDescriptionMap
): Prospect {
  return enrichmentDescriptions
    ? normalizeProspectWithDescriptions(item, enrichmentDescriptions)
    : normalizeProspect(item)
}

// Create client instance with proper error handling
export function createExaWebsetsClient(): ExaWebsetsClient {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) {
    throw new Error('EXA_API_KEY environment variable is not set')
  }
  return new ExaWebsetsClient(apiKey)
}

// Export a function to get the client when needed
export const getExaWebsetsClient = () => createExaWebsetsClient() 
