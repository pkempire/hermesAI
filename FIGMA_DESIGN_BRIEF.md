# HermesAI - Functional Design Brief

## What is HermesAI?
HermesAI is an AI-powered sales prospecting copilot. Users describe who they want to reach in natural language (e.g., "Find VPs of Marketing at B2B SaaS companies in NYC"), and the AI finds qualified prospects, enriches their contact data, and helps draft personalized emails. It's a conversational interface where users chat with AI to complete their prospecting workflow.

## What Needs to Be Designed

### Primary Interface
- **Main chat interface** - Conversational UI where users talk to Hermes (like ChatGPT interface)
- **Chat input box** - Text input at bottom for describing prospects or asking questions
- **Message history** - Shows user messages and AI responses in conversation format

### Key Functionality to Design

1. **Empty/Onboarding State**
   - Landing screen when no conversation exists
   - Shows example prompts or "playbook" templates users can start with
   - Brief onboarding flow (3 steps) explaining what Hermes does

2. **Prospect Search Flow**
   - User describes prospects → AI processes → Shows search criteria builder (optional review) → Runs search → Shows streaming results as prospects are found → Displays prospect cards in grid/list

3. **Prospect Cards**
   - Display found prospects with: name, job title, company, email, LinkedIn, phone, location, enrichment data (recent posts, tech stack, etc.), fit score indicator

4. **Prospect Actions**
   - Select multiple prospects (checkboxes)
   - Bulk actions: "Draft Emails", "Export CSV", "Save"
   - Individual actions: View details, Draft email, Remove

5. **Email Drafting**
   - After selecting prospects, AI drafts personalized emails
   - Shows preview of emails
   - Options to edit, regenerate, or send

6. **Progress & Status Indicators**
   - Show when AI is processing/searching ("Analyzing...", "Found 12 of 25 prospects...")
   - Real-time updates as results come in
   - Loading states during AI work

### Supporting Elements
- **Header** - Logo, user menu, credit balance display
- **Sidebar** (optional) - Navigation, saved searches, history
- **Modals/Dialogs** - Onboarding, settings, email previews
- **Notifications** - Success/error toasts for actions

## Design Constraints
- Must work on mobile, tablet, and desktop (responsive)
- Chat interface is primary - everything else should feel secondary
- Focus on clarity and speed - users want results fast
- Build trust - show what AI is doing, be transparent

That's it. Design a modern, clean interface that lets users chat with AI to find and reach prospects. Keep it simple, fast, and trustworthy.
