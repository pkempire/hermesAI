'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { createExaWebsetsClient, createProspectEnrichments } from '@/lib/clients/exa-websets'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Pause, Play, RotateCcw, Search, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Prospect, ProspectGrid } from './prospect-grid'

interface InteractiveProspectSearchProps {
  initialQuery?: string
  initialTargetCount?: number
  onSearchComplete?: (prospects: Prospect[], websetId: string) => void
}

export function InteractiveProspectSearch({
  initialQuery = '',
  initialTargetCount = 25,
  onSearchComplete
}: InteractiveProspectSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [targetCount, setTargetCount] = useState(initialTargetCount)
  
  const [searchStatus, setSearchStatus] = useState<'idle' | 'running' | 'completed' | 'failed' | 'paused'>('idle')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [progress, setProgress] = useState({ found: 0, analyzed: 0, completion: 0 })
  const [websetId, setWebsetId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchMessage, setSearchMessage] = useState('')
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const exaClientRef = useRef<any>(null)

  // Initialize Exa client
  useEffect(() => {
    try {
      exaClientRef.current = createExaWebsetsClient()
    } catch (err) {
      setError('Failed to initialize search client')
      console.error('Error initializing Exa client:', err)
    }
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const startSearch = async () => {
    if (!exaClientRef.current) {
      setError('Search client not initialized')
      return
    }

    setSearchStatus('running')
    setProspects([])
    setError(null)
    setProgress({ found: 0, analyzed: 0, completion: 0 })
    setSearchMessage('Starting prospect search...')

    try {
      // Create webset search configuration - just use the natural language query
      const websetSearchConfig = {
        query: query,
        count: Math.min(targetCount, 1000), // Respect API limits
        entity: { type: 'person' as const }, // Default to person search
        behavior: 'override' as const
      }
      
      const websetEnrichments = createProspectEnrichments()

      console.log('🔧 [InteractiveProspectSearch] Creating webset with config:', websetSearchConfig)

      // Create the webset
      const webset = await exaClientRef.current.createWebset({
        search: websetSearchConfig,
        enrichments: websetEnrichments
      })

      setWebsetId(webset.id)
      setSearchMessage(`Search started! Found ${webset.searches?.[0]?.progress?.found || 0} prospects so far...`)

      // Start polling for updates
      startPolling(webset.id)

    } catch (err) {
      console.error('❌ [InteractiveProspectSearch] Error starting search:', err)
      setError(err instanceof Error ? err.message : 'Failed to start search')
      setSearchStatus('failed')
      setSearchMessage('Failed to start search')
    }
  }

  const startPolling = (id: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    pollingRef.current = setInterval(async () => {
      try {
        // Get webset status
        const webset = await exaClientRef.current.getWebset(id)
        const search = webset.searches?.[0]
        
        if (search) {
          const currentProgress = search.progress || { found: 0, analyzed: 0, completion: 0 }
          setProgress(currentProgress)
          
          if (currentProgress.found > 0) {
            setSearchMessage(`Found ${currentProgress.found} prospects, analyzed ${currentProgress.analyzed}...`)
          }

          // Get current results
          const itemsResponse = await exaClientRef.current.listItems(id, { limit: targetCount })
          const currentProspects = itemsResponse.data.map((item: any) => exaClientRef.current.convertToProspect(item))
          setProspects(currentProspects)

          // Check if search is complete
          if (search.status === 'completed') {
            setSearchStatus('completed')
            setSearchMessage(`Search completed! Found ${currentProspects.length} qualified prospects.`)
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
            }
            if (onSearchComplete) {
              onSearchComplete(currentProspects, id)
            }
          } else if (search.status === 'failed') {
            setSearchStatus('failed')
            setSearchMessage('Search failed')
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
            }
          }
        }
      } catch (err) {
        console.error('❌ [InteractiveProspectSearch] Error polling:', err)
        setError('Failed to get search updates')
        setSearchStatus('failed')
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
        }
      }
    }, 3000) // Poll every 3 seconds
  }

  const pauseSearch = () => {
    setSearchStatus('paused')
    setSearchMessage('Search paused')
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
  }

  const resumeSearch = () => {
    if (websetId) {
      setSearchStatus('running')
      setSearchMessage('Resuming search...')
      startPolling(websetId)
    }
  }

  const resetSearch = () => {
    setSearchStatus('idle')
    setProspects([])
    setProgress({ found: 0, analyzed: 0, completion: 0 })
    setWebsetId(null)
    setError(null)
    setSearchMessage('')
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
  }

  const getStatusIcon = () => {
    switch (searchStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-white" />
      case 'running':
        return <Search className="h-5 w-5 animate-pulse text-white" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-white" />
      case 'paused':
        return <Pause className="h-5 w-5 text-white" />
      default:
        return <Search className="h-5 w-5 text-white" />
    }
  }

  const getStatusBadgeVariant = () => {
    switch (searchStatus) {
      case 'completed':
        return 'default'
      case 'running':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'paused':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Search Configuration */}
      <Card className="border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-lg rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              {getStatusIcon()}
            </div>
            <div>
              <div className="text-xl font-semibold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent">
                Prospect Search Builder
              </div>
              <Badge variant={getStatusBadgeVariant()} className="mt-1">
                {searchStatus === 'completed' ? '✓ Complete' : 
                 searchStatus === 'running' ? '⏳ Searching...' : 
                 searchStatus === 'failed' ? '✗ Failed' : 
                 searchStatus === 'paused' ? '⏸️ Paused' : '🎯 Ready to Search'}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className="text-base">
            Fine-tune your search criteria and launch when ready
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="query">Search Query</Label>
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., CTOs at fintech companies in San Francisco"
                disabled={searchStatus === 'running'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetCount">Target Count</Label>
              <Input
                id="targetCount"
                type="number"
                min={1}
                max={1000}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                disabled={searchStatus === 'running'}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-100">
            {searchStatus === 'idle' && (
              <Button 
                onClick={startSearch} 
                disabled={!query.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <Play className="h-5 w-5 mr-2" />
                Launch Prospect Search
              </Button>
            )}
            
            {searchStatus === 'running' && (
              <Button 
                variant="outline" 
                onClick={pauseSearch}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Search
              </Button>
            )}
            
            {searchStatus === 'paused' && (
              <Button 
                onClick={resumeSearch}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume Search
              </Button>
            )}
            
            {(searchStatus === 'completed' || searchStatus === 'failed') && (
              <Button 
                variant="outline" 
                onClick={resetSearch}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start New Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Progress */}
      <AnimatePresence>
        {searchStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-900">Search Progress</div>
                    <div className="text-sm text-blue-600 mt-1">
                      {searchMessage || 'Monitoring search progress...'}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress.completion)}%</span>
                  </div>
                  <Progress value={progress.completion} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.found} found</span>
                    <span>{progress.analyzed} analyzed</span>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Search Error</p>
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {prospects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 bg-gradient-to-br from-green-50 to-blue-50 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-900">
                      Found Prospects ({prospects.length})
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      {searchStatus === 'completed' 
                        ? '✓ Search completed successfully!' 
                        : '🔄 Results updating in real-time...'}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProspectGrid prospects={prospects} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 