'use client'

import { logger } from '@/lib/utils/logger'
import { memo } from 'react'
import { EnhancedProspectSearchBuilder } from '../enhanced-prospect-search-builder'
import type { InteractiveProps } from './types'

export interface ProspectSearchBuilderProps {
  props: InteractiveProps
  onStreamingStart: (params: {
    websetId: string
    targetCount: number
    criteria: { query?: string; entityType?: string; targetCount?: number }
    context: { targetPersona?: string; offer?: string; originalQuery?: string }
    message?: string
  }) => void
  onError: (message: string) => void
  onPreviewStart: (params: {
    websetId: string
    criteria: { query?: string; entityType?: string; targetCount?: number }
    context: { targetPersona?: string; offer?: string; originalQuery?: string }
    message?: string
  }) => void
  onPreviewComplete: (params: {
    prospects: any[]
    summary: any
    message?: string
    context: { targetPersona?: string; offer?: string; originalQuery?: string }
  }) => void
  onStreamingFlush: () => void
}

/**
 * Interactive criteria + enrichment builder. Wraps EnhancedProspectSearchBuilder
 * and centralizes the /api/prospect-search/execute call. The parent owns all
 * UI-state transitions (streaming, results, error) so this component stays pure.
 */
function ProspectSearchBuilderImpl({
  props,
  onStreamingStart,
  onError,
  onPreviewStart,
  onPreviewComplete,
  onStreamingFlush
}: ProspectSearchBuilderProps) {
  return (
    <EnhancedProspectSearchBuilder
      initialCriteria={props.initialCriteria || []}
      initialEnrichments={props.initialEnrichments || []}
      initialCustomEnrichments={props.initialCustomEnrichments || []}
      initialEntityType={(props.initialEntityType as 'person' | 'company') || 'company'}
      initialCount={props.initialCount || 25}
      originalQuery={props.originalQuery || ''}
      step={props.step || 1}
      totalSteps={props.totalSteps || 5}
      onSearchExecute={async searchParams => {
        if (!searchParams?.criteria || searchParams.criteria.length === 0) {
          onError('Please add at least one search criterion.')
          return
        }
        const validTargetCount = Math.max(1, Math.min(1000, searchParams.targetCount || 25))

        onStreamingFlush()

        try {
          const response = await fetch('/api/prospect-search/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...searchParams,
              targetPersona: props.targetPersona,
              offer: props.offer,
              targetCount: validTargetCount,
              preview: false
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            const errorMsg = errorData?.message || errorData?.error || response.statusText
            if (response.status === 402) {
              onError('⚠️ Quota exceeded. Please upgrade your plan or contact support.')
            } else if (response.status === 400) {
              onError(`Invalid request: ${errorMsg}`)
            } else {
              onError(`Search failed: ${errorMsg}`)
            }
            return
          }

          const result = await response.json()
          if (result.type === 'prospect_search_start') {
            onStreamingStart({
              websetId: result.websetId,
              targetCount: validTargetCount,
              criteria: {
                query: searchParams.originalQuery,
                entityType: searchParams.entityType,
                targetCount: validTargetCount
              },
              context: {
                originalQuery: searchParams.originalQuery,
                targetPersona: props.targetPersona,
                offer: props.offer
              },
              message: result.message
            })
          } else if (result.type === 'prospect_search_error') {
            onError(result.message || 'Search failed')
          }
        } catch (error) {
          logger.error('ProspectSearchBuilder execute failed:', error)
          onError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }}
      onPreviewExecute={async previewParams => {
        if (!previewParams?.criteria || previewParams.criteria.length === 0) {
          onError('Please add at least one search criterion.')
          return
        }
        onStreamingFlush()

        try {
          const response = await fetch('/api/prospect-search/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...previewParams,
              targetPersona: props.targetPersona,
              offer: props.offer,
              preview: true,
              targetCount: 1
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const result = await response.json()
          const ctx = {
            originalQuery: previewParams.originalQuery,
            targetPersona: props.targetPersona,
            offer: props.offer
          }
          if (result.type === 'prospect_search_complete') {
            onPreviewComplete({
              prospects: result.prospects || [],
              summary: result.summary,
              message: result.message || 'Preview completed',
              context: ctx
            })
          } else if (result.type === 'prospect_search_progress' && result.event === 'progress') {
            onPreviewStart({
              websetId: result.websetId,
              criteria: {
                query: previewParams.originalQuery,
                entityType: previewParams.entityType,
                targetCount: 1
              },
              context: ctx,
              message: result.message
            })
          } else if (result.type === 'prospect_search_error') {
            onError(result.message || 'Preview failed')
          }
        } catch (error) {
          logger.error('ProspectSearchBuilder preview failed:', error)
          onError(`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }}
    />
  )
}

export const ProspectSearchBuilder = memo(ProspectSearchBuilderImpl)
