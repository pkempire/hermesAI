export interface ProspectCriteria {
  query: string
  entityType: 'company' | 'person' | 'mixed'
  targetCount: number
  includeEnrichments: string[]
  allCriteria?: Array<{ label: string; value: string; type: string }>
  filters: {
    industry?: string[]
    companySize?: string
    location?: string[]
    jobTitles?: string[]
    technologies?: string[]
    activities?: string[]
    other?: string[]
    revenueRange?: string
  }
}

export interface EmailSequence {
  id: string
  type: 'initial' | 'follow_up_1' | 'follow_up_2' | 'follow_up_3'
  subject: string
  body: string
  delayDays: number
}

export interface CampaignSettings {
  name: string
  dailyLimit: number
  timezone: string
  warmupEnabled: boolean
  trackOpens: boolean
  trackClicks: boolean
  autoFollowUp: boolean
}

export type ProspectSearchEventType = 'start' | 'progress' | 'complete' | 'error'

export interface ProspectSearchStartPayload {
  type: 'prospect_search_start'
  event: 'start'
  websetId: string
  status: 'created'
  message: string
  searchCriteria: {
    query: string
    targetCount?: number
    entityType?: string
    criteriaCount: number
    enrichmentsCount: number
  }
  progress: {
    found: number
    analyzed: number
    completion: number
  }
}
