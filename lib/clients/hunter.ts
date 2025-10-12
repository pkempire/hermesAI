/**
 * Hunter.io API Client for Email Verification and Discovery
 * Provides 95% deliverability with real-time verification
 */

interface HunterEmailResult {
  email: string | null
  score: number
  verification: {
    result: 'deliverable' | 'undeliverable' | 'risky' | 'unknown'
    score: number
  }
  first_name?: string
  last_name?: string
  position?: string
  linkedin?: string
}

interface HunterDomainSearch {
  emails: HunterEmailResult[]
  company: string
  domain: string
  organization: string
}

export class HunterClient {
  private apiKey: string
  private baseUrl = 'https://api.hunter.io/v2'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUNTER_API_KEY || ''
    if (!this.apiKey) {
      console.warn('⚠️ [Hunter] No API key provided - email enrichment will be disabled')
    }
  }

  /**
   * Find verified email addresses for a specific domain
   */
  async findEmails(domain: string, limit = 5): Promise<HunterEmailResult[]> {
    if (!this.apiKey) return []

    try {
      const url = `${this.baseUrl}/domain-search?domain=${encodeURIComponent(domain)}&api_key=${this.apiKey}&limit=${limit}`

      console.log(`🔍 [Hunter] Searching emails for domain: ${domain}`)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Hunter API error: ${response.status}`)
      }

      const data = await response.json() as { data: HunterDomainSearch }

      // Filter for verified emails only
      const verifiedEmails = data.data.emails.filter(email =>
        email.verification.result === 'deliverable' &&
        email.verification.score >= 85
      )

      console.log(`✅ [Hunter] Found ${verifiedEmails.length} verified emails for ${domain}`)
      return verifiedEmails

    } catch (error) {
      console.error(`❌ [Hunter] Failed to find emails for ${domain}:`, error)
      return []
    }
  }

  /**
   * Find specific email by person name and domain
   */
  async findPersonEmail(firstName: string, lastName: string, domain: string): Promise<HunterEmailResult | null> {
    if (!this.apiKey) return null

    try {
      const url = `${this.baseUrl}/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${this.apiKey}`

      console.log(`🔍 [Hunter] Finding email for ${firstName} ${lastName} at ${domain}`)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Hunter API error: ${response.status}`)
      }

      const data = await response.json() as { data: HunterEmailResult }

      // Only return if email is deliverable
      if (data.data.verification.result === 'deliverable') {
        console.log(`✅ [Hunter] Found verified email: ${data.data.email}`)
        return data.data
      }

      console.log(`⚠️ [Hunter] Email found but not verified as deliverable`)
      return null

    } catch (error) {
      console.error(`❌ [Hunter] Failed to find email for ${firstName} ${lastName}:`, error)
      return null
    }
  }

  /**
   * Verify an email address
   */
  async verifyEmail(email: string): Promise<{ deliverable: boolean; score: number }> {
    if (!this.apiKey) return { deliverable: false, score: 0 }

    try {
      const url = `${this.baseUrl}/email-verifier?email=${encodeURIComponent(email)}&api_key=${this.apiKey}`

      console.log(`🔍 [Hunter] Verifying email: ${email}`)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Hunter API error: ${response.status}`)
      }

      const data = await response.json() as { data: { result: string; score: number } }

      const deliverable = data.data.result === 'deliverable' && data.data.score >= 85
      console.log(`${deliverable ? '✅' : '❌'} [Hunter] Email verification: ${email} - ${data.data.result} (${data.data.score}%)`)

      return {
        deliverable,
        score: data.data.score
      }

    } catch (error) {
      console.error(`❌ [Hunter] Failed to verify email ${email}:`, error)
      return { deliverable: false, score: 0 }
    }
  }

  /**
   * Enrich prospect data with verified emails
   */
  async enrichProspectEmails(prospects: Array<{
    company?: string
    domain?: string
    firstName?: string
    lastName?: string
    targetRole?: string
  }>): Promise<Array<{ email?: string; emailScore?: number; verified?: boolean }>> {

    if (!this.apiKey) {
      console.warn('⚠️ [Hunter] No API key - returning prospects without email enrichment')
      return prospects.map(() => ({}))
    }

    console.log(`🚀 [Hunter] Enriching ${prospects.length} prospects with verified emails`)

    const enrichedProspects = await Promise.allSettled(
      prospects.map(async (prospect) => {
        if (!prospect.domain) return {}

        // Try to find specific person email if we have name
        if (prospect.firstName && prospect.lastName) {
          const personEmail = await this.findPersonEmail(
            prospect.firstName,
            prospect.lastName,
            prospect.domain
          )

          if (personEmail) {
            return {
              email: personEmail.email,
              emailScore: personEmail.verification.score,
              verified: true
            }
          }
        }

        // Fallback: find general emails for the domain
        const domainEmails = await this.findEmails(prospect.domain, 3)

        if (domainEmails.length > 0) {
          // Prefer emails that match the target role
          const roleMatch = domainEmails.find(email =>
            prospect.targetRole && email.position?.toLowerCase().includes(prospect.targetRole.toLowerCase())
          )

          const bestEmail = roleMatch || domainEmails[0]

          return {
            email: bestEmail.email,
            emailScore: bestEmail.verification.score,
            verified: bestEmail.verification.result === 'deliverable'
          }
        }

        return {}
      })
    )

    const results = enrichedProspects.map(result =>
      result.status === 'fulfilled' ? result.value : {}
    )

    const verifiedCount = results.filter(r => r.verified).length
    console.log(`✅ [Hunter] Enriched ${verifiedCount}/${prospects.length} prospects with verified emails`)

    return results
  }
}

// Default client instance
export const hunterClient = new HunterClient()