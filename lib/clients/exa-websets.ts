/**
 * Exa Websets API Client for HermesAI
 * Handles prospect research, enrichment, and data extraction using official exa-js SDK
 */

import { ProspectCriteria } from '@/components/campaign-builder'
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

export interface ListItemsResponse {
  data: WebsetItem[]
  object: string
  hasMore: boolean
  nextCursor?: string
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
    console.log('🔗 [ExaWebsetsClient] Creating webset with params:', JSON.stringify(params, null, 2))
    
    try {
      const result = await this.exa.websets.create(params as any) as any
      console.log('✅ [ExaWebsetsClient] Webset created successfully:', result.id)
      return result
    } catch (error) {
      console.error('❌ [ExaWebsetsClient] Error creating webset:', error)
      throw error
    }
  }

  /**
   * Get Webset by ID
   */
  async getWebset(websetId: string): Promise<Webset> {
    console.log(`🔗 [ExaWebsetsClient] Getting webset: ${websetId}`)
    
    try {
      const result = await this.exa.websets.get(websetId) as any
      console.log('✅ [ExaWebsetsClient] Webset retrieved:', result.id, 'Status:', result.status)
      return result
    } catch (error) {
      console.error('❌ [ExaWebsetsClient] Error getting webset:', error)
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
    console.log(`⏳ [ExaWebsetsClient] Waiting for webset to be idle: ${websetId}`)
    
    try {
      const result = await this.exa.websets.waitUntilIdle(websetId, options) as any
      console.log('✅ [ExaWebsetsClient] Webset is now idle:', result.id)
      return result
    } catch (error) {
      console.error('❌ [ExaWebsetsClient] Error waiting for webset to be idle:', error)
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
    console.log(`📋 [ExaWebsetsClient] Listing items for webset: ${websetId}`)
    
    try {
      const result = await this.exa.websets.items.list(websetId, options) as any
      console.log('✅ [ExaWebsetsClient] Items listed:', result.data.length, 'items')
      return result
    } catch (error) {
      console.error('❌ [ExaWebsetsClient] Error listing items:', error)
      throw error
    }
  }

  /**
   * Cancel a running Webset
   */
  async cancelWebset(websetId: string): Promise<void> {
    console.log(`🚫 [ExaWebsetsClient] Canceling webset: ${websetId}`)
    
    try {
      await this.exa.websets.cancel(websetId) as any
      console.log('✅ [ExaWebsetsClient] Webset canceled successfully')
    } catch (error) {
      console.error('❌ [ExaWebsetsClient] Error canceling webset:', error)
      throw error
    }
  }

  /**
   * Convert Webset item to our Prospect format
   */
  convertToProspect(item: WebsetItem): Prospect {
    console.log('🔄 [ExaWebsetsClient] Converting item to prospect:', item.id)
    
    // Parse enrichments from the Exa API format
    const enrichments = item.enrichments || {}
    let fullName = 'Unknown'
    let jobTitle = 'Unknown'
    let company = 'Unknown'
    let email: string | undefined
    let linkedinUrl: string | undefined
    let phone: string | undefined
    let location: string | undefined
    let industry: string | undefined
    let companySize: string | undefined
    
    // Extract data from enrichment results
    if (Array.isArray(enrichments)) {
      enrichments.forEach((enrichment: any) => {
        if (enrichment.status === 'completed' && enrichment.result && enrichment.result.length > 0) {
          const value = enrichment.result[0]
          
          // Map enrichment titles to our fields
          if (enrichment.enrichmentId?.includes('Full Name') || value.includes(' ')) {
            fullName = value
          } else if (enrichment.enrichmentId?.includes('Job Title') || 
                     value.toLowerCase().includes('cto') || 
                     value.toLowerCase().includes('chief') ||
                     value.toLowerCase().includes('technology')) {
            jobTitle = value
          } else if (enrichment.enrichmentId?.includes('Company') || 
                     !value.includes('@') && !value.includes('linkedin.com')) {
            company = value
          } else if (enrichment.enrichmentId?.includes('Email') || value.includes('@')) {
            email = value
          } else if (enrichment.enrichmentId?.includes('LinkedIn') || value.includes('linkedin.com')) {
            linkedinUrl = value
          } else if (
            enrichment.enrichmentId?.toLowerCase?.().includes('phone') ||
            /\+?\d[\d\s().-]{7,}/.test(value)
          ) {
            phone = value
          }
        }
      })
    }
    
    // Fallback to direct property access if enrichments array parsing didn't work
    if (fullName === 'Unknown') {
      fullName = item.title || 'Unknown'
    }
    if (jobTitle === 'Unknown') {
      const enrichmentsObj = enrichments as Record<string, any>
      jobTitle = enrichmentsObj.jobTitle || enrichmentsObj['Job Title'] || 'Unknown'
    }
    if (company === 'Unknown') {
      const enrichmentsObj = enrichments as Record<string, any>
      company = enrichmentsObj.company || enrichmentsObj['Company'] || 'Unknown'
    }
    if (!email) {
      const enrichmentsObj = enrichments as Record<string, any>
      email = enrichmentsObj.email || enrichmentsObj['Email']
    }
    if (!linkedinUrl) {
      const enrichmentsObj = enrichments as Record<string, any>
      linkedinUrl = enrichmentsObj.linkedin || enrichmentsObj['LinkedIn'] || item.url
    }
    if (!phone) {
      const enrichmentsObj = enrichments as Record<string, any>
      phone = enrichmentsObj.phone || enrichmentsObj['Phone']
    }
    if (!location) {
      const enrichmentsObj = enrichments as Record<string, any>
      location = enrichmentsObj.location || enrichmentsObj['Location']
    }
    if (!industry) {
      const enrichmentsObj = enrichments as Record<string, any>
      industry = enrichmentsObj.industry || enrichmentsObj['Industry']
    }
    if (!companySize) {
      const enrichmentsObj = enrichments as Record<string, any>
      companySize = enrichmentsObj.companySize || enrichmentsObj['Company Size']
    }
    
    const prospect: Prospect = {
      id: item.id,
      exaItemId: item.id,
      fullName,
      jobTitle,
      company,
      email,
      linkedinUrl,
      phone,
      location,
      industry,
      companySize,
      website: item.url,
      enrichments: enrichments
    }
    
    console.log('✅ [ExaWebsetsClient] Converted prospect:', prospect.fullName, 'at', prospect.company)
    return prospect
  }
}

/**
 * Create optimized search criteria for prospect research
 */
export function createProspectSearchCriteria(
  criteria: ProspectCriteria & { allCriteria?: Array<{ label: string; value: string; type: string }> }
): WebsetSearchConfig {
  console.log('🔧 [createProspectSearchCriteria] Creating search criteria for:', criteria.query)
  
  const entityType = criteria.entityType || 'company'
  
  // Build verification criteria from ALL extracted criteria
  const verificationCriteria: Array<{ description: string; successRate?: number }> = []
  
  // If we have detailed criteria from the AI extraction, use those
  if (criteria.allCriteria?.length) {
    console.log('🎯 [createProspectSearchCriteria] Using detailed AI-extracted criteria:', criteria.allCriteria.length)
    
    // Sort criteria by importance/type and take only the top 5 to respect Exa's limit
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
      .sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)
      .slice(0, 5) // Take only top 5 criteria to respect Exa's limit
    
    console.log(`🔢 [createProspectSearchCriteria] Limited to top ${prioritizedCriteria.length} criteria (Exa max: 5)`)
    
    prioritizedCriteria.forEach((criterion) => {
      verificationCriteria.push({
        description: criterion.description,
        successRate: criterion.successRate
      })
    })
  } else {
    // Fallback to basic filter-based criteria
    console.log('📋 [createProspectSearchCriteria] Using basic filter criteria')
    
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

  // Final safeguard: Ensure we never exceed Exa's 5-criteria limit
  if (verificationCriteria.length > 5) {
    logger.warn(`Too many criteria (${verificationCriteria.length}), trimming to 5`)
    verificationCriteria.splice(5) // Keep only first 5
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
  logger.debug('Creating enrichments')
  
  const enrichments: WebsetEnrichment[] = [
    {
      description: "Extract the full name from the LinkedIn profile or bio",
      format: 'text',
      instructions: "Look for the person's full name as displayed on their LinkedIn profile, bio, or about section. Return just the name."
    },
    {
      description: "Extract current job title and role",
      format: 'text',
      instructions: "Find the person's current job title, role, or position. Look for titles like 'Marketing Director', 'CTO', 'VP of Sales', etc."
    },
    {
      description: "Extract current company name",
      format: 'text',
      instructions: "Find the name of the company where this person currently works. Look in LinkedIn employment section or bio."
    },
    {
      description: "Extract email address",
      format: 'text',
      instructions: "Look for any email addresses mentioned in contact info, bio, or contact sections. Return only valid email format."
    },
    {
      description: "Extract LinkedIn profile URL",
      format: 'text',
      instructions: "Return the full LinkedIn profile URL for this person if available."
    }
  ]
  
  logger.debug('Created enrichments', { count: enrichments.length })
  return enrichments
}

export function convertToProspect(item: WebsetItem): Prospect {
  logger.debug('Converting item to prospect', { itemId: item.id })
  
  // Parse enrichments from the Exa API format
  const enrichments = item.enrichments || {}
  let fullName = 'Unknown'
  let jobTitle = 'Unknown'
  let company = 'Unknown'
  let email: string | undefined
  let linkedinUrl: string | undefined
  let location: string | undefined
  let industry: string | undefined
  let companySize: string | undefined
  
  // Extract data from enrichment results
  if (Array.isArray(enrichments)) {
    enrichments.forEach((enrichment: any) => {
      if (enrichment.status === 'completed' && enrichment.result && enrichment.result.length > 0) {
        const value = enrichment.result[0]
        
        // Map enrichment titles to our fields
        if (enrichment.enrichmentId?.includes('Full Name') || value.includes(' ')) {
          fullName = value
        } else if (enrichment.enrichmentId?.includes('Job Title') || 
                   value.toLowerCase().includes('cto') || 
                   value.toLowerCase().includes('chief') ||
                   value.toLowerCase().includes('technology')) {
          jobTitle = value
        } else if (enrichment.enrichmentId?.includes('Company') || 
                   !value.includes('@') && !value.includes('linkedin.com')) {
          company = value
        } else if (enrichment.enrichmentId?.includes('Email') || value.includes('@')) {
          email = value
        } else if (enrichment.enrichmentId?.includes('LinkedIn') || value.includes('linkedin.com')) {
          linkedinUrl = value
        }
      }
    })
  }
  
  // Fallback to direct property access if enrichments array parsing didn't work
  if (fullName === 'Unknown') {
    fullName = item.title || 'Unknown'
  }
  if (jobTitle === 'Unknown') {
    const enrichmentsObj = enrichments as Record<string, any>
    jobTitle = enrichmentsObj.jobTitle || enrichmentsObj['Job Title'] || 'Unknown'
  }
  if (company === 'Unknown') {
    const enrichmentsObj = enrichments as Record<string, any>
    company = enrichmentsObj.company || enrichmentsObj['Company'] || 'Unknown'
  }
  if (!email) {
    const enrichmentsObj = enrichments as Record<string, any>
    email = enrichmentsObj.email || enrichmentsObj['Email']
  }
  if (!linkedinUrl) {
    const enrichmentsObj = enrichments as Record<string, any>
    linkedinUrl = enrichmentsObj.linkedin || enrichmentsObj['LinkedIn'] || item.url
  }
  if (!location) {
    const enrichmentsObj = enrichments as Record<string, any>
    location = enrichmentsObj.location || enrichmentsObj['Location']
  }
  if (!industry) {
    const enrichmentsObj = enrichments as Record<string, any>
    industry = enrichmentsObj.industry || enrichmentsObj['Industry']
  }
  if (!companySize) {
    const enrichmentsObj = enrichments as Record<string, any>
    companySize = enrichmentsObj.companySize || enrichmentsObj['Company Size']
  }
  
  const prospect: Prospect = {
    id: item.id,
    exaItemId: item.id,
    fullName,
    jobTitle,
    company,
    email,
    linkedinUrl,
    location,
    industry,
    companySize,
    website: item.url,
    enrichments: enrichments
  }
  
  console.log('✅ [ExaWebsetsClient] Converted prospect:', prospect.fullName, 'at', prospect.company)
  return prospect
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