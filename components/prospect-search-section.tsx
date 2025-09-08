'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Search, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EnhancedProspectSearchBuilder } from './enhanced-prospect-search-builder'
import { Prospect, ProspectGrid } from './prospect-grid'
import { ProspectPreviewCard } from './prospect-preview-card'

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
  console.log('🔧 [Frontend] =================== PROSPECT SEARCH SECTION RENDERED ===================')
  console.log('🔧 [Frontend] Tool name:', tool.toolName)
  console.log('🔧 [Frontend] Tool state:', tool.state)
  console.log('🔧 [Frontend] Tool args:', tool.args)
  console.log('🔧 [Frontend] Tool result exists:', !!(tool as any).result)
  console.log('🔧 [Frontend] Tool result:', (tool as any).result)
  console.log('🔧 [Frontend] Is open:', isOpen)
  
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [searchStatus, setSearchStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [searchMessage, setSearchMessage] = useState<string>('')
  const [searchSummary, setSearchSummary] = useState<any>(null)
  const [uiType, setUiType] = useState<'idle' | 'interactive' | 'streaming' | 'results' | 'error'>('idle')
  const [streamingWebsetId, setStreamingWebsetId] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [lastStatus, setLastStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [showEmailDrafter, setShowEmailDrafter] = useState(false)

  // Parse the tool result to determine UI type and handle different response formats
  const parseToolResult = useCallback(() => {
    console.log('🔍 [ProspectSearchSection] Parsing tool result...')
    console.log('🔍 [ProspectSearchSection] Tool state is:', tool.state)
    console.log('🔍 [ProspectSearchSection] Tool result is:', (tool as any).result)
    console.log('🔍 [ProspectSearchSection] Full tool object:', JSON.stringify(tool, null, 2))
    
    // Check if result exists - try regardless of state for debugging
    const toolResult = (tool as any).result
    if (toolResult) {
      try {
        let result = toolResult
        if (typeof toolResult === 'string') {
          try {
            result = JSON.parse(toolResult)
          } catch (parseError) {
            console.error('❌ [ProspectSearchSection] JSON parse error:', parseError)
            result = toolResult
          }
        }
        console.log('🔍 [ProspectSearchSection] Parsed result:', result)
        console.log('🔍 [ProspectSearchSection] Result type:', result?.type)
        
        // Handle interactive UI configuration
        if (result.type === 'interactive_ui') {
          console.log('🎨 [ProspectSearchSection] Interactive UI requested')
          return { type: 'interactive', props: result.props, message: result.message }
        }
        
        // Handle streaming search configuration
        if (result.type === 'streaming_search') {
          console.log('🔄 [ProspectSearchSection] Streaming search started')
          return { type: 'streaming', websetId: result.websetId, message: result.message }
        }
        
        // Handle completed search results
        if (result.type === 'search_results' || (result.success && result.prospects)) {
          console.log('✅ [ProspectSearchSection] Search results received')
          const prospectsData = result.prospects || result.prospects || []
          return { type: 'results', prospects: prospectsData, summary: result.summary, message: result.message }
        }
        
        // Handle error
        if (result.type === 'error' || !result.success) {
          console.log('❌ [ProspectSearchSection] Search failed:', result.message)
          return { type: 'error', message: result.message }
        }
        
      } catch (error) {
        console.error('❌ [ProspectSearchSection] Error parsing prospect search result:', error)
        return { type: 'error', message: 'Failed to parse search results' }
      }
    } else {
      console.log('🔍 [ProspectSearchSection] Tool state is not "result" or no result available')
      console.log('🔍 [ProspectSearchSection] Tool state:', tool.state)
      console.log('🔍 [ProspectSearchSection] Tool result exists:', !!(tool as any).result)
    }
    
    console.log('❌ [ProspectSearchSection] No valid tool result found')
    return null
  }, [tool])  // Add dependencies for useCallback

  // Start polling for streaming search updates
  const startStreamingPolling = useCallback((websetId: string, target?: number) => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    let pollCount = 0
    const maxPolls = 60 // 3 minutes max at 3-second intervals
    
    const interval = setInterval(async () => {
      try {
        pollCount++
        console.log(`📡 [ProspectSearchSection] Polling streaming search status (${pollCount}/${maxPolls})...`)
        
        // Use the server-side API to get status
        const targetParam = target ? `&target=${target}` : ''
        const response = await fetch(`/api/prospect-search/status?websetId=${websetId}${targetParam}`)
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`)
        }
        
        const data = await response.json()
        console.log(`📊 [ProspectSearchSection] Poll ${pollCount}: Status=${data.status}, Prospects=${data.prospects?.length || 0}, Found=${data.found}, Analyzed=${data.analyzed}`)
        setLastStatus(data.status as any)
        
        // Update progress messages
        if (data.found > 0 || data.analyzed > 0) {
          setSearchMessage(`Processing: ${data.analyzed} analyzed, ${data.found} prospects found...`)
        } else if (pollCount > 5) {
          setSearchMessage(`Still searching... (${pollCount * 3}s elapsed)`)
        }
        
        // Update prospects if available
        if (data.prospects && Array.isArray(data.prospects) && data.prospects.length > 0) {
          console.log('📊 [ProspectSearchSection] Updating prospects list:', data.prospects.length)
          setProspects(prev => {
            // Merge by unique id to allow incremental growth without flicker
            const byId = new Map<string, Prospect>()
            for (const p of prev) byId.set(p.id, p)
            for (const p of data.prospects) byId.set(p.id, p)
            return Array.from(byId.values())
          })
        }

        // Emit pipeline progress event for the campaign tracker (0-100)
        try {
          const targetTotal = target || currentSearchCriteria.targetCount || 25
          const found = typeof data.found === 'number' ? data.found : (data.prospects?.length || 0)
          const percent = Math.max(0, Math.min(100, Math.round((found / Math.max(1, targetTotal)) * 100)))
          window.dispatchEvent(new CustomEvent('pipeline-progress', {
            detail: {
              stepNumber: 1,
              totalSteps: 5,
              percent,
              label: 'Searching and analyzing'
            }
          }))
        } catch {}
        
        // Handle timeout
        if (pollCount >= maxPolls) {
          console.warn('⏰ [ProspectSearchSection] Polling timeout reached')
          setSearchStatus('failed')
          setSearchMessage('Search took too long. Try a smaller target (e.g., 10–25) or simplify criteria.')
          clearInterval(interval)
          setPollingInterval(null)
          setUiType('error')
          return
        }
        
        // Check if search is complete
        if (data.status === 'completed' || data.status === 'idle') {
          setSearchStatus('completed')
          clearInterval(interval)
          setPollingInterval(null)
          
          if (data.prospects?.length > 0) {
            // Switch to results UI for multiple prospects, keep streaming for single prospect preview
            if (data.prospects.length > 1) {
              setUiType('results')
              setSearchMessage(`Search completed! Found ${data.prospects.length} qualified prospects.`)
            } else {
              setSearchMessage(`Search completed! Found ${data.prospects.length} prospect.`)
            }
            
            setSearchSummary({
              totalFound: data.prospects.length,
              query: currentSearchCriteria.query || streamingWebsetId,
              entityType: currentSearchCriteria.entityType || 'person',
              websetId: streamingWebsetId
            })
            try {
              window.dispatchEvent(new CustomEvent('pipeline-progress', {
                detail: { stepNumber: 2, totalSteps: 5, percent: 100, label: 'Discovery complete' }
              }))
            } catch {}

            // Ask the model to propose next step via a short assistant message
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('chat-system-suggest', {
                detail: {
                  text: `Found ${data.prospects.length} prospects. I can now draft concise outreach and set up your email campaign. Ready to draft emails?`
                }
              }))
            }, 300)
          } else {
            setSearchMessage('Search completed but no prospects found. Try broadening your criteria.')
            setSearchStatus('completed')
          }
        } else if (data.status === 'failed') {
          setSearchStatus('failed')
          setSearchMessage(data.error || 'Search failed')
          clearInterval(interval)
          setPollingInterval(null)
          setUiType('error')
        }
      } catch (error) {
        console.error('❌ [ProspectSearchSection] Error polling streaming search:', error)
        
        // Only fail after multiple consecutive errors
        if (pollCount > 3) {
          setSearchStatus('failed')
          setSearchMessage(`Connection error: ${error instanceof Error ? error.message : 'Failed to get search updates'}`)
          clearInterval(interval)
          setPollingInterval(null)
          setUiType('error')
        } else {
          setSearchMessage(`Retrying connection... (attempt ${pollCount})`)
        }
      }
    }, 3000) // Poll every 3 seconds

    setPollingInterval(interval)
  }, [pollingInterval])  // Remove excessive dependencies that cause re-renders

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Parse tool result whenever tool changes
  useEffect(() => {
    console.log('🔄 [ProspectSearchSection] Tool changed, parsing result...')
    const result = parseToolResult()
    
    if (!result) return
    
    // IMPORTANT: Only let tool result set UI when we haven't started a local run
    if (uiType !== 'idle') return

    // Initialize UI from tool result on first mount only
    if (result.type === 'interactive') {
      setUiType('interactive')
      setSearchStatus('idle')
      setSearchMessage(result.message || 'Interactive search builder ready')
      // notify global progress (optional: could be elevated to context)
    } else if (result.type === 'streaming') {
      setUiType('streaming')
      setSearchStatus('running')
      setSearchMessage(result.message || 'Search started...')
      if (result.websetId) {
        setStreamingWebsetId(result.websetId)
        startStreamingPolling(result.websetId, currentSearchCriteria.targetCount)
      }
    } else if (result.type === 'results') {
      setUiType('results')
      setSearchStatus('completed')
      setProspects(result.prospects || [])
      setSearchMessage(result.message || `Found ${result.prospects?.length || 0} prospects`)
      setSearchSummary(result.summary)
    } else if (result.type === 'error') {
      setUiType('error')
      setSearchStatus('failed')
      setSearchMessage(result.message || 'Search failed')
    }
  }, [tool, parseToolResult, startStreamingPolling, uiType])

  // Debug UI type changes
  useEffect(() => {
    console.log('🎭 [ProspectSearchSection] UI Type changed to:', uiType)
  }, [uiType])

  const toolResult = useMemo(() => parseToolResult(), [parseToolResult])
  console.log('🔍 [ProspectSearchSection] Tool result parsed:', toolResult)

  // If we have no prospects yet but status shows counts, synthesize placeholders (optional)
  useEffect(() => {
    if (uiType === 'streaming' && prospects.length === 0 && lastStatus !== 'failed') {
      // Keep the UI in streaming mode until data arrives
      setSearchStatus('running')
    }
  }, [uiType, prospects.length, lastStatus])

  // Extract search criteria from tool arguments for display
  const getSearchCriteria = () => {
    if (tool.args) {
      try {
        const args = typeof tool.args === 'string' ? JSON.parse(tool.args) : tool.args
        return {
          query: args.query || '',
          entityType: args.entityType || 'person',
          targetCount: args.targetCount || 10,
          enrichments: args.enrichments || ['email', 'linkedin', 'company_info']
        }
      } catch (error) {
        console.error('Error parsing search criteria:', error)
      }
    }
    
    return {
      query: '',
      entityType: 'person',
      targetCount: 10,
      enrichments: ['email', 'linkedin', 'company_info']
    }
  }

  const currentSearchCriteria = getSearchCriteria()

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
        return <CheckCircle className="h-5 w-5 text-white" />
      case 'running':
        return <Search className="h-5 w-5 text-white animate-pulse" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-white" />
      default:
        return <Search className="h-5 w-5 text-white" />
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

  // Suggest refinement based on prospect-feedback events
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const detail = e?.detail
        if (!detail) return
        // For now, just surface a suggestion message
        setSearchMessage(detail.type === 'good'
          ? 'Noted good fit — I can prioritize similar titles/companies next.'
          : 'Got it — I will down-rank similar profiles and suggest tighter criteria.')
      } catch {}
    }
    window.addEventListener('prospect-feedback', handler as any)
    return () => window.removeEventListener('prospect-feedback', handler as any)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full my-4 rounded-xl bg-card border border-border p-0 md:p-2"
    >
      {/* Removed embedded step progress - handled by global campaign tracker */}

      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <Card className="w-full border-none shadow-none bg-transparent">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/40 transition-all duration-200 rounded-t-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/90">
                    {getStatusIcon()}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Prospect Discovery
                    </CardTitle>
                    <Badge variant={getStatusBadgeVariant()} className="mt-1 text-[10px]">
                      {searchStatus === 'completed' ? '✓ Complete' : 
                       searchStatus === 'running' ? '⏳ Searching...' : 
                       searchStatus === 'failed' ? '✗ Failed' : 'Ready'}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-muted">
                  {isOpen ? <ChevronDown className="h-5 w-5 text-gray-600" /> : <ChevronRight className="h-5 w-5 text-gray-600" />}
                </div>
              </div>
              <div className="space-y-2">
                <CardDescription className="text-xs">
                  {searchMessage || `Ready to search for: ${currentSearchCriteria.query}`}
                </CardDescription>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Type: {currentSearchCriteria.entityType}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    Target: {currentSearchCriteria.targetCount} prospects
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Enrichments: {currentSearchCriteria.enrichments.join(', ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-4 px-4 pb-4 pt-2">
                  {/* Interactive UI Component */}
                  {uiType === 'interactive' && toolResult?.props && (
                    <EnhancedProspectSearchBuilder
                      initialCriteria={toolResult.props.initialCriteria || []}
                      initialEnrichments={toolResult.props.initialEnrichments || []}
                      initialCustomEnrichments={toolResult.props.initialCustomEnrichments || []}
                      initialEntityType={toolResult.props.initialEntityType || 'person'}
                      initialCount={toolResult.props.initialCount || 25}
                      originalQuery={toolResult.props.originalQuery || ''}
                      step={toolResult.props.step || 1}
                      totalSteps={toolResult.props.totalSteps || 5}
                      onSearchExecute={async (searchParams) => {
                        console.log('🚀 [ProspectSearchSection] Starting search with:', searchParams)
                        
                        // Immediately transition to streaming UI
                        setUiType('streaming')
                        setSearchStatus('running')
                        setSearchMessage('Starting search...')
                        setProspects([]) // Clear any existing prospects
                        
                        try {
                          const response = await fetch('/api/prospect-search/execute', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...(searchParams || {}), preview: false })
                          })
                          
                          if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                          }
                          
                          const result = await response.json()
                          console.log('📊 [ProspectSearchSection] Search API response:', result)
                          
                          if (result.type === 'streaming_search') {
                            setStreamingWebsetId(result.websetId)
                            setSearchMessage(result.message || 'Search started, finding prospects...')
                            startStreamingPolling(result.websetId, (searchParams as any)?.targetCount ?? currentSearchCriteria.targetCount)
                          } else if (result.type === 'error') {
                            setUiType('error')
                            setSearchStatus('failed')
                            setSearchMessage(result.message || 'Search failed')
                          }
                        } catch (error) {
                          console.error('❌ [ProspectSearchSection] Search execution error:', error)
                          setUiType('error')
                          setSearchStatus('failed')
                          setSearchMessage(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                        }
                      }}
                      onPreviewExecute={async (previewParams) => {
                        console.log('👁️ [ProspectSearchSection] Starting preview with:', previewParams)
                        
                        // Show loading state for preview
                        setUiType('streaming')
                        setSearchStatus('running')
                        setSearchMessage('Getting preview result...')
                        setProspects([])
                        
                        try {
                          const response = await fetch('/api/prospect-search/execute', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...(previewParams || {}), preview: true, targetCount: 1 })
                          })
                          
                          if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                          }
                          
                          const result = await response.json()
                          console.log('🔍 [ProspectSearchSection] Preview API response:', result)
                          
                          if (result.type === 'preview_result') {
                            setUiType('results')
                            setProspects(result.prospects || [])
                            setSearchSummary(result.summary)
                            setSearchStatus('completed')
                            setSearchMessage(result.message || 'Preview completed')
                          } else if (result.type === 'preview_timeout') {
                            // Handle timeout - start polling for this webset
                            setStreamingWebsetId(result.websetId)
                            setSearchMessage(result.message || 'Preview taking longer than expected, monitoring...')
                            startStreamingPolling(result.websetId)
                          } else if (result.type === 'error') {
                            setUiType('error')
                            setSearchStatus('failed')
                            setSearchMessage(result.message || 'Preview failed')
                          }
                        } catch (error) {
                          console.error('❌ [ProspectSearchSection] Preview execution error:', error)
                          setUiType('error')
                          setSearchStatus('failed')
                          setSearchMessage(`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                        }
                      }}
                    />
                  )}

                  {console.log('🎨 [ProspectSearchSection] Render check - uiType:', uiType, 'searchStatus:', searchStatus, 'prospects:', prospects.length)}
                  
                  {/* Streaming Search Progress */}
                  {uiType === 'streaming' && (
                    <div className="space-y-4">
                      {/* Real-time Progress Bar */}
                      <div className="bg-muted/40 border border-border rounded-md p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Search className="h-5 w-5 text-blue-600 animate-pulse" />
                            <p className="text-sm font-medium text-blue-800">
                              {searchStatus === 'completed' ? 'Search Completed!' : lastStatus === 'running' ? 'Searching and analyzing sources…' : 'Initializing search…'}
                            </p>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {prospects.length} found
                          </div>
                        </div>
                        
                        {/* Progress indicators */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Progress</span>
                            <span>{searchMessage || (lastStatus === 'running' ? 'Working…' : 'Starting…')}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full transition-all duration-500 animate-pulse"
                              style={{ width: `${Math.min((prospects.length / (currentSearchCriteria.targetCount || 25)) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{prospects.length} prospects found</span>
                            <span>Target: {currentSearchCriteria.targetCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Empty state while searching */}
                      {prospects.length === 0 && searchStatus === 'running' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                          <div className="flex items-center space-x-2">
                            <Search className="h-5 w-5 text-yellow-600 animate-pulse" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                {lastStatus === 'running' ? 'Scanning sources and enriching…' : 'Starting the pipeline…'}
                              </p>
                              <p className="text-[11px] text-amber-700 mt-1">
                                This might take a moment. We’ll stream results as soon as we verify matches.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Real-time prospect discovery */}
                      {prospects.length > 0 && (
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-green-600" />
                                <div>
                                  <p className="text-sm font-medium text-green-800">
                                    {prospects.length} qualified prospects discovered
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    Live updates • Data enriching in background
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] text-green-700 font-mono">LIVE</span>
                              </div>
                            </div>
                          </div>

                          {/* Animated prospect cards as they stream in */}
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                              <span>Latest Prospects</span>
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                            </div>
                            <ProspectGrid 
                              prospects={prospects}
                              onSelectionChange={(ids) => {
                                // Could be used to enable CTA or next step
                                console.log('📝 Selected prospects:', ids.length)
                              }}
                              onReviewComplete={() => {
                                // Transition to next step: drafting emails
                                setUiType('results')
                                setSearchStatus('completed')
                                setSearchMessage('Prospect review complete! Moving to email drafting…')
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show search summary if available */}
                  {searchSummary && uiType !== 'interactive' && uiType !== 'streaming' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Search Summary
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Query: &quot;{searchSummary.query}&quot; • Entity Type: {searchSummary.entityType} • 
                            Found: {searchSummary.totalFound} prospects
                            {searchSummary.websetId && ` • ID: ${searchSummary.websetId.slice(-8)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show preview result with feedback loop */}
                  {searchStatus === 'completed' && prospects.length === 1 && uiType === 'results' && (
                    <ProspectPreviewCard
                      prospect={prospects[0]}
                      searchSummary={searchSummary}
                      onApprove={(feedback) => {
                        console.log('✅ [ProspectSearchSection] Preview approved:', feedback)
                        // Switch back to interactive mode to run full search
                        setUiType('interactive')
                        setSearchStatus('idle')
                        setSearchMessage('Great! Ready to run the full search with these criteria.')
                      }}
                      onReject={(feedback) => {
                        console.log('❌ [ProspectSearchSection] Preview rejected:', feedback)
                        // Switch back to interactive mode with feedback
                        setUiType('interactive')
                        setSearchStatus('idle')
                        setSearchMessage(`I understand this isn't what you're looking for. Let's refine the search criteria based on your feedback: "${feedback}"`)
                      }}
                      onRefineSearch={(feedback) => {
                        console.log('🔧 [ProspectSearchSection] Search refinement requested:', feedback)
                        // Switch back to interactive mode with refinement suggestions
                        setUiType('interactive')
                        setSearchStatus('idle')
                        setSearchMessage(`Let's refine the search based on your feedback: "${feedback}". I'll suggest some adjustments.`)
                      }}
                    />
                  )}

                  {/* Show results if available (multiple prospects) */}
                  {searchStatus === 'completed' && prospects.length > 1 && uiType !== 'interactive' && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Prospect search completed successfully!
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Found {prospects.length} qualified prospects
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Display prospects */}
                      <ProspectGrid prospects={prospects} />
                      <div className="flex justify-end gap-2">
                        <a
                          href={typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || 'https://stripe.com') : '#'}
                          className="px-3 py-2 text-xs rounded-md border bg-white hover:bg-muted transition-colors"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Upgrade $39/mo
                        </a>
                        <button
                          className="px-3 py-2 text-xs rounded-md border bg-white hover:bg-muted transition-colors"
                          onClick={() => {
                            setShowEmailDrafter(true)
                            try {
                              window.dispatchEvent(new CustomEvent('pipeline-progress', {
                                detail: { stepNumber: 3, totalSteps: 5, percent: 60, label: 'Draft emails' }
                              }))
                            } catch {}
                          }}
                        >
                          Draft Emails
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show error if search failed */}
                  {(searchStatus === 'failed' || uiType === 'error') && uiType !== 'interactive' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="text-sm font-medium text-red-800">
                              Search failed
                            </p>
                            <p className="text-xs text-red-600 mt-1">
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
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show idle state */}
                  {searchStatus === 'idle' && tool.state === 'result' && uiType === 'idle' && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Ready to search for prospects. The search will execute automatically.
                      </p>
                    </div>
                  )}
                </CardContent>
                {showEmailDrafter && prospects.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="rounded-md border bg-card p-3 mb-3 text-xs text-muted-foreground">
                      Drafting emails for {prospects.length} prospects. You can define a template and add natural‑language enrichments.
                    </div>
                    {/* Inline interactive email drafter */}
                    <div className="bg-white rounded-md border p-3">
                      {/* Light-weight header and CTA to open a dedicated drawer/page later; for now we render inline */}
                      <div className="text-xs text-muted-foreground mb-2">Interactive Email Drafter</div>
                      {/* @ts-ignore */}
                      <div className="mt-2">
                        {/* We import directly to keep scope minimal for now */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <span className="text-[11px]">Open the drafter via the Templates tab to customize subject/body with variables like {'{'}firstName{'}'}, {'{'}company{'}'}. AI generation available.</span>
                      </div>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </motion.div>
  )
}

export default ProspectSearchSection