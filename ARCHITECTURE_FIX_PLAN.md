# 🔧 Tool Calling Architecture Fix Plan

## The Problem: Manual Tool Result Handling

### Current (WRONG) Implementation

**What's happening:**
1. AI SDK v5 automatically creates `tool-call` and `tool-result` **parts** in the message stream
2. Our code **manually intercepts** these in `onStepFinish` callback
3. We **re-write** them as custom `message-metadata` objects
4. UI then has to parse these custom objects instead of using native parts

**Code Location:** `lib/streaming/create-tool-calling-stream.ts:165-256`

```typescript
// ❌ CURRENT: Manual interception and re-writing
onStepFinish: (step) => {
  const content = step?.content as any[] | undefined
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item?.type === 'tool-call') {
        // Manually writing custom message-metadata
        writer.write({
          type: 'message-metadata',  // ❌ Custom type
          messageMetadata: {
            type: 'tool_call',
            data: {
              state: 'call',
              toolCallId: item.toolCallId,
              toolName: item.toolName,
              args: JSON.stringify(item.args ?? {})
            }
          }
        })
      }
      if (item?.type === 'tool-result') {
        // More manual re-writing...
        writer.write({
          type: 'message-metadata',
          messageMetadata: {
            type: 'tool_call',
            data: {
              state: 'result',
              toolCallId: item.toolCallId,
              toolName: item.toolName,
              result: JSON.stringify(item.output)
            }
          }
        })
      }
    }
  }
}
```

**Problems:**
- ❌ Duplicates data (tool-call appears in parts AND custom metadata)
- ❌ Creates custom format that UI has to parse separately
- ❌ Loses type safety and native SDK features
- ❌ Makes code harder to maintain
- ❌ Potential sync issues between parts and metadata

### What AI SDK v5 Does Automatically

AI SDK v5's `streamText` with tools automatically:
1. Creates `tool-call` parts when model decides to call a tool
2. Executes the tool function
3. Creates `tool-result` parts with the result
4. These parts appear in `message.parts` array natively

**Example native structure:**
```typescript
message.parts = [
  { type: 'text', text: 'Let me search for that...' },
  { 
    type: 'tool-call',
    toolCallId: 'call_123',
    toolName: 'prospect_search',
    args: { query: 'fintech companies', ... }
  },
  {
    type: 'tool-result',
    toolCallId: 'call_123',
    toolName: 'prospect_search',
    output: { type: 'interactive_ui', component: 'ProspectSearchBuilder', ... }
  },
  { type: 'text', text: 'Here are the results...' }
]
```

**UI should read directly from `message.parts`** - no custom parsing needed!

---

## The Fix: Use Native AI SDK Parts

### Step 1: Remove Manual Tool Handling

**File:** `lib/streaming/create-tool-calling-stream.ts`

**Remove:**
- The entire `onStepFinish` callback (lines 165-256)
- Manual `message-metadata` writing for tool-calls
- Manual `message-metadata` writing for tool-results

**Keep:**
- `data-pipeline` events for campaign progress (those are custom, fine)
- `onFinish` callback for persistence

### Step 2: Update UI to Use Native Parts

**File:** `components/render-message.tsx`

**Current (partially correct):**
```typescript
// Already reads from message.parts ✅
case 'tool-call': {
  const tool = {
    state: 'call',
    toolCallId: part.toolCallId,
    toolName: part.toolName,
    args: part.args  // ✅ Already structured, no JSON.parse needed
  }
  return <ToolSection tool={tool} ... />
}

case 'tool-result': {
  const tool = {
    state: 'result',
    toolCallId: part.toolCallId,
    toolName: part.toolName,
    result: part.output  // ✅ Already structured
  }
  return <ToolSection tool={tool} ... />
}
```

**Fix needed:**
- Remove parsing from `message-metadata` (lines 40-73 in render-message.tsx)
- Simplify to only read from `message.parts`
- Remove `toolData` useMemo that parses annotations/metadata

### Step 3: Update Chat Component

**File:** `components/chat.tsx`

**Current:**
```typescript
onData: (part: any) => {
  // Manually parsing message-metadata
  if (part?.type === 'message-metadata' && part?.messageMetadata?.type === 'tool_call') {
    setUiData(prev => [...prev, { type: 'tool_call', data: part.messageMetadata.data }])
  }
}
```

**Fix:**
- Remove this manual parsing
- `useChat` hook automatically handles native parts
- No need to manually track tool calls in `uiData`

### Step 4: Clean Up Prospect Search Section

**File:** `components/prospect-search-section.tsx`

**Current:**
- Parses tool result from custom format
- Tries multiple formats (string, object, nested)

**Fix:**
- Tool result comes directly as `part.output` in native format
- No JSON parsing needed
- Type-safe access

---

## Implementation Steps

### Phase 1: Remove Manual Handling (Immediate)

1. **Edit `lib/streaming/create-tool-calling-stream.ts`:**
   ```typescript
   const result = streamText({
     ...researcherConfig,
     stopWhen: stepCountIs(5),
     // ❌ REMOVE: onStepFinish callback entirely
     // ✅ KEEP: onFinish for persistence
     onFinish: async result => {
       // ... existing code
     }
   })
   
   // ✅ KEEP: Merge native stream (has tool-call/tool-result parts automatically)
   writer.merge(result.toUIMessageStream())
   ```

2. **Keep custom data-pipeline events:**
   - Add listener for tool calls in UI (to emit pipeline events)
   - Or emit them in tool execution functions directly

### Phase 2: Simplify UI Components

3. **Edit `components/render-message.tsx`:**
   - Remove `toolData` useMemo (lines 40-73)
   - Remove annotations/metadata parsing
   - Only use `message.parts` directly

4. **Edit `components/chat.tsx`:**
   - Remove `message-metadata` parsing from `onData`
   - Remove `uiData` tracking for tool calls
   - Let `useChat` handle parts natively

5. **Edit `components/prospect-search-section.tsx`:**
   - Simplify tool result parsing
   - Access `tool.result` directly (already structured)
   - Remove JSON.parse logic

### Phase 3: Add Custom Events (If Needed)

6. **Campaign Progress Events:**
   - Option A: Listen for `tool-call` parts in UI and emit pipeline events
   - Option B: Emit pipeline events directly in tool execution functions
   - Option C: Use custom `data-*` parts (not message-metadata)

---

## Expected Outcome

### Before (Complex)
```
streamText → onStepFinish intercepts → writes message-metadata
→ UI reads message-metadata → parses custom format → renders
```

### After (Simple)
```
streamText → automatically creates tool-call/tool-result parts
→ UI reads message.parts directly → renders
```

### Benefits
- ✅ **Simpler code**: ~100 lines removed
- ✅ **Type safe**: Native SDK types
- ✅ **More reliable**: No sync issues
- ✅ **Better performance**: No duplicate data
- ✅ **Easier to maintain**: Standard SDK patterns
- ✅ **Future proof**: Works with SDK updates

---

## Migration Checklist

### Server-Side (`lib/streaming/`)
- [ ] Remove `onStepFinish` callback from `streamText`
- [ ] Remove all `message-metadata` writing for tools
- [ ] Keep `onFinish` for persistence
- [ ] Keep `data-pipeline` events (or move to UI)
- [ ] Test that tool-call/tool-result parts appear in stream

### Client-Side (`components/`)
- [ ] Remove `message-metadata` parsing from `chat.tsx`
- [ ] Remove `toolData` useMemo from `render-message.tsx`
- [ ] Remove annotations/metadata parsing
- [ ] Simplify `prospect-search-section.tsx` tool parsing
- [ ] Test all tools render correctly from native parts

### Testing
- [ ] Test `prospect_search` tool (interactive mode)
- [ ] Test `prospect_search` tool (immediate mode)
- [ ] Test `email_drafter` tool
- [ ] Test `ask_question` tool
- [ ] Test `scrape_site` tool
- [ ] Test `search` tool
- [ ] Verify no console errors
- [ ] Verify tool results display correctly

---

## Files to Modify

### High Priority
1. `lib/streaming/create-tool-calling-stream.ts` - Remove manual handling
2. `components/render-message.tsx` - Simplify to use parts only
3. `components/chat.tsx` - Remove message-metadata parsing
4. `components/prospect-search-section.tsx` - Simplify tool result parsing

### Medium Priority
5. `components/tool-section.tsx` - Verify it works with native parts
6. `components/chat-messages.tsx` - Check for any manual tool parsing

### Testing
7. Test all tool types work
8. Verify campaign progress tracking still works
9. Check error states

---

## Code Examples

### Example: Simplified Tool Call Handling

**Before:**
```typescript
// Manual interception
onStepFinish: (step) => {
  for (const item of step.content) {
    if (item.type === 'tool-call') {
      writer.write({
        type: 'message-metadata',
        messageMetadata: {
          type: 'tool_call',
          data: { /* manual structure */ }
        }
      })
    }
  }
}
```

**After:**
```typescript
// Nothing! AI SDK handles it automatically
// tool-call and tool-result parts appear in message.parts
```

### Example: Simplified UI Rendering

**Before:**
```typescript
// Parse from multiple sources
const toolData = useMemo(() => {
  const collected = []
  // Parse annotations
  for (const ann of annotations) {
    if (ann?.type === 'tool_call') collected.push(ann.data)
  }
  // Parse metadata
  if (meta?.type === 'tool_call') collected.push(meta.data)
  // JSON.parse args/results
  // ...
}, [annotations, metadata])

// Then render from custom format
```

**After:**
```typescript
// Just read from parts
{message.parts?.map(part => {
  switch (part.type) {
    case 'tool-call':
      return <ToolSection tool={{
        state: 'call',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        args: part.args  // Already structured!
      }} />
    case 'tool-result':
      return <ToolSection tool={{
        state: 'result',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        result: part.output  // Already structured!
      }} />
  }
})}
```

---

**Status:** Ready to implement  
**Estimated Impact:** Major simplification, ~150 lines removed  
**Risk:** Low (moving to standard SDK patterns)

