# HermesAI: Prospecting & Outreach Engine - Implementation Plan

This document outlines the step-by-step plan to transform the existing AI chat boilerplate into a powerful, automated sales prospecting and outreach tool. We will build this iteratively, with clear verification steps to ensure each component is working correctly before moving to the next.

---

## Phase 1: Core Prospecting Engine

**Goal:** Implement the backend logic and UI to find prospects using Exa Websets and display them in a real-time grid.

### Step 1.1: Database Schema for Campaigns

**Objective:** Create the necessary database tables to store campaign data.

**Files to Create:**
*   `supabase/migrations/YYYYMMDDHHMMSS_create_campaign_schema.sql`

**Implementation:**
*   Write a SQL migration to create three tables:
    *   `campaigns`: To store high-level campaign details (`id`, `user_id`, `created_at`, `prompt`, `status`).
    *   `prospects`: To store found prospects (`id`, `campaign_id`, `exa_item_id`, `properties` (jsonb), `enrichments` (jsonb)).
    *   `draft_emails`: To store generated emails (`id`, `prospect_id`, `subject`, `body`, `status`).

**Verification:**
1.  Run `supabase db reset` locally to apply the migration.
2.  Use the Supabase Studio (Table Editor) to confirm the `campaigns`, `prospects`, and `draft_emails` tables exist with the correct columns.
3.  Manually insert a row into each table to ensure there are no constraint violations.

### Step 1.2: Implement the Campaign Builder UI

**Objective:** Create the user-facing form to define and launch a new prospecting campaign.

**Files to Create/Modify:**
*   Create `components/campaign-builder.tsx`
*   Modify `app/page.tsx`

**Implementation:**
1.  Create the `CampaignBuilder` component exactly as you designed it, with state management for all inputs (query, entity type, enrichments, filters, count).
2.  Replace the content of `app/page.tsx` to render the `CampaignBuilder` component as the main feature of the home page.
3.  The `onCreateCampaign` prop will trigger the `startProspectSearch` action.

**Verification:**
1.  Run the app and navigate to the homepage.
2.  Verify the `CampaignBuilder` UI renders correctly with all toggles, inputs, and sliders.
3.  Interact with all form elements and check that their state updates correctly (e.g., using React DevTools).
4.  Clicking the "Start Search" button should trigger a console log or a placeholder action for now.

### Step 1.3: Enhance Exa to support Websets & Create the Agent

**Objective:** Create a new agent that uses an enhanced Exa tool to initiate a Webset search and stream UI updates.

**Files to Create/Modify:**
*   Create `lib/agents/prospect-researcher.ts`
*   Create `components/prospect-grid.tsx`
*   Modify `lib/actions/chat.ts` (or wherever the `createAI` actions are defined).

**Implementation:**
1.  Create the `prospect-researcher.ts` file. Implement the `prospectResearcher` function as you outlined. This will involve:
    *   Accepting structured `searchParams`.
    *   Calling `exa.websets.create(...)` with the structured query, criteria, and enrichments.
    *   Streaming initial status updates to the UI (`createStreamableUI`).
    *   Initiating the polling mechanism (`streamWebsetResults`) to check for results.
2.  Create the `ProspectGrid.tsx` component. This component will receive the list of `prospects` and render them in a grid using the `ProspectCard` sub-component. It must handle the `isComplete` state to show/hide the loading indicators.
3.  In `lib/actions/chat.ts`, define the `startProspectSearch` server action. This action will:
    *   Receive the `searchParams` from the `CampaignBuilder` UI.
    *   Initialize a `createStreamableUI` instance.
    *   Call the `prospectResearcher` agent function.
    *   Return the `streamableUI.value` as part of the AI message.

**Verification:**
1.  Fill out the `CampaignBuilder` form and click "Start Search".
2.  Check the browser's network tab to confirm the `startProspectSearch` action is called.
3.  In your terminal logs, confirm that the `prospect-researcher` is called and that it makes an API request to Exa's Webset endpoint.
4.  The UI should update in real-time, first showing "Creating intelligent search agents...", then "Finding prospects...", and finally rendering the `ProspectGrid` component.
5.  As the polling runs, new prospect cards should appear in the grid one by one, animated with `framer-motion`.

---

## Phase 2: Email Integration and Sending

**Goal:** Allow users to connect their Gmail account and send the generated emails.

### Step 2.1: Update Supabase Auth to Include Gmail Scopes

**Objective:** Modify the existing Google OAuth flow to request permissions for sending emails.

**Files to Modify:**
*   `lib/auth/get-current-user.ts` or wherever `signInWithOAuth` is called.
*   We'll also need a new table/column for the refresh token.

**Implementation:**
1.  Locate the `supabase.auth.signInWithOAuth` call for the 'google' provider.
2.  Add the `scopes` and `queryParams` to the options object as you defined:
    ```javascript
    options: {
      scopes: 'openid email profile https://www.googleapis.com/auth/gmail.send',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
    ```
3.  **Crucially**, we must also store the `provider_refresh_token`. Modify the `users` table in Supabase (or create a new `user_tokens` table) to store an encrypted version of the refresh token. After a user logs in, we'll need a server-side function to grab this token from the session and save it to our database.

**Verification:**
1.  Log out of the application.
2.  Log back in using the Google provider.
3.  You should be prompted by Google's consent screen to grant permission for "Send email on your behalf."
4.  After logging in, inspect the user's session data (e.g., via `supabase.auth.getSession()`) and confirm that `provider_token` and `provider_refresh_token` are present.
5.  Check your database to ensure the refresh token was saved correctly.

### Step 2.2: Create the "Generate Emails" and "Send Emails" Logic

**Objective:** Implement the functionality to draft and send emails for a completed campaign.

**Files to Create/Modify:**
*   Modify `lib/agents/prospect-researcher.ts`
*   Create `app/api/send-emails/route.ts`
*   Modify `components/prospect-grid.tsx`

**Implementation:**
1.  Add a "Generate Emails" button to the `ProspectGrid` component, which appears when `isComplete` is true.
2.  When clicked, this button will call a new server action (e.g., `generateEmailsForCampaign`).
3.  The `generateEmailsForCampaign` action will:
    *   Fetch all prospects for the campaign from the DB.
    *   For each prospect, call the LLM with their enriched data and the original pitch to generate a personalized subject and body.
    *   Save these drafts to the `draft_emails` table.
4.  Create the `/api/send-emails/route.ts` API route as you specified. This route will:
    *   Fetch the user's `access_token` (using the `refresh_token` to get a new one if necessary).
    *   Use the `googleapis` library to send the emails.
    *   Update the status of each email in the `draft_emails` table.

**Verification:**
1.  After a prospect search is complete, click the "Generate Emails" button.
2.  Check the database to confirm that the `draft_emails` table is populated with personalized content.
3.  Implement a "Send" button. When clicked, it should call the `/api/send-emails` endpoint.
4.  Confirm in your own Gmail "Sent" folder that the emails were actually sent.
5.  Check the `draft_emails` table to see their status updated to 'sent'.

## Launch Readiness (Checklist)

- Landing page: product promise, screenshots, pricing, CTA (waitlist or signup)
- Auth: Supabase or email OTP (sign up, login, forgot password)
- Usage limits: env flags + simple rate limit (Upstash Redis)
- Observability: basic server logs in Vercel + error boundaries
- Billing (optional for v1): Stripe Checkout link or manual onboarding
- Data: .env variables set (OpenAI/Anthropic, EXA_API_KEY)
- CI: GitHub Actions (Node 20) lint + build
- Hosting: Vercel (Next 15) on Node >= 18.18

## GitHub Setup

1. Create a new repo on GitHub.
2. In this project, run:

```bash
git init
git remote add origin <your-repo-url>
git checkout -b dev
git add -A
git commit -m "feat: streaming prospect search + Hermes prompt + UI improvements"
git push -u origin dev
```

3. Open a PR to `main`. CI will run via `.github/workflows/ci.yml`.
4. Add repository secrets (Settings → Secrets → Actions):
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY` (if used)
   - `EXA_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if using auth)

## Running Locally

```bash
# Node >= 18.18 required for Next.js 15
nvm use 20
npm i
npm run dev
```
