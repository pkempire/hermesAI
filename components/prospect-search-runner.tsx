'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
    cancelProspectSearch,
    checkProspectSearchStatus,
    saveCampaignToDatabase,
    startProspectSearch
} from '@/lib/actions/prospect-search'
import {
    AlertCircle,
    CheckCircle,
    Play,
    RefreshCw,
    Search,
    Square,
    Users
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { CampaignSettings, EmailSequence, ProspectCriteria } from './campaign-builder'
import { Prospect, ProspectGrid } from './prospect-grid'

interface ProspectSearchRunnerProps {
  criteria: ProspectCriteria
  emailSequence: EmailSequence[]
  settings: CampaignSettings
  onSearchComplete?: (prospects: Prospect[]) => void
  onError?: (error: string) => void
}

export function ProspectSearchRunner({
  criteria,
  emailSequence,
  settings,
  onSearchComplete,
  onError
}: ProspectSearchRunnerProps) {
  const [searchState, setSearchState] = useState<'idle' | 'running' | 'completed' | 'failed' | 'cancelled'>('idle')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [websetId, setWebsetId] = useState<string | null>(null)
  const [totalFound, setTotalFound] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPolling, setIsPolling] = useState(false)

  // Poll for search results when search is running
  useEffect(() => {
    if (searchState === 'running' && websetId && !isPolling) {
      setIsPolling(true)
      const pollInterval = setInterval(async () => {
        try {
          const result = await checkProspectSearchStatus(websetId)
          
          if (result.success) {
            setProspects(result.prospects)
            setTotalFound(result.totalFound)
            
            // Calculate progress based on target count vs found
            const progressPercent = Math.min((result.prospects.length / criteria.targetCount) * 100, 100)
            setProgress(progressPercent)
            
            if (result.status === 'completed') {
              setSearchState('completed')
              setIsPolling(false)
              clearInterval(pollInterval)
              
              // Save to database and notify completion
              try {
                await saveCampaignToDatabase(criteria, emailSequence, settings, websetId, result.prospects)
                onSearchComplete?.(result.prospects)
              } catch (saveError) {
                console.error('Error saving campaign:', saveError)
                // Continue anyway - search was successful
                onSearchComplete?.(result.prospects)
              }
            } else if (result.status === 'failed') {
              setSearchState('failed')
              setError(result.error || 'Search failed')
              setIsPolling(false)
              clearInterval(pollInterval)
              onError?.(result.error || 'Search failed')
            }
          } else {
            setError(result.error || 'Failed to check search status')
            setSearchState('failed')
            setIsPolling(false)
            clearInterval(pollInterval)
          }
        } catch (err) {
          console.error('Error polling search status:', err)
          setError('Error checking search progress')
          setSearchState('failed')
          setIsPolling(false)
          clearInterval(pollInterval)
        }
      }, 5000) // Poll every 5 seconds

      // Cleanup on unmount or when search completes
      return () => {
        clearInterval(pollInterval)
        setIsPolling(false)
      }
    }
  }, [searchState, websetId, isPolling, criteria.targetCount, criteria, emailSequence, settings, onSearchComplete, onError])

  const handleStartSearch = async () => {
    setSearchState('running')
    setError(null)
    setProspects([])
    setProgress(0)
    setTotalFound(0)

    try {
      const result = await startProspectSearch(criteria, emailSequence, settings)
      
      if (result.success && result.websetId) {
        setWebsetId(result.websetId)
        // Polling will start automatically via useEffect
      } else {
        setSearchState('failed')
        setError(result.error || 'Failed to start search')
        onError?.(result.error || 'Failed to start search')
      }
    } catch (err) {
      setSearchState('failed')
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  const handleCancelSearch = async () => {
    if (websetId) {
      try {
        await cancelProspectSearch(websetId)
        setSearchState('cancelled')
        setIsPolling(false)
      } catch (err) {
        console.error('Error canceling search:', err)
        // Continue with cancellation even if API call fails
        setSearchState('cancelled')
        setIsPolling(false)
      }
    }
  }

  const handleRetrySearch = () => {
    setSearchState('idle')
    setError(null)
    setWebsetId(null)
    setProgress(0)
    setProspects([])
    setTotalFound(0)
  }

  const getStatusIcon = () => {
    switch (searchState) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (searchState) {
      case 'running':
        return `Searching for prospects... (${prospects.length}/${criteria.targetCount} found)`
      case 'completed':
        return `Search completed! Found ${prospects.length} qualified prospects`
      case 'failed':
        return 'Search failed'
      case 'cancelled':
        return 'Search cancelled'
      default:
        return 'Ready to start prospect search'
    }
  }

  const getStatusColor = () => {
    switch (searchState) {
      case 'running':
        return 'blue'
      case 'completed':
        return 'green'
      case 'failed':
      case 'cancelled':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Prospect Search
              </CardTitle>
              <CardDescription>
                {getStatusText()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-${getStatusColor()}-600`}>
                {searchState.toUpperCase()}
              </Badge>
              {totalFound > 0 && (
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {totalFound} total
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {searchState === 'running' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Search Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {searchState === 'idle' || searchState === 'failed' || searchState === 'cancelled' ? (
              <Button 
                onClick={handleStartSearch}
                className="flex items-center gap-2"
                disabled={!criteria.query}
              >
                <Play className="h-4 w-4" />
                Start Search
              </Button>
            ) : searchState === 'running' ? (
              <Button 
                variant="destructive"
                onClick={handleCancelSearch}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Cancel Search
              </Button>
            ) : null}

            {(searchState === 'failed' || searchState === 'cancelled') && (
              <Button 
                variant="outline"
                onClick={handleRetrySearch}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>

          {/* Search Configuration Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="text-sm font-medium">Entity Type</div>
              <div className="text-sm text-muted-foreground capitalize">{criteria.entityType}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Target Count</div>
              <div className="text-sm text-muted-foreground">{criteria.targetCount}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Enrichments</div>
              <div className="text-sm text-muted-foreground">{criteria.includeEnrichments.length} enabled</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Email Sequence</div>
              <div className="text-sm text-muted-foreground">{emailSequence.length} emails</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prospects Grid */}
      {prospects.length > 0 && (
        <ProspectGrid
          prospects={prospects}
        />
      )}
    </div>
  )
} 