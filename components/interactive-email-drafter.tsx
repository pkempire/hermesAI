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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Building,
  CheckCircle2,
  Eye,
  Plus,
  Send,
  Sparkles,
  User,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
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

export function InteractiveEmailDrafter({
  prospects = [],
  searchSummary,
  step = 2,
  totalSteps = 5,
  onEmailsGenerated,
  onPreviewEmail
}: InteractiveEmailDrafterProps) {
  // Ensure we have prospects - try to load from sessionStorage if props are empty
  const [actualProspects, setActualProspects] = useState<Prospect[]>(prospects)
  
  useEffect(() => {
    // If no prospects provided, try to load from sessionStorage
    if (actualProspects.length === 0) {
      try {
        const stored = sessionStorage.getItem('hermes-latest-prospects')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActualProspects(parsed)
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to load prospects from sessionStorage:', e)
        }
      }
    }
  }, [prospects])
  
  // Update when props change
  useEffect(() => {
    if (prospects.length > 0) {
      setActualProspects(prospects)
    }
  }, [prospects])
  
  // Pre-fill campaign fields from search context
  const getInitialObjective = () => {
    try {
      const stored = sessionStorage.getItem('hermes-search-context')
      if (stored) {
        const context = JSON.parse(stored)
        const persona = context.targetPersona || 'decision makers'
        const offer = context.offer || 'our services'
        return `Connect with ${persona} to discuss ${offer}`
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
  
  // State management
  const [campaignType, setCampaignType] = useState<'single' | 'sequence'>('single')
  const [emailCount, setEmailCount] = useState(1)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Initial Outreach',
      type: 'initial',
      subject: '',
      body: '',
      tone: 'professional',
      delayDays: 0
    }
  ])
  const [personalization, setPersonalization] = useState<EmailPersonalizationSettings>({
    includePersonalNote: true,
    includeCompanyContext: true,
    includeRecentActivity: false,
    includeIndustryInsights: true,
    callToActionType: 'meeting'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [campaignObjective, setCampaignObjective] = useState(getInitialObjective())
  const [valueProposition, setValueProposition] = useState(getInitialValueProp())

  // Add new email to sequence
  const addEmailToSequence = () => {
    if (emailTemplates.length >= 4) return
    
    const nextStep = emailTemplates.length + 1
    const newEmail: EmailTemplate = {
      id: Date.now().toString(),
      name: `Follow-up ${nextStep - 1}`,
      type: nextStep === 2 ? 'follow_up_1' : nextStep === 3 ? 'follow_up_2' : 'follow_up_3',
      subject: '',
      body: '',
      tone: 'professional',
      delayDays: nextStep * 3 // Default 3 days between emails
    }
    setEmailTemplates([...emailTemplates, newEmail])
  }

  // Remove email from sequence
  const removeEmail = (index: number) => {
    if (emailTemplates.length <= 1 || index === 0) return
    setEmailTemplates(emailTemplates.filter((_, i) => i !== index))
  }

  // Update email template
  const updateTemplate = (index: number, updates: Partial<EmailTemplate>) => {
    setEmailTemplates(templates => 
      templates.map((template, i) => 
        i === index ? { ...template, ...updates } : template
      )
    )
  }

  // Generate AI-powered email content
  const generateEmailContent = async () => {
    if (actualProspects.length === 0) {
      alert('No prospects available. Please run a prospect search first.')
      return
    }
    
    if (!campaignObjective.trim()) {
      alert('Please enter a campaign objective before generating emails.')
      return
    }
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospects: actualProspects.slice(0, 3), // Sample prospects for context
          campaignObjective,
          valueProposition,
          personalization,
          emailTypes: emailTemplates.map(t => ({ type: t.type, tone: t.tone }))
        })
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate emails' }))
        throw new Error(error.error || 'Failed to generate emails')
      }
      
      const result = await response.json()
      
      if (result.success && result.templates) {
        const updatedTemplates = emailTemplates.map((template, index) => ({
          ...template,
          subject: result.templates[index]?.subject || template.subject,
          body: result.templates[index]?.body || template.body
        }))
        setEmailTemplates(updatedTemplates)
      } else {
        throw new Error(result.error || 'Failed to generate email templates')
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to generate email content:', error)
      }
      alert(`Failed to generate emails: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = () => {
    if (actualProspects.length > 0 && selectedTemplate < emailTemplates.length) {
      onPreviewEmail?.(emailTemplates[selectedTemplate], actualProspects[0])
    }
  }

  const generatingRef = { current: false } as any
  const handleGenerate = () => {
    if (generatingRef.current) return
    if (actualProspects.length === 0) {
      alert('No prospects available. Please run a prospect search first.')
      return
    }
    generatingRef.current = true
    try {
      onEmailsGenerated?.(emailTemplates)
    } finally {
      setTimeout(() => { generatingRef.current = false }, 1000)
    }
  }

  const sampleProspect = actualProspects[0]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}: Draft Email Campaign</span>
            <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="w-full" />
        </div>
      </div>

      {/* Campaign Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-green-900 flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Prospects Found</span>
          </CardTitle>
          <CardDescription className="text-green-700">
            Ready to draft personalized emails for {actualProspects.length} qualified prospect{actualProspects.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        {sampleProspect && (
          <CardContent className="text-sm text-green-800">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Example: {sampleProspect.fullName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>{sampleProspect.jobTitle} at {sampleProspect.company}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Campaign Setup</TabsTrigger>
          <TabsTrigger value="templates">Email Templates ({emailTemplates.length})</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
        </TabsList>

        {/* Campaign Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Configuration</CardTitle>
              <CardDescription>
                Define your campaign objective and structure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="objective">Campaign Objective</Label>
                  <Textarea
                    id="objective"
                    placeholder="e.g., Connect with decision makers to explore partnership opportunities..."
                    value={campaignObjective}
                    onChange={(e) => setCampaignObjective(e.target.value)}
                    className="min-h-20"
                  />
                  <p className="text-xs text-gray-500">What do you want to achieve with this outreach?</p>
                </div>

                <div>
                  <Label htmlFor="value-prop">Value Proposition</Label>
                  <Textarea
                    id="value-prop"
                    placeholder="e.g., We help organizations achieve their goals through innovative solutions..."
                    value={valueProposition}
                    onChange={(e) => setValueProposition(e.target.value)}
                    className="min-h-20"
                  />
                  <p className="text-xs text-gray-500">What unique value do you offer?</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Campaign Type</Label>
                  <Select 
                    value={campaignType} 
                    onValueChange={(value: 'single' | 'sequence') => setCampaignType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Email</SelectItem>
                      <SelectItem value="sequence">Email Sequence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {campaignType === 'sequence' && (
                  <div className="space-y-4">
                    <Label>Number of Follow-ups</Label>
                    <Select 
                      value={emailCount.toString()} 
                      onValueChange={(value) => {
                        const count = parseInt(value)
                        setEmailCount(count)
                        // Adjust templates array
                        if (count > emailTemplates.length) {
                          while (emailTemplates.length < count) {
                            addEmailToSequence()
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Email Only</SelectItem>
                        <SelectItem value="2">1 Follow-up</SelectItem>
                        <SelectItem value="3">2 Follow-ups</SelectItem>
                        <SelectItem value="4">3 Follow-ups</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {emailTemplates.map((template, index) => (
            <Card key={template.id} className={selectedTemplate === index ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {index === 0 ? 'Initial Email' : `Follow-up ${index}`}
                    </Badge>
                    <Input
                      value={template.name}
                      onChange={(e) => updateTemplate(index, { name: e.target.value })}
                      className="w-40"
                    />
                    {index > 0 && (
                      <span className="text-sm text-muted-foreground">
                        Send after {template.delayDays} days
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={selectedTemplate === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTemplate(index)}
                    >
                      {selectedTemplate === index ? 'Editing' : 'Edit'}
                    </Button>
                    {index > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmail(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {index > 0 && (
                    <div>
                      <Label>Delay (days)</Label>
                      <Input
                        type="number"
                        value={template.delayDays}
                        onChange={(e) => updateTemplate(index, { delayDays: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="30"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label>Tone</Label>
                    <Select 
                      value={template.tone} 
                      onValueChange={(value: 'professional' | 'casual' | 'friendly') => 
                        updateTemplate(index, { tone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Subject Line</Label>
                  <Input
                    placeholder="e.g., Quick question about {{company}}'s API strategy"
                    value={template.subject}
                    onChange={(e) => updateTemplate(index, { subject: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Email Body</Label>
                  <Textarea
                    placeholder={`Hi {{firstName}},\n\nI noticed {{company}} is... \n\nWould you be interested in a quick 15-minute call to discuss?\n\nBest regards,\n[Your name]`}
                    value={template.body}
                    onChange={(e) => updateTemplate(index, { body: e.target.value })}
                    className="min-h-40"
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    Use variables: {'{'}firstName{'}'}, {'{'}lastName{'}'}, {'{'}company{'}'}, {'{'}jobTitle{'}'}, {'{'}industry{'}'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {campaignType === 'sequence' && emailTemplates.length < 4 && (
            <Button onClick={addEmailToSequence} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Follow-up Email
            </Button>
          )}
        </TabsContent>

        {/* Personalization Tab */}
        <TabsContent value="personalization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalization Settings</CardTitle>
              <CardDescription>
                Configure how emails should be personalized for each prospect.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Content Personalization</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'includePersonalNote', label: 'Personal note based on LinkedIn activity', desc: 'Reference recent posts or updates' },
                      { key: 'includeCompanyContext', label: 'Company-specific context', desc: 'Mention recent company news or achievements' },
                      { key: 'includeRecentActivity', label: 'Recent industry activity', desc: 'Reference industry trends or events' },
                      { key: 'includeIndustryInsights', label: 'Industry insights', desc: 'Include relevant industry statistics' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-start space-x-3">
                        <Checkbox
                          checked={personalization[key as keyof EmailPersonalizationSettings] as boolean}
                          onCheckedChange={(checked) => 
                            setPersonalization(prev => ({ 
                              ...prev, 
                              [key]: checked 
                            }))
                          }
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Call to Action</h4>
                  <div className="space-y-3">
                    <Label>CTA Type</Label>
                    <Select 
                      value={personalization.callToActionType} 
                      onValueChange={(value) => 
                        setPersonalization(prev => ({ 
                          ...prev, 
                          callToActionType: value as any
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Schedule Meeting</SelectItem>
                        <SelectItem value="demo">Request Demo</SelectItem>
                        <SelectItem value="call">Quick Call</SelectItem>
                        <SelectItem value="reply">Simple Reply</SelectItem>
                        <SelectItem value="custom">Custom CTA</SelectItem>
                      </SelectContent>
                    </Select>

                    {personalization.callToActionType === 'custom' && (
                      <div>
                        <Label>Custom CTA</Label>
                        <Input
                          placeholder="e.g., Download our whitepaper"
                          value={personalization.customCTA || ''}
                          onChange={(e) => 
                            setPersonalization(prev => ({ 
                              ...prev, 
                              customCTA: e.target.value
                            }))
                          }
                        />
                      </div>
                    )}
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
          {emailTemplates.length} email{emailTemplates.length > 1 ? 's' : ''} • {actualProspects.length} prospect{actualProspects.length !== 1 ? 's' : ''}
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handlePreview} disabled={!sampleProspect}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Email
          </Button>
          <Button 
            onClick={generateEmailContent} 
            disabled={isGenerating || !campaignObjective.trim()}
            variant="outline"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'AI Generate Content'}
          </Button>
          <Button onClick={handleGenerate} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Send className="w-4 h-4 mr-2" />
            Finalize Campaign
          </Button>
        </div>
      </div>
    </div>
  )
}