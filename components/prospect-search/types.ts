import type { Prospect, ProspectSearchContext } from '@/components/prospect-grid'

export type SearchUIType = 'idle' | 'interactive' | 'streaming' | 'results' | 'error'
export type SearchStatus = 'idle' | 'running' | 'completed' | 'failed'

export interface SearchCriteria {
  query: string
  entityType: string
  targetCount: number
  enrichments: string[]
}

export interface InteractiveProps {
  initialCriteria?: any[]
  initialEnrichments?: any[]
  initialCustomEnrichments?: any[]
  initialEntityType?: string
  initialCount?: number
  originalQuery?: string
  step?: number
  totalSteps?: number
  targetPersona?: string
  offer?: string
  evidenceMode?: boolean
}

export interface ParsedToolResult {
  type: SearchUIType
  websetId?: string
  prospects?: Prospect[]
  message?: string
  summary?: any
  props?: InteractiveProps
}

export interface ProspectSearchSectionProps {
  tool: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export type { Prospect, ProspectSearchContext }
