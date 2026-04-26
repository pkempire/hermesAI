# 🚨 HermesAI Production Audit - January 2025

**Status:** CRITICAL FIXES NEEDED  
**Date:** 2025-01-XX  
**Goal:** Transform from "AI slop" to production-grade open source repo

---

## 📊 Executive Summary

### Current State
- ✅ **Core functionality works**: Tool calling, prospect search, UI rendering
- ❌ **Production blockers**: Performance, errors, code quality, architecture
- ❌ **Technical debt**: 288 console.logs, deprecated APIs, unused code
- ❌ **User experience**: Slow, error-prone, poor UI/UX

### Critical Issues (P0)
1. **288 console.log statements** in production code (84 components, 204 lib)
2. **Deprecated AI SDK APIs**: `experimental_transform`, `experimental_throttle`
3. **Polling instead of SSE**: 200ms polling loop is inefficient
4. **Complex message conversion**: Unnecessary UI ↔ Core message conversions
5. **Large component files**: `prospect-search-section.tsx` is 1000+ lines

### High Priority (P1)
6. **Unused components**: ~20+ files from Morphic fork
7. **Excessive documentation**: 27 MD files, many outdated
8. **Manual tool result handling**: Should use AI SDK native handling
9. **Performance bottlenecks**: Re-renders, large state objects
10. **Error handling**: Inconsistent, missing boundaries

---

## 🔧 Tool Calling System Analysis

### Current Flow
```
User Message → useChat → POST /api/chat → createToolCallingStreamResponse
→ researcher() → streamText() → tool.execute() → result streaming
→ UI updates via polling/streaming
```

### Issues Found

#### 1. **Deprecated `experimental_transform`**
**File:** `lib/agents/researcher.ts:140`
```typescript
experimental_transform: smoothStream()  // ❌ DEPRECATED in v5
```
**Fix:** Remove - `smoothStream()` is handled automatically in v5

#### 2. **Deprecated `experimental_throttle`**
**File:** `components/chat.tsx:85`
```typescript
experimental_throttle: 100  // ❌ DEPRECATED
```
**Fix:** Remove - throttling is built-in

#### 3. **Manual Tool Result Handling**
**File:** `lib/streaming/create-tool-calling-stream.ts:169-252`
- Manually writing tool-call/tool-result to `message-metadata`
- Should let AI SDK handle this natively
- Creates duplicate data structures

#### 4. **Complex Message Conversion**
**File:** `lib/streaming/create-tool-calling-stream.ts:82-150`
- Multiple conversion layers: UI → Core → UI
- Filters out `input-available` states manually
- Should use `convertToModelMessages` directly

### Recommended Architecture

```typescript
// SIMPLIFIED FLOW
User Message → useChat → POST /api/chat
→ createUIMessageStream
→ streamText({ tools, messages: convertToModelMessages(messages) })
→ AI SDK handles tool-call/tool-result automatically
→ Writer.merge(result.toUIMessageStream())
```

---

## 🎨 UI/UX Performance Issues

### Performance Problems

#### 1. **Excessive Re-renders**
- `prospect-search-section.tsx`: 1000+ lines, complex state
- `useEffect` chains causing cascading updates
- Large `prospects` array updates triggering full re-renders

#### 2. **Polling Overhead**
- `setInterval` every 200ms = 5 requests/second
- Should use SSE or WebSocket
- No exponential backoff on errors

#### 3. **Console Logging**
- 288 console.logs in production
- Should use proper logging service (or remove for prod)
- Performance impact from string serialization

### UI Errors
- Missing error boundaries
- Inconsistent error states
- No loading skeletons for async operations
- Poor mobile responsiveness

---

## 🗑️ Code Cleanup Opportunities

### Unused Components (High Confidence)
Based on `UNUSED_COMPONENTS_AUDIT.md`:

**Video Search (5 files)** - Not used in HermesAI
- `components/video-carousel-dialog.tsx`
- `components/video-result-grid.tsx`
- `components/video-search-results.tsx`
- `components/video-search-section.tsx`
- `components/artifact/video-search-artifact-content.tsx`

**Legacy Search (6 files)** - Morphic leftovers
- `components/search-results.tsx`
- `components/search-results-image.tsx`
- `components/search-section.tsx`
- `components/related-questions.tsx`
- `components/answer-section.tsx`
- `components/reasoning-section.tsx`

**Debug/Inspector (2 files)**
- `components/inspector/inspector-drawer.tsx`
- `components/inspector/inspector-panel.tsx`

**Total:** ~13-20 files can likely be removed

### Documentation Cleanup
27 markdown files, many outdated:
- Keep: `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
- Archive: Day summaries, status reports, audit files
- Consolidate: Technical docs into single ARCHITECTURE.md

---

## 🏗️ Architecture Improvements

### 1. **Simplify Tool Calling**
- Remove manual tool result handling
- Use AI SDK's native `tool-result` parts
- Eliminate custom `message-metadata` types

### 2. **Streaming Architecture**
Replace polling with SSE:
```typescript
// Current: setInterval polling
const poll = setInterval(async () => {
  const data = await fetch('/api/prospect-search/status')
  // ...
}, 200)

// Better: Server-Sent Events
const eventSource = new EventSource('/api/prospect-search/stream')
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // Update UI
}
```

### 3. **State Management**
- Split large components (`prospect-search-section.tsx`)
- Use `useReducer` for complex state
- Implement proper memoization

### 4. **Error Handling**
- Add Error Boundaries
- Consistent error states
- User-friendly error messages

---

## 📋 Action Plan

### Phase 1: Critical Fixes (Immediate)
1. ✅ Remove all `console.log` statements (or wrap in dev-only check)
2. ✅ Remove deprecated `experimental_*` APIs
3. ✅ Fix tool calling to use native AI SDK handling
4. ✅ Add Error Boundaries
5. ✅ Remove unused components (after verification)

### Phase 2: Performance (Week 1)
6. ✅ Replace polling with SSE
7. ✅ Split large components
8. ✅ Optimize re-renders
9. ✅ Add loading states
10. ✅ Implement proper logging

### Phase 3: Cleanup (Week 2)
11. ✅ Archive old documentation
12. ✅ Consolidate technical docs
13. ✅ Remove dead code
14. ✅ Update README
15. ✅ Code review & testing

---

## 🔍 Detailed File Audit

### Files with Most Issues

#### `components/prospect-search-section.tsx` (1098 lines)
- **Issues:** Too large, complex state, many console.logs
- **Fix:** Split into: Builder, Polling, Results, Error states

#### `lib/streaming/create-tool-calling-stream.ts` (293 lines)
- **Issues:** Manual tool handling, deprecated APIs
- **Fix:** Simplify to use native AI SDK patterns

#### `lib/agents/researcher.ts` (148 lines)
- **Issues:** Deprecated `experimental_transform`, excessive logging
- **Fix:** Remove experimental API, reduce logging

#### `app/api/prospect-search/status/route.ts` (325 lines)
- **Issues:** Excessive console.logs, complex enrichment parsing
- **Fix:** Extract parsing logic, remove logs (or use logger)

---

## ✅ Success Criteria

### Before Launch
- [ ] Zero console.logs in production builds
- [ ] No deprecated APIs
- [ ] All unused components removed
- [ ] Error boundaries on all major sections
- [ ] SSE streaming (no polling)
- [ ] < 500ms initial render
- [ ] All components < 300 lines
- [ ] Documentation consolidated to < 10 files

### Performance Targets
- Initial load: < 2s
- Tool execution: < 500ms to first response
- Prospect streaming: Real-time (SSE)
- Error recovery: < 100ms

---

## 📚 References

- [AI SDK v5 Migration Guide](https://sdk.vercel.ai/docs/08-migration-guides/26-migration-guide-5-0)
- [Exa Websets API Docs](https://docs.exa.ai/websets/api/overview)
- [Next.js 15 Best Practices](https://nextjs.org/docs)

---

**Next Steps:** Start with Phase 1 critical fixes immediately.

