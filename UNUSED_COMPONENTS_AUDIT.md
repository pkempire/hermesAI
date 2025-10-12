# HermesAI Unused Components Audit

This document tracks components that may be unused from the original Morphic.sh fork and can potentially be cleaned up.

## Status: REVIEW NEEDED - DO NOT DELETE YET

**⚠️ WARNING: This is for documentation only. Components should be thoroughly tested before removal.**

## Likely Unused Components (From Original Morphic)

### Search-Related Components (Morphic Legacy)
These components were part of Morphic's search functionality and are likely unused in HermesAI:

- `components/search-results.tsx` - Search results display
- `components/search-results-image.tsx` - Image search results
- `components/search-section.tsx` - Search functionality section
- `components/related-questions.tsx` - Related search questions
- `components/answer-section.tsx` - Search answer display
- `components/reasoning-section.tsx` - Search reasoning display
- `components/retrieve-section.tsx` - Content retrieval section

### Video Search Components
- `components/video-carousel-dialog.tsx` - Video carousel
- `components/video-result-grid.tsx` - Video results grid
- `components/video-search-results.tsx` - Video search results
- `components/video-search-section.tsx` - Video search section
- `components/artifact/video-search-artifact-content.tsx` - Video search artifacts

### Inspector/Debug Components
- `components/inspector/inspector-drawer.tsx` - Debug inspector drawer
- `components/inspector/inspector-panel.tsx` - Debug inspector panel

### Theme Components (Removed Feature)
- `components/theme-menu-items.tsx` - Theme switching menu (feature removed)
- `components/theme-provider.tsx` - Theme provider (may be unused)

### Authentication Components (Check Usage)
- `components/update-password-form.tsx` - Password update form
- `components/forgot-password-form.tsx` - Password reset form

### Generic UI Components (Review Usage)
- `components/external-link-items.tsx` - External link handling
- `components/custom-link.tsx` - Custom link component
- `components/collapsible-message.tsx` - Collapsible message display
- `components/default-skeleton.tsx` - Default loading skeleton
- `components/retry-button.tsx` - Retry button component
- `components/tool-badge.tsx` - Tool badge display

### Artifact Components (Check If Used)
- `components/artifact/retrieve-artifact-content.tsx` - Artifact retrieval
- `components/artifact/search-artifact-content.tsx` - Search artifacts

## Currently Used Components (Keep)

### Core HermesAI Components
- `components/hermes-app.tsx` - Main app component
- `components/chat.tsx` - Chat interface
- `components/chat-panel.tsx` - Chat input panel
- `components/empty-screen.tsx` - Landing page templates
- `components/template-marketplace.tsx` - Template marketplace
- `components/header.tsx` - App header
- `components/user-menu.tsx` - User menu
- `components/guest-menu.tsx` - Guest menu

### Prospect Search Components
- `components/prospect-search-builder.tsx` - Search builder
- `components/prospect-search-progress.tsx` - Search progress
- `components/prospect-search-summary.tsx` - Search results
- `components/prospect-grid.tsx` - Prospect display grid
- `components/prospect-card.tsx` - Individual prospect cards
- `components/interactive-email-drafter.tsx` - Email drafting

### Campaign Components
- `components/campaign-analytics-dashboard.tsx` - Analytics
- `components/campaign-progress-tracker.tsx` - Progress tracking
- `components/ai-copilot-assistant.tsx` - AI assistant
- `components/onboarding-modal.tsx` - User onboarding

### Authentication & Core UI
- `components/login-form.tsx` - Login form
- `components/sign-up-form.tsx` - Sign up form
- `components/message.tsx` - Chat messages
- `components/render-message.tsx` - Message rendering
- `components/user-message.tsx` - User message display

### Essential UI Components
- All components in `components/ui/` - UI library components
- `components/app-sidebar.tsx` - Sidebar navigation
- `components/chat-share.tsx` - Chat sharing
- `components/message-actions.tsx` - Message actions

## Analysis Summary

### High Confidence Unused (Safe to Remove After Testing)
1. Video search components (5 files)
2. Original search components (6 files)
3. Inspector/debug components (2 files)
4. Theme components (2 files)

### Medium Confidence Unused (Requires Testing)
1. Authentication helper components (2 files)
2. Generic UI helpers (6 files)
3. Some artifact components (2 files)

### Low Confidence / Keep For Now
1. All UI library components
2. All prospect/campaign components
3. Core authentication components
4. Chat and messaging components

## Recommended Action Plan

### Phase 1: Safe Removals (After Verification)
- Remove video search components
- Remove original Morphic search components
- Remove inspector components if not used in development

### Phase 2: Careful Review
- Test authentication flows for password components
- Check if theme provider is needed
- Verify artifact components usage

### Phase 3: Long-term Cleanup
- Review generic UI components for actual usage
- Consolidate similar components
- Remove any remaining unused utilities

## Files That Should NOT Be Deleted

### Critical HermesAI Components
- Any component with "prospect", "campaign", "hermes" in the name
- All `components/ui/*` files (UI library)
- Authentication core components
- Chat and messaging components
- Template marketplace components

### Unknown Usage (Research Before Deletion)
- `components/artifact/*` - May be used by AI SDK
- `components/section.tsx` - Generic section component
- `components/current-user-avatar.tsx` - User avatar display

## Notes

- This audit was performed on 2025-10-08
- Components marked as "unused" should be verified through:
  1. Code search for imports
  2. Runtime testing
  3. Build verification
- Some components may be used dynamically or in routes not yet reviewed
- Always test thoroughly before deletion

---

**Last Updated:** 2025-10-08
**Status:** Draft - Requires validation before any deletions