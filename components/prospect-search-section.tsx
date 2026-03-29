'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Search, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EnhancedProspectSearchBuilder } from './enhanced-prospect-search-builder'
import { InteractiveEmailDrafter } from './interactive-email-drafter'
import { Prospect, ProspectGrid, ProspectSearchContext } from './prospect-grid'
import { ProspectPreviewCard } from './prospect-preview-card'
import { campaignStore } from '@/lib/store/campaign-store'

interface ProspectSearchSectionProps {
  tool: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ProspectSearchSection({
  tool,
  isOpen,
  onOpenChange
}: ProspectSearchSectionProps) {
  // Logging removed - use React DevTools or logger utility if needed
  
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [searchStatus, setSearchStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [searchMessage, setSearchMessage] = useState<string>('')
  const [searchSummary, setSearchSummary] = useState<any>(null)
  const [uiType, setUiType] = useState<'idle' | 'interactive' | 'streaming' | 'results' | 'error'>('idle')
  const [streamingWebsetId, setStreamingWebsetId] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const appliedResultKeyRef = useRef<string | null>(null)
  const [lastStatus, setLastStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [showEmailDrafter, setShowEmailDrafter] = useState(false)
  const [evidenceMode, setEvidenceMode] = useState(false)
  const [searchContext, setSearchContext] = useState<ProspectSearchContext | undefined>(undefined)
  const router = useRouter()

  // Extract search criteria from tool arguments for display
  const getSearchCriteria = useCallback(() => {
    if (tool.args) {
      try {
        const args = typeof tool.args === 'string' ? JSON.parse(tool.args) : tool.args
        return {
          query: args.query || '',
          entityType: args.entityType || 'company',
          targetCount: args.targetCount || 10,
          enrichments: args.enrichments || ['email', 'linkedin', 'company_info']
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error parsing search criteria:', error)
        }
      }
    }

    return {
      query: '',
      entityType: 'company',
      targetCount: 10,
      enrichments: ['email', 'linkedin', 'company_info']
    }
  }, [tool.args])

  const currentSearchCriteria = useMemo(() => getSearchCriteria(), [getSearchCriteria])

  // Parse the tool result to determine UI type and handle different response formats
  const parseToolResult = useCallback(() => {
    
    // Check if result exists - try regardless of state for debugging
    const toolResult = (tool as any).result
    if (toolResult) {
      try {
        let result = toolResult
        if (typeof toolResult === 'string') {
          try {
            result = JSON.parse(toolResult)
          } catch (parseError) {
            // JSON parse failed, use raw value
            result = toolResult
          }
        }
        
        // Handle interactive UI configuration
        if (result.type === 'interactive_ui') {
          return { type: 'interactive', props: { ...result.props, evidenceMode: Boolean(result.props?.evidenceMode) }, message: result.message }
        }
        
        // Handle streaming search configuration
        if (result.type === 'prospect_search_start') {
          return { type: 'streaming', websetId: result.websetId, message: result.message }
        }
        
        // Handle completed search results
        if (result.type === 'prospect_search_complete') {
          const prospectsData = result.prospects || result.prospects || []
          return { type: 'results', prospects: prospectsData, summary: result.summary, message: result.message }
        }
        
        // Handle error
        if (result.type === 'prospect_search_error') {
          return { type: 'error', message: result.message }
        }
        
      } catch (error) {
        return { type: 'error', message: 'Failed to parse search results' }
      }
    }
    return null
  }, [tool])  // Add dependencies for useCallback

  // Start SSE streaming for real-time search updates
  const startStreamingPolling = useCallback((websetId: string, target?: number, criteria?: { query?: string; entityType?: string; targetCount?: number }, searchContext?: { targetPersona?: string; offer?: string; originalQuery?: string }) => {
    // Clean up any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    // Use Server-Sent Events (SSE) instead of polling
    const targetParam = target ? `&target=${target}` : ''
    const eventSource = new EventSource(`/api/prospect-search/stream?websetId=${websetId}${targetParam}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastStatus(data.status as any)
        
        // Update progress messages
        if (data.found > 0 || data.analyzed > 0) {
          setSearchMessage(`${data.found} matches found so far.`)
        }
        
        // Update prospects if available (only new ones)
        if (data.prospects && Array.isArray(data.prospects) && data.prospects.length > 0) {
          setProspects(prev => {
            const byId = new Map(prev.map((p: Prospect) => [p.id, p]))
            for (const nextProspect of data.prospects as Prospect[]) {
              byId.set(nextProspect.id, nextProspect)
            }
            return Array.from(byId.values())
          })
        }

        // Emit pipeline progress event for the campaign tracker (0-100)
        try {
          const targetTotal = target || criteria?.targetCount || 25
          const found = typeof data.found === 'number' ? data.found : (data.totalProspects || 0)
          const percent = Math.max(0, Math.min(100, Math.round((found / Math.max(1, targetTotal)) * 100)))
              window.dispatchEvent(new CustomEvent('pipeline-progress', {
                detail: {
                  stepNumber: 1,
                  totalSteps: 5,
                  percent,
                  label: 'Finding companies'
                }
              }))
            } catch {}
        
        // Check if search is complete
        if (data.event === 'complete' || data.type === 'prospect_search_complete' || data.status === 'completed' || data.status === 'idle') {
          setSearchStatus('completed')
          eventSource.close()
          
          // Get final prospects count
          const finalProspects = data.prospects || []
          if (finalProspects.length > 0) {
            // Switch to results UI for multiple prospects, keep streaming for single prospect preview
            if (finalProspects.length > 1) {
              setUiType('results')
              setSearchMessage(`Search completed! Found ${finalProspects.length} qualified prospects.`)
            } else {
              setSearchMessage(`Search completed! Found ${finalProspects.length} prospect.`)
            }
            
            setSearchSummary({
              totalFound: finalProspects.length,
              query: (criteria?.query || websetId),
              entityType: (criteria?.entityType || 'company'),
              websetId
            })
            try {
              window.dispatchEvent(new CustomEvent('pipeline-progress', {
                detail: { stepNumber: 2, totalSteps: 5, percent: 100, label: 'Discovery complete' }
              }))
            } catch {}

            // Store prospects and context for email drafter
            try {
              sessionStorage.setItem('hermes-latest-prospects', JSON.stringify(finalProspects))
              sessionStorage.setItem('hermes-search-summary', JSON.stringify({
                query: criteria?.query || '',
                entityType: criteria?.entityType || 'company',
                totalFound: finalProspects.length
              }))
              // Also store search context (targetPersona, offer) from tool result
              if (searchContext) {
                sessionStorage.setItem('hermes-search-context', JSON.stringify({
                  targetPersona: searchContext.targetPersona,
                  offer: searchContext.offer,
                  originalQuery: searchContext.originalQuery
                }))
              }
              
              // Save campaign for later viewing
              const campaigns = JSON.parse(localStorage.getItem('hermes-campaigns') || '[]')
              campaigns.unshift({
                id: `camp_${Date.now()}`,
                name: (criteria?.query || 'Untitled Campaign'),
                websetId,
                query: criteria?.query,
                entityType: criteria?.entityType,
                totalFound: finalProspects.length,
                createdAt: new Date().toISOString(),
                status: 'completed'
              })
              // Keep only last 20 campaigns
              localStorage.setItem('hermes-campaigns', JSON.stringify(campaigns.slice(0, 20)))
            } catch (e) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('Failed to store prospects:', e)
              }
            }
            
          } else {
            setSearchMessage('Search completed but no prospects found. Try broadening your criteria.')
            setSearchStatus('completed')
          }
        } else if (data.event === 'error' || data.type === 'prospect_search_error' || data.type === 'error' || data.status === 'failed') {
          setSearchStatus('failed')
          setSearchMessage(data.error || 'Search failed')
          eventSource.close()
          setUiType('error')
        } else if (data.status === 'timeout' || data.type === 'timeout') {
          setSearchStatus('failed')
          setSearchMessage('Search is taking longer than expected. Results may still arrive - check back soon or contact support.')
          eventSource.close()
        }
      } catch (error) {
        // Error parsing SSE data
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error parsing SSE data:', error)
        }
      }
    }

    eventSource.onerror = (error) => {
      // SSE connection dropped unexpectedly (like Vercel 60s timeout limit)
      eventSource.close()
      setProspects(current => {
        if (current.length > 0) {
          // Graceful recovery: if we found some before crashing, just accept them.
          setSearchStatus('completed')
          setSearchMessage(`Search completed! Recovered ${current.length} prospects before connection limit.`)
          setSearchSummary({
            totalFound: current.length,
            query: criteria?.query || websetId,
            entityType: criteria?.entityType || 'company',
            websetId
          })
          if (current.length > 1) {
             setUiType('results')
          }
        } else {
          setSearchStatus('failed')
          setSearchMessage('Search timed out due to volume. Please try again with stricter geography or keywords.')
          setUiType('error')
        }
        return current
      })
    }

    // Store eventSource reference for cleanup
    pollingIntervalRef.current = eventSource as any
  }, [])

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        // Can be either EventSource or interval, check type
        if (pollingIntervalRef.current instanceof EventSource) {
          pollingIntervalRef.current.close()
        } else {
          clearInterval(pollingIntervalRef.current)
        }
        pollingIntervalRef.current = null
      }
    }
  }, [])

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

  // Parse tool result whenever tool changes
  useEffect(() => {
      const result = parseToolResult()
    if (!result) return

    const resultKey = JSON.stringify({
      type: result.type,
      websetId: (result as any).websetId ?? null,
      message: result.message ?? null,
      prospectCount: Array.isArray((result as any).prospects)
        ? (result as any).prospects.length
        : null,
      originalQuery: (result as any).props?.originalQuery ?? null,
      step: (result as any).props?.step ?? null
    })

    if (appliedResultKeyRef.current === resultKey) {
      return
    }
    appliedResultKeyRef.current = resultKey

    if (result.type === 'interactive') {
      setUiType('interactive')
      setEvidenceMode(Boolean(result.props?.evidenceMode))
      setSearchStatus('idle')
      setSearchMessage(result.message || 'Interactive search builder ready')
    } else if (result.type === 'streaming') {
      setUiType('streaming')
      setSearchStatus('running')
      setSearchMessage(result.message || 'Search started...')
      if (result.websetId) {
        setStreamingWebsetId(result.websetId)
        startStreamingPolling(result.websetId, currentSearchCriteria.targetCount, currentSearchCriteria, {
          targetPersona: result.props?.targetPersona,
          offer: result.props?.offer,
          originalQuery: result.props?.originalQuery
        })
        setSearchContext({
          targetPersona: result.props?.targetPersona,
          offer: result.props?.offer,
          originalQuery: result.props?.originalQuery
        })
        campaignStore.setState({
          offer: result.props?.offer || '',
          motionIcp: result.props?.targetPersona || '',
          summary: result.props?.originalQuery || ''
        })
      }
    } else if (result.type === 'results') {
      setUiType('results')
      setSearchStatus('completed')
      setProspects(result.prospects || [])
      setSearchMessage(result.message || `Found ${result.prospects?.length || 0} prospects`)
      setSearchSummary(result.summary)
      setSearchContext(previous => previous || {
        originalQuery: currentSearchCriteria.query || undefined
      })
    } else if (result.type === 'error') {
      setUiType('error')
      setSearchStatus('failed')
      setSearchMessage(result.message || 'Search failed')
    }
  }, [parseToolResult, startStreamingPolling, currentSearchCriteria])

  const toolResult = useMemo(() => parseToolResult(), [parseToolResult])
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
      ? (toolResult.props?.initialEnrichments?.length || 0) + (toolResult.props?.initialCustomEnrichments?.length || 0)
      : currentSearchCriteria.enrichments.length

  // If we have no prospects yet but status shows counts, synthesize placeholders (optional)
  useEffect(() => {
    if (uiType === 'streaming' && prospects.length === 0 && lastStatus !== 'failed') {
      // Keep the UI in streaming mode until data arrives
      setSearchStatus('running')
    }
  }, [uiType, prospects.length, lastStatus])

  // Get status badge variant
  const getStatusBadgeVariant = () => {
    switch (searchStatus) {
      case 'completed':
        return 'default'
      case 'running':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Get status icon
  const getStatusIcon = () => {
    switch (searchStatus) {
      case 'completed':
        return <img src="/images/hermes-pixel.png" alt="Complete" className="h-6 w-6 rounded-full drop-shadow-sm" />
      case 'running':
        return <img src="/hermes-discovery.png" alt="Searching" className="h-6 w-6 animate-pulse drop-shadow-sm" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <img src="/hermes-discovery.png" alt="Ready" className="h-5 w-5 opacity-50 grayscale transition-all group-hover:grayscale-0 group-hover:opacity-100" />
    }
  }

  // Handle search completion from interactive component
  const handleSearchComplete = (prospects: Prospect[], websetId: string) => {
    setProspects(prospects)
    setSearchStatus('completed')
    setSearchMessage(`Search completed! Found ${prospects.length} qualified prospects.`)
    setSearchSummary({
      totalFound: prospects.length,
      query: currentSearchCriteria.query,
      entityType: currentSearchCriteria.entityType,
      enrichments: currentSearchCriteria.enrichments
    })
  }

  return (
    <div className="my-5 w-full rounded-3xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100/50 overflow-hidden">
      {/* Removed embedded step progress - handled by global campaign tracker */}

      <Collapsible open={isOpen !== false} onOpenChange={onOpenChange}>
        <Card className="w-full border-none bg-transparent shadow-none">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer rounded-t-3xl px-5 py-5 transition-all duration-200 hover:bg-gray-50 md:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="rounded-2xl bg-[hsl(var(--hermes-gold))]/10 p-3 shadow-sm">
                    {getStatusIcon()}
                  </div>
                  <div>
                    <CardTitle className="font-serif text-[1.6rem] leading-none text-gray-900 tracking-tight">
                      Prospect Discovery
                    </CardTitle>
                    <Badge variant={getStatusBadgeVariant()} className="mt-2 border-transparent bg-gray-100/80 text-[10px] uppercase tracking-wider text-gray-500 font-semibold shadow-none">
                      {searchStatus === 'completed' ? 'Complete' : 
                       searchStatus === 'running' ? 'Searching' : 
                       searchStatus === 'failed' ? 'Failed' : 'Ready'}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-full border border-gray-200 bg-white p-2.5 shadow-sm transition-transform duration-200">
                  {isOpen ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <CardDescription className="text-[14px] leading-relaxed text-gray-500 font-medium">
                  {uiType === 'interactive'
                    ? 'Edit the filters, keep the strongest fields, then run the search.'
                    : uiType === 'streaming'
                    ? 'Hermes is searching and enriching live.'
                    : searchMessage || 'Ready to configure the search.'}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-3 text-[13px] font-semibold text-gray-500 uppercase tracking-widest mt-2">
                  <span className="text-[hsl(var(--hermes-gold-dark))]">Type: {displayEntityType}</span>
                  <span className="text-gray-200">|</span>
                  <span>Target: {displayTargetCount}</span>
                  {prospects.length > 0 && prospects.length < displayTargetCount && (
                    <>
                      <span className="text-gray-200">|</span>
                      <span className="text-emerald-600">
                        Found: {prospects.length} ({Math.round((prospects.length / displayTargetCount) * 100)}%)
                      </span>
                    </>
                  )}
                  <span className="text-gray-200">|</span>
                  <span>{displayEnrichmentCount} fields</span>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-6 px-5 pb-6 pt-2 md:px-6 border-t border-gray-100">
                  {/* Criteria setup */}
                  {uiType === 'idle' && tool && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 mt-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm border border-gray-100">
                          <Search className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-gray-900">Configuring search</p>
                          <p className="text-[13px] text-gray-500 mt-1">Shaping the builder from your brief and offer.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Interactive UI Component */}
                  {uiType === 'interactive' && toolResult?.props && (
                    <EnhancedProspectSearchBuilder
                      initialCriteria={toolResult.props.initialCriteria || []}
                      initialEnrichments={toolResult.props.initialEnrichments || []}
                      initialCustomEnrichments={toolResult.props.initialCustomEnrichments || []}
                      initialEntityType={toolResult.props.initialEntityType || 'company'}
                      initialCount={toolResult.props.initialCount || 25}
                      originalQuery={toolResult.props.originalQuery || ''}
                      step={toolResult.props.step || 1}
                      totalSteps={toolResult.props.totalSteps || 5}
                      onSearchExecute={async (searchParams) => {
                        // Validation
                        if (!searchParams?.criteria || searchParams.criteria.length === 0) {
                          setUiType('error')
                          setSearchStatus('failed')
                          setSearchMessage('Please add at least one search criterion.')
                          return
                        }
                        
                        // Validate targetCount
                        const validTargetCount = Math.max(1, Math.min(1000, searchParams.targetCount || 25))
                        
                        // Immediately transition to streaming UI
                        setUiType('streaming')
                        setSearchStatus('running')
                        setSearchMessage('Starting search...')
                        setProspects([]) // Clear any existing prospects
                        
                        try {
                          const response = await fetch('/api/prospect-search/execute', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              ...searchParams, 
                              targetPersona: toolResult?.props?.targetPersona,
                              offer: toolResult?.props?.offer,
                              targetCount: validTargetCount,
                              preview: false 
                            })
                          })
                          
                          if (!response.ok) {
                            // Try to get error message from response
                            const errorData = await response.json().catch(() => null)
                            const errorMsg = errorData?.message || errorData?.error || response.statusText
                            
                            // Handle specific error codes
                            if (response.status === 402) {
                              setUiType('error')
                              setSearchStatus('failed')
                              setSearchMessage(`⚠️ Quota exceeded. Please upgrade your plan or contact support.`)
                              return
                            }
                            
                            if (response.status === 400) {
                              setUiType('error')
                              setSearchStatus('failed')
                              setSearchMessage(`Invalid request: ${errorMsg}`)
                              return
                            }
                            
                            setUiType('error')
                            setSearchStatus('failed')
                            setSearchMessage(`Search failed: ${errorMsg}`)
                            return
                          }
                          
                          const result = await response.json()
                          if (result.type === 'prospect_search_start') {
                            setStreamingWebsetId(result.websetId)
                            setSearchMessage(result.message || 'Search started, finding prospects...')
                            setSearchContext({
                              originalQuery: searchParams.originalQuery,
                              targetPersona: toolResult?.props?.targetPersona,
                              offer: toolResult?.props?.offer
                            })
                            startStreamingPolling(result.websetId, validTargetCount, {
                              query: searchParams.originalQuery,
                              entityType: searchParams.entityType,
                              targetCount: validTargetCount
                            }, {
                              originalQuery: searchParams.originalQuery,
                              targetPersona: toolResult?.props?.targetPersona,
                              offer: toolResult?.props?.offer
                            })
                          } else if (result.type === 'prospect_search_error') {
                            setUiType('error')
                            setSearchStatus('failed')
                            setSearchMessage(result.message || 'Search failed')
                          }
                        } catch (error) {
                          if (process.env.NODE_ENV !== 'production') {
                            console.error('❌ [ProspectSearchSection] Search execution error:', error)
                          }
                          setUiType('error')
                          setSearchStatus('failed')
                          setSearchMessage(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                        }
                      }}
                      onPreviewExecute={async (previewParams) => {
                        // Validation
                        if (!previewParams?.criteria || previewParams.criteria.length === 0) {
                          setUiType('error')
                          setSearchStatus('failed')
                          setSearchMessage('Please add at least one search criterion.')
                          return
                        }
                        
                        // Show loading state for preview
                        setUiType('streaming')
                        setSearchStatus('running')
                        setSearchMessage('Getting preview result...')
                        setProspects([])
                        
                        try {
                          const response = await fetch('/api/prospect-search/execute', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              ...(previewParams || {}),
                              targetPersona: toolResult?.props?.targetPersona,
                              offer: toolResult?.props?.offer,
                              preview: true,
                              targetCount: 1
                            })
                          })
                          
                          if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                          }
                          
                          const result = await response.json()
                          if (result.type === 'prospect_search_complete') {
                            setUiType('results')
                            setProspects(result.prospects || [])
                            setSearchSummary(result.summary)
                            setSearchStatus('completed')
                            setSearchMessage(result.message || 'Preview completed')
                            setSearchContext({
                              originalQuery: previewParams.originalQuery,
                              targetPersona: toolResult?.props?.targetPersona,
                              offer: toolResult?.props?.offer
                            })
                          } else if (result.type === 'prospect_search_progress' && result.event === 'progress') {
                            // Handle timeout - start polling for this webset
                            setStreamingWebsetId(result.websetId)
                            setSearchMessage(result.message || 'Preview taking longer than expected, monitoring...')
                            startStreamingPolling(result.websetId, 1, {
                              query: previewParams.originalQuery,
                              entityType: previewParams.entityType,
                              targetCount: 1
                            }, {
                              originalQuery: previewParams.originalQuery,
                              targetPersona: toolResult?.props?.targetPersona,
                              offer: toolResult?.props?.offer
                            })
                          } else if (result.type === 'prospect_search_error') {
                            setUiType('error')
                            setSearchStatus('failed')
                            setSearchMessage(result.message || 'Preview failed')
                          }
                        } catch (error) {
                          if (process.env.NODE_ENV !== 'production') {
                            console.error('❌ [ProspectSearchSection] Preview execution error:', error)
                          }
                          setUiType('error')
                          setSearchStatus('failed')
                          setSearchMessage(`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                        }
                      }}
                    />
                  )}

                  
                  {/* Streaming Search Progress */}
                  {uiType === 'streaming' && (
                    <div className="space-y-6 mt-2">
                      <div className="px-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
                               <img src="/hermes-discovery.png" alt="Discovering" className="h-5 w-5 animate-pulse drop-shadow-sm opacity-80" />
                            </div>
                            <div>
                                <p className="text-[15px] font-semibold text-gray-900 leading-none">
                                  {searchStatus === 'completed' ? 'Search complete' : lastStatus === 'running' ? 'Analyzing results in real-time...' : 'Starting search...'}
                                </p>
                                <p className="text-[13px] text-gray-500 mt-1.5 font-medium">{searchMessage}</p>
                            </div>
                          </div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--hermes-gold-dark))] bg-[hsl(var(--hermes-gold))]/5 px-2.5 py-1 rounded-md shadow-sm border border-[hsl(var(--hermes-gold))]/10">
                            {prospects.length} extracted
                          </div>
                        </div>
                        
                        {/* Progress indicator */}
                        <div className="h-2 w-full rounded-full bg-gray-100/80 overflow-hidden shadow-inner mt-5 mix-blend-multiply">
                          <div 
                            className="h-full rounded-full transition-all duration-[800ms] ease-out bg-[hsl(var(--hermes-gold))] bg-gradient-to-r from-[hsl(var(--hermes-gold))]/80 to-[hsl(var(--hermes-gold-dark))]"
                            style={{ width: `${Math.min((prospects.length / (displayTargetCount || 25)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {prospects.length > 0 && (
                        <ProspectGrid
                          prospects={prospects}
                          searchContext={searchContext}
                          onFindContacts={async (ids) => {
                            const toEnrich = prospects.filter(p => ids.includes(p.id))
                            try {
                              const storedContext = sessionStorage.getItem('hermes-search-context')
                              const ctx = storedContext ? JSON.parse(storedContext) : searchContext
                              const res = await fetch('/api/enrich/people', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ prospects: toEnrich, context: ctx })
                              })
                              if (!res.ok) throw new Error('Enrichment failed')
                              const { enriched } = await res.json()
                              setProspects(prev => {
                                const byId = new Map(prev.map(p => [p.id, p]))
                                for (const p of enriched) byId.set(p.id, p)
                                return Array.from(byId.values())
                              })
                            } catch (err) {
                              if (process.env.NODE_ENV !== 'production') console.error('Find contacts failed:', err)
                            }
                          }}
                        />
                      )}
                    </div>
                  )}



                  {/* Show preview result with feedback loop */}
                  {searchStatus === 'completed' && prospects.length === 1 && uiType === 'results' && searchSummary?.preview === true && (
                    <ProspectPreviewCard
                      prospect={prospects[0]}
                      searchSummary={searchSummary}
                      onApprove={(feedback) => {
                        // Switch back to interactive mode to run full search
                        setUiType('interactive')
                        setSearchStatus('idle')
                        setSearchMessage('Great! Ready to run the full search with these criteria.')
                      }}
                      onReject={(feedback) => {
                        // Switch back to interactive mode with feedback
                        setUiType('interactive')
                        setSearchStatus('idle')
                        setSearchMessage(`I understand this isn't what you're looking for. Let's refine the search criteria based on your feedback: "${feedback}"`)
                      }}
                      onRefineSearch={(feedback) => {
                        // Switch back to interactive mode with refinement suggestions
                        setUiType('interactive')
                        setSearchStatus('idle')
                        setSearchMessage(`Let's refine the search based on your feedback: "${feedback}". I'll suggest some adjustments.`)
                      }}
                    />
                  )}

                  {/* Show results if available (multiple prospects) */}
                  {searchStatus === 'completed' && ((prospects.length > 1) || searchSummary?.preview !== true) && uiType !== 'interactive' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-100 shadow-sm">
                          <img src="/images/hermes-pixel.png" alt="Complete" className="h-4 w-4 object-contain" />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-gray-900">{prospects.length} prospects found</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">
                            Select companies and click <span className="font-semibold">Find Contacts</span> to resolve decision-makers and email addresses.
                          </p>
                        </div>
                      </div>

                      <ProspectGrid
                        prospects={prospects}
                        searchContext={searchContext}
                        onFindContacts={async (ids) => {
                          const toEnrich = prospects.filter(p => ids.includes(p.id))
                          try {
                            const storedContext = sessionStorage.getItem('hermes-search-context')
                            const ctx = storedContext ? JSON.parse(storedContext) : searchContext
                            const res = await fetch('/api/enrich/people', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ prospects: toEnrich, context: ctx })
                            })
                            if (!res.ok) throw new Error('Enrichment failed')
                            const { enriched } = await res.json()
                            setProspects(prev => {
                              const byId = new Map(prev.map(p => [p.id, p]))
                              for (const p of enriched) byId.set(p.id, p)
                              return Array.from(byId.values())
                            })
                          } catch (err) {
                            if (process.env.NODE_ENV !== 'production') console.error('Find contacts failed:', err)
                          }
                        }}
                      />
                      <div className="flex justify-end">
                        <a
                          href={typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || 'https://buy.stripe.com/cNi00i7UMc0xgLCfk56sw03') : '#'}
                          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-sm transition-colors"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Unlock Hermes Premium
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Show error if search failed */}
                  {(searchStatus === 'failed' || uiType === 'error') && uiType !== 'interactive' && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white p-2 rounded-lg border border-red-100 shadow-sm">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="text-[15px] font-bold text-gray-900">
                              Search failed
                            </p>
                            <p className="mt-0.5 text-[13px] font-medium text-red-700">
                              {searchMessage || 'An error occurred during the search'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setUiType('interactive')
                            setSearchStatus('idle')
                            setSearchMessage('Let\'s try again with different criteria')
                            setProspects([])
                          }}
                          className="text-[13px] font-semibold text-red-600 underline hover:text-red-800"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show idle state */}
                  {searchStatus === 'idle' && tool.state === 'result' && uiType === 'idle' && (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[14px] font-medium text-gray-500">
                        Ready to search for prospects. The search will execute automatically.
                      </p>
                    </div>
                  )}
                </CardContent>
                {false && showEmailDrafter && prospects.length > 0 && (
                  <div className="px-5 pb-5">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4 text-[13px] font-medium text-gray-500 shadow-sm">
                      Drafting emails for {prospects.length} prospects. You can define a template and add natural‑language enrichments.
                    </div>
                    {/* Inline interactive email drafter */}
                    <InteractiveEmailDrafter 
                      prospects={prospects}
                      searchSummary={searchSummary}
                      step={3}
                      totalSteps={5}
                      onEmailsGenerated={() => {
                        try {
                          window.dispatchEvent(new CustomEvent('pipeline-progress', {
                            detail: { stepNumber: 4, totalSteps: 5, percent: 85, label: 'Campaign draft ready' }
                          }))
                        } catch {}
                      }}
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Card>
          </Collapsible>
    </div>
  )
}

export default ProspectSearchSection
