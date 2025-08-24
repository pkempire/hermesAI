'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  MapPin, 
  Search, 
  Target, 
  User, 
  Users, 
  Zap,
  Plus,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useState } from 'react'

// Enhanced types for detailed search criteria
interface SearchCriterion {
  label: string
  value: string
  type: 'job_title' | 'company_type' | 'industry' | 'location' | 'technology' | 'activity' | 'other'
  enabled: boolean
}

interface EnrichmentField {
  label: string
  value: string
  required: boolean
  enabled: boolean
}

interface CustomEnrichment {
  label: string
  value: string
  description: string
}

interface EnhancedProspectSearchBuilderProps {
  initialCriteria: Array<{ label: string; value: string; type: string }>
  initialEnrichments: Array<{ label: string; value: string; required: boolean }>
  initialCustomEnrichments?: Array<{ label: string; value: string; description: string }>
  initialEntityType: 'person' | 'company'
  initialCount: number
  previewMode?: boolean
  originalQuery: string
  step?: number
  totalSteps?: number
  onSearchExecute?: (params: any) => void
  onPreviewExecute?: (params: any) => void
}

export function EnhancedProspectSearchBuilder({
  initialCriteria = [],
  initialEnrichments = [],
  initialCustomEnrichments = [],
  initialEntityType = 'person',
  initialCount = 25,
  previewMode = false,
  originalQuery = '',
  step = 1,
  totalSteps = 5,
  onSearchExecute,
  onPreviewExecute
}: EnhancedProspectSearchBuilderProps) {
  // State management
  const [criteria, setCriteria] = useState<SearchCriterion[]>(
    initialCriteria.map(c => ({ 
      ...c, 
      type: c.type as any,
      enabled: true 
    }))
  )
  const [enrichments, setEnrichments] = useState<EnrichmentField[]>(
    initialEnrichments.map(e => ({ ...e, enabled: e.required }))
  )
  const [customEnrichments, setCustomEnrichments] = useState<CustomEnrichment[]>(initialCustomEnrichments)
  const [entityType, setEntityType] = useState<'person' | 'company'>(initialEntityType)
  const [targetCount, setTargetCount] = useState(initialCount)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [newCustomEnrichment, setNewCustomEnrichment] = useState({ label: '', description: '' })

  // Grouping criteria by type
  const criteriaByType = criteria.reduce((acc, criterion) => {
    if (!acc[criterion.type]) acc[criterion.type] = []
    acc[criterion.type].push(criterion)
    return acc
  }, {} as Record<string, SearchCriterion[]>)

  const toggleCriterion = (index: number) => {
    setCriteria(prev => prev.map((c, i) => 
      i === index ? { ...c, enabled: !c.enabled } : c
    ))
  }

  const toggleEnrichment = (index: number) => {
    setEnrichments(prev => prev.map((e, i) => 
      i === index ? { ...e, enabled: !e.enabled } : e
    ))
  }

  const addCustomEnrichment = () => {
    if (newCustomEnrichment.label.trim() && newCustomEnrichment.description.trim()) {
      setCustomEnrichments(prev => [...prev, {
        ...newCustomEnrichment,
        value: newCustomEnrichment.label.toLowerCase().replace(/\s+/g, '_')
      }])
      setNewCustomEnrichment({ label: '', description: '' })
    }
  }

  const removeCustomEnrichment = (index: number) => {
    setCustomEnrichments(prev => prev.filter((_, i) => i !== index))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job_title': return <User className="w-4 h-4" />
      case 'company_type': return <Building className="w-4 h-4" />
      case 'industry': return <Target className="w-4 h-4" />
      case 'location': return <MapPin className="w-4 h-4" />
      case 'technology': return <Zap className="w-4 h-4" />
      case 'activity': return <Users className="w-4 h-4" />
      default: return <Search className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job_title': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'company_type': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'industry': return 'bg-green-100 text-green-800 border-green-200'
      case 'location': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'technology': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'activity': return 'bg-pink-100 text-pink-800 border-pink-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const enabledCriteria = criteria.filter(c => c.enabled)
  const enabledEnrichments = enrichments.filter(e => e.enabled)
  const allEnabledEnrichments = [...enabledEnrichments, ...customEnrichments.map(ce => ({
    label: ce.label,
    value: ce.value,
    required: false,
    enabled: true
  }))]

  const handlePreview = () => {
    const params = {
      criteria: enabledCriteria,
      enrichments: allEnabledEnrichments,
      entityType,
      targetCount: 1,
      originalQuery
    }
    onPreviewExecute?.(params)
  }

  const handleSearch = () => {
    const params = {
      criteria: enabledCriteria,
      enrichments: allEnabledEnrichments,
      entityType,
      targetCount,
      originalQuery
    }
    onSearchExecute?.(params)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}: Configure Prospect Search</span>
            <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="w-full" />
        </div>
      </div>

      {/* Original query display */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Campaign Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Original Request:</p>
            <p className="font-medium">&quot;{originalQuery}&quot;</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="criteria" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="criteria">Search Criteria ({enabledCriteria.length})</TabsTrigger>
          <TabsTrigger value="enrichments">Enrichments ({allEnabledEnrichments.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Search Criteria Tab */}
        <TabsContent value="criteria" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Criteria</CardTitle>
              <CardDescription>
                AI-extracted criteria that prospects must match. Toggle individual criteria on/off.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(criteriaByType).map(([type, typeCriteria]) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(type)}
                    <h4 className="font-medium capitalize">
                      {type.replace('_', ' ')} ({typeCriteria.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                    {typeCriteria.map((criterion, index) => {
                      const globalIndex = criteria.findIndex(c => c === criterion)
                      return (
                        <div
                          key={globalIndex}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                            criterion.enabled 
                              ? getTypeColor(type)
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          <Checkbox
                            checked={criterion.enabled}
                            onCheckedChange={() => toggleCriterion(globalIndex)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium break-words">
                              {criterion.label}
                            </p>
                          </div>
                          {criterion.enabled && (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              
              {criteria.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No specific criteria extracted from your query.</p>
                  <p className="text-sm">The search will use the original query as-is.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrichments Tab */}
        <TabsContent value="enrichments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Enrichments</CardTitle>
              <CardDescription>
                Choose what data to extract for each prospect found.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {enrichments.map((enrichment, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      enrichment.enabled 
                        ? enrichment.required 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={enrichment.enabled}
                        onCheckedChange={() => toggleEnrichment(index)}
                        disabled={enrichment.required}
                      />
                      <div>
                        <p className="font-medium text-sm">{enrichment.label}</p>
                        {enrichment.required && (
                          <Badge variant="secondary" className="text-xs mt-1">Required</Badge>
                        )}
                      </div>
                    </div>
                    {enrichment.enabled && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Enrichments */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Custom Enrichments</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showAdvanced ? 'Hide' : 'Add Custom'}
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="custom-label">Field Name</Label>
                        <Input
                          id="custom-label"
                          placeholder="e.g., Company Funding Stage"
                          value={newCustomEnrichment.label}
                          onChange={(e) => setNewCustomEnrichment(prev => ({ ...prev, label: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom-description">Description</Label>
                        <Input
                          id="custom-description"
                          placeholder="e.g., Extract if company is Series A, B, C..."
                          value={newCustomEnrichment.description}
                          onChange={(e) => setNewCustomEnrichment(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button onClick={addCustomEnrichment} size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Enrichment
                    </Button>
                  </div>
                )}

                {customEnrichments.length > 0 && (
                  <div className="space-y-2">
                    {customEnrichments.map((custom, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{custom.label}</p>
                          <p className="text-xs text-muted-foreground">{custom.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomEnrichment(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Settings</CardTitle>
              <CardDescription>
                Configure search parameters and behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select value={entityType} onValueChange={(value: 'person' | 'company') => setEntityType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person">People</SelectItem>
                      <SelectItem value="company">Companies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Count</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[targetCount]}
                      onValueChange={([value]) => setTargetCount(value)}
                      max={500}
                      min={1}
                      step={1}
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      {targetCount} prospects
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-6 border-t bg-muted/30">
        <div className="text-sm text-muted-foreground">
          {enabledCriteria.length} criteria • {allEnabledEnrichments.length} enrichments • {targetCount} prospects
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview 1 Result
          </Button>
          <Button onClick={handleSearch} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Search className="w-4 h-4 mr-2" />
            Start Full Search
          </Button>
        </div>
      </div>
    </div>
  )
}