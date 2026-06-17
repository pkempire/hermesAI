'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { useProspectStream } from '@/hooks/use-prospect-stream'
import { campaignStore } from '@/lib/store/campaign-store'
import { logger } from '@/lib/utils/logger'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { ProspectSearchBuilder } from './builder'
import { ProspectSearchEmpty } from './empty'
import { ProspectSearchResults } from './results'
import { ProspectSearchStreamer } from './streamer'
import type {
  ParsedToolResult,
  Prospect,
  ProspectSearchContext,
  ProspectSearchSectionProps,
  SearchCriteria,
  SearchStatus,
  SearchUIType
} from './types'

const DEFAULT_CRITERIA: SearchCriteria = {
  query: '',
  entityType: 'company',
  targetCount: 10,
  enrichments: ['email', 'linkedin', 'company_info']
}

function parseToolArgs(tool: any): SearchCriteria {
  if (!tool?.args) return DEFAULT_CRITERIA
  try {
    const args = typeof tool.args === 'string' ? JSON.parse(tool.args) : tool.args
    return {
      query: args.query || '',
      entityType: args.entityType || 'company',
      targetCount: args.targetCount || 10,
      enrichments: args.enrichments || DEFAULT_CRITERIA.enrichments
    }
  } catch (error) {
    logger.warn('parseToolArgs failed:', error)
    return DEFAULT_CRITERIA
  }
}

function parseToolResult(tool: any): ParsedToolResult | null {
  const raw = tool?.result
  if (!raw) return null
  let result: any = raw
  if (typeof raw === 'string') {
    try {
      result = JSON.parse(raw)
    } catch {
      result = raw
    }
  }
  if (!result || typeof result !== 'object') return null

  if (result.type === 'interactive_ui') {
    return {
      type: 'interactive',
      props: { ...result.props, evidenceMode: Boolean(result.props?.evidenceMode) },
      message: result.message
    }
  }
  if (result.type === 'prospect_search_start') {
    return {
      type: 'streaming',
      websetId: result.websetId,
      runId: result.runId,
      message: result.message
    }
  }
  if (result.type === 'prospect_search_complete') {
    return {
      type: 'results',
      prospects: result.prospects || [],
      summary: result.summary,
      message: result.message
    }
  }
  if (result.type === 'prospect_search_error') {
    return { type: 'error', message: result.message }
  }
  return null
}

function emitPipeline(detail: Record<string, any>) {
  try {
    window.dispatchEvent(new CustomEvent('pipeline-progress', { detail }))
  } catch {}
}

function persistCampaign(query: string, websetId: string, totalFound: number, entityType: string) {
  try {
    sessionStorage.setItem(
      'hermes-search-summary',
      JSON.stringify({ query, entityType, totalFound })
    )
    const campaigns = JSON.parse(localStorage.getItem('hermes-campaigns') || '[]')
    campaigns.unshift({
      id: `camp_${Date.now()}`,
      name: query || 'Untitled Campaign',
      websetId,
      query,
      entityType,
      totalFound,
      createdAt: new Date().toISOString(),
      status: 'completed'
    })
    localStorage.setItem('hermes-campaigns', JSON.stringify(campaigns.slice(0, 20)))
  } catch (e) {
    logger.warn('Failed to persist campaign:', e)
  }
}

function StatusMark({ status }: { status: SearchStatus }) {
  const tone =
    status === 'completed'
      ? 'border-emerald-200 bg-emerald-50'
      : status === 'running'
      ? 'border-[#cbd4ff] bg-[#edf1ff]'
      : status === 'failed'
      ? 'border-red-200 bg-red-50'
      : 'border-[#dfe4ee] bg-[#fbfcff]'

  const dots =
    status === 'completed'
      ? ['bg-[#12b981]', 'bg-[#12b981]', 'bg-[#12b981]', 'bg-[#dfe4ee]']
      : status === 'running'
      ? ['bg-[#315dff]', 'bg-[#315dff]', 'bg-[#bfc9ff]', 'bg-[#dfe4ee]']
      : status === 'failed'
      ? ['bg-red-500', 'bg-red-300', 'bg-[#dfe4ee]', 'bg-[#dfe4ee]']
      : ['bg-[#315dff]', 'bg-[#dfe4ee]', 'bg-[#dfe4ee]', 'bg-[#dfe4ee]']

  return (
    <span className={`grid h-10 w-10 shrink-0 grid-cols-2 gap-1 rounded-lg border p-2 shadow-sm ${tone}`}>
      {dots.map((dot, index) => (
        <span
          key={index}
          className={`rounded-[3px] ${dot} ${
            status === 'running' && index === 1 ? 'animate-pulse' : ''
          }`}
        />
      ))}
    </span>
  )
}

export function ProspectSearchSection({
  tool,
  isOpen,
  onOpenChange
}: ProspectSearchSectionProps) {
  const [, startTransition] = useTransition()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle')
  const [searchMessage, setSearchMessage] = useState('')
  const [searchSummary, setSearchSummary] = useState<any>(null)
  const [uiType, setUiType] = useState<SearchUIType>('idle')
  const [streamingWebsetId, setStreamingWebsetId] = useState<string | null>(null)
  const [streamingTarget, setStreamingTarget] = useState<number | undefined>(undefined)
  const [streamingCriteria, setStreamingCriteria] = useState<SearchCriteria | null>(null)
  const [searchContext, setSearchContext] = useState<ProspectSearchContext | undefined>(undefined)
  const appliedResultKeyRef = useRef<string | null>(null)

  // The `tool` object identity changes every render (re-built in
  // render-message), so memoize derived state by content fingerprint
  // instead of reference. This prevents the "Maximum update depth
  // exceeded" loop where a new derived object every frame re-fires the
  // result-handling effect.
  const toolFingerprint = useMemo(
    () =>
      JSON.stringify({
        state: tool?.state ?? null,
        toolCallId: tool?.toolCallId ?? null,
        result:
          typeof tool?.result === 'string'
            ? tool.result
            : tool?.result
            ? JSON.stringify(tool.result)
            : null,
        args: tool?.args ?? tool?.input ?? null
      }),
    [tool]
  )

  const currentSearchCriteria = useMemo(
    () => parseToolArgs(tool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toolFingerprint]
  )
  const toolResult = useMemo(
    () => parseToolResult(tool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toolFingerprint]
  )

  // ── SSE stream subscription (replaces 200ms polling) ────────────────────
  const stream = useProspectStream<Prospect>({
    websetId: streamingWebsetId,
    target: streamingTarget,
    onProgress: ({ found, companyEnriched }) => {
      const targetTotal = streamingTarget || streamingCriteria?.targetCount || 25
      const percent = Math.max(0, Math.min(100, Math.round((found / Math.max(1, targetTotal)) * 100)))
      emitPipeline({
        stepNumber: 2,
        totalSteps: 5,
        percent,
        label: companyEnriched > 0 ? `${companyEnriched} enriched` : 'Search'
      })
    },
    onComplete: finalProspects => {
      const list = finalProspects.length > 0 ? finalProspects : stream.prospects
      startTransition(() => {
        setProspects(list as Prospect[])
        setSearchStatus('completed')
        if (list.length > 1) {
          setUiType('results')
          setSearchMessage(`Search completed! Found ${list.length} qualified prospects.`)
        } else {
          setSearchMessage(`Search completed! Found ${list.length} prospect.`)
        }
        setSearchSummary({
          totalFound: list.length,
          query: streamingCriteria?.query || streamingWebsetId,
          entityType: streamingCriteria?.entityType || 'company',
          websetId: streamingWebsetId
        })
      })
      emitPipeline({ stepNumber: 3, totalSteps: 5, percent: 100, label: 'Resolved' })
      try {
        sessionStorage.setItem('hermes-latest-prospects', JSON.stringify(list))
        if (searchContext) {
          sessionStorage.setItem('hermes-search-context', JSON.stringify(searchContext))
        }
      } catch (e) {
        logger.warn('Failed to cache prospects in sessionStorage:', e)
      }
      if (streamingWebsetId) {
        persistCampaign(
          streamingCriteria?.query || '',
          streamingWebsetId,
          list.length,
          streamingCriteria?.entityType || 'company'
        )
      }
    },
    onError: msg => {
      setSearchStatus('failed')
      setSearchMessage(msg)
      setUiType('error')
    }
  })

  // Mirror live streaming prospects into local state (memoized upsert).
  useEffect(() => {
    if (!streamingWebsetId) return
    if (stream.prospects.length === 0) return
    setProspects(prev => {
      const byId = new Map(prev.map(p => [p.id, p]))
      for (const p of stream.prospects) byId.set(p.id, p)
      return Array.from(byId.values())
    })
    if (stream.found > 0 || stream.analyzed > 0) {
      setSearchMessage(`${Math.max(stream.found, stream.prospects.length)} matches found so far.`)
    }
  }, [stream.prospects, stream.found, stream.analyzed, streamingWebsetId])

  // Restore search context from sessionStorage on mount.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('hermes-search-context')
      if (!stored) return
      const parsed = JSON.parse(stored)
      setSearchContext({
        targetPersona: parsed?.targetPersona || undefined,
        offer: parsed?.offer || undefined,
        originalQuery: parsed?.originalQuery || undefined
      })
      campaignStore.setState({
        offer: parsed?.offer || '',
        motionIcp: parsed?.targetPersona || '',
        summary: parsed?.originalQuery || ''
      })
    } catch {}
  }, [])

  // React to tool result changes.
  useEffect(() => {
    if (!toolResult) return
    const resultKey = JSON.stringify({
      type: toolResult.type,
      websetId: toolResult.websetId ?? null,
      message: toolResult.message ?? null,
      prospectCount: Array.isArray(toolResult.prospects) ? toolResult.prospects.length : null,
      originalQuery: toolResult.props?.originalQuery ?? null,
      step: toolResult.props?.step ?? null
    })
    if (appliedResultKeyRef.current === resultKey) return
    appliedResultKeyRef.current = resultKey

    if (toolResult.type === 'interactive') {
      setUiType('interactive')
      setSearchStatus('idle')
      setSearchMessage(toolResult.message || 'Interactive search builder ready')
    } else if (toolResult.type === 'streaming') {
      setUiType('streaming')
      setSearchStatus('running')
      setSearchMessage(toolResult.message || 'Search started...')
      if (toolResult.websetId) {
        setStreamingWebsetId(toolResult.websetId)
        setStreamingTarget(currentSearchCriteria.targetCount)
        setStreamingCriteria(currentSearchCriteria)
        const ctx = {
          targetPersona: toolResult.props?.targetPersona,
          offer: toolResult.props?.offer,
          originalQuery: toolResult.props?.originalQuery
        }
        setSearchContext(ctx)
        campaignStore.setState({
          offer: ctx.offer || '',
          motionIcp: ctx.targetPersona || '',
          summary: ctx.originalQuery || ''
        })
      }
    } else if (toolResult.type === 'results') {
      setUiType('results')
      setSearchStatus('completed')
      setProspects(toolResult.prospects || [])
      setSearchMessage(toolResult.message || `Found ${toolResult.prospects?.length || 0} prospects`)
      setSearchSummary(toolResult.summary)
      setSearchContext(prev => prev || { originalQuery: currentSearchCriteria.query || undefined })
    } else if (toolResult.type === 'error') {
      setUiType('error')
      setSearchStatus('failed')
      setSearchMessage(toolResult.message || 'Search failed')
    }
  }, [toolResult, currentSearchCriteria])

  // Display labels
  const displayEntityType =
    toolResult?.type === 'interactive'
      ? toolResult.props?.initialEntityType || currentSearchCriteria.entityType
      : currentSearchCriteria.entityType
  const displayTargetCount =
    toolResult?.type === 'interactive'
      ? toolResult.props?.initialCount || currentSearchCriteria.targetCount
      : currentSearchCriteria.targetCount
  const displayEnrichmentCount =
    toolResult?.type === 'interactive'
      ? (toolResult.props?.initialEnrichments?.length || 0) +
        (toolResult.props?.initialCustomEnrichments?.length || 0)
      : currentSearchCriteria.enrichments.length

  const liveStatusLabel =
    searchStatus === 'completed'
      ? 'Search complete'
      : stream.status === 'running'
      ? 'Reading live sources'
      : 'Starting'

  const statusLabel =
    searchStatus === 'completed'
      ? 'Complete'
      : searchStatus === 'running'
      ? 'Live'
      : searchStatus === 'failed'
      ? 'Needs fix'
      : 'Ready'

  const statusTone =
    searchStatus === 'completed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : searchStatus === 'running'
      ? 'border-[#cbd4ff] bg-[#edf1ff] text-[#315dff]'
      : searchStatus === 'failed'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-[#dfe4ee] bg-[#fbfcff] text-[#6a7283]'

  const headerMessage =
    uiType === 'interactive'
      ? 'Review filters, then run.'
      : uiType === 'streaming'
      ? 'Live search running.'
      : searchStatus === 'failed' || searchStatus === 'completed'
      ? searchMessage
      : ''

  // Builder callbacks
  const handleStreamingFlush = useCallback(() => {
    setUiType('streaming')
    setSearchStatus('running')
    setSearchMessage('Starting search...')
    setProspects([])
    setStreamingWebsetId(null)
  }, [])

  const handleBuilderError = useCallback((message: string) => {
    setUiType('error')
    setSearchStatus('failed')
    setSearchMessage(message)
  }, [])

  const handleStreamingStart = useCallback(
    ({ websetId, targetCount, criteria, context, message }: any) => {
      setStreamingWebsetId(websetId)
      setStreamingTarget(targetCount)
      setStreamingCriteria({ ...DEFAULT_CRITERIA, ...criteria, targetCount })
      setSearchContext(context)
      setSearchMessage(message || 'Search started, finding prospects...')
    },
    []
  )

  const handlePreviewStart = useCallback(({ websetId, criteria, context, message }: any) => {
    setStreamingWebsetId(websetId)
    setStreamingTarget(1)
    setStreamingCriteria({ ...DEFAULT_CRITERIA, ...criteria, targetCount: 1 })
    setSearchContext(context)
    setSearchMessage(message || 'Preview taking longer than expected, monitoring...')
  }, [])

  const handlePreviewComplete = useCallback(
    ({ prospects: previewProspects, summary, message, context }: any) => {
      setUiType('results')
      setProspects(previewProspects)
      setSearchSummary(summary)
      setSearchStatus('completed')
      setSearchMessage(message || 'Preview completed')
      setSearchContext(context)
    },
    []
  )

  const handleRefine = useCallback((message: string) => {
    setUiType('interactive')
    setSearchStatus('idle')
    setSearchMessage(message)
  }, [])

  const handleRetry = useCallback(() => {
    setUiType('interactive')
    setSearchStatus('idle')
    setSearchMessage("Let's try again with different criteria")
    setProspects([])
    setStreamingWebsetId(null)
  }, [])

  return (
    <div className="my-4 w-full overflow-hidden rounded-lg border border-[#dfe4ee] bg-white shadow-[0_18px_50px_rgba(5,18,47,0.06)]">
      <Collapsible open={isOpen !== false} onOpenChange={onOpenChange}>
        <Card className="w-full border-none bg-transparent shadow-none">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer rounded-t-lg px-4 py-4 transition-colors duration-150 hover:bg-[#fbfcff] md:px-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <StatusMark status={searchStatus} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-[20px] leading-none tracking-normal text-[#071329]">
                        Prospect Discovery
                      </CardTitle>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a92a6]">
                      <span className="capitalize text-[#46506a]">{displayEntityType}</span>
                      <span className="h-1 w-1 rounded-full bg-[#d1d6e2]" />
                      <span>{displayTargetCount} targets</span>
                      <span className="h-1 w-1 rounded-full bg-[#d1d6e2]" />
                      <span>{displayEnrichmentCount} fields</span>
                      {prospects.length > 0 && prospects.length < displayTargetCount && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[#d1d6e2]" />
                          <span className="text-emerald-600">{prospects.length} found</span>
                        </>
                      )}
                    </div>
                    {headerMessage && (
                      <p className="mt-2 max-w-[620px] text-[12px] font-medium leading-relaxed text-[#6a7283]">
                        {headerMessage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-full border border-[#dfe4ee] bg-white p-2 shadow-sm transition-colors hover:border-[#bfc9ff]">
                  {isOpen ? (
                    <span className="block h-4 w-4 text-center text-[15px] font-bold leading-4 text-[#8a92a6]">−</span>
                  ) : (
                    <span className="block h-4 w-4 text-center text-[15px] font-bold leading-4 text-[#8a92a6]">+</span>
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 border-t border-[#edf0f6] px-4 pb-5 pt-4 md:px-5">
              {uiType === 'idle' && tool && (
                <ProspectSearchEmpty ready={searchStatus === 'idle' && tool.state === 'result'} />
              )}

              {uiType === 'interactive' && toolResult?.props && (
                <ProspectSearchBuilder
                  props={toolResult.props}
                  onStreamingFlush={handleStreamingFlush}
                  onError={handleBuilderError}
                  onStreamingStart={handleStreamingStart}
                  onPreviewStart={handlePreviewStart}
                  onPreviewComplete={handlePreviewComplete}
                />
              )}

              {uiType === 'streaming' && (
                <ProspectSearchStreamer
                  searchStatus={searchStatus}
                  message={searchMessage}
                  prospects={prospects}
                  targetCount={displayTargetCount}
                  analyzed={stream.analyzed}
                  completion={stream.completion}
                  companyEnriched={stream.companyEnriched}
                  companyEnrichmentPending={stream.companyEnrichmentPending}
                  searchContext={searchContext}
                  onProspectsUpdate={updater => setProspects(prev => updater(prev))}
                  liveStatusLabel={liveStatusLabel}
                />
              )}

              {searchStatus === 'completed' && uiType !== 'interactive' && (
                <ProspectSearchResults
                  prospects={prospects}
                  searchSummary={searchSummary}
                  searchContext={searchContext}
                  onProspectsUpdate={updater => setProspects(prev => updater(prev))}
                  onRefine={handleRefine}
                />
              )}

              {(searchStatus === 'failed' || uiType === 'error') && uiType !== 'interactive' && (
                <ProspectSearchResults
                  prospects={[]}
                  isError
                  errorMessage={searchMessage}
                  onProspectsUpdate={() => {}}
                  onRefine={handleRefine}
                  onRetry={handleRetry}
                />
              )}

            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}

export default ProspectSearchSection
