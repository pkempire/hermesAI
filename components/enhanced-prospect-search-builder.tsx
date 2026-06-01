'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Eye,
  MapPin,
  Search,
  Target,
  User,
  Users,
  Zap
} from 'lucide-react'
import { useMemo, useState } from 'react'

interface SearchCriterion {
  label: string
  value: string
  type: 'job_title' | 'company_type' | 'industry' | 'location' | 'technology' | 'activity' | 'company_criteria'
  enabled: boolean
}

interface EnrichmentField {
  label: string
  value: string
  required: boolean
  enabled: boolean
  description?: string
}

type BuilderEnrichmentInput =
  | { label: string; value: string; required: boolean; description?: string }
  | { label: string; value: string; description: string }

interface EnhancedProspectSearchBuilderProps {
  initialCriteria: Array<{ label: string; value: string; type: string }>
  initialEnrichments: Array<{ label: string; value: string; required: boolean; description?: string }>
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
  initialEntityType = 'company',
  initialCount = 25,
  originalQuery = '',
  onSearchExecute,
  onPreviewExecute
}: EnhancedProspectSearchBuilderProps) {
  const mergedInitialEnrichments = useMemo<BuilderEnrichmentInput[]>(
    () => [...initialEnrichments, ...initialCustomEnrichments].slice(0, 10),
    [initialCustomEnrichments, initialEnrichments]
  )

  const [criteria, setCriteria] = useState<SearchCriterion[]>(
    initialCriteria.map(criterion => ({
      ...criterion,
      type: criterion.type as SearchCriterion['type'],
      enabled: true
    }))
  )

  const [enrichments, setEnrichments] = useState<EnrichmentField[]>(
    mergedInitialEnrichments.map(enrichment => ({
        ...enrichment,
        enabled: true,
        required: 'required' in enrichment ? Boolean(enrichment.required) : false,
        description: enrichment.description
      }))
  )

  const [entityType, setEntityType] = useState<'person' | 'company'>(initialEntityType)
  const [targetCount, setTargetCount] = useState(initialCount)
  const [evidenceMode, setEvidenceMode] = useState(false)

  const enabledCriteria = useMemo(() => criteria.filter(criterion => criterion.enabled), [criteria])
  const enabledEnrichments = useMemo(() => enrichments.filter(enrichment => enrichment.enabled), [enrichments])
  const canEnableMore = enabledEnrichments.length < 10

  const toggleCriterion = (index: number) => {
    setCriteria(previous =>
      previous.map((criterion, currentIndex) =>
        currentIndex === index ? { ...criterion, enabled: !criterion.enabled } : criterion
      )
    )
  }

  const toggleEnrichment = (index: number) => {
    setEnrichments(previous =>
      previous.map((enrichment, currentIndex) => {
        if (currentIndex !== index) return enrichment
        if (!enrichment.enabled && !canEnableMore && !enrichment.required) return enrichment
        return { ...enrichment, enabled: !enrichment.enabled }
      })
    )
  }

  const updateCriterionLabel = (index: number, value: string) => {
    setCriteria(previous =>
      previous.map((criterion, currentIndex) =>
        currentIndex === index ? { ...criterion, label: value, value } : criterion
      )
    )
  }

  const updateEnrichmentLabel = (index: number, value: string) => {
    setEnrichments(previous =>
      previous.map((enrichment, currentIndex) =>
        currentIndex === index ? { ...enrichment, label: value, value } : enrichment
      )
    )
  }

  const addCriterion = () => setCriteria(prev => [...prev, { label: '', value: '', type: 'company_criteria', enabled: true }])
  const removeCriterion = (index: number) => setCriteria(prev => prev.filter((_, i) => i !== index))

  const addEnrichment = () => setEnrichments(prev => [...prev, { label: '', value: '', required: false, enabled: true, description: '' }])
  const removeEnrichment = (index: number) => setEnrichments(prev => prev.filter((_, i) => i !== index))

  const getTypeIcon = (type: SearchCriterion['type']) => {
    switch (type) {
      case 'job_title':
        return <User className="h-3.5 w-3.5" />
      case 'company_type':
        return <Building className="h-3.5 w-3.5" />
      case 'industry':
        return <Target className="h-3.5 w-3.5" />
      case 'location':
        return <MapPin className="h-3.5 w-3.5" />
      case 'technology':
        return <Zap className="h-3.5 w-3.5" />
      case 'activity':
        return <Users className="h-3.5 w-3.5" />
      default:
        return <Search className="h-3.5 w-3.5" />
    }
  }

  const buildParams = (preview: boolean) => ({
    criteria:
      enabledCriteria.length > 0
        ? enabledCriteria
        : [{ label: originalQuery, value: originalQuery, type: 'company_criteria' as const, enabled: true }],
    enrichments: enabledEnrichments,
    entityType,
    targetCount: preview ? 1 : Math.max(1, Math.min(1000, targetCount)),
    originalQuery: originalQuery || enabledCriteria.map(criterion => criterion.label).join(' '),
    evidenceMode
  })

  const handlePreview = () => {
    if (enabledCriteria.length === 0 && !originalQuery.trim()) {
      alert('Please add at least one search criterion or provide a query.')
      return
    }

    onPreviewExecute?.(buildParams(true))
  }

  const handleSearch = () => {
    if (enabledCriteria.length === 0 && !originalQuery.trim()) {
      alert('Please add at least one search criterion or provide a query.')
      return
    }

    onSearchExecute?.(buildParams(false))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-gray-100/50">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-[2.2rem] text-gray-900 tracking-tight">Search Focus</CardTitle>
              <CardDescription className="text-[14px] font-medium text-gray-500 mt-2">
                Keep this tight. Strong Websets runs usually use a few clear filters.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-[hsl(var(--hermes-gold))]/20 bg-[hsl(var(--hermes-gold))]/10 text-[hsl(var(--hermes-gold-dark))] shadow-none px-3 py-1 font-semibold">
              {enabledCriteria.length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-0">
          {criteria.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-2xl border border-gray-100">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="font-medium text-gray-900 text-lg">No structured criteria extracted from your brief.</p>
              <p className="text-[14px] text-gray-500 mt-1">Hermes will use the original request as the search query.</p>
              <Button onClick={addCriterion} variant="outline" className="mt-4 rounded-full border-gray-200">Add Field</Button>
            </div>
          ) : (
            <>
            {criteria.map((criterion, index) => (
              <div
                key={`criterion-${index}`}
                className={`flex items-start gap-4 rounded-2xl border px-5 py-4 transition-colors ${
                  criterion.enabled ? 'border-[hsl(var(--hermes-gold))]/30 bg-[hsl(var(--hermes-gold))]/5 shadow-sm' : 'border-gray-200 bg-white'
                }`}
              >
                <Checkbox
                  checked={criterion.enabled}
                  onCheckedChange={() => toggleCriterion(index)}
                  className="mt-1 border-gray-300"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {getTypeIcon(criterion.type)}
                    <span>{criterion.type.replace('_', ' ')}</span>
                  </div>
                  <input
                    value={criterion.label}
                    onChange={event => updateCriterionLabel(index, event.target.value)}
                    className="w-full border-b border-transparent bg-transparent text-[16px] font-medium leading-6 text-gray-900 outline-none transition-colors focus:border-gray-300"
                    placeholder="Enter search criterion..."
                  />
                </div>
                <button onClick={() => removeCriterion(index)} className="mt-1 ml-2 text-gray-400 hover:text-red-500 transition-colors">
                  <span className="sr-only">Remove</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <div className="flex justify-start mt-2">
              <Button onClick={addCriterion} variant="outline" size="sm" className="rounded-full text-xs font-semibold text-gray-600">
                + Add Criterion
              </Button>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-[2.2rem] text-gray-900 tracking-tight flex items-center gap-2">
                Enrichments
                <span className="text-[14px] font-medium text-gray-500 mt-1 tracking-normal font-sans">Core fields used for prospect review and outreach.</span>
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 font-semibold px-3 py-1 shadow-none">
              {enabledEnrichments.length}/10 selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-0">
          {enrichments.map((enrichment, index) => (
            <div
                key={`enrichment-${index}`}
                className={`flex items-start gap-4 rounded-2xl border px-5 py-4 transition-colors ${
                  enrichment.enabled ? 'border-sky-200 bg-white shadow-sm' : 'border-gray-200 bg-white/50 opacity-60'
                }`}
              >
              <Checkbox
                checked={enrichment.enabled}
                onCheckedChange={() => toggleEnrichment(index)}
                disabled={!enrichment.enabled && !canEnableMore}
                className="mt-1 border-gray-300"
              />
              <div className="min-w-0 flex-1 flex items-center">
                  <input
                  className="w-full border-b border-transparent bg-transparent text-[16px] font-medium leading-6 text-gray-900 outline-none transition-colors focus:border-gray-300"
                  value={enrichment.label}
                  placeholder="E.g. Recent News, Tech Stack..."
                  onChange={event => updateEnrichmentLabel(index, event.target.value)}
                />
              </div>
              <button onClick={() => removeEnrichment(index)} className="mt-1 ml-2 text-gray-400 hover:text-red-500 transition-colors">
                <span className="sr-only">Remove</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}

          <div className="flex justify-between items-center mt-2">
            <Button onClick={addEnrichment} disabled={!canEnableMore} variant="outline" size="sm" className="rounded-full text-xs font-semibold text-gray-600">
              + Add Enrichment
            </Button>
            {!canEnableMore && (
              <div className="text-[13px] font-medium text-gray-400">
                Limit: 10 enrichments per run.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="font-serif text-[2.2rem] text-gray-900 tracking-tight">Run Settings</CardTitle>
          <CardDescription className="text-[14px] font-medium text-gray-500 mt-2">Preview one result first, or launch the full pull.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 p-0">
          <div className="space-y-3">
            <Label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Entity Type</Label>
            <Select value={entityType} onValueChange={(value: 'person' | 'company') => setEntityType(value)}>
              <SelectTrigger className="border-gray-200 bg-gray-50 text-gray-900 h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Companies</SelectItem>
                <SelectItem value="person">People</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Target Count</Label>
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <Slider
                value={[targetCount]}
                onValueChange={([value]) => setTargetCount(Math.max(1, Math.min(1000, value)))}
                max={1000}
                min={1}
                step={1}
                className="[&_.relative]:bg-gray-200 [&_[role=slider]]:bg-white [&_[role=slider]]:border-gray-300 [&_[role=slider]]:shadow-sm"
              />
              <div className="flex items-center justify-between text-[14px] font-medium text-gray-500">
                <span><strong className="text-gray-900">{targetCount}</strong> prospects</span>
                <span>Max 1000</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Evidence Mode</Label>
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="pr-4 text-[14px] font-medium text-gray-600">
                Keep source-backed evidence attached before drafting or sending outreach.
              </p>
              <Checkbox checked={evidenceMode} onCheckedChange={value => setEvidenceMode(Boolean(value))} className="border-gray-300 data-[state=checked]:bg-[hsl(var(--hermes-gold))] data-[state=checked]:text-white data-[state=checked]:border-[hsl(var(--hermes-gold))]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100/50 p-4 pl-6">
        <div className="text-[14px] font-medium text-gray-500 flex gap-4">
          <span><strong className="text-gray-900">{enabledCriteria.length}</strong> criteria</span>
          <span className="text-gray-300">•</span>
          <span><strong className="text-gray-900">{enabledEnrichments.length}</strong> enrichments</span>
          <span className="text-gray-300">•</span>
          <span><strong className="text-gray-900">{targetCount}</strong> prospects</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePreview} className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm rounded-full px-6 text-[14px] font-medium">
            <Eye className="mr-2 h-4 w-4" />
            Preview 1 Result
          </Button>
          <Button onClick={handleSearch} className="border border-transparent bg-[hsl(var(--hermes-gold))] text-white font-semibold hover:bg-[hsl(var(--hermes-gold-dark))] shadow-[0_4px_14px_rgba(214,157,74,0.25)] rounded-full px-6 text-[14px]">
            <Search className="mr-2 h-4 w-4" />
            Start Full Search
          </Button>
        </div>
      </div>
    </div>
  )
}
