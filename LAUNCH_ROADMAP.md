# 🚀 HermesAI Launch Roadmap

## 🔴 CRITICAL BLOCKERS (Days 1-2)

### Breaking Errors
- [x] ~~Fix Node.js version (18.17.0 → 20.x)~~ - User confirmed `nvm use 20` works
- [ ] Fix model IDs in models.json (gpt-4.1 → gpt-4o, o3-mini → o1-mini, etc.)
- [ ] Verify build passes with correct Node version
- [ ] Test all AI providers with correct model IDs

### Security Vulnerabilities
- [ ] **CRITICAL**: Encrypt OAuth tokens in gmail_credentials table
  - [ ] Implement pgcrypto or Supabase Vault
  - [ ] Migrate existing tokens to encrypted format
  - [ ] Update insert/select queries to use encryption
- [ ] **CRITICAL**: Implement rate limiting (Upstash Redis)
  - [ ] Chat API: 10 requests/minute per user
  - [ ] Prospect Search: 5 searches/hour per user
  - [ ] Email sending: 100 emails/day (trial), 500/day (paid)
- [ ] **HIGH**: Add input validation
  - [ ] Validate targetCount (1-100 max)
  - [ ] Sanitize email addresses
  - [ ] Validate URL inputs
- [ ] **HIGH**: Add API key validation
  - [ ] Runtime checks for required env vars
  - [ ] Graceful degradation if keys missing
  - [ ] User-facing error messages

### Cost Protection
- [ ] Implement quota tracking system
  - [ ] Track Exa API usage per user
  - [ ] Track OpenAI API usage per user
  - [ ] Show cost estimate before search
  - [ ] Hard limits per plan (trial: 200 prospects/month)
- [ ] Add usage dashboard for admins

---

## 🟡 HIGH PRIORITY (Days 3-5)

### Email Generation & Sending (Complete MVP Flow)
- [ ] Verify email generation logic exists and works
- [ ] Implement email personalization engine
  - [ ] Extract key prospect data points
  - [ ] Generate value prop based on company context
  - [ ] A/B test subject lines
- [ ] Build email template system
  - [ ] Default templates (cold outreach, follow-up, etc.)
  - [ ] Variable interpolation {{firstName}}, {{company}}
  - [ ] Template preview UI
- [ ] Implement Gmail batch sending
  - [ ] Job queue with Inngest or QStash
  - [ ] Rate limiting (avoid Gmail spam filters)
  - [ ] Error handling + retry logic
  - [ ] Track send status in database
- [ ] Email warm-up scheduler
  - [ ] Gradual sending volume increase
  - [ ] Monitor bounce rates
  - [ ] Auto-pause if deliverability drops

### Error Handling & Monitoring
- [ ] Add error boundaries to critical components
  - [ ] Chat interface
  - [ ] Prospect search
  - [ ] Email drafter
- [ ] Implement Sentry error tracking
- [ ] Add fallback UI states
  - [ ] Failed searches
  - [ ] API errors
  - [ ] Network timeouts
- [ ] Add loading skeletons
  - [ ] Prospect grid
  - [ ] Email preview
  - [ ] Analytics dashboard

---

## 🎨 UI/UX TRANSFORMATION (Days 6-10)

### Glassmorphism & Spatial Depth
- [ ] **Cards with frosted glass effect**
  - [ ] backdrop-filter: blur(10px)
  - [ ] Semi-transparent backgrounds
  - [ ] Subtle border gradients
  - [ ] Apply to: ProspectCard, CampaignBuilder, EmailDrafter
- [ ] **Layered UI with depth**
  - [ ] Z-index hierarchy (background → mid → foreground)
  - [ ] Shadow elevation system (sm, md, lg, xl)
  - [ ] Parallax scrolling on homepage
- [ ] **3D micro-interactions**
  - [ ] Card hover: lift + rotate
  - [ ] Button press: scale(0.98)
  - [ ] Icon hover: spin/bounce
  - [ ] Smooth spring animations (Framer Motion)

### AI Copilot Patterns
- [ ] **Floating assistant bubble**
  - [ ] Fixed bottom-right position
  - [ ] Expandable chat interface
  - [ ] Context-aware suggestions
  - [ ] "Ask Hermes" quick actions
- [ ] **Inline suggestions**
  - [ ] Auto-complete for prospect criteria
  - [ ] Suggested enrichments based on query
  - [ ] Email template suggestions
- [ ] **Voice input**
  - [ ] Web Speech API integration
  - [ ] Voice → text for searches
  - [ ] Microphone button in search bar
  - [ ] Visual feedback while listening

### Data Visualization
- [ ] **Prospect quality score**
  - [ ] Calculate score based on:
    - Email deliverability (verified vs unverified)
    - LinkedIn presence
    - Recent activity
    - Company size/funding
  - [ ] Display as /100 with color coding
  - [ ] Radial progress component
- [ ] **Company distribution charts**
  - [ ] Industry pie chart (Recharts/Tremor)
  - [ ] Company size bar chart
  - [ ] Location map (Mapbox GL)
  - [ ] Technology stack word cloud
- [ ] **Email deliverability prediction**
  - [ ] ML model or heuristics
  - [ ] Spam score estimation
  - [ ] Bounce rate prediction
  - [ ] Visual gauge component

### Onboarding Experience
- [ ] **Interactive tutorial**
  - [ ] Step 1: Connect Gmail
  - [ ] Step 2: Describe ideal prospect
  - [ ] Step 3: Review search results
  - [ ] Step 4: Draft first email
  - [ ] Step 5: Send campaign
  - [ ] Progress tracker + skip option
- [ ] **Success stories**
  - [ ] Customer testimonials section
  - [ ] Case study cards with metrics
  - [ ] Video testimonials
  - [ ] "How X company got Y results" format
- [ ] **Gmail connection prompt**
  - [ ] Modal on first login
  - [ ] Benefits explanation
  - [ ] One-click OAuth flow
  - [ ] Fallback: "Skip for now" (limited features)

### Branding & Copy Improvements
- [ ] **Hero section redesign**
  - [ ] Compelling headline
  - [ ] Clear value prop
  - [ ] Animated demo/video
  - [ ] Social proof (logos, metrics)
- [ ] **Microcopy polish**
  - [ ] Empty states: helpful, not generic
  - [ ] Error messages: actionable, not technical
  - [ ] CTAs: specific, not "Submit"
  - [ ] Tooltips: educate, don't assume knowledge
- [ ] **Color system refresh**
  - [ ] Primary: Bold but professional
  - [ ] Accent: High contrast for CTAs
  - [ ] Surface: Glassmorphic grays
  - [ ] Success/Error: Clear visual feedback

---

## 🟢 POLISH & LAUNCH PREP (Days 11-14)

### Mobile Responsiveness
- [ ] Fix prospect cards on mobile
  - [ ] Stack vertically
  - [ ] Larger touch targets
  - [ ] Swipeable actions
- [ ] Optimize sidebar for mobile
  - [ ] Drawer that slides from left
  - [ ] Touch-friendly navigation
- [ ] Responsive input fields
  - [ ] Auto-zoom on focus (prevent zoom)
  - [ ] Mobile keyboard optimization
- [ ] Test on real devices
  - [ ] iPhone (Safari)
  - [ ] Android (Chrome)
  - [ ] Tablet (iPad)

### Performance Optimization
- [ ] Bundle size reduction
  - [ ] Code splitting for routes
  - [ ] Lazy load heavy components
  - [ ] Tree-shake unused Radix components
- [ ] Image optimization
  - [ ] Next.js Image component everywhere
  - [ ] WebP format with fallbacks
  - [ ] Lazy loading below fold
- [ ] Database query optimization
  - [ ] Add missing indexes
  - [ ] Paginate large result sets
  - [ ] Cache frequent queries (Vercel KV)
- [ ] React performance
  - [ ] Memo expensive components
  - [ ] Virtualize long lists (react-window)
  - [ ] Debounce search inputs

### Testing & QA
- [ ] Manual testing checklist
  - [ ] Full user flow (signup → campaign → email sent)
  - [ ] Error scenarios (no Gmail, failed search, etc.)
  - [ ] Edge cases (0 prospects, 1000 prospects)
  - [ ] Cross-browser testing
- [ ] Beta user testing
  - [ ] 10 external testers
  - [ ] Collect feedback (Typeform survey)
  - [ ] Track key metrics (activation, retention)
- [ ] Load testing
  - [ ] 100 concurrent users
  - [ ] Database connection pooling
  - [ ] API rate limit verification

### Launch Infrastructure
- [ ] Set up CI/CD
  - [ ] GitHub Actions workflow
  - [ ] Automated tests on PR
  - [ ] Deploy preview on Vercel
- [ ] Configure production env vars
  - [ ] Vercel project settings
  - [ ] Supabase production project
  - [ ] Stripe live keys
- [ ] Set up monitoring
  - [ ] Sentry error tracking
  - [ ] Vercel Analytics
  - [ ] PostHog product analytics
  - [ ] Custom metrics dashboard
- [ ] Create runbook
  - [ ] Incident response plan
  - [ ] Common issues + fixes
  - [ ] Escalation procedures

---

## 🚀 LAUNCH (Day 15+)

### Pre-Launch
- [ ] Waitlist email campaign
- [ ] Social media announcements
- [ ] Product Hunt submission prep
- [ ] Press kit (screenshots, copy, logos)

### Launch Day
- [ ] Deploy to production
- [ ] Monitor errors in real-time
- [ ] Customer support standby
- [ ] Track key metrics (signups, campaigns, emails sent)

### Post-Launch (Week 1)
- [ ] Daily standups
- [ ] Hot fixes for critical bugs
- [ ] User feedback collection
- [ ] Iterate on top pain points

---

## 📊 SUCCESS METRICS

### Week 1 Goals
- [ ] 100 signups
- [ ] 50 active campaigns
- [ ] 1,000 emails sent
- [ ] 20% activation rate (signup → first campaign)
- [ ] < 1% error rate

### Month 1 Goals
- [ ] 500 signups
- [ ] 50 paying customers ($100/mo each = $5k MRR)
- [ ] 10,000 prospects discovered
- [ ] 50,000 emails sent
- [ ] 30% activation rate
- [ ] 10% conversion to paid

---

## 🛠️ TECHNICAL DEBT (Post-MVP)

### Deferred Features
- [ ] LinkedIn automation
- [ ] CRM integrations
- [ ] Team collaboration
- [ ] Advanced A/B testing
- [ ] Email warm-up automation
- [ ] Webhook management UI
- [ ] API for external integrations

### Code Quality
- [ ] Add unit tests (Jest)
- [ ] Add integration tests (Playwright)
- [ ] Reduce 'any' types (type safety)
- [ ] Remove @ts-ignore comments
- [ ] Document complex functions
- [ ] Refactor god components

---

## 📝 DAILY EXECUTION LOG

### Day 1 (Today)
- [x] Create comprehensive roadmap
- [ ] Fix breaking errors (model IDs)
- [ ] Implement rate limiting
- [ ] Start glassmorphism UI updates

### Day 2
- [ ] Encrypt OAuth tokens
- [ ] Complete security hardening
- [ ] Add error boundaries

### Day 3-4
- [ ] Email generation polish
- [ ] Gmail sending implementation
- [ ] Job queue setup

### Day 5-7
- [ ] UI/UX transformation (glassmorphism)
- [ ] AI copilot assistant
- [ ] Data visualization

### Day 8-10
- [ ] Onboarding flow
- [ ] Mobile responsive fixes
- [ ] Performance optimization

### Day 11-14
- [ ] Beta testing
- [ ] Bug fixes
- [ ] Launch prep

### Day 15
- [ ] 🚀 LAUNCH!

---

_Last Updated: [Auto-generated timestamp]_
_Progress: 35% → 100% (15 days)_
