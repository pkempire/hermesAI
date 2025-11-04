'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Search, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EnhancedProspectSearchBuilder } from './enhanced-prospect-search-builder'
import { InteractiveEmailDrafter } from './interactive-email-drafter'
import { Prospect, ProspectGrid } from './prospect-grid'
import { ProspectPreviewCard } from './prospect-preview-card'
import { ProspectTable } from './prospect-table'

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
  const [lastStatus, setLastStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [showEmailDrafter, setShowEmailDrafter] = useState(false)
  const [evidenceMode, setEvidenceMode] = useState(false)

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
        if (result.type === 'streaming_search') {
          return { type: 'streaming', websetId: result.websetId, message: result.message }
        }
        
        // Handle completed search results
        if (result.type === 'search_results' || (result.success && result.prospects)) {
          const prospectsData = result.prospects || result.prospects || []
          return { type: 'results', prospects: prospectsData, summary: result.summary, message: result.message }
        }
        
        // Handle error
        if (result.type === 'error' || !result.success) {
          return { type: 'error', message: result.message }
        }
        
      } catch (error) {
        return { type: 'error', message: 'Failed to parse search results' }
      }
    }
    return null
  }, [tool])  // Add dependencies for useCallback

  // Start polling for streaming search updates with faster polling
  const startStreamingPolling = useCallback((websetId: string, target?: number, criteria?: { query?: string; entityType?: string; targetCount?: number }) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    let pollCount = 0
    const maxPolls = 1500 // 5 minutes at 200ms polling (faster for better UX)
    let hasDispatchedSuggestion = false // Prevent duplicate messages

    const interval = setInterval(async () => {
        try {
          pollCount++
          
          // Use the server-side API to get status
          const targetParam = target ? `&target=${target}` : ''
          const response = await fetch(`/api/prospect-search/status?websetId=${websetId}${targetParam}`)
          if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`)
          }
          
          const data = await response.json()
          setLastStatus(data.status as any)
          
          // Update progress messages
          if (data.found > 0 || data.analyzed > 0) {
            setSearchMessage(`Processing: ${data.analyzed} analyzed, ${data.found} prospects found...`)
          } else if (pollCount > 5) {
            setSearchMessage(`Still searching... (${pollCount * 3}s elapsed)`)
          }
          
          // Update prospects if available
          if (data.prospects && Array.isArray(data.prospects) && data.prospects.length > 0) {
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
          const targetTotal = target || criteria?.targetCount || 25
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
        
        // Handle timeout (only after 5 minutes - rare case)
        if (pollCount >= maxPolls) {
          setSearchStatus('failed')
          setSearchMessage('Search is taking longer than expected. Results may still arrive - check back soon or contact support.')
          clearInterval(interval)
          pollingIntervalRef.current = null
          return
        }
        
        // Check if search is complete
        if (data.status === 'completed' || data.status === 'idle') {
          setSearchStatus('completed')
          clearInterval(interval)
          pollingIntervalRef.current = null
          
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
              query: (criteria?.query || streamingWebsetId),
              entityType: (criteria?.entityType || 'company'),
              websetId: streamingWebsetId
            })
            try {
              window.dispatchEvent(new CustomEvent('pipeline-progress', {
                detail: { stepNumber: 2, totalSteps: 5, percent: 100, label: 'Discovery complete' }
              }))
            } catch {}

            // Store prospects and context for email drafter
            try {
              sessionStorage.setItem('hermes-latest-prospects', JSON.stringify(data.prospects))
              sessionStorage.setItem('hermes-search-summary', JSON.stringify({
                query: currentSearchCriteria.query || '',
                entityType: currentSearchCriteria.entityType || 'company',
                totalFound: data.prospects.length
              }))
              // Also store search context (targetPersona, offer) from tool result
              const toolResult = parseToolResult()
              if (toolResult?.props) {
                sessionStorage.setItem('hermes-search-context', JSON.stringify({
                  targetPersona: toolResult.props.targetPersona,
                  offer: toolResult.props.offer,
                  originalQuery: toolResult.props.originalQuery
                }))
              }
              
              // Save campaign for later viewing
              const campaigns = JSON.parse(localStorage.getItem('hermes-campaigns') || '[]')
              campaigns.unshift({
                id: `camp_${Date.now()}`,
                name: (criteria?.query || 'Untitled Campaign'),
                websetId: streamingWebsetId,
                query: criteria?.query,
                entityType: criteria?.entityType,
                totalFound: data.prospects.length,
                createdAt: new Date().toISOString(),
                status: 'completed'
              })
              // Keep only last 20 campaigns
              localStorage.setItem('hermes-campaigns', JSON.stringify(campaigns.slice(0, 20)))
            } catch (e) {
              console.warn('Failed to store prospects:', e)
            }
            
            // Ask the model to propose next step via a short assistant message (ONLY ONCE)
            if (!hasDispatchedSuggestion && data.prospects.length > 0) {
              hasDispatchedSuggestion = true
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('chat-system-suggest', {
                  detail: {
                    text: `Found ${data.prospects.length} ${data.prospects.length === 1 ? 'prospect' : 'prospects'}. Ready to draft personalized emails?`
                  }
                }))
              }, 300)
            }
          } else {
            setSearchMessage('Search completed but no prospects found. Try broadening your criteria.')
            setSearchStatus('completed')
          }
        } else if (data.status === 'failed') {
          setSearchStatus('failed')
          setSearchMessage(data.error || 'Search failed')
          clearInterval(interval)
          pollingIntervalRef.current = null
          setUiType('error')
        }
      } catch (error) {
        // Silent error handling - show user-friendly message instead
        
        // Only fail after multiple consecutive errors
        if (pollCount > 3) {
          setSearchStatus('failed')
          setSearchMessage(`Connection error: ${error instanceof Error ? error.message : 'Failed to get search updates'}`)
          clearInterval(interval)
          pollingIntervalRef.current = null
          setUiType('error')
        } else {
          setSearchMessage(`Retrying connection... (attempt ${pollCount})`)
        }
      }
    }, 200) // Ultra-fast polling for real-time updates (10x faster than typical)

    pollingIntervalRef.current = interval
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

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
      setEvidenceMode(Boolean(result.props?.evidenceMode))
      setSearchStatus('idle')
      setSearchMessage(result.message || 'Interactive search builder ready')
      // notify global progress (optional: could be elevated to context)
    } else if (result.type === 'streaming') {
      setUiType('streaming')
      setSearchStatus('running')
      setSearchMessage(result.message || 'Search started...')
      if (result.websetId) {
        setStreamingWebsetId(result.websetId)
        startStreamingPolling(result.websetId, currentSearchCriteria.targetCount, currentSearchCriteria)
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
          entityType: args.entityType || 'company',
          targetCount: args.targetCount || 10,
          enrichments: args.enrichments || ['email', 'linkedin', 'company_info']
        }
      } catch (error) {
        console.error('Error parsing search criteria:', error)
      }
    }
    
    return {
      query: '',
      entityType: 'company',
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
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Type: {currentSearchCriteria.entityType}
                  </Badge>
                  <Badge variant="outline" className="bg-info text-info border-info">
                    Target: {currentSearchCriteria.targetCount} prospects
                  </Badge>
                  {prospects.length > 0 && prospects.length < currentSearchCriteria.targetCount && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Found: {prospects.length} ({Math.round((prospects.length / currentSearchCriteria.targetCount) * 100)}%)
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-success text-success border-success">
                    {currentSearchCriteria.enrichments.length} enrichments
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-4 px-4 pb-4 pt-2">
                  {/* Enhanced loading animation while generating criteria */}
                  {uiType === 'idle' && tool && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="space-y-6"
                    >
                      {/* Hermes Analysis Header */}
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200/50 rounded-xl p-6 relative overflow-hidden"
                      >
                        {/* Animated background patterns */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 via-transparent to-yellow-100/20 animate-pulse" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-300/10 to-yellow-300/10 rounded-full -translate-y-8 translate-x-8 animate-divine-pulse" />

                        <div className="relative">
                          <div className="flex items-center gap-4 mb-6">
                            <motion.div
                              animate={{
                                rotate: [0, 360],
                                scale: [1, 1.1, 1]
                              }}
                              transition={{
                                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                              }}
                              className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg ring-4 ring-amber-200/30"
                            >
                              <Search className="h-7 w-7 text-white" />
                            </motion.div>
                            <div className="flex-1">
                              <motion.h3
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                className="text-lg font-bold text-amber-900 mb-1"
                              >
                                Hermes is analyzing your request...
                              </motion.h3>
                              <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                                className="text-sm text-amber-700"
                              >
                                Crafting the perfect search strategy to find your ideal prospects
                              </motion.p>
                            </div>
                          </div>

                          {/* Progressive Analysis Steps */}
                          <div className="space-y-4">
                            {/* Step 1: Criteria Generation */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6, duration: 0.4 }}
                              className="space-y-3"
                            >
                              <div className="flex items-center gap-2">
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                  className="h-2 w-2 bg-amber-500 rounded-full"
                                />
                                <span className="text-sm font-semibold text-amber-800">Generating search criteria</span>
                                <motion.div
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 1.2, repeat: Infinity }}
                                  className="text-xs text-amber-600"
                                >
                                  ✨ AI thinking...
                                </motion.div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {[1,2,3,4].map(i => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8 + (i * 0.1), duration: 0.3 }}
                                    className="relative"
                                  >
                                    <div className="h-10 bg-white/80 rounded-lg border border-amber-200/70 animate-divine-shimmer flex items-center px-3">
                                      <motion.div
                                        animate={{ width: ["0%", "100%", "0%"] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                        className="h-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
                                      />
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>

                            {/* Step 2: Enrichment Configuration */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.4, duration: 0.4 }}
                              className="space-y-3"
                            >
                              <div className="flex items-center gap-2">
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                  className="h-2 w-2 bg-yellow-500 rounded-full"
                                />
                                <span className="text-sm font-semibold text-amber-800">Configuring data enrichments</span>
                                <motion.div
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                                  className="text-xs text-amber-600"
                                >
                                  🔍 Mapping fields...
                                </motion.div>
                              </div>
                              <div className="space-y-2">
                                {[1,2,3,4,5].map(i => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.6 + (i * 0.1), duration: 0.3 }}
                                    className="relative"
                                  >
                                    <div className="h-8 bg-white/80 rounded-lg border border-amber-200/70 animate-divine-shimmer flex items-center px-3">
                                      <motion.div
                                        animate={{
                                          width: ["0%", "80%", "100%"],
                                          backgroundColor: ["rgb(245 158 11)", "rgb(251 191 36)", "rgb(34 197 94)"]
                                        }}
                                        transition={{
                                          duration: 1.8,
                                          repeat: Infinity,
                                          delay: i * 0.2,
                                          ease: "easeInOut"
                                        }}
                                        className="h-1.5 rounded-full"
                                      />
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>

                            {/* Step 3: Final Processing */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 2.2, duration: 0.4 }}
                              className="flex items-center justify-center gap-3 pt-4 border-t border-amber-200/50"
                            >
                              <motion.div
                                animate={{
                                  scale: [1, 1.3, 1],
                                  rotate: [0, 180, 360]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="h-3 w-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
                              />
                              <motion.span
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-sm font-medium text-amber-700"
                              >
                                Finalizing your divine search parameters...
                              </motion.span>
                              <motion.div
                                animate={{
                                  scale: [1, 1.3, 1],
                                  rotate: [360, 180, 0]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: 0.5
                                }}
                                className="h-3 w-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"
                              />
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Progress Indicator */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                        className="bg-white/80 border border-amber-200/50 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-amber-800">Processing Progress</span>
                          <motion.span
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-xs text-amber-600"
                          >
                            Crafting your search...
                          </motion.span>
                        </div>
                        <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                          <motion.div
                            animate={{
                              width: ["0%", "30%", "60%", "85%", "100%"],
                              backgroundColor: [
                                "rgb(245 158 11)",
                                "rgb(251 191 36)",
                                "rgb(252 211 77)",
                                "rgb(34 197 94)",
                                "rgb(16 185 129)"
                              ]
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="h-2 rounded-full shadow-sm"
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                  
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
                            // Try to get error message from response
                            const errorData = await response.json().catch(() => null)
                            const errorMsg = errorData?.message || errorData?.error || response.statusText
                            
                            // Handle specific error codes
                            if (response.status === 402) {
                              setUiType('error')
                              setSearchStatus('failed')
                              setSearchMessage(`⚠️ Quota Error: ${errorMsg}. Running in dev mode - this should be bypassed. Check your .env.local file.`)
                              return
                            }
                            
                            setUiType('error')
                            setSearchStatus('failed')
                            setSearchMessage(`Search failed: ${errorMsg}`)
                            return
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
                            <Search className="h-5 w-5 text-hermes-sky animate-pulse" />
                            <p className="text-sm font-medium text-hermes-sky">
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
                                <Users className="h-5 w-5 text-success" />
                                <div>
                                  <p className="text-sm font-medium text-success">
                                    {prospects.length} qualified prospects discovered
                                  </p>
                                  <p className="text-xs text-success mt-1">
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

                          {/* Single prospect deep‑dive: show last enriched prospect only */}
                          <div className="space-y-2">
                            {(() => {
                              const p = prospects[prospects.length - 1]
                              const ready = !!(p?.fullName || p?.email || p?.linkedinUrl || p?.jobTitle)
                              if (!ready) {
                                return (
                                  <div className="text-[11px] text-muted-foreground">Waiting for enrichments…</div>
                                )
                              }
                              return (
                                <div className="max-w-3xl mx-auto">
                                  <ProspectGrid prospects={[p]} />
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show search summary if available */}
                  {searchSummary && uiType !== 'interactive' && uiType !== 'streaming' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-hermes-sky" />
                        <div>
                          <p className="text-sm font-medium text-hermes-sky">
                            Search Summary
                          </p>
                          <p className="text-xs text-hermes-sky mt-1">
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
                          <Users className="h-5 w-5 text-success" />
                          <div>
                            <p className="text-sm font-medium text-success">
                              Prospect search completed successfully!
                            </p>
                            <p className="text-xs text-success mt-1">
                              Found {prospects.length} qualified prospects
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Display prospects */}
                      <ProspectTable prospects={prospects} />
                      <div className="flex justify-end gap-2 mt-4">
                        <a
                          href={typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || 'https://buy.stripe.com/cNi00i7UMc0xgLCfk56sw03') : '#'}
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
                          disabled={evidenceMode && prospects.every((p: any) => !p?.enrichments || (Array.isArray(p.enrichments) ? p.enrichments.length === 0 : Object.keys(p.enrichments || {}).length === 0))}
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
                          <AlertCircle className="h-5 w-5 text-error" />
                          <div>
                            <p className="text-sm font-medium text-error">
                              Search failed
                            </p>
                            <p className="text-xs text-error mt-1">
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
                          className="text-xs text-error hover:text-error underline"
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
                {false && showEmailDrafter && prospects.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="rounded-md border bg-card p-3 mb-3 text-xs text-muted-foreground">
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
        </motion.div>
  )
}

export default ProspectSearchSection