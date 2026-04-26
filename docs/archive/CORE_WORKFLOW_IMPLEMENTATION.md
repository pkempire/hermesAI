# 🔧 Core Workflow Implementation Guide

**Last Updated:** September 30, 2025

---

## 🎯 Critical Improvements Needed

### 1. **Context-Aware Enrichments**
### 2. **10x Faster Performance**
### 3. **CSV Upload**
### 4. **Marketplace Templates**
### 5. **Better UI (Error States)**
### 6. **Stripe Billing**

---

## 1. Context-Aware Enrichments

### **Current (Bad):**
```typescript
// Generic enrichments - same for everyone
const enrichments = [
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'LinkedIn', value: 'linkedin' }
]
```

### **New (Smart):**
```typescript
// lib/agents/enrichment-strategy.ts

import { generateObject } from 'ai'
import { getModel } from '@/lib/utils/registry'
import { z } from 'zod'

const enrichmentStrategySchema = z.object({
  useCase: z.enum(['sales', 'recruiting', 'partnerships', 'fundraising', 'other']),
  coreEnrichments: z.array(z.object({
    name: z.string(),
    description: z.string(),
    why: z.string().describe('Why this enrichment helps close the deal')
  })),
  customEnrichments: z.array(z.object({
    name: z.string(),
    description: z.string(),
    extractionInstructions: z.string(),
    exampleValue: z.string()
  }))
})

export async function generateEnrichmentStrategy(params: {
  query: string
  offer: string
  targetPersona: string
}) {
  const result = await generateObject({
    model: getModel('openai:gpt-5'),
    schema: enrichmentStrategySchema,
    prompt: `You are an expert at B2B prospecting. Determine the BEST enrichments for this campaign.

Campaign Context:
- What they're looking for: ${params.query}
- What we're offering: ${params.offer}
- Target persona: ${params.targetPersona}

Create enrichments that will:
1. Help qualify the prospect (are they a good fit?)
2. Provide ammunition for personalization (recent activity, pain points)
3. Enable follow-up (contact info, best time to reach)

Examples:

For PARTNERSHIP prospecting:
- Recent partnership announcements
- Integration marketplace URL
- Competitor partnerships
- Tech stack mentions

For RECRUITING:
- GitHub activity (for eng roles)
- Speaking engagements
- Publications/blog posts
- Career trajectory

For SALES (API product):
- Tech stack currently using
- Engineering blog posts mentioning pain points
- API usage scale (requests/month if public)
- Recent funding (growth signal)

Now generate for this campaign.`,
    temperature: 0.4
  })
  
  return result.object
}
```

### **Usage in Prospect Search Tool:**
```typescript
// lib/tools/prospect-search.ts

export function createProspectSearchTool(model: string) {
  return tool({
    inputSchema: z.object({
      query: z.string(),
      offer: z.string().optional().describe('What you\'re offering (for smart enrichments)'),
      targetPersona: z.string().optional().describe('Who you\'re targeting'),
      targetCount: z.number().default(25),
      interactive: z.boolean().default(true)
    }),
    execute: async ({ query, offer, targetPersona, targetCount, interactive }) => {
      
      // Generate smart enrichments based on offer
      const enrichmentStrategy = await generateEnrichmentStrategy({
        query,
        offer: offer || 'Not specified',
        targetPersona: targetPersona || 'Not specified'
      })
      
      // Use GPT-5 to extract search criteria
      const websetPlan = await generateObject({
        model: getModel('openai:gpt-5'),
        schema: websetPlanSchema,
        prompt: `Create Exa webset plan:
        
Query: ${query}
Offer: ${offer}
Persona: ${targetPersona}

Enrichments to include:
${enrichmentStrategy.coreEnrichments.map(e => `- ${e.name}: ${e.description} (${e.why})`).join('\n')}

Custom enrichments:
${enrichmentStrategy.customEnrichments.map(e => `- ${e.name}: ${e.extractionInstructions}`).join('\n')}
`
      })
      
      // Return interactive UI with SMART enrichments
      return {
        type: 'interactive_ui',
        component: 'ProspectSearchBuilder',
        props: {
          initialCriteria: websetPlan.object.searchCriteria,
          initialEnrichments: [
            ...enrichmentStrategy.coreEnrichments,
            ...enrichmentStrategy.customEnrichments
          ],
          enrichmentRationale: enrichmentStrategy.coreEnrichments.map(e => e.why),
          useCase: enrichmentStrategy.useCase
        }
      }
    }
  })
}
```

---

## 2. 10x Faster Performance

### **Problem:** Currently polls every 2 seconds (slow)

### **Solution A: Faster Polling (Easy, 2x faster)**
```typescript
// components/prospect-search-section.tsx

const POLL_INTERVAL = 500 // 500ms instead of 2000ms (4x faster)
const MAX_POLLS = 600 // 5 minutes max (was 150 polls)

const startStreamingPolling = (websetId: string, targetCount: number) => {
  let pollCount = 0
  
  const poll = async () => {
    if (pollCount++ > MAX_POLLS) {
      setSearchStatus('failed')
      setSearchMessage('Search timed out after 5 minutes')
      return
    }
    
    try {
      const response = await fetch(`/api/prospect-search/status?id=${websetId}`)
      const data = await response.json()
      
      if (data.status === 'completed') {
        setProspects(data.prospects)
        setSearchStatus('completed')
        clearInterval(pollInterval)
      } else if (data.status === 'failed') {
        setSearchStatus('failed')
        setSearchMessage(data.error || 'Search failed')
        clearInterval(pollInterval)
      } else {
        // Update progress
        setSearchMessage(`Found ${data.prospectsFound || 0}/${targetCount} prospects...`)
      }
    } catch (error) {
      console.error('Polling error:', error)
    }
  }
  
  const pollInterval = setInterval(poll, POLL_INTERVAL)
  poll() // Initial poll
}
```

### **Solution B: WebSocket (Ideal, 10x faster)**
```typescript
// app/api/prospect-search/stream/route.ts

import { createClient } from '@/lib/supabase/server'
import { createExaWebsetsClient } from '@/lib/clients/exa-websets'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const websetId = searchParams.get('id')
  
  if (!websetId) {
    return new Response('Missing webset ID', { status: 400 })
  }
  
  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const exa = createExaWebsetsClient()
      
      // Poll Exa every 500ms and stream results
      const pollInterval = setInterval(async () => {
        try {
          const webset = await exa.websets.get(websetId)
          
          // Send progress update
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            status: webset.status,
            progress: webset.progress || 0
          })}\n\n`))
          
          if (webset.status === 'completed') {
            const items = await exa.websets.listItems(websetId, { limit: 1000 })
            
            // Stream each prospect individually
            for (const item of items) {
              const prospect = convertToProspect(item)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'prospect',
                data: prospect
              })}\n\n`))
            }
            
            // Close stream
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              total: items.length
            })}\n\n`))
            
            clearInterval(pollInterval)
            controller.close()
          }
          
          if (webset.status === 'failed') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: 'Search failed'
            })}\n\n`))
            clearInterval(pollInterval)
            controller.close()
          }
        } catch (error) {
          console.error('Stream error:', error)
          clearInterval(pollInterval)
          controller.close()
        }
      }, 500)
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        controller.close()
      }, 300000)
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

**Client-side (SSE):**
```typescript
// components/prospect-search-section.tsx

const startWebSocketStream = (websetId: string) => {
  const eventSource = new EventSource(`/api/prospect-search/stream?id=${websetId}`)
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    switch (data.type) {
      case 'progress':
        setSearchMessage(`Progress: ${data.progress}%`)
        break
        
      case 'prospect':
        // Add prospect immediately (real-time!)
        setProspects(prev => [...prev, data.data])
        break
        
      case 'complete':
        setSearchStatus('completed')
        setSearchMessage(`Found ${data.total} prospects`)
        eventSource.close()
        break
        
      case 'error':
        setSearchStatus('failed')
        setSearchMessage(data.message)
        eventSource.close()
        break
    }
  }
  
  eventSource.onerror = () => {
    eventSource.close()
    setSearchStatus('failed')
  }
}
```

### **Solution C: Parallel Processing**
```typescript
// app/api/prospect-search/execute/route.ts

// Instead of sequential enrichment
const prospects = []
for (const item of items) {
  const enriched = await enrichProspect(item)
  prospects.push(enriched)
}

// Parallel (10x faster for 100 prospects)
const prospects = await Promise.all(
  items.map(async (item) => {
    try {
      return await enrichProspect(item)
    } catch (error) {
      console.error('Enrichment failed:', item.id, error)
      return { ...item, enrichmentFailed: true }
    }
  })
)
```

---

## 3. CSV Upload

### **Database Schema:**
```sql
-- supabase/migrations/20250930_csv_upload.sql

CREATE TABLE csv_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE csv_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES csv_uploads(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  company_name TEXT,
  person_name TEXT,
  email TEXT,
  linkedin_url TEXT,
  custom_fields JSONB,
  enrichment_status TEXT DEFAULT 'pending', -- pending, enriching, completed, failed
  enriched_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uploads" ON csv_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create uploads" ON csv_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own prospects" ON csv_prospects
  FOR SELECT USING (
    upload_id IN (SELECT id FROM csv_uploads WHERE user_id = auth.uid())
  );
```

### **API Route:**
```typescript
// app/api/csv/upload/route.ts

import { createClient } from '@/lib/supabase/server'
import { parse } from 'csv-parse/sync'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return new Response('No file provided', { status: 400 })
  }
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Parse CSV
  const text = await file.text()
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true
  })
  
  // Create upload record
  const { data: upload } = await supabase
    .from('csv_uploads')
    .insert({
      user_id: user.id,
      filename: file.name,
      row_count: records.length,
      status: 'processing'
    })
    .select()
    .single()
  
  // Insert prospects
  const prospects = records.map((row: any, index: number) => ({
    upload_id: upload.id,
    row_index: index,
    company_name: row['Company'] || row['company'] || row['Company Name'],
    person_name: row['Name'] || row['Full Name'] || row['name'],
    email: row['Email'] || row['email'],
    linkedin_url: row['LinkedIn'] || row['linkedin'] || row['LinkedIn URL'],
    custom_fields: row
  }))
  
  await supabase.from('csv_prospects').insert(prospects)
  
  // Trigger enrichment job
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/csv/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId: upload.id })
  })
  
  return Response.json({ uploadId: upload.id, count: records.length })
}
```

### **Enrichment via Websets:**
```typescript
// app/api/csv/enrich/route.ts

export async function POST(req: Request) {
  const { uploadId } = await req.json()
  
  const supabase = await createClient()
  
  // Get all prospects from upload
  const { data: prospects } = await supabase
    .from('csv_prospects')
    .select('*')
    .eq('upload_id', uploadId)
  
  // Create Exa webset with just the companies/people
  const exa = createExaWebsetsClient()
  
  const webset = await exa.websets.create({
    search: {
      query: `Companies: ${prospects.map(p => p.company_name).join(', ')}`,
      count: prospects.length,
      entity: { type: 'company' }
    },
    enrichments: [
      { title: 'Email', description: 'Contact email', format: 'text' },
      { title: 'Phone', description: 'Phone number', format: 'text' },
      { title: 'LinkedIn', description: 'LinkedIn URL', format: 'text' },
      { title: 'Tech Stack', description: 'Technologies used', format: 'json' },
      { title: 'Funding', description: 'Recent funding rounds', format: 'text' }
    ]
  })
  
  // Poll for completion
  const pollInterval = setInterval(async () => {
    const websetStatus = await exa.websets.get(webset.id)
    
    if (websetStatus.status === 'completed') {
      const items = await exa.websets.listItems(webset.id)
      
      // Match items back to prospects and update
      for (const item of items) {
        const matchingProspect = prospects.find(p => 
          p.company_name.toLowerCase() === item.title.toLowerCase()
        )
        
        if (matchingProspect) {
          await supabase
            .from('csv_prospects')
            .update({
              enrichment_status: 'completed',
              enriched_data: item.enrichments
            })
            .eq('id', matchingProspect.id)
        }
      }
      
      // Mark upload as completed
      await supabase
        .from('csv_uploads')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', uploadId)
      
      clearInterval(pollInterval)
    }
  }, 2000)
  
  return Response.json({ status: 'enriching', websetId: webset.id })
}
```

---

## 4. Marketplace Templates

### **Database Schema:**
```sql
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  use_case TEXT NOT NULL, -- 'recruiting', 'partnerships', 'sales', 'fundraising'
  icon TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  
  -- Template content
  example_query TEXT NOT NULL,
  suggested_criteria JSONB NOT NULL,
  suggested_enrichments JSONB NOT NULL,
  email_template TEXT,
  
  -- Metadata
  times_used INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed templates
INSERT INTO campaign_templates (name, description, use_case, icon, example_query, suggested_criteria, suggested_enrichments, email_template) VALUES
('Tech Recruiting - Engineers', 'Find software engineers for your open roles', 'recruiting', '👨‍💻', 
 'Find senior software engineers in San Francisco who work with React',
 '[{"type": "job_title", "value": "Senior Software Engineer"}, {"type": "location", "value": "San Francisco"}, {"type": "technology", "value": "React"}]',
 '[{"name": "GitHub Profile", "description": "GitHub username and activity"}, {"name": "Tech Stack", "description": "Technologies they use"}, {"name": "Open to Opportunities", "description": "Are they job hunting?"}]',
 'Hi {{firstName}},\n\nSaw your work with React at {{company}}. We''re building [your product] and looking for senior engineers.\n\nInterested in a quick chat?'),
 
('Partnership Outreach', 'Find potential integration partners', 'partnerships', '🤝',
 'Find SaaS companies with integration marketplaces in the HR space',
 '[{"type": "industry", "value": "HR Tech"}, {"type": "company_type", "value": "Has integration marketplace"}]',
 '[{"name": "Marketplace URL", "description": "URL of their integration/app marketplace"}, {"name": "Recent Partnerships", "description": "Partnership announcements in last 6 months"}, {"name": "Tech Stack", "description": "Technologies they integrate with"}]',
 'Hi {{firstName}},\n\nSaw {{company}} has an integration marketplace. We help HR platforms add [your feature].\n\nWorth exploring a partnership?');
```

### **UI Component:**
```typescript
// components/template-marketplace.tsx

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CampaignTemplate {
  id: string
  name: string
  description: string
  use_case: string
  icon: string
  example_query: string
  times_used: number
  average_rating: number
}

export function TemplateMarketplace({ onSelectTemplate }: {
  onSelectTemplate: (template: CampaignTemplate) => void
}) {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [filter, setFilter] = useState<string>('all')
  
  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => setTemplates(data))
  }, [])
  
  const filteredTemplates = filter === 'all' 
    ? templates 
    : templates.filter(t => t.use_case === filter)
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Templates
        </Button>
        <Button
          variant={filter === 'recruiting' ? 'default' : 'outline'}
          onClick={() => setFilter('recruiting')}
        >
          👨‍💻 Recruiting
        </Button>
        <Button
          variant={filter === 'partnerships' ? 'default' : 'outline'}
          onClick={() => setFilter('partnerships')}
        >
          🤝 Partnerships
        </Button>
        <Button
          variant={filter === 'sales' ? 'default' : 'outline'}
          onClick={() => setFilter('sales')}
        >
          💰 Sales
        </Button>
      </div>
      
      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="p-4 lift-on-hover">
            <div className="flex items-start gap-3">
              <div className="text-3xl">{template.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span>⭐ {template.average_rating?.toFixed(1) || 'New'}</span>
                  <span>•</span>
                  <span>{template.times_used} uses</span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950"
                  onClick={() => onSelectTemplate(template)}
                >
                  Use Template
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## 5. Better UI (Error States, Placeholders)

### **Prospect Card Improvements:**
```typescript
// components/prospect-card.tsx

export function ProspectCard({ prospect }: { prospect: Prospect }) {
  // Handle missing data gracefully
  const hasPhoto = prospect.avatarUrl || prospect.companyLogoUrl
  const hasLinkedIn = prospect.linkedinUrl
  const hasEmail = prospect.email
  
  return (
    <Card className="glass lift-on-hover p-4">
      {/* Photo with fallback */}
      <div className="flex items-start gap-3">
        {hasPhoto ? (
          <img 
            src={prospect.avatarUrl || prospect.companyLogoUrl} 
            alt={prospect.fullName}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <User className="h-6 w-6 text-amber-600" />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="font-semibold">{prospect.fullName || 'Name not found'}</h3>
          <p className="text-sm text-muted-foreground">
            {prospect.jobTitle || 'Title not available'}
          </p>
          <p className="text-xs text-muted-foreground">
            {prospect.company || 'Company not found'}
          </p>
        </div>
      </div>
      
      {/* Contact Info with "Not found" states */}
      <div className="mt-4 space-y-2">
        {hasEmail ? (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-green-500" />
            <a href={`mailto:${prospect.email}`} className="text-green-600 hover:underline">
              {prospect.email}
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Email not found</span>
            <Button size="sm" variant="ghost" className="h-6 text-xs">
              Find Email
            </Button>
          </div>
        )}
        
        {hasLinkedIn ? (
          <div className="flex items-center gap-2 text-sm">
            <ExternalLink className="h-4 w-4 text-blue-500" />
            <a href={prospect.linkedinUrl} target="_blank" className="text-blue-600 hover:underline">
              View LinkedIn
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <span>LinkedIn not found</span>
          </div>
        )}
      </div>
      
      {/* Loading skeleton for pending enrichments */}
      {prospect.enrichmentStatus === 'pending' && (
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      )}
    </Card>
  )
}
```

---

## 6. Stripe Billing Implementation

### **Database Schema:**
```sql
-- Add to existing users table
ALTER TABLE auth.users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE auth.users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE auth.users ADD COLUMN plan TEXT DEFAULT 'trial'; -- trial, starter, growth, enterprise
ALTER TABLE auth.users ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE auth.users ADD COLUMN tokens_remaining INTEGER DEFAULT 25; -- For usage tracking
```

### **Stripe Webhook Handler:**
```typescript
// app/api/stripe/webhook/route.ts

import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 })
  }
  
  const supabase = await createClient()
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('users')
        .update({
          stripe_subscription_id: subscription.id,
          plan: subscription.items.data[0].price.lookup_key, // 'starter', 'growth', etc.
          tokens_remaining: getPlanTokens(subscription.items.data[0].price.lookup_key)
        })
        .eq('stripe_customer_id', subscription.customer as string)
      break
      
    case 'customer.subscription.deleted':
      const deletedSub = event.data.object as Stripe.Subscription
      await supabase
        .from('users')
        .update({
          plan: 'free',
          tokens_remaining: 0
        })
        .eq('stripe_customer_id', deletedSub.customer as string)
      break
  }
  
  return Response.json({ received: true })
}

function getPlanTokens(plan: string): number {
  const limits = {
    'starter': 200,
    'growth': 1000,
    'enterprise': 999999
  }
  return limits[plan as keyof typeof limits] || 0
}
```

---

**Continue to Part 2 for Auth Permissions & Full Integration...**


