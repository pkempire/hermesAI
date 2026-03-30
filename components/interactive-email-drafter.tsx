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
  Wand2,
  Sparkles,
  Inbox
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Prospect } from './prospect-grid'
import Image from 'next/image'

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
        <div className={cn("relative h-full w-full", isCompany ? "rounded-xl" : "rounded-full", "overflow-hidden")}>
          <Image 
            src={url} 
            alt={initials} 
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )
    }
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-gray-50 text-[11px] font-bold text-gray-400", isCompany ? "rounded-xl" : "rounded-full")}>
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
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600/70 mb-4 px-3 py-1 bg-amber-50 self-start rounded-full border border-amber-100/50">
              Personalization Engine
            </div>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-gray-900 md:text-[3.5rem] tracking-tight">
              Campaign Draft Studio
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] leading-[1.6] font-medium text-gray-500/80">
              Refine your autonomous sequence. Tighten the hook, adjust the tone, and verify the signals before Hermes initiates the Gmail send.
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
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
            <div className="flex space-x-6 text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">
              <span className="text-gray-900 border-b-2 border-gray-900 pb-5 -mb-[21px] flex items-center gap-2">
                <Inbox className="w-3.5 h-3.5" /> Discovery List
              </span>
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
                        'flex flex-col w-full items-start px-6 py-5 text-left border-b border-gray-100 last:border-0 transition-all duration-300',
                        active
                          ? 'bg-white shadow-[inset_4px_0_0_#926e2e]'
                          : 'bg-transparent hover:bg-gray-50/80'
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-8 w-8 shrink-0 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-white")}>
                            <Avatar url={prospect.companyLogoUrl} initials={initials(company)} isCompany />
                          </div>
                          <span className="truncate text-[14px] font-bold text-gray-900 tracking-tight">{company}</span>
                        </div>
                        <div className="flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                      </div>
                      <div className="w-full pl-11">
                        <span className={cn("block truncate text-[13px] font-medium leading-none", active ? "text-gray-700" : "text-gray-400")}>
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
          <div className="flex-1 overflow-y-auto bg-gray-50/30 md:p-10 p-4">
            <div className="mx-auto max-w-2xl bg-white rounded-[2rem] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col min-h-[500px]">
              
              <div className="border-b border-gray-100 p-8 space-y-5">
                <div className="flex items-center border-b border-gray-50 pb-4">
                  <Label className="w-20 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 my-auto shrink-0">Recipient</Label>
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex items-center space-x-3 bg-gray-50/50 border border-gray-100 rounded-full px-4 py-2 overflow-hidden shadow-sm">
                      <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 border border-gray-200">
                        <Avatar url={activeProspect?.avatarUrl} initials={initials(activeProspect?.fullName)} />
                      </div>
                      <span className="text-[14px] font-bold text-gray-700 truncate">{activeProspect?.email || activeProspect?.fullName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Label className="w-20 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 my-auto shrink-0">Subject</Label>
                  <Input
                    value={activeTemplate?.subject || ''}
                    onChange={(e) => updateTemplate(selectedTemplate, { subject: e.target.value })}
                    className="flex-1 border-0 shadow-none px-0 py-0 h-auto text-[15px] font-bold text-gray-900 focus-visible:ring-0 placeholder:text-gray-300"
                    placeholder="Enter subject line..."
                  />
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-8">
                <Textarea
                  value={activeTemplate?.body || ''}
                  onChange={(e) => updateTemplate(selectedTemplate, { body: e.target.value })}
                  className="w-full h-full min-h-[350px] resize-none border-0 bg-transparent p-0 text-[16px] leading-[1.8] text-gray-700 focus-visible:ring-0 placeholder:text-gray-300 font-medium"
                  placeholder="Draft content will appear here..."
                />
              </div>

              {/* Draft Composer Footer */}
              <div className="px-8 py-6 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white shrink-0">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Select
                    value={activeTemplate?.tone || 'professional'}
                    onValueChange={(value: 'professional' | 'casual' | 'friendly') => updateTemplate(selectedTemplate, { tone: value })}
                  >
                    <SelectTrigger className="h-10 border-gray-100 bg-gray-50/50 text-gray-600 hover:text-gray-900 focus:ring-0 shadow-none w-[130px] px-4 text-[13px] font-bold rounded-xl transition-all">
                      <SelectValue placeholder="Tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={generateEmailContent}
                    disabled={isGenerating || !getInitialObjective().trim()}
                    variant="outline"
                    className="h-11 border-gray-100 bg-white text-gray-600 hover:text-gray-900 text-[13px] font-bold rounded-2xl shadow-sm px-6 transition-all hover:border-amber-200"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                    {isGenerating ? 'Drafting...' : 'Autodraft'}
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || emailTemplates[0]?.body.length === 0}
                    className="h-11 rounded-2xl shadow-lg bg-gray-900 px-8 text-[13px] font-bold tracking-wide text-white hover:bg-amber-600 transition-all active:scale-95"
                  >
                    Initiate Gmail Send <Send className="ml-2 h-3.5 w-3.5" />
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
