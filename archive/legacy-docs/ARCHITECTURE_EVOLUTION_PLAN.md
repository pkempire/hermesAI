# Architecture Analysis: Current Tool Calling vs MCP Servers & Claude Agent SDK Loop

## Executive Summary

Your current architecture uses **native AI SDK tool calling** (Vercel AI SDK), which is simpler but less flexible than MCP servers. The Claude Agent SDK Loop provides a framework that could significantly improve your agent's effectiveness through better context management, parallelization, and verification.

---

## 1. Current Tool Calling vs MCP Servers

### **Current Approach: Native AI SDK Tool Calling**

**How it works:**
- Tools defined as JavaScript functions with Zod schemas
- AI model calls tools directly via native tool-calling API
- Tools execute synchronously in the same process
- Results stream back immediately

**Your current tools:**
```typescript
// lib/tools/prospect-search.ts
export function createProspectSearchTool(model: string) {
  return tool({
    description: 'Search for qualified prospects...',
    inputSchema: prospectSearchSchema,
    execute: async ({ query, targetPersona, offer, ... }) => {
      // Direct execution
      return { type: 'interactive', props: {...} }
    }
  })
}
```

**Pros:**
- ✅ Simple, direct execution
- ✅ Type-safe with Zod schemas
- ✅ Fast (no network overhead)
- ✅ Easy to debug
- ✅ Works with any AI SDK

**Cons:**
- ❌ No standardization across tools
- ❌ Hard to parallelize tool execution
- ❌ Limited context sharing between tools
- ❌ No built-in tool discovery/registry
- ❌ Tools tightly coupled to application code

---

### **MCP Servers Approach**

**How it works:**
- Tools exposed via standardized Model Context Protocol
- Tools run as separate servers/processes
- Standardized schemas and discovery
- Can be shared across applications

**Example MCP Server:**
```typescript
// mcp-server-prospect-search.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

const server = new Server({
  name: 'prospect-search-server',
  version: '1.0.0'
})

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'prospect_search',
    description: 'Search for qualified prospects',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        targetPersona: { type: 'string' }
      }
    }
  }]
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Execute tool
  return { content: [{ type: 'text', text: JSON.stringify(results) }] }
})
```

**Pros:**
- ✅ Standardized protocol (works with any MCP client)
- ✅ Tools can be shared/reused across projects
- ✅ Better separation of concerns
- ✅ Can run tools in parallel across servers
- ✅ Built-in tool discovery
- ✅ Language-agnostic (can write tools in Python, Go, etc.)

**Cons:**
- ❌ More complex setup
- ❌ Network overhead (unless local)
- ❌ Requires MCP client library
- ❌ Overkill for simple tools

---

## 2. Claude Agent SDK Loop Analysis

### **The Three-Step Framework:**

#### **Step 1: Gathering Context**
- Use subagents (parallelize for efficiency)
- Compact/maintain context
- Leverage agentic/semantic search
- Hybrid search approaches

#### **Step 2: Taking Action**
- Leverage tools
- Use prebuilt MCP servers
- Bash/scripts (Skills)
- Generate code to take action
- Enhance MCP through code execution/routing

#### **Step 3: Verifying Output**
- Define rules to verify outputs
- Enable visual feedback
- LLM-as-a-Judge for quality verification
- Don't overcomplicate (use simple scripts when possible)

---

## 3. Your Current Architecture Analysis

### **✅ What You're Doing Well:**

#### **Gathering Context:**
- ✅ **Semantic Search**: Using Exa for prospect discovery
- ✅ **Context-Aware Enrichments**: GPT analyzes `offer` to generate relevant enrichments
- ✅ **Website Scraping**: `scrape_site` tool extracts ICP/offer from websites
- ✅ **Caching**: Redis cache for prospect results

**Current Implementation:**
```typescript
// lib/clients/exa-websets.ts
// Uses Exa's semantic search for company discovery
// Context-aware enrichments based on offer type
```

#### **Taking Action:**
- ✅ **Native Tool Calling**: Clean tool definitions with Zod schemas
- ✅ **Streaming Results**: Real-time updates via SSE
- ✅ **Interactive UI**: Tools can return UI configurations
- ✅ **Code Generation**: Email drafter generates personalized content

**Current Implementation:**
```typescript
// lib/agents/researcher.ts
// Tools: search, prospect_search, scrape_site, email_drafter
// Direct execution with streaming
```

#### **Verifying Output:**
- ⚠️ **Limited Verification**: Mostly implicit (Zod schema validation)
- ⚠️ **No LLM-as-Judge**: No quality checks on outputs
- ⚠️ **No Visual Feedback**: Limited (just UI state)

---

### **❌ What's Missing:**

#### **1. Parallelization (Gathering Context)**
**Current:** Tools execute sequentially
```typescript
// Tools execute one at a time
prospect_search() → wait → email_drafter() → wait → done
```

**Should be:**
```typescript
// Parallel subagents
const [prospects, enrichments, research] = await Promise.all([
  prospectSearchAgent.execute(),
  enrichmentAgent.execute(),
  researchAgent.execute()
])
```

**Impact:** Could reduce 88s → ~30s for prospect search

#### **2. Context Compaction (Gathering Context)**
**Current:** Full conversation history passed to every tool call
```typescript
// All messages sent to every tool
messages: [...allMessages] // Could be 50+ messages
```

**Should be:**
```typescript
// Compact relevant context only
const relevantContext = compactContext(allMessages, currentTask)
messages: [systemPrompt, relevantContext, currentMessage]
```

**Impact:** Reduces token usage, improves relevance

#### **3. Agentic Search (Gathering Context)**
**Current:** Single search call, no iterative refinement
```typescript
// One-shot search
const results = await search(query)
```

**Should be:**
```typescript
// Iterative search refinement
const results = await agenticSearch({
  initialQuery: query,
  refineBasedOnResults: true,
  maxIterations: 3
})
```

**Impact:** Better search quality, more relevant results

#### **4. Tool Parallelization (Taking Action)**
**Current:** Tools wait for each other
```typescript
// Sequential
const prospects = await prospectSearch()
const emails = await emailDrafter(prospects) // Waits for search
```

**Should be:**
```typescript
// Parallel when possible
const [prospects, emailTemplates] = await Promise.all([
  prospectSearch(),
  emailDrafter.prepareTemplates() // Can start early
])
```

**Impact:** Faster end-to-end workflows

#### **5. Output Verification (Verifying Output)**
**Current:** No quality checks
```typescript
// No verification
return { prospects: [...], emails: [...] }
```

**Should be:**
```typescript
// LLM-as-Judge verification
const verified = await verifyOutput({
  output: prospects,
  criteria: ['hasEmail', 'matchesICP', 'recentActivity'],
  judgeModel: 'gpt-5-mini'
})
```

**Impact:** Higher quality outputs, fewer bad prospects

---

## 4. Recommended Architecture Evolution

### **Phase 1: Add Parallelization (Quick Win)**

**File: `lib/agents/researcher.ts`**
```typescript
// Add parallel tool execution
async function executeToolsInParallel(toolCalls: ToolCall[]) {
  const results = await Promise.all(
    toolCalls.map(call => executeTool(call))
  )
  return results
}
```

**Impact:** 2-3x faster for multi-tool workflows

---

### **Phase 2: Add Context Compaction**

**New File: `lib/agents/context-compactor.ts`**
```typescript
export async function compactContext(
  messages: CoreMessage[],
  currentTask: string
): Promise<CoreMessage[]> {
  // Use LLM to extract only relevant context
  const compacted = await generateText({
    model: getModel('gpt-5-mini'),
    prompt: `Extract only context relevant to: ${currentTask}`,
    messages
  })
  return parseCompactedMessages(compacted.text)
}
```

**Impact:** 30-50% token reduction, better relevance

---

### **Phase 3: Add Subagents**

**New File: `lib/agents/subagents/`**
```typescript
// lib/agents/subagents/prospect-researcher.ts
export class ProspectResearcherAgent {
  async execute(query: string) {
    // Parallel: search + enrich + verify
    const [companies, enrichments, verification] = await Promise.all([
      this.findCompanies(query),
      this.generateEnrichments(query),
      this.verifyCriteria(query)
    ])
    return { companies, enrichments, verification }
  }
}

// lib/agents/subagents/email-specialist.ts
export class EmailSpecialistAgent {
  async execute(prospects: Prospect[], offer: string) {
    // Parallel: research + draft + verify
    const [research, drafts, quality] = await Promise.all([
      this.researchContext(prospects),
      this.draftEmails(prospects, offer),
      this.verifyQuality(drafts)
    ])
    return { research, drafts, quality }
  }
}
```

**Impact:** Better separation of concerns, easier to optimize each agent

---

### **Phase 4: Add LLM-as-Judge Verification**

**New File: `lib/agents/verification/judge.ts`**
```typescript
export async function verifyOutput<T>({
  output,
  criteria,
  judgeModel = 'gpt-5-mini'
}: {
  output: T
  criteria: string[]
  judgeModel?: string
}): Promise<{ passed: boolean; score: number; feedback: string }> {
  const judge = await generateText({
    model: getModel(judgeModel),
    prompt: `Verify this output meets criteria: ${criteria.join(', ')}`,
    input: JSON.stringify(output)
  })
  
  return parseJudgeResponse(judge.text)
}

// Usage:
const verified = await verifyOutput({
  output: prospects,
  criteria: [
    'Has valid email address',
    'Matches target persona',
    'Company size matches criteria',
    'Recent activity (last 6 months)'
  ]
})

if (!verified.passed) {
  // Refine search or filter results
}
```

**Impact:** Higher quality outputs, fewer false positives

---

### **Phase 5: Consider MCP Servers (Optional)**

**When to use MCP:**
- ✅ Building reusable tools for multiple projects
- ✅ Need to share tools across teams
- ✅ Want language-agnostic tool development
- ✅ Need standardized tool discovery

**When NOT to use MCP:**
- ❌ Simple, project-specific tools (your case)
- ❌ Performance-critical tools (network overhead)
- ❌ Tightly integrated workflows (your case)

**Recommendation:** **Don't migrate to MCP yet**. Your current approach is simpler and faster. Consider MCP if you:
1. Build a tool marketplace
2. Need to share tools with other teams
3. Want to write tools in Python/Go

---

## 5. Implementation Priority

### **High Priority (Immediate Impact):**

1. **Parallel Tool Execution** (2-3x speedup)
   - File: `lib/streaming/create-tool-calling-stream.ts`
   - Effort: 2-3 hours
   - Impact: Major

2. **Context Compaction** (30-50% token reduction)
   - New file: `lib/agents/context-compactor.ts`
   - Effort: 4-6 hours
   - Impact: Major (cost savings)

3. **LLM-as-Judge Verification** (Quality improvement)
   - New file: `lib/agents/verification/judge.ts`
   - Effort: 3-4 hours
   - Impact: Major (better outputs)

### **Medium Priority (Nice to Have):**

4. **Subagents Architecture** (Better organization)
   - New directory: `lib/agents/subagents/`
   - Effort: 1-2 days
   - Impact: Medium (maintainability)

5. **Agentic Search** (Better search quality)
   - File: `lib/tools/search.ts`
   - Effort: 1 day
   - Impact: Medium (quality)

### **Low Priority (Future):**

6. **MCP Server Migration** (Only if needed)
   - Effort: 1-2 weeks
   - Impact: Low (complexity increase)

---

## 6. Key Takeaways

### **Your Current Architecture:**
- ✅ **Good**: Simple, fast, type-safe tool calling
- ✅ **Good**: Context-aware enrichments
- ✅ **Good**: Streaming results
- ⚠️ **Missing**: Parallelization
- ⚠️ **Missing**: Context compaction
- ⚠️ **Missing**: Output verification

### **Claude Agent SDK Loop Alignment:**
- **Gathering Context**: 70% aligned (missing parallelization & compaction)
- **Taking Action**: 80% aligned (missing parallel tool execution)
- **Verifying Output**: 30% aligned (missing LLM-as-Judge)

### **Recommendation:**
1. **Keep** your current tool calling approach (it's simpler)
2. **Add** parallelization (biggest impact)
3. **Add** context compaction (cost savings)
4. **Add** LLM-as-Judge verification (quality)
5. **Skip** MCP migration (not needed yet)

---

## 7. Next Steps

1. **Implement parallel tool execution** in `create-tool-calling-stream.ts`
2. **Add context compaction** before tool calls
3. **Add LLM-as-Judge** for prospect verification
4. **Measure impact**: Speed, token usage, quality scores
5. **Iterate** based on results

**Estimated Total Effort:** 1-2 days
**Expected Impact:** 2-3x faster, 30-50% cheaper, higher quality outputs



