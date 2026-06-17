'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useMemo, useState } from 'react'

type CriterionType =
  | 'job_title'
  | 'company_type'
  | 'industry'
  | 'location'
  | 'technology'
  | 'activity'
  | 'company_criteria'
  | 'other'

interface SearchCriterion {
  label: string
  value: string
  type: CriterionType
  enabled: boolean
}

interface EnrichmentField {
  label: string
  value: string
  required: boolean
  enabled: boolean
  description?: string
  source: 'core' | 'signal'
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

function criterionLabel(type: CriterionType) {
  return type.replace(/_/g, ' ')
}

function normalizeCount(value: number) {
  return Math.max(1, Math.min(1000, value || 25))
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
  const mergedInitialEnrichments = useMemo<EnrichmentField[]>(() => {
    const core = initialEnrichments.map(enrichment => ({
      ...enrichment,
      source: 'core' as const
    }))
    const signals = initialCustomEnrichments.map(enrichment => ({
      ...enrichment,
      required: false,
      source: 'signal' as const
    }))

    return [...core, ...signals].slice(0, 10).map(enrichment => ({
      ...enrichment,
      enabled: true,
      required: Boolean('required' in enrichment ? enrichment.required : false),
      description: enrichment.description
    }))
  }, [initialCustomEnrichments, initialEnrichments])

  const [criteria, setCriteria] = useState<SearchCriterion[]>(
    initialCriteria.map(criterion => ({
      ...criterion,
      type: criterion.type as CriterionType,
      enabled: true
    }))
  )
  const [enrichments, setEnrichments] = useState<EnrichmentField[]>(mergedInitialEnrichments)
  const [entityType, setEntityType] = useState<'person' | 'company'>(initialEntityType)
  const [targetCount, setTargetCount] = useState(normalizeCount(initialCount))
  const [evidenceMode, setEvidenceMode] = useState(false)

  const enabledCriteria = useMemo(() => criteria.filter(criterion => criterion.enabled), [criteria])
  const enabledEnrichments = useMemo(
    () => enrichments.filter(enrichment => enrichment.enabled),
    [enrichments]
  )
  const signalCount = enrichments.filter(enrichment => enrichment.source === 'signal').length
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

  const addCriterion = () => {
    setCriteria(previous => [
      ...previous,
      { label: '', value: '', type: 'company_criteria', enabled: true }
    ])
  }
  const removeCriterion = (index: number) => {
    setCriteria(previous => previous.filter((_, currentIndex) => currentIndex !== index))
  }

  const addEnrichment = () => {
    setEnrichments(previous => [
      ...previous,
      {
        label: '',
        value: '',
        required: false,
        enabled: true,
        description: '',
        source: 'signal'
      }
    ])
  }
  const removeEnrichment = (index: number) => {
    setEnrichments(previous => previous.filter((_, currentIndex) => currentIndex !== index))
  }

  const buildParams = (preview: boolean) => ({
    criteria:
      enabledCriteria.length > 0
        ? enabledCriteria
        : [{ label: originalQuery, value: originalQuery, type: 'company_criteria' as const, enabled: true }],
    enrichments: enabledEnrichments,
    entityType,
    targetCount: preview ? 1 : normalizeCount(targetCount),
    originalQuery: originalQuery || enabledCriteria.map(criterion => criterion.label).join(' '),
    evidenceMode
  })

  const handlePreview = () => {
    if (enabledCriteria.length === 0 && !originalQuery.trim()) {
      alert('Add at least one search criterion.')
      return
    }
    onPreviewExecute?.(buildParams(true))
  }

  const handleSearch = () => {
    if (enabledCriteria.length === 0 && !originalQuery.trim()) {
      alert('Add at least one search criterion.')
      return
    }
    onSearchExecute?.(buildParams(false))
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3">
      <div className="rounded-xl border border-[#dfe4ee] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#cbd4ff] bg-[#edf1ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#315dff]">
                Run plan
              </span>
              <span className="text-[12px] font-semibold text-[#6a7283]">
                {entityType} search · {targetCount} targets · {enabledEnrichments.length} fields
              </span>
            </div>
            <p className="mt-2 truncate text-[13px] text-[#071329]">
              {originalQuery || 'Review the generated criteria before launch.'}
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-1 rounded-lg border border-[#edf0f6] bg-[#fbfcff] p-1 text-center">
            {[
              ['criteria', enabledCriteria.length],
              ['signals', signalCount],
              ['selected', enabledEnrichments.length]
            ].map(([label, value]) => (
              <div key={label} className="min-w-[96px] flex-1 rounded-md bg-white px-3 py-1.5 shadow-sm">
                <div className="text-[13px] font-bold text-[#071329]">{value}</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8a92a6]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
        <section className="rounded-xl border border-[#dfe4ee] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#071329]">Search criteria</h3>
              <p className="text-[12px] text-[#6a7283]">Keep only the filters that should change the result set.</p>
            </div>
            <Button
              onClick={addCriterion}
              variant="outline"
              size="sm"
              className="h-8 rounded-md border-[#dfe4ee] text-[12px] font-semibold"
            >
              Add
            </Button>
          </div>

          {criteria.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#dfe4ee] bg-[#fbfcff] px-4 py-5 text-[13px] text-[#6a7283]">
              Hermes will use the original brief as the query.
            </div>
          ) : (
            <div className="space-y-2">
              {criteria.map((criterion, index) => (
                <div
                  key={`criterion-${index}`}
                  className={`flex min-h-12 items-start gap-2 rounded-lg border px-3 py-2 transition-colors ${
                    criterion.enabled
                      ? 'border-[#cbd4ff] bg-[#f7f9ff]'
                      : 'border-[#edf0f6] bg-white opacity-60'
                  }`}
                >
                  <Checkbox
                    checked={criterion.enabled}
                    onCheckedChange={() => toggleCriterion(index)}
                    className="mt-0.5 border-[#cfd6e4]"
                    aria-label={`Use criterion ${index + 1}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8a92a6]">
                      {criterionLabel(criterion.type)}
                    </div>
                    <input
                      value={criterion.label}
                      onChange={event => updateCriterionLabel(index, event.target.value)}
                      className="w-full border-0 bg-transparent p-0 text-[13px] font-semibold leading-5 text-[#071329] outline-none placeholder:text-[#b0b6c5]"
                      placeholder="Search criterion"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    className="rounded px-1.5 py-0.5 text-[16px] leading-none text-[#9aa2b4] hover:bg-white hover:text-red-600"
                    aria-label="Remove criterion"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#dfe4ee] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#071329]">Enrichment fields</h3>
              <p className="text-[12px] text-[#6a7283]">Core identity plus campaign-specific proof.</p>
            </div>
            <Button
              onClick={addEnrichment}
              disabled={!canEnableMore}
              variant="outline"
              size="sm"
              className="h-8 rounded-md border-[#dfe4ee] text-[12px] font-semibold"
            >
              Add
            </Button>
          </div>

          <div className="grid gap-2 xl:grid-cols-2">
            {enrichments.map((enrichment, index) => (
              <div
                key={`enrichment-${index}`}
                className={`min-h-[58px] min-w-0 rounded-lg border px-3 py-2 transition-colors ${
                  enrichment.enabled
                    ? enrichment.source === 'signal'
                      ? 'border-[#cbd4ff] bg-[#f7f9ff]'
                      : 'border-[#edf0f6] bg-[#fbfcff]'
                    : 'border-[#edf0f6] bg-white opacity-55'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={enrichment.enabled}
                    onCheckedChange={() => toggleEnrichment(index)}
                    disabled={!enrichment.enabled && !canEnableMore}
                    className="mt-0.5 border-[#cfd6e4]"
                    aria-label={`Use enrichment ${enrichment.label || index + 1}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] font-semibold leading-5 text-[#071329] outline-none placeholder:text-[#b0b6c5]"
                        value={enrichment.label}
                        placeholder="Enrichment field"
                        onChange={event => updateEnrichmentLabel(index, event.target.value)}
                      />
                      <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a92a6]">
                        {enrichment.source === 'signal' ? 'signal' : enrichment.required ? 'core' : 'field'}
                      </span>
                    </div>
                    {enrichment.description ? (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#6a7283]">
                        {enrichment.description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEnrichment(index)}
                    className="rounded px-1.5 py-0.5 text-[16px] leading-none text-[#9aa2b4] hover:bg-white hover:text-red-600"
                    aria-label="Remove enrichment"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!canEnableMore ? (
            <p className="mt-2 text-[11px] font-medium text-[#8a92a6]">10 fields max for this run.</p>
          ) : null}
        </section>
      </div>

      <div className="grid gap-3 rounded-xl border border-[#dfe4ee] bg-white p-4 shadow-sm md:grid-cols-[180px_minmax(240px,1fr)_minmax(180px,220px)_auto] md:items-end">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a92a6]">
            Entity
          </Label>
          <Select value={entityType} onValueChange={(value: 'person' | 'company') => setEntityType(value)}>
            <SelectTrigger className="h-9 rounded-md border-[#dfe4ee] bg-[#fbfcff] text-[13px] font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Companies</SelectItem>
              <SelectItem value="person">People</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a92a6]">
              Target count
            </Label>
            <span className="text-[12px] font-bold text-[#071329]">{targetCount}</span>
          </div>
          <Slider
            value={[targetCount]}
            onValueChange={([value]) => setTargetCount(normalizeCount(value))}
            max={1000}
            min={1}
            step={1}
          />
        </div>

        <label className="flex h-9 cursor-pointer items-center justify-between rounded-md border border-[#dfe4ee] bg-[#fbfcff] px-3">
          <span className="text-[12px] font-semibold text-[#46506a]">Evidence mode</span>
          <Checkbox
            checked={evidenceMode}
            onCheckedChange={value => setEvidenceMode(Boolean(value))}
            className="border-[#cfd6e4]"
          />
        </label>

        <div className="flex gap-2 md:justify-end">
          <Button
            variant="outline"
            onClick={handlePreview}
            className="h-9 rounded-md border-[#dfe4ee] px-4 text-[12px] font-semibold"
          >
            Preview
          </Button>
          <Button
            onClick={handleSearch}
            className="h-9 rounded-md bg-[#071329] px-4 text-[12px] font-semibold text-white hover:bg-[#102448]"
          >
            Run search
          </Button>
        </div>
      </div>
    </div>
  )
}
