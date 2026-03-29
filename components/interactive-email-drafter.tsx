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

  const Avatar = ({ url, initials, isCompany }: { url?: string, initials: string, isCompany?: boolean }) => {
    if (url) {
      return (
        <img 
          src={url} 
          alt={initials} 
          className={cn("h-full w-full object-cover", isCompany ? "rounded-xl" : "rounded-full")} 
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
      )
    }
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-gray-50 text-[13px] font-semibold text-gray-500", isCompany ? "rounded-xl" : "rounded-full")}>
        {initials}
      </div>
    )
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

      <div className="grid gap-0 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm h-[750px]">
        {/* Left Column: Inbox List */}
        <div className="flex flex-col border-r border-gray-200 bg-[#FAFAFA]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
            <div className="flex space-x-4 text-[13px] font-medium text-gray-500">
              <span className="text-gray-900 border-b-2 border-gray-900 pb-1 -mb-[17px]">Inbox</span>
              <span className="hover:text-gray-900 cursor-pointer transition-colors">Flows</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto w-full">
            {actualProspects.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-400">
                Run a prospect search first. Hermes will load the review queue here.
              </div>
            ) : (
              <div className="flex flex-col w-full">
                {actualProspects.slice(0, 8).map((prospect, index) => {
                  const company = prospect.company || prospect.fullName || 'Unnamed prospect'
                  const person = prospect.fullName && prospect.fullName !== prospect.company ? prospect.fullName : prospect.jobTitle || 'Role unconfirmed'
                  const active = index === selectedProspectIndex
                  return (
                    <button
                      key={`${prospect.id}-${index}`}
                      type="button"
                      onClick={() => setSelectedProspectIndex(index)}
                      className={cn(
                        'flex flex-col w-full items-start px-5 py-4 text-left border-b border-gray-100 last:border-0 transition-colors',
                        active
                          ? 'bg-white shadow-[inset_3px_0_0_hsl(var(--hermes-gold))]'
                          : 'bg-transparent hover:bg-gray-50/50'
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("flex h-6 w-6 shrink-0 border", prospect.companyLogoUrl ? "border-transparent" : "border-gray-200", "rounded-md overflow-hidden")}>
                            <Avatar url={prospect.companyLogoUrl} initials={initials(company)} isCompany />
                          </div>
                          <span className="truncate text-[13px] font-semibold text-gray-900">{company}</span>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-gray-400">
                          {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="w-full flex items-center justify-between mt-0.5 pl-8">
                        <span className={cn("truncate text-[13px]", active ? "text-gray-900 font-medium" : "text-gray-500")}>
                          Draft for {person}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Email Editor */}
        <div className="flex flex-col bg-white overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <span className="text-[14px] font-semibold text-gray-900">
                {activeTemplate?.subject || `Drafting outreach to ${activeProspect?.fullName || activeProspect?.company}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePreview} variant="ghost" size="sm" className="hidden sm:flex text-gray-500 hover:text-gray-900 h-8 text-xs font-medium">
                Preview <Eye className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Email Canvas inside a scrollable area */}
          <div className="flex-1 overflow-y-auto bg-[#FAFAFA] md:p-8 p-4">
            <div className="mx-auto max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              
              <div className="border-b border-gray-100 p-5 space-y-4">
                <div className="flex items-center border-b border-gray-50 pb-3">
                  <Label className="w-16 text-[13px] text-gray-400 font-medium shrink-0">To</Label>
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 rounded-md px-2 py-1 overflow-hidden">
                      <div className="h-4 w-4 rounded-full overflow-hidden shrink-0 border border-gray-200">
                        <Avatar url={activeProspect?.avatarUrl} initials={initials(activeProspect?.fullName)} />
                      </div>
                      <span className="text-[13px] font-medium text-gray-700 truncate">{activeProspect?.email || activeProspect?.fullName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center border-b border-gray-50 pb-3">
                  <Label className="w-16 text-[13px] text-gray-400 font-medium my-auto shrink-0">Subject</Label>
                  <Input
                    value={activeTemplate?.subject || ''}
                    onChange={(e) => updateTemplate(selectedTemplate, { subject: e.target.value })}
                    className="flex-1 border-0 shadow-none px-0 py-0 h-auto text-[14px] font-semibold text-gray-900 focus-visible:ring-0 placeholder:text-gray-300"
                    placeholder="Enter subject line..."
                  />
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-5 min-h-[300px]">
                <Textarea
                  value={activeTemplate?.body || ''}
                  onChange={(e) => updateTemplate(selectedTemplate, { body: e.target.value })}
                  className="w-full h-full min-h-[300px] resize-none border-0 bg-transparent p-0 text-[14px] leading-[1.6] text-gray-800 focus-visible:ring-0 placeholder:text-gray-300 format-email-body"
                  placeholder="Type your response..."
                />
              </div>

              {/* Draft Composer Footer */}
              <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700 hover:bg-white rounded-full">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Select
                    value={activeTemplate?.tone || 'professional'}
                    onValueChange={(value: 'professional' | 'casual' | 'friendly') => updateTemplate(selectedTemplate, { tone: value })}
                  >
                    <SelectTrigger className="h-8 border-transparent bg-transparent text-gray-500 hover:text-gray-900 focus:ring-0 shadow-none w-[110px] px-2 text-[12px] font-medium rounded-full">
                      <SelectValue placeholder="Tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={generateEmailContent}
                    disabled={isGenerating || !getInitialObjective().trim()}
                    variant="outline"
                    className="h-8 border-gray-200 bg-white text-gray-600 hover:text-gray-900 text-[12px] font-medium rounded-full shadow-sm"
                  >
                    <Wand2 className="mr-1.5 h-3.5 w-3.5 text-[hsl(var(--hermes-gold))]" />
                    {isGenerating ? 'Drafting...' : 'Autodraft'}
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || emailTemplates[0]?.body.length === 0}
                    className="h-8 rounded-full shadow-sm bg-[hsl(var(--hermes-gold))] px-4 text-[12px] font-bold tracking-wide text-white hover:bg-[hsl(var(--hermes-gold-dark))]"
                  >
                    Send Email <Send className="ml-1.5 h-3 w-3" />
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
