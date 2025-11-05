# HermesAI - AI-Powered Outbound Prospecting Engine

HermesAI is an intelligent prospecting platform that helps you find, enrich, and engage with your ideal customers using natural language and AI.

## 🚀 What It Does

Users describe their ideal prospects in plain English, and HermesAI:
1. **Extracts criteria** (location, industry, company type, decision maker roles)
2. **Finds prospects** via Exa Websets API
3. **Enriches contacts** with email, LinkedIn, phone from Apollo/Hunter
4. **Drafts personalized emails** using AI and prospect context
5. **Sends via Gmail** with tracking and analytics

### Example Workflow

```
Input: "Find 20 Boston-area education nonprofits that partner with summer programs"

↓

AI extracts:
- Location: Boston area
- Industry: Education
- Company Type: Nonprofit
- Focus: Summer program partnerships

↓

Search runs → Prospects found → Emails drafted → Ready to send!
```

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **UI:** Radix UI + shadcn/ui + Tailwind CSS
- **Database:** Supabase (PostgreSQL with Row-Level Security)
- **Authentication:** Supabase Auth (Email/Password + Google OAuth)
- **AI/LLM:** Vercel AI SDK v5 (OpenAI GPT-4o-mini, Anthropic Claude)
- **Search:** Exa Websets API (prospect discovery)
- **Enrichment:** Apollo.io, Hunter.io (contact data)
- **Email:** Gmail API (OAuth integration)
- **Rate Limiting:** Upstash Redis (optional but recommended)
- **Animations:** Framer Motion
- **Deployment:** Vercel-ready

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ or Bun 1.2.12+
- A Supabase account (free tier works)
- OpenAI API key
- Exa API key
- Google Cloud Console project (for Gmail OAuth)
- (Optional) Upstash Redis account for rate limiting
- (Optional) Apollo.io and Hunter.io API keys for enrichment

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd hermesAI
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using Bun (recommended):
```bash
bun install
```

### 3. Set Up Supabase

#### a. Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your **Project URL** and **Anon Key** from Settings → API

#### b. Run Database Migrations

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link your project
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push
```

Or manually run the SQL migrations in the `supabase/migrations/` directory through the Supabase dashboard.

### 4. Set Up Google OAuth (for Gmail Integration)

#### a. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Gmail API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Save your **Client ID** and **Client Secret**

#### b. Configure Supabase Auth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google Client ID and Client Secret
4. Add scopes: `https://www.googleapis.com/auth/gmail.send`, `https://www.googleapis.com/auth/gmail.compose`

### 5. Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Models
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key  # Optional

# Prospect Research
EXA_API_KEY=your-exa-api-key

# Email Enrichment (Optional)
APOLLO_API_KEY=your-apollo-key
HUNTER_API_KEY=your-hunter-key

# Google OAuth
GMAIL_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-google-client-secret

# Rate Limiting (Optional but recommended)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run the Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Core Features

### ✅ Implemented Features

- **Natural Language Search:** Describe prospects in plain English
- **AI Criteria Extraction:** Automatically parse search intent
- **Exa Websets Integration:** High-quality prospect discovery
- **Interactive Search Builder:** Refine criteria before searching
- **Real-time Progress Tracking:** See results as they're found
- **Prospect Grid View:** Cards with quality scores and enriched data
- **Email Template Generation:** AI-powered personalization with GPT-4o-mini
- **4-Email Sequences:** Initial + 3 follow-ups with delay scheduling
- **Gmail Integration:** OAuth flow + send/draft capabilities
- **Campaign Management:** Save and track campaigns
- **Email Preview:** Review emails before sending
- **Rate Limiting:** Protect APIs with configurable limits
- **Analytics Dashboard:** Track opens, clicks, replies (infrastructure ready)

### 🚧 Coming Soon

- Stripe billing integration (webhook setup complete)
- Advanced analytics and reporting
- CSV import/export
- Email scheduling and warm-up logic
- Webhook processing for delivery events
- CRM integrations (Salesforce, HubSpot)

## 📚 API Routes

### Prospect Search
- `POST /api/prospect-search` - Create new search
- `POST /api/prospect-search/execute` - Execute search
- `GET /api/prospect-search/status` - Poll search progress

### Email Generation
- `POST /api/email/generate` - Generate AI email templates
- `POST /api/email/create-draft` - Save draft to database

### Gmail Integration
- `POST /api/gmail/send` - Send email via Gmail
- `POST /api/gmail/draft` - Create Gmail draft

### Campaigns
- `GET /api/campaigns` - List user campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/[id]` - Get campaign details

## 🔐 Security

- **Row-Level Security (RLS):** All Supabase tables protected
- **User Isolation:** Users only see their own data
- **Rate Limiting:** Configurable per endpoint
- **OAuth Tokens:** Securely stored and refreshed
- **Environment Variables:** Secrets never committed to repo

### Rate Limits (Default)

- Prospect Search: 5 searches/hour
- Email Generation: 10 requests/minute
- Email Sending: 100 emails/day (trial), 500/day (paid)

## 📊 Database Schema

Key tables:
- `campaigns` - Campaign configurations and search criteria
- `prospects` - Found prospects with enriched data
- `draft_emails` - Email templates and instances
- `email_analytics` - Event tracking (opens, clicks, replies)
- `gmail_credentials` - OAuth token storage
- `subscriptions` - User plans and quotas

All tables include automatic timestamps and RLS policies.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy!

Vercel will automatically:
- Build the Next.js app
- Set up serverless functions
- Configure CDN and edge network
- Enable automatic deployments on push

### Environment Variables for Production

Ensure you set all required environment variables in Vercel dashboard:
- Add production Supabase credentials
- Add production Google OAuth redirect URI
- Enable Redis for production rate limiting

## 🧪 Testing

Run the development server and test the workflow:

1. **Sign up/Login** → Create account or use Google OAuth
2. **Search for Prospects** → Type natural language query
3. **Review Results** → See enriched prospect cards
4. **Generate Emails** → AI creates personalized templates
5. **Preview & Send** → Review before sending via Gmail

## 🐛 Troubleshooting

### Gmail OAuth Not Working
- Check redirect URI matches exactly in Google Cloud Console
- Ensure Gmail API is enabled
- Verify scopes in Supabase Auth provider settings

### Rate Limiting Errors
- If Redis not configured, rate limits are disabled (development only)
- Add Upstash Redis credentials for production

### Prospect Search Fails
- Verify Exa API key is valid
- Check API quota hasn't been exceeded
- Review logs for detailed error messages

### Email Generation Slow
- Using GPT-4o-mini (fast model) by default
- Check OpenAI API quota and rate limits
- Consider caching common templates

## 📖 Documentation

- [Exa Websets API Docs](https://docs.exa.ai/reference/websets)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Gmail API Docs](https://developers.google.com/gmail/api)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Apache-2.0

## 🆘 Support

For issues, questions, or feature requests:
- Create an issue on GitHub
- Check existing issues for solutions
- Review troubleshooting guide above

---

**Built with ❤️ using Next.js, Vercel AI SDK, and Supabase**
