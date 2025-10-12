# 🚀 Implementation Plan - Priority Order

**Created:** September 30, 2025  
**Goal:** Get HermesAI to production-ready MVP

---

## ✅ PHASE 1: Fix Breaking Stuff (Today - 4 hours)

### 1.1 Faster Polling (30 min)
- [ ] Change poll interval from 2s → 500ms
- [ ] File: `components/prospect-search-section.tsx`
- [ ] Test: Search completes 4x faster

### 1.2 Better Error States (1 hour)
- [ ] Add "Email not found" with "Find Email" button
- [ ] Add user avatar placeholder (initials)
- [ ] Add loading skeletons for pending enrichments
- [ ] File: `components/prospect-card.tsx`

### 1.3 Context-Aware Enrichments (1.5 hours)
- [ ] Create `lib/agents/enrichment-strategy.ts`
- [ ] Update `lib/tools/prospect-search.ts` to use offer/pitch
- [ ] Add `offer` and `targetPersona` to schema
- [ ] Test: Enrichments change based on use case

### 1.4 Parallel Processing (1 hour)
- [ ] Update `app/api/prospect-search/execute/route.ts`
- [ ] Use `Promise.all()` instead of sequential loops
- [ ] Test: 100 prospects process in 5s instead of 50s

---

## ✅ PHASE 2: Core Workflow (Tomorrow - 6 hours)

### 2.1 Template Marketplace (2 hours)
- [ ] Database migration: `campaign_templates` table
- [ ] Seed 10 templates (recruiting, partnerships, sales)
- [ ] Create `components/template-marketplace.tsx`
- [ ] API: `app/api/templates/route.ts`
- [ ] Test: Select template → pre-fills search

### 2.2 CSV Upload (2 hours)
- [ ] Database migration: `csv_uploads` + `csv_prospects` tables
- [ ] API: `app/api/csv/upload/route.ts`
- [ ] API: `app/api/csv/enrich/route.ts`
- [ ] Component: `components/csv-upload.tsx`
- [ ] Test: Upload 100 companies → enrich via Exa

### 2.3 Stripe Billing (2 hours)
- [ ] Add Stripe fields to users table
- [ ] Webhook handler: `app/api/stripe/webhook/route.ts`
- [ ] Checkout flow: `app/api/stripe/checkout/route.ts`
- [ ] Customer portal: Link in settings
- [ ] Test: Subscribe → tokens update

---

## ✅ PHASE 3: Email Generation (Day 3 - 4 hours)

### 3.1 Implement Email Drafter (3 hours)
- [ ] Update `lib/tools/email-drafter.ts`
- [ ] Use `generateText` with prospect context
- [ ] Create template system (3-5 templates)
- [ ] Add personalization variables
- [ ] Test: Draft 10 emails with context

### 3.2 Email Preview UI (1 hour)
- [ ] Component: `components/email-preview.tsx`
- [ ] Show personalization highlights
- [ ] Edit/regenerate buttons
- [ ] Test: Preview looks professional

---

## ✅ PHASE 4: Polish & Launch (Day 4-5 - 8 hours)

### 4.1 WebSocket Streaming (2 hours)
- [ ] API: `app/api/prospect-search/stream/route.ts` (SSE)
- [ ] Update client to use EventSource
- [ ] Test: Prospects appear in real-time

### 4.2 Auth Permissions (1 hour)
- [ ] Use Supabase RLS for Gmail access check
- [ ] Prompt to connect Gmail if not connected
- [ ] Graceful degradation (draft but can't send)

### 4.3 Error Boundaries (1 hour)
- [ ] Wrap ProspectSearchSection
- [ ] Wrap InteractiveEmailDrafter
- [ ] Show friendly error messages

### 4.4 Mobile Responsive (2 hours)
- [ ] Fix prospect cards on mobile
- [ ] Drawer sidebar for mobile nav
- [ ] Touch-friendly buttons

### 4.5 Final Testing (2 hours)
- [ ] End-to-end user flow
- [ ] Edge cases (0 results, API failures)
- [ ] Cross-browser testing

---

## 📊 Success Criteria

### Must Have (MVP)
- ✅ Search works in <30 seconds
- ✅ Enrichments are contextual
- ✅ Email generation works
- ✅ Billing/subscriptions work
- ✅ No breaking errors

### Nice to Have (Post-MVP)
- WebSocket streaming
- CSV upload with >1000 rows
- Template marketplace with ratings
- A/B testing for emails

---

## 🎯 Answers to Your Questions

### Q: What is `successRate` param?
**A:** Exa's confidence threshold (50-95%). Higher = fewer but better results.
- Job titles: 90% (easy to verify)
- Industry: 85% (fairly confident)
- Activities: 70% (subjective)

### Q: Can we poll faster?
**A:** YES! We can go 500ms (4x faster) or use SSE/WebSocket (10x faster).

### Q: Can we create webset with prospects and enrich?
**A:** YES! For CSV upload:
1. User uploads CSV of companies
2. We create Exa webset with those companies
3. Exa enriches them all
4. We match results back to CSV rows

### Q: Why enrichments are dumb?
**A:** Currently hardcoded. Solution: Use GPT-5 to generate enrichments based on:
- What you're offering
- Target persona
- Use case (recruiting vs partnerships vs sales)

### Q: Auth for drafting - Supabase or separate?
**A:** **Use Supabase!**
- Gmail OAuth tokens stored in `gmail_credentials` table
- RLS policy: `auth.uid() = user_id`
- Check before drafting: `SELECT * FROM gmail_credentials WHERE user_id = auth.uid()`
- If none → show "Connect Gmail" button

### Q: How to make UI fire?
**A:** 
1. ✅ Add placeholders for missing data
2. ✅ Faster polling (500ms)
3. ✅ Loading skeletons during enrichment
4. ✅ Smooth animations (already using Framer Motion)
5. ✅ Error states with actions ("Find Email" button)

---

## 🚀 Let's Start!

I'll implement in this order:
1. **Faster polling** (quick win)
2. **Better error states** (UX improvement)
3. **Context-aware enrichments** (core value prop)
4. **Parallel processing** (10x performance)

Then tomorrow:
5. **Template marketplace**
6. **CSV upload**
7. **Stripe billing**
8. **Email generation**

Ready? Let me start implementing! 🔥


