'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Building, Globe, Mail, Search, Target, TrendingUp, User, Users, Zap } from 'lucide-react'
import { useState } from 'react'

// Types for the campaign configuration
export interface ProspectCriteria {
  query: string
  entityType: 'company' | 'person' | 'mixed'
  targetCount: number
  includeEnrichments: string[]
  allCriteria?: Array<{ label: string; value: string; type: string }> // AI-extracted detailed criteria
  filters: {
    industry?: string[]
    companySize?: string
    location?: string[]
    jobTitles?: string[]
    technologies?: string[]
    activities?: string[] // Recent activities/posts
    other?: string[] // Other criteria
    revenueRange?: string
  }
}

export interface EmailSequence {
  id: string
  type: 'initial' | 'follow_up_1' | 'follow_up_2' | 'follow_up_3'
  subject: string
  body: string
  delayDays: number
}

export interface CampaignSettings {
  name: string
  dailyLimit: number
  timezone: string
  warmupEnabled: boolean
  trackOpens: boolean
  trackClicks: boolean
  autoFollowUp: boolean
}

interface CampaignBuilderProps {
  onCreateCampaign: (criteria: ProspectCriteria, emailSequence: EmailSequence[], settings: CampaignSettings) => void
}

export function CampaignBuilder({ onCreateCampaign }: CampaignBuilderProps) {
  // State for prospect criteria
  const [prospectCriteria, setProspectCriteria] = useState<ProspectCriteria>({
    query: '',
    entityType: 'company',
    targetCount: 100,
    includeEnrichments: ['email', 'linkedin', 'company_info'],
    filters: {}
  })

  // State for email sequence
  const [emailSequence, setEmailSequence] = useState<EmailSequence[]>([
    {
      id: 'initial',
      type: 'initial',
      subject: '',
      body: '',
      delayDays: 0
    }
  ])

  // State for campaign settings
  const [campaignSettings, setCampaignSettings] = useState<CampaignSettings>({
    name: '',
    dailyLimit: 50,
    timezone: 'UTC',
    warmupEnabled: true,
    trackOpens: true,
    trackClicks: true,
    autoFollowUp: true
  })

  const [activeTab, setActiveTab] = useState('prospects')

  // Available enrichment options
  const enrichmentOptions = [
    { id: 'email', label: 'Email Address', icon: Mail },
    { id: 'linkedin', label: 'LinkedIn Profile', icon: Users },
    { id: 'company_info', label: 'Company Details', icon: Building },
    { id: 'phone', label: 'Phone Number', icon: User },
    { id: 'social_media', label: 'Social Media', icon: Globe },
    { id: 'technologies', label: 'Tech Stack', icon: Zap }
  ]

  const handleEnrichmentToggle = (enrichmentId: string) => {
    setProspectCriteria(prev => ({
      ...prev,
      includeEnrichments: prev.includeEnrichments.includes(enrichmentId)
        ? prev.includeEnrichments.filter(id => id !== enrichmentId)
        : [...prev.includeEnrichments, enrichmentId]
    }))
  }

  const addEmailStep = () => {
    const nextStep = emailSequence.length + 1
    const newEmail: EmailSequence = {
      id: `follow_up_${nextStep}`,
      type: nextStep === 1 ? 'follow_up_1' : nextStep === 2 ? 'follow_up_2' : 'follow_up_3',
      subject: '',
      body: '',
      delayDays: nextStep * 3 // Default 3 days between emails
    }
    setEmailSequence(prev => [...prev, newEmail])
  }

  const removeEmailStep = (id: string) => {
    setEmailSequence(prev => prev.filter(email => email.id !== id))
  }

  const updateEmailStep = (id: string, updates: Partial<EmailSequence>) => {
    setEmailSequence(prev => 
      prev.map(email => 
        email.id === id ? { ...email, ...updates } : email
      )
    )
  }

  const handleSubmit = () => {
    if (!prospectCriteria.query.trim()) {
      alert('Please enter a search query for prospects')
      return
    }
    if (!campaignSettings.name.trim()) {
      alert('Please enter a campaign name')
      return
    }
    if (emailSequence.some(email => !email.subject.trim() || !email.body.trim())) {
      alert('Please complete all email templates')
      return
    }

    onCreateCampaign(prospectCriteria, emailSequence, campaignSettings)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Create Cold Email Campaign
        </h1>
        <p className="text-muted-foreground">
          Find prospects, craft personalized emails, and automate your outreach
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prospects" className="space-x-2">
            <Search className="w-4 h-4" />
            <span>Find Prospects</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="space-x-2">
            <Mail className="w-4 h-4" />
            <span>Email Sequence</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="space-x-2">
            <Target className="w-4 h-4" />
            <span>Campaign Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Prospect Search Tab */}
        <TabsContent value="prospects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Prospect Discovery</span>
              </CardTitle>
              <CardDescription>
                Use natural language to describe your ideal prospects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">Search Query</Label>
                <Textarea
                  id="query"
                  placeholder="e.g., 'SaaS companies with 10-50 employees that use React and are hiring software engineers'"
                  value={prospectCriteria.query}
                  onChange={(e) => setProspectCriteria(prev => ({ ...prev, query: e.target.value }))}
                  className="min-h-20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select 
                    value={prospectCriteria.entityType} 
                    onValueChange={(value: 'company' | 'person' | 'mixed') => 
                      setProspectCriteria(prev => ({ ...prev, entityType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Companies</SelectItem>
                      <SelectItem value="person">People</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Count</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[prospectCriteria.targetCount]}
                      onValueChange={([value]) => setProspectCriteria(prev => ({ ...prev, targetCount: value }))}
                      max={1000}
                      min={10}
                      step={10}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      {prospectCriteria.targetCount} prospects
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Data Enrichments</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {enrichmentOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = prospectCriteria.includeEnrichments.includes(option.id)
                    return (
                      <div
                        key={option.id}
                        className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-muted/20 border-border hover:bg-muted/40'
                        }`}
                        onClick={() => handleEnrichmentToggle(option.id)}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {option.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Sequence Tab */}
        <TabsContent value="emails" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Email Sequence</h3>
              <p className="text-sm text-muted-foreground">Create your automated email flow</p>
            </div>
            <Button 
              onClick={addEmailStep}
              disabled={emailSequence.length >= 4}
              variant="outline"
              size="sm"
            >
              Add Follow-up
            </Button>
          </div>

          <div className="space-y-4">
            {emailSequence.map((email, index) => (
              <Card key={email.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? 'Initial Email' : `Follow-up ${index}`}
                      </Badge>
                      {index > 0 && (
                        <span className="text-sm text-muted-foreground">
                          Send after {email.delayDays} days
                        </span>
                      )}
                    </div>
                    {index > 0 && (
                      <Button
                        onClick={() => removeEmailStep(email.id)}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {index > 0 && (
                    <div className="space-y-2">
                      <Label>Delay (days)</Label>
                      <Input
                        type="number"
                        value={email.delayDays}
                        onChange={(e) => updateEmailStep(email.id, { delayDays: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="30"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input
                      placeholder="e.g., Quick question about {{company}}"
                      value={email.subject}
                      onChange={(e) => updateEmailStep(email.id, { subject: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email Body</Label>
                    <Textarea
                      placeholder="Hi {{firstName}},&#10;&#10;I noticed {{company}} is..."
                      value={email.body}
                      onChange={(e) => updateEmailStep(email.id, { body: e.target.value })}
                      className="min-h-32"
                    />
                    <div className="text-xs text-muted-foreground">
                      Use variables: {'{'}firstName{'}'}, {'{'}lastName{'}'}, {'{'}company{'}'}, {'{'}jobTitle{'}'}, {'{'}linkedinUrl{'}'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Campaign Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Configuration</CardTitle>
              <CardDescription>Set up your campaign parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Q1 SaaS Outreach"
                  value={campaignSettings.name}
                  onChange={(e) => setCampaignSettings(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Daily Email Limit</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[campaignSettings.dailyLimit]}
                      onValueChange={([value]) => setCampaignSettings(prev => ({ ...prev, dailyLimit: value }))}
                      max={200}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground text-center">
                      {campaignSettings.dailyLimit} emails per day
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={campaignSettings.timezone} 
                    onValueChange={(value) => setCampaignSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Email Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label>Email Warm-up</Label>
                      <p className="text-xs text-muted-foreground">
                        Gradually increase sending volume
                      </p>
                    </div>
                    <Switch
                      checked={campaignSettings.warmupEnabled}
                      onCheckedChange={(checked) => setCampaignSettings(prev => ({ ...prev, warmupEnabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label>Track Opens</Label>
                      <p className="text-xs text-muted-foreground">
                        Monitor email open rates
                      </p>
                    </div>
                    <Switch
                      checked={campaignSettings.trackOpens}
                      onCheckedChange={(checked) => setCampaignSettings(prev => ({ ...prev, trackOpens: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label>Track Clicks</Label>
                      <p className="text-xs text-muted-foreground">
                        Monitor link click rates
                      </p>
                    </div>
                    <Switch
                      checked={campaignSettings.trackClicks}
                      onCheckedChange={(checked) => setCampaignSettings(prev => ({ ...prev, trackClicks: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label>Auto Follow-up</Label>
                      <p className="text-xs text-muted-foreground">
                        Send follow-ups automatically
                      </p>
                    </div>
                    <Switch
                      checked={campaignSettings.autoFollowUp}
                      onCheckedChange={(checked) => setCampaignSettings(prev => ({ ...prev, autoFollowUp: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          Ready to launch your campaign?
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            Save Draft
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Start Campaign
          </Button>
        </div>
      </div>
    </div>
  )
} 