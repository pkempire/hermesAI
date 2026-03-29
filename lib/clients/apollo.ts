/**
 * Apollo.io API Client
 * 
 * Apollo has 275M contacts + 73M companies
 * Best for: Email, phone, LinkedIn enrichment
 * 
 * NOT good for: Company discovery, contextual enrichment
 * USE EXA FOR: Finding companies, recent activity, contextual data
 * USE APOLLO FOR: Contact info (email, phone, verified data)
 */

export interface ApolloCompanyEnrichment {
  id: string
  name: string
  domain: string
  industry: string
  employee_count: number
  revenue_range: string
  founded_year: number
  linkedin_url: string
  twitter_url: string
  facebook_url: string
}

export interface ApolloPersonEnrichment {
  id: string
  first_name: string
  last_name: string
  email: string
  email_status: 'verified' | 'guessed' | 'unavailable'
  phone_numbers: Array<{
    number: string
    type: 'mobile' | 'work' | 'home'
    status: 'verified' | 'guessed'
  }>
  linkedin_url: string
  title: string
  seniority: 'entry' | 'manager' | 'director' | 'vp' | 'c-level' | 'owner'
  departments: string[]
  company: {
    name: string
    domain: string
  }
}

export interface ApolloPersonSearchParams {
  // Company filters
  organization_ids?: string[]
  organization_domains?: string[]
  organization_num_employees_ranges?: string[]
  
  // Person filters
  person_titles?: string[]
  person_seniorities?: string[]
  person_departments?: string[]
  
  // Pagination
  page?: number
  per_page?: number // max 100
}

export interface ApolloPersonMatchParams {
  email?: string
  linkedin_url?: string
  first_name?: string
  last_name?: string
  organization_name?: string
  domain?: string
  reveal_personal_emails?: boolean
  reveal_phone_number?: boolean
  run_waterfall_email?: boolean
  run_waterfall_phone?: boolean
}

export class ApolloClient {
  private apiKey: string
  private baseUrl = 'https://api.apollo.io/api/v1'
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APOLLO_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('⚠️ [Apollo] No API key found. Set APOLLO_API_KEY env var.')
    }
  }
  
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Authorization: `Bearer ${this.apiKey}`
    }
  }

  /**
   * Enrich a person by email or LinkedIn URL.
   * Official docs:
   * - POST /api/v1/people/match
   * - Supports optional waterfall email/phone enrichment
   */
  async enrichPerson(params: ApolloPersonMatchParams): Promise<ApolloPersonEnrichment | null> {
    if (!this.apiKey) {
      console.warn('⚠️ [Apollo] Cannot enrich person - no API key')
      return null
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/people/match`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        console.error('❌ [Apollo] Person enrichment failed:', response.statusText)
        return null
      }
      
      const data = await response.json()
      return data.person as ApolloPersonEnrichment
    } catch (error) {
      console.error('❌ [Apollo] Person enrichment error:', error)
      return null
    }
  }
  
  /**
   * Search for people matching criteria.
   * Uses Apollo's API-first people search endpoint, which is optimized for net-new prospecting.
   */
  async searchPeople(params: ApolloPersonSearchParams): Promise<ApolloPersonEnrichment[]> {
    if (!this.apiKey) {
      console.warn('⚠️ [Apollo] Cannot search people - no API key')
      return []
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/mixed_people/api_search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...params,
          per_page: params.per_page || 25
        })
      })
      
      if (!response.ok) {
        console.error('❌ [Apollo] People search failed:', response.statusText)
        return []
      }
      
      const data = await response.json()
      return data.people as ApolloPersonEnrichment[]
    } catch (error) {
      console.error('❌ [Apollo] People search error:', error)
      return []
    }
  }
  
  /**
   * Enrich a company by domain
   */
  async enrichCompany(domain: string): Promise<ApolloCompanyEnrichment | null> {
    if (!this.apiKey) {
      console.warn('⚠️ [Apollo] Cannot enrich company - no API key')
      return null
    }
    
    try {
      const url = new URL(`${this.baseUrl}/organizations/enrich`)
      url.searchParams.set('domain', domain)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store'
      })

      if (!response.ok) {
        console.error('❌ [Apollo] Company enrichment failed:', response.statusText)
        return null
      }

      const data = await response.json()
      return (data.organization || data.account) as ApolloCompanyEnrichment
    } catch (error) {
      console.error('❌ [Apollo] Company enrichment error:', error)
      return null
    }
  }
}

export function createApolloClient(): ApolloClient {
  return new ApolloClient()
}
