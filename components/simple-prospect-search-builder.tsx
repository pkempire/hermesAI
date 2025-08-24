'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Target, X, Zap, Users, Building2, Mail, Phone, MapPin, Briefcase } from 'lucide-react'
import { useState } from 'react'

interface SimpleProspectSearchBuilderProps {
  initialCriteria: Array<{ label: string; value: string; type: string }>
  initialCount: number
  originalQuery: string
  step: number
  totalSteps: number
  onSearchExecute: (criteria: Array<{ label: string; value: string; type: string }>, count: number, entityType: string, enrichments: string[]) => void
  onPreviewExecute: (criteria: Array<{ label: string; value: string; type: string }>, count: number, entityType: string, enrichments: string[]) => void
}

export function SimpleProspectSearchBuilder({
  initialCriteria,
  initialCount,
  originalQuery,
  step,
  totalSteps,
  onSearchExecute,
  onPreviewExecute
}: SimpleProspectSearchBuilderProps) {
  const [criteria, setCriteria] = useState(initialCriteria)
  const [targetCount, setTargetCount] = useState(initialCount)
  const [newCriterion, setNewCriterion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [entityType, setEntityType] = useState('person')
  const [selectedEnrichments, setSelectedEnrichments] = useState([
    'email', 'linkedin', 'company_info', 'location', 'job_title'
  ])

  const availableEnrichments = [
    { id: 'email', label: 'Email Address', icon: Mail },
    { id: 'linkedin', label: 'LinkedIn Profile', icon: Users },
    { id: 'phone', label: 'Phone Number', icon: Phone },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'job_title', label: 'Job Title', icon: Briefcase },
    { id: 'company_info', label: 'Company Info', icon: Building2 }
  ]

  const addCriterion = () => {
    if (newCriterion.trim()) {
      setCriteria([...criteria, {
        label: newCriterion.trim(),
        value: newCriterion.trim(),
        type: 'criterion'
      }])
      setNewCriterion('')
    }
  }

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addCriterion()
    }
  }

  const executePreview = async () => {
    setIsLoading(true)
    await onPreviewExecute(criteria, 1, entityType, selectedEnrichments)
    setIsLoading(false)
  }

  const executeSearch = async () => {
    setIsLoading(true)
    await onSearchExecute(criteria, targetCount, entityType, selectedEnrichments)
    setIsLoading(false)
  }

  const toggleEnrichment = (enrichmentId: string) => {
    setSelectedEnrichments(prev => 
      prev.includes(enrichmentId) 
        ? prev.filter(id => id !== enrichmentId)
        : [...prev, enrichmentId]
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Refine Your Search
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Review and add more criteria to find the perfect prospects
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Step {step} of {totalSteps}
          </Badge>
        </div>
        
        {/* Progress */}
        <div className="mt-4">
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Original Query */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Original Search</h4>
          <p className="text-sm text-blue-800">&quot;{originalQuery}&quot;</p>
        </div>

        {/* Search Criteria */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Search Criteria</h4>
            <Badge variant="secondary" className="text-xs">
              {criteria.length} criteria
            </Badge>
          </div>
          
          {/* Criteria List */}
          <div className="space-y-2">
            {criteria.map((criterion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border group hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm text-gray-800">{criterion.label}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCriterion(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add New Criterion */}
          <div className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <Plus className="w-4 h-4 text-gray-400" />
            <Input
              value={newCriterion}
              onChange={(e) => setNewCriterion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add another criterion (e.g., 'Company has raised funding in last 12 months')"
              className="flex-1 border-0 bg-transparent focus:ring-0 text-sm"
            />
            <Button
              onClick={addCriterion}
              disabled={!newCriterion.trim()}
              size="sm"
              variant="outline"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Entity Type Selector */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Search Type</h4>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="person">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  People (LinkedIn profiles, contacts)
                </div>
              </SelectItem>
              <SelectItem value="company">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Companies (Business entities)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enrichments Selector */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Data to Extract</h4>
          <div className="grid grid-cols-2 gap-3">
            {availableEnrichments.map((enrichment) => {
              const IconComponent = enrichment.icon
              return (
                <div key={enrichment.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={enrichment.id}
                    checked={selectedEnrichments.includes(enrichment.id)}
                    onCheckedChange={() => toggleEnrichment(enrichment.id)}
                  />
                  <label
                    htmlFor={enrichment.id}
                    className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer"
                  >
                    <IconComponent className="w-4 h-4" />
                    {enrichment.label}
                  </label>
                </div>
              )
            })}
          </div>
        </div>

        {/* Target Count */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Target Number of Prospects</h4>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={targetCount}
              onChange={(e) => setTargetCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 25)))}
              min={1}
              max={1000}
              className="w-24 text-center"
            />
            <div className="flex gap-2">
              {[10, 25, 50, 100].map(count => (
                <Button
                  key={count}
                  variant={targetCount === count ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTargetCount(count)}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            💡 Tip: Be specific with your criteria for better results
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={executePreview}
              disabled={isLoading || criteria.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Preview (1 result)
            </Button>
            
            <Button
              onClick={() => {
                console.log('🚀 [SimpleProspectSearchBuilder] Starting full search...')
                executeSearch()
              }}
              disabled={isLoading || criteria.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 relative"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Find {targetCount} Prospects
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}