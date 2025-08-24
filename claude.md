# HermesAI Product Requirements Document

## Transforming Morphic.sh into a Cold Email Prospect Research and Outreach Platform

### Executive Summary

HermesAI transforms the Morphic.sh AI search template into a comprehensive B2B cold email platform that combines Exa.ai's powerful Websets API for prospect research with modern email automation capabilities. This PRD provides detailed specifications for building a production-ready SaaS platform that enables sales teams to discover, enrich, and engage prospects at scale while ensuring exceptional deliverability and compliance.

## 1. Architecture Transformation Strategy

### From Morphic to HermesAI

#### Reusable Components from Morphic.sh
- **Next.js 15 App Router** structure with React Server Components
- **Vercel AI SDK** for AI-powered email generation (replacing search functionality)
- **Supabase authentication** system with email/Google OAuth
- **shadcn/ui component library** for rapid UI development
- **TypeScript** foundation for type safety across the stack

#### Major Architectural Changes

**Replace Search with Email Campaign Focus:**
```typescript
// Transform Morphic's search interface
// FROM: components/search-interface.tsx
interface SearchQuery {
  query: string;
  searchType: 'neural' | 'keyword';
}

// TO: components/campaign-builder.tsx
interface CampaignBuilder {
  prospectCriteria: ProspectSearchCriteria;
  emailSequence: EmailSequence[];
  settings: CampaignSettings;
}
```

**Component Modifications:**
- Replace `tool-section.tsx` with email campaign tools
- Transform `message.tsx` into email preview component
- Create new components: ProspectTable, EmailEditor, CampaignFlow

## 2. Exa.ai Websets Integration

### API Implementation Architecture

```typescript
// lib/exa/websets-client.ts
import { Exa } from 'exa-js';

export class WebsetsClient {
  private exa: Exa;
  
  constructor(apiKey: string) {
    this.exa = new Exa(apiKey);
  }

  async searchProspects(criteria: ProspectCriteria) {
    const webset = await this.exa.websets.create({
      search: {
        query: criteria.naturalLanguageQuery,
        count: criteria.limit || 500
      },
      enrichments: [
        { format: "text", name: "email", type: "email" },
        { format: "text", name: "linkedin", type: "text" },
        { format: "text", name: "company_info", type: "text" }
      ]
    });
    
    return this.processWebsetResults(webset);
  }
}
```

### Pricing Integration
- **Pro Plan ($449/month)** recommended for production
- 100,000 credits/month = ~10,000 enriched prospects
- Implement credit tracking and usage alerts

## 3. Database Schema Design

### Core Tables (PostgreSQL + Prisma)

```prisma
// prisma/schema.prisma

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  role          UserRole @default(USER)
  organizations Organization[]
  createdAt     DateTime @default(now())
}

model Campaign {
  id              String   @id @default(cuid())
  name            String
  organizationId  String
  status          CampaignStatus @default(DRAFT)
  prospectQuery   Json
  emailSequence   EmailSequence[]
  prospects       CampaignProspect[]
  analytics       CampaignAnalytics?
  createdAt       DateTime @default(now())
}

model Prospect {
  id              String   @id @default(cuid())
  email           String   @unique
  firstName       String?
  lastName        String?
  company         String?
  jobTitle        String?
  linkedinUrl     String?
  enrichedData    Json?
  verificationStatus EmailStatus @default(UNVERIFIED)
  campaigns       CampaignProspect[]
  interactions    Interaction[]
}

model EmailSequence {
  id          String   @id @default(cuid())
  campaignId  String
  stepNumber  Int
  subject     String
  body        String
  delayDays   Int      @default(0)
  campaign    Campaign @relation(fields: [campaignId], references: [id])
}

model Interaction {
  id          String   @id @default(cuid())
  prospectId  String
  campaignId  String
  type        InteractionType // SENT, OPENED, CLICKED, REPLIED
  timestamp   DateTime @default(now())
  metadata    Json?
}
```

## 4. UI/UX Specifications

### Campaign Builder Interface

```typescript
// app/campaigns/builder/page.tsx
export default function CampaignBuilder() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Panel: Prospect Search */}
      <div className="col-span-4">
        <ProspectSearchPanel />
      </div>
      
      {/* Center: Email Sequence Builder */}
      <div className="col-span-5">
        <EmailSequenceBuilder />
      </div>
      
      {/* Right: Preview & Settings */}
      <div className="col-span-3">
        <CampaignPreview />
      </div>
    </div>
  );
}
```

### Progressive Form Flow
1. **Campaign Setup** → Basic settings and goals
2. **Prospect Discovery** → Natural language Exa search
3. **Email Creation** → AI-powered templates
4. **Review & Launch** → Deliverability checks

## 5. Technical Implementation Specifications

### Backend Architecture

```typescript
// app/api/campaigns/route.ts
import { BullMQ } from 'bullmq';
import { WebsetsClient } from '@/lib/exa/websets-client';

const prospectQueue = new Queue('prospect-enrichment', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
});

export async function POST(request: Request) {
  const { prospectCriteria, campaignId } = await request.json();
  
  // Queue prospect enrichment job
  await prospectQueue.add('enrich-prospects', {
    criteria: prospectCriteria,
    campaignId,
    enrichmentServices: ['exa', 'email-verification']
  });
  
  return NextResponse.json({ status: 'processing' });
}
```

### Real-time Progress Tracking

```typescript
// app/api/campaigns/[id]/progress/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const job = await prospectQueue.getJob(campaignId);
      
      job.on('progress', (progress) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
        );
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });
}
```

## 6. Email Generation and Sending

### AI-Powered Personalization

```typescript
// lib/ai/email-generator.ts
import { openai } from '@vercel/ai';

export async function generatePersonalizedEmail({
  template,
  prospect,
  campaignContext
}: EmailGenerationParams) {
  const prompt = `
    Generate a personalized cold email for:
    Company: ${prospect.company}
    Role: ${prospect.jobTitle}
    Recent News: ${prospect.enrichedData.recentNews}
    
    Template: ${template}
    Tone: ${campaignContext.tone}
  `;
  
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });
  
  return response.choices[0].message.content;
}
```

### Gmail Integration

```typescript
// lib/gmail/client.ts
import { google } from 'googleapis';

export class GmailClient {
  private gmail: any;
  
  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
  }
  
  async sendEmail({ to, subject, body, threadId }: EmailParams) {
    const message = this.createMessage({ to, subject, body });
    
    return await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: message,
        threadId
      }
    });
  }
}
```

## 7. Analytics and Reporting

### Real-time Dashboard Components

```typescript
// components/analytics/campaign-dashboard.tsx
export function CampaignDashboard({ campaignId }: Props) {
  const { data: metrics } = useCampaignMetrics(campaignId);
  
  return (
    <div className="grid grid-cols-4 gap-6">
      <MetricCard
        title="Delivery Rate"
        value={metrics.deliveryRate}
        trend={metrics.deliveryTrend}
      />
      <MetricCard
        title="Open Rate"
        value={metrics.openRate}
        benchmark={25.3} // Industry average
      />
      <MetricCard
        title="Reply Rate"
        value={metrics.replyRate}
        target={metrics.replyTarget}
      />
      <MetricCard
        title="Meetings Booked"
        value={metrics.meetingsBooked}
        revenue={metrics.estimatedRevenue}
      />
    </div>
  );
}
```

## 8. Development Roadmap

### Phase 1: MVP (Months 1-3)
- ✅ Transform Morphic.sh base template
- ✅ Implement Exa Websets integration
- ✅ Basic campaign builder UI
- ✅ Gmail OAuth integration
- ✅ Simple email sequences
- ✅ Core analytics

### Phase 2: Enhanced Features (Months 4-6)
- 🔄 AI email personalization
- 🔄 A/B testing framework
- 🔄 Advanced analytics
- 🔄 Team collaboration
- 🔄 CRM integrations

### Phase 3: Scale & Enterprise (Months 7-12)
- 📋 White-label options
- 📋 Advanced automation
- 📋 Multi-channel outreach
- 📋 Enterprise security (SOC 2)

## 9. Pricing and Monetization

### Recommended Tiers

```typescript
// config/pricing.ts
export const PRICING_TIERS = {
  starter: {
    price: 49,
    prospects: 1000,
    emails: 5000,
    seats: 1,
    features: ['basic_templates', 'gmail_integration']
  },
  professional: {
    price: 149,
    prospects: 5000,
    emails: 25000,
    seats: 5,
    features: ['ai_personalization', 'a_b_testing', 'api_access']
  },
  enterprise: {
    price: 'custom',
    prospects: 'unlimited',
    emails: 'unlimited',
    seats: 'unlimited',
    features: ['white_label', 'dedicated_support', 'custom_integrations']
  }
};
```

## 10. Deployment Configuration

### Vercel Deployment

```json
// vercel.json
{
  "env": {
    "DATABASE_URL": "@database-url",
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key",
    "EXA_API_KEY": "@exa-api-key",
    "OPENAI_API_KEY": "@openai-api-key",
    "GOOGLE_CLIENT_ID": "@google-client-id",
    "GOOGLE_CLIENT_SECRET": "@google-client-secret",
    "REDIS_URL": "@redis-url"
  },
  "crons": [
    {
      "path": "/api/cron/email-warmup",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/campaign-analytics",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Environment Variables

```bash
# .env.local
# Existing Morphic variables
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# New HermesAI variables
EXA_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=postgresql://
REDIS_URL=redis://
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_WARMUP_ENABLED=true
```

## 11. Build Instructions for Developers

### Initial Setup

```bash
# Clone and setup
git clone https://github.com/miurla/morphic
cd morphic
npm install

# Install additional dependencies
npm install @exa/sdk bullmq @prisma/client googleapis stripe

# Setup database
npx prisma init
npx prisma migrate dev

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Key Modifications

1. **Replace Search Components**
   - Remove `components/search-*` files
   - Add `components/campaign-builder/*`
   - Update `app/page.tsx` to show campaign dashboard

2. **Update API Routes**
   - Replace `/api/search` with `/api/campaigns`
   - Add `/api/prospects`, `/api/emails` endpoints
   - Implement webhook handlers for email events

3. **Database Integration**
   - Replace in-memory storage with Prisma/PostgreSQL
   - Add migration scripts for schema
   - Implement connection pooling

### Testing Strategy

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Deliverability tests
npm run test:deliverability
```

## Conclusion

This PRD provides a comprehensive blueprint for transforming Morphic.sh into HermesAI, a powerful cold email platform. By leveraging Morphic's solid foundation and integrating Exa.ai's advanced prospect research capabilities, developers can build a competitive SaaS product that addresses the critical needs of modern B2B sales teams.

The key to success lies in maintaining laser focus on email deliverability, providing an intuitive user experience, and ensuring compliance with evolving regulations. Following this PRD and the included specifications will result in a platform capable of competing with established players while offering unique advantages in AI-powered personalization and data quality.