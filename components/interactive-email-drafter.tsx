'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Building2,
  CheckCircle2,
  Eye,
  Mail,
  Paperclip,
  Send,
  User,
  Wand2
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Prospect } from './prospect-grid'

interface EmailTemplate {
  id: string
  name: string
  type: 'initial' | 'follow_up_1' | 'follow_up_2' | 'follow_up_3'
  subject: string
  body: string
  tone: 'professional' | 'casual' | 'friendly'
  delayDays: number
}

interface EmailPersonalizationSettings {
  includePersonalNote: boolean
  includeCompanyContext: boolean
  includeRecentActivity: boolean
  includeIndustryInsights: boolean
  callToActionType: 'meeting' | 'demo' | 'call' | 'reply' | 'custom'
  customCTA?: string
}

interface InteractiveEmailDrafterProps {
  prospects: Prospect[]
  searchSummary?: any
  step?: number
  totalSteps?: number
  onEmailsGenerated?: (templates: EmailTemplate[]) => void
  onPreviewEmail?: (template: EmailTemplate, prospect: Prospect) => void
}

function initials(value?: string) {
  if (!value) return 'HM'
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'HM'
}

export function InteractiveEmailDrafter({
  prospects = [],
  step = 2,
  totalSteps = 5,
  onEmailsGenerated,
  onPreviewEmail
}: InteractiveEmailDrafterProps) {
  const [actualProspects, setActualProspects] = useState<Prospect[]>(prospects)
  const [selectedProspectIndex, setSelectedProspectIndex] = useState(0)

  useEffect(() => {
    if (actualProspects.length === 0) {
      try {
        const stored = sessionStorage.getItem('hermes-latest-prospects')
        if (!stored) return
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActualProspects(parsed)
        }
      } catch {}
    }
  }, [actualProspects.length])

  useEffect(() => {
    if (prospects.length > 0) {
      setActualProspects(prospects)
    }
  }, [prospects])

  const getInitialObjective = () => {
    try {
      const stored = sessionStorage.getItem('hermes-search-context')
      if (stored) {
        const context = JSON.parse(stored)
        const persona = context.targetPersona || 'decision makers'
        const offer = context.offer || 'our services'
        return `Reach ${persona} about ${offer}`
      }
    } catch {}
    return ''
  }

  const getInitialValueProp = () => {
    try {
      const stored = sessionStorage.getItem('hermes-search-context')
      if (stored) {
        const context = JSON.parse(stored)
        return context.offer || ''
      }
    } catch {}
    return ''
  }

  const [campaignType, setCampaignType] = useState<'single' | 'sequence'>('single')
  const [emailCount, setEmailCount] = useState(1)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('hermes-draft-templates')
        if (stored) return JSON.parse(stored)
      }
    } catch {}
    return [
      {
        id: '1',
        name: 'Initial Outreach',
        type: 'initial',
        subject: '',
        body: '',
        tone: 'professional',
        delayDays: 0
      }
    ]
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && emailTemplates) {
      sessionStorage.setItem('hermes-draft-templates', JSON.stringify(emailTemplates))
    }
  }, [emailTemplates])
  const [personalization, setPersonalization] = useState<EmailPersonalizationSettings>({
    includePersonalNote: true,
    includeCompanyContext: true,
    includeRecentActivity: false,
    includeIndustryInsights: true,
    callToActionType: 'meeting'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(0)

  // Auto-generate drafts on load if none exist
  useEffect(() => {
    if (actualProspects.length > 0 && !emailTemplates[0].body && !isGenerating) {
      generateEmailContent()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualProspects.length])

  const activeProspect = actualProspects[Math.min(selectedProspectIndex, Math.max(actualProspects.length - 1, 0))]
  const activeTemplate = emailTemplates[selectedTemplate] || emailTemplates[0]

  useEffect(() => {
    if (selectedProspectIndex > Math.max(actualProspects.length - 1, 0)) {
      setSelectedProspectIndex(0)
    }
  }, [actualProspects.length, selectedProspectIndex])

  useEffect(() => {
    if (selectedTemplate > Math.max(emailTemplates.length - 1, 0)) {
      setSelectedTemplate(0)
    }
  }, [emailTemplates.length, selectedTemplate])

  const syncTemplateCount = (count: number) => {
    const normalized = Math.max(1, Math.min(4, count))
    setEmailCount(normalized)
    setEmailTemplates(previous => {
      const next = [...previous]
      while (next.length < normalized) {
        const stepIndex = next.length + 1
        next.push({
          id: `${Date.now()}-${stepIndex}`,
          name: stepIndex === 1 ? 'Initial Outreach' : `Follow-up ${stepIndex - 1}`,
          type: stepIndex === 2 ? 'follow_up_1' : stepIndex === 3 ? 'follow_up_2' : stepIndex === 4 ? 'follow_up_3' : 'initial',
          subject: '',
          body: '',
          tone: 'professional',
          delayDays: stepIndex === 1 ? 0 : stepIndex * 3
        })
      }
      return next.slice(0, normalized)
    })
  }

  const updateTemplate = (index: number, updates: Partial<EmailTemplate>) => {
    setEmailTemplates(templates =>
      templates.map((template, i) => (i === index ? { ...template, ...updates } : template))
    )
  }

  const generateEmailContent = async () => {
    if (actualProspects.length === 0) {
      alert('No prospects available. Please run a prospect search first.')
      return
    }

    const objective = getInitialObjective()
    if (!objective.trim()) {
      alert('Hermes needs to learn about your offer and objective first.')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospects: [activeProspect], 
          campaignObjective: getInitialObjective(),
          valueProposition: getInitialValueProp(),
          personalization,
          emailTypes: emailTemplates.map(t => ({ type: t.type, tone: t.tone }))
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate emails' }))
        throw new Error(error.error || 'Failed to generate emails')
      }

      const result = await response.json()
      if (!result.success || !result.templates) {
        throw new Error(result.error || 'Failed to generate email templates')
      }

      setEmailTemplates(current =>
        current.map((template, index) => ({
          ...template,
          subject: result.templates[index]?.subject || template.subject,
          body: result.templates[index]?.body || template.body
        }))
      )
    } catch (error) {
      alert(`Failed to generate emails: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = () => {
    if (activeProspect && activeTemplate) {
      onPreviewEmail?.(activeTemplate, activeProspect)
    }
  }

  const handleGenerate = () => {
    if (actualProspects.length === 0) {
      alert('No prospects available. Please run a prospect search first.')
      return
    }
    onEmailsGenerated?.(emailTemplates)
  }

  const personalizationRows = useMemo(
    () => [
      { key: 'includePersonalNote', label: 'Personal note', desc: 'Reference a person-level signal when available.' },
      { key: 'includeCompanyContext', label: 'Company context', desc: 'Use site positioning and category context.' },
      { key: 'includeRecentActivity', label: 'Recent activity', desc: 'Pull fresh program, launch, or listing signals.' },
      { key: 'includeIndustryInsights', label: 'Industry insight', desc: 'Use one market or category hook in the draft.' }
    ],
    []
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gray-400">
              Step {step} of {totalSteps}
            </div>
            <h2 className="mt-3 font-serif text-4xl leading-none text-gray-900 md:text-[3.2rem]">
              Email Draft Studio
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-500 md:text-[15px]">
              Review the queue, generate a draft with GPT-5, then tighten the copy before Hermes prepares the Gmail send.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-700 font-medium">
              {actualProspects.length} prospects
            </Badge>
            <Badge className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-700 font-medium">
              {emailTemplates.length} drafts
            </Badge>
            <Badge className="rounded-full border border-[hsl(var(--hermes-gold))]/30 bg-[hsl(var(--hermes-gold))]/10 px-3 py-1.5 text-[hsl(var(--hermes-gold-dark))]">
              Gmail-ready
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">Inbox</div>
              <div className="text-sm text-gray-500">Choose the company you want to draft against</div>
            </div>
            <div className="mt-4 space-y-2">
              {actualProspects.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                  Run a prospect search first. Hermes will load the review queue here.
                </div>
              ) : (
                actualProspects.slice(0, 8).map((prospect, index) => {
                  const company = prospect.company || prospect.fullName || 'Unnamed prospect'
                  const person = prospect.fullName && prospect.fullName !== prospect.company ? prospect.fullName : prospect.jobTitle || 'Role unconfirmed'
                  const active = index === selectedProspectIndex
                  return (
                    <button
                      key={`${prospect.id}-${index}`}
                      type="button"
                      onClick={() => setSelectedProspectIndex(index)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all',
                        active
                          ? 'border-[hsl(var(--hermes-gold))] bg-white shadow-[0_4px_20px_rgba(214,157,74,0.08)]'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100/80'
                      )}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--hermes-gold))]/10 text-sm font-semibold text-[hsl(var(--hermes-gold-dark))]">
                        {initials(company)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-[15px] font-semibold text-gray-900">{company}</div>
                          <div className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                            Draft
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">{person}</div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Removed manual Campaign Setup blocks to enforce autonomous architecture */}
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">Editor</div>
              <div className="mt-2 text-[15px] font-medium text-gray-600">
                {activeProspect ? `Drafting against ${activeProspect.company || activeProspect.fullName}` : 'Drafting workspace'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {emailTemplates.length > 1 && emailTemplates.map((template, index) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(index)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[13px] font-medium transition-all shadow-sm',
                    selectedTemplate === index
                      ? 'bg-[hsl(var(--hermes-gold))] text-white border border-transparent'
                      : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  )}
                >
                  {index === 0 ? 'Initial' : `Follow-up ${index}`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[0.4fr_0.6fr]">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--hermes-gold))]/10 text-sm font-semibold text-[hsl(var(--hermes-gold-dark))]">
                  {initials(activeProspect?.company || activeProspect?.fullName)}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-gray-900">{activeProspect?.company || activeProspect?.fullName || 'No prospect selected'}</div>
                  <div className="mt-1 text-sm text-gray-500">{activeProspect?.location || 'Location not found'}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-[1rem] border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    <User className="h-3.5 w-3.5" />
                    Decision maker
                  </div>
                  <div className="text-[14px] font-medium text-gray-900">{activeProspect?.fullName || 'Unknown recipient'}</div>
                  <div className="mt-0.5 text-[13px] text-gray-500">{activeProspect?.jobTitle || 'Role not confirmed yet'}</div>
                </div>

                <div className="rounded-[1rem] border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                    <Building2 className="h-3.5 w-3.5" />
                    Signals
                  </div>
                  <div className="text-[13px] leading-relaxed text-gray-600">
                    {activeProspect?.note || 'Hermes will use company evidence, contact context, and offer fit to personalize the draft.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-gray-200/50">
              <div className="grid gap-4">
                <div>
                  <Label className="text-gray-700">Recipient</Label>
                  <Input
                    value={activeProspect?.email || activeProspect?.fullName || ''}
                    readOnly
                    className="mt-2 border-transparent bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 cursor-default"
                    placeholder="Decision maker email"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Tone</Label>
                  <Select
                    value={activeTemplate?.tone || 'professional'}
                    onValueChange={(value: 'professional' | 'casual' | 'friendly') => updateTemplate(selectedTemplate, { tone: value })}
                  >
                    <SelectTrigger className="mt-2 border-gray-200 bg-white text-gray-900 focus:ring-[hsl(var(--hermes-gold))]/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-700">Subject</Label>
                  <Input
                    value={activeTemplate?.subject || ''}
                    onChange={(e) => updateTemplate(selectedTemplate, { subject: e.target.value })}
                    className="mt-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-[hsl(var(--hermes-gold))]/50"
                    placeholder="Subject line"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Body</Label>
                  <Textarea
                    value={activeTemplate?.body || ''}
                    onChange={(e) => updateTemplate(selectedTemplate, { body: e.target.value })}
                    className="mt-2 min-h-[340px] resize-none border-gray-200 bg-white text-[15px] leading-relaxed text-gray-900 placeholder:text-gray-400 focus-visible:ring-[hsl(var(--hermes-gold))]/50"
                    placeholder="Hermes will write the draft here."
                  />
                </div>
                <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments handled in Gmail step
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gray-400">Personalization</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {personalizationRows.map((row) => (
                  <label key={row.key} className="flex cursor-pointer items-start gap-3 rounded-[1rem] border border-transparent bg-gray-50 hover:bg-gray-100 px-4 py-3 transition-colors">
                    <Checkbox
                      checked={Boolean(personalization[row.key as keyof EmailPersonalizationSettings])}
                      onCheckedChange={(checked) =>
                        setPersonalization(prev => ({
                          ...prev,
                          [row.key]: Boolean(checked)
                        }))
                      }
                      className="mt-0.5 border-gray-300 text-[hsl(var(--hermes-gold))] focus-visible:ring-[hsl(var(--hermes-gold))]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{row.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{row.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gray-400">CTA Generation</div>
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-gray-700">Call to action</Label>
                  <Select
                    value={personalization.callToActionType}
                    onValueChange={(value) => setPersonalization(prev => ({ ...prev, callToActionType: value as EmailPersonalizationSettings['callToActionType'] }))}
                  >
                    <SelectTrigger className="mt-2 border-gray-200 bg-gray-50 text-gray-900 focus:ring-[hsl(var(--hermes-gold))]/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Schedule meeting</SelectItem>
                      <SelectItem value="demo">Request demo</SelectItem>
                      <SelectItem value="call">Quick call</SelectItem>
                      <SelectItem value="reply">Simple reply</SelectItem>
                      <SelectItem value="custom">Custom CTA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {personalization.callToActionType === 'custom' ? (
                  <div>
                    <Label className="text-gray-700">Custom CTA</Label>
                    <Input
                      value={personalization.customCTA || ''}
                      onChange={(e) => setPersonalization(prev => ({ ...prev, customCTA: e.target.value }))}
                      className="mt-2 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[hsl(var(--hermes-gold))]/50"
                      placeholder="What should Hermes ask for?"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--hermes-gold-dark))]" />
              {actualProspects.length} prospects queued • {emailTemplates.length} draft{emailTemplates.length !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handlePreview} disabled={!activeProspect} className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={generateEmailContent}
                disabled={isGenerating || !getInitialObjective().trim()}
                variant="outline"
                className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating…' : 'Autodraft with GPT-5'}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || emailTemplates[0]?.body.length === 0}
                className="rounded-full shadow-md bg-[hsl(var(--hermes-gold))] px-6 font-semibold text-white hover:bg-[hsl(var(--hermes-gold-dark))]"
              >
                <Send className="mr-2 h-4 w-4" />
                Review & Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
