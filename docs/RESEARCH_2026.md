# Hermes: AI Agent Web App UX/UI Research (2025–2026)

Scope: Concrete, opinionated guidance for making Hermes feel alive and fast on Next.js 15 (App Router) + AI SDK v5 + Vercel + Supabase + Exa Websets.

Conventions: PICK = the recommended choice. SKIP = avoid for this stack. All version numbers are the current stable line as of Q1 2026.

---

## 1. AI SDK v5 — Streaming Patterns

Versions to target:
- `ai` ^5.0.x  (v5 GA shipped mid‑2025)
- `@ai-sdk/react` ^2.0.x
- `@ai-sdk/openai` ^2.x / `@ai-sdk/anthropic` ^2.x

What actually changed from v4 → v5 (relevant to your pain points):

1. **UIMessage is now a typed, part-based structure.** Messages are an array of `parts` — `text`, `tool-<name>`, `reasoning`, `source`, `file`, `data-<name>`. No more flattening tool calls into ad‑hoc fields. This eliminates the "manual tool-result writing" pain.
2. **`createUIMessageStream` + `createUIMessageStreamResponse`** replace `experimental_StreamData`. Server pushes typed parts; client renders them by type.
3. **Throttling moved to first-class config**. `experimental_throttle` on `useChat` is now `experimental_throttle: number` (still experimental name) OR you set `throttle` on the stream transform. The default UI update cadence is also smoother — many teams now drop manual throttling entirely and rely on React 19 transitions.
4. **`experimental_transform`** for smoothing/word-streaming has been promoted: `smoothStream({ chunking: 'word' | 'line' | RegExp, delayInMs: 15 })` from `ai` is the canonical helper. Use it on the server in `streamText({ experimental_transform: smoothStream() })`.
5. **Native tool-result rendering**: tools defined with `tool({ inputSchema, execute })` produce parts with state machine `input-streaming` → `input-available` → `output-available` → `output-error`. You render once and the UI updates as state advances. No reducer code.
6. **Transport abstraction**: `useChat({ transport: new DefaultChatTransport({ api: '/api/chat' }) })`. Swap to `TextStreamChatTransport` for raw text, or build a custom transport for resumable streams (see §2).
7. **Resumable streams** via `@vercel/functions`' `after()` + a Redis-backed stream store. AI SDK v5 ships `experimental_resume` on `useChat` — call it on mount to reattach to an in-flight generation. This is what kills the "user refreshes and loses the run" problem.

PICK: server route uses `streamText` + `smoothStream` + `toUIMessageStreamResponse()`. Client uses `useChat` with `DefaultChatTransport` and renders `message.parts.map(...)`.

Server skeleton:

    import { streamText, smoothStream, convertToModelMessages, tool, stepCountIs } from 'ai';
    import { openai } from '@ai-sdk/openai';
    import { z } from 'zod';

    export const maxDuration = 300;

    export async function POST(req: Request) {
      const { messages } = await req.json();
      const result = streamText({
        model: openai('gpt-4.1'),
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(8),
        experimental_transform: smoothStream({ chunking: 'word', delayInMs: 12 }),
        tools: {
          searchProspects: tool({
            description: 'Search Exa Websets for prospects',
            inputSchema: z.object({ query: z.string(), limit: z.number().default(20) }),
            execute: async ({ query, limit }) => {
              return await exa.websets.search({ query, limit });
            },
          }),
        },
      });
      return result.toUIMessageStreamResponse({
        sendReasoning: true,
        sendSources: true,
      });
    }

Client skeleton (drop the polling entirely):

    'use client';
    import { useChat } from '@ai-sdk/react';
    import { DefaultChatTransport } from 'ai';

    export function Chat() {
      const { messages, sendMessage, status, stop } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
        experimental_throttle: 50, // ms — render coalescing
      });

      return messages.map(m => (
        <div key={m.id}>
          {m.parts.map((part, i) => {
            switch (part.type) {
              case 'text': return <p key={i}>{part.text}</p>;
              case 'reasoning': return <Reasoning key={i} text={part.text} />;
              case 'tool-searchProspects': return <ProspectToolCard key={i} part={part} />;
              case 'source-url': return <Source key={i} url={part.url} />;
              default: return null;
            }
          })}
        </div>
      ));
    }

`ProspectToolCard` reads `part.state` and renders a skeleton during `input-streaming`/`input-available`, then the table when `output-available`. No manual subscriptions, no polling.

---

## 2. SSE vs Polling vs WebSockets for Live Agent Updates

What top AI products actually use (verified from public network traces / engineering posts):

- **ChatGPT, Claude.ai, Perplexity, Vercel v0, Cursor chat**: SSE (HTTP streaming, `text/event-stream` or chunked transfer with the AI SDK data-stream protocol). Single direction, server → client, works through every CDN, free reconnect semantics.
- **Linear's AI features (Magic, Asks)**: SSE for the assistant stream; their normal real-time sync is a custom delta protocol over WebSocket, but AI responses are SSE.
- **Cursor's background agents**: SSE for the chat panel; WebSocket only for the multiplayer cursor presence.
- **Devin / Replit Agent**: SSE for token stream; a small WS channel for terminal/PTY frames specifically because they need bidirectional bytes.

Rule of thumb:
- One-way token/tool stream → **SSE**.
- Bidirectional (terminal, voice, collaborative cursors) → **WebSocket**.
- Polling → **never for live UX**. Only for "is this background job done yet" with a 2–10s interval, and even then prefer Supabase Realtime.

For Hermes specifically:
- Live agent thinking/tool calls → SSE via AI SDK (you already have it; just stop polling).
- Long-running Exa Webset enrichment (minutes) → kick off in a server action, write progress rows to Supabase, subscribe with **Supabase Realtime** (Postgres `replication` channel) on the client. This replaces 200ms polling.
- Resumability → write each stream's chunks to Vercel KV / Upstash Redis with a TTL of 10 min, then `experimental_resume` on the client.

PICK:
1. Drop polling.
2. SSE via AI SDK for the chat surface.
3. Supabase Realtime channels for "background job → row updated" notifications.
4. Upstash Redis for resumable stream storage.

---

## 3. Optimistic UI Patterns

React 19 primitives that matter here:

- `useOptimistic(state, reducer)` — for *user-initiated* mutations (send message, star prospect, add to list). Apply before the server confirms.
- `useTransition()` — wrap server action calls so the UI stays interactive; gives you `isPending` for inline spinners.
- `useFormStatus()` — pending state inside form children without prop drilling.
- **RSC streaming with `<Suspense>`** — the agent's first response shell renders instantly; tool cards stream in as their data resolves.

Canonical optimistic-send pattern (replace your current send handler):

    const [optimisticMessages, addOptimistic] = useOptimistic(
      messages,
      (state, newMsg: UIMessage) => [...state, newMsg]
    );

    async function handleSend(text: string) {
      addOptimistic({
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', text }],
      });
      startTransition(() => sendMessage({ text }));
    }

For tool cards, optimistic skeletons are inherent in AI SDK v5: the `input-streaming` state already gives you a "we know this tool is firing" frame before output exists. Render a branded skeleton at that state.

For server actions that mutate Supabase (create campaign, save prospect):
- Use `useOptimistic` on the list.
- Action returns the canonical row; `revalidatePath` or `revalidateTag` to reconcile.
- On error, throw — `useOptimistic` auto-reverts.

PICK: `useOptimistic` for every list mutation; `useTransition` around every server action; `<Suspense>` boundaries at the tool-card level so one slow tool doesn't block the rest of the response.

---

## 4. Command Palette

Options on the table:

| Lib | Stars | Bundle | Notes |
|---|---|---|---|
| **cmdk** (paco/shadcn) | ~12k | ~6kb | Used by Vercel v0, Linear's prior version, shadcn's `<Command>` |
| ninja-keys | ~3k | ~15kb | Web component, framework-agnostic, less React-idiomatic |
| kbar | ~5k | ~10kb | Older, less active |
| react-aria `useCommandPalette` | n/a | varies | A11y-perfect, more wiring |

Real-world picks:
- **Vercel v0**: cmdk (shadcn `<Command>` wrapper).
- **Linear**: custom built on Radix primitives; behaves like cmdk.
- **Granola**: cmdk.
- **Raycast web**: custom; cmdk-shaped API.
- **Cursor**: custom Electron menu; web fallback uses cmdk-like.

PICK: **cmdk** via shadcn's `<Command>` component. Specifically:

    npx shadcn@latest add command dialog

Pattern for Hermes:

    'use client';
    import { Command, CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem } from '@/components/ui/command';
    import { useEffect, useState } from 'react';

    export function CommandPalette() {
      const [open, setOpen] = useState(false);
      useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(o => !o); }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, []);

      return (
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Search prospects, run agent, jump to…" />
          <CommandList>
            <CommandGroup heading="Agent">
              <CommandItem onSelect={() => runAgent('find_prospects')}>Find new prospects…</CommandItem>
              <CommandItem onSelect={() => runAgent('draft_outreach')}>Draft outreach for selection…</CommandItem>
            </CommandGroup>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => router.push('/campaigns')}>Campaigns</CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      );
    }

Tips that matter:
- Async results: cmdk supports `shouldFilter={false}` + your own filtered list; debounce 120ms; show `<CommandLoading>` while the Exa search returns.
- Group ordering: Actions → Navigation → Recent → Search results.
- Don't put more than ~5 default groups; flatten with fuzzy on input.

---

## 5. Skeleton / Loading Patterns for AI Tools

What the leaders do:

- **Vercel v0 chat**: shimmer block of the *expected component shape* (e.g., a code-card skeleton when it knows code is coming). They use the agent's plan/intent to pre-render the right skeleton.
- **Perplexity Pro**: three-phase: (1) "Searching" with source-favicon stack, (2) "Reading" with bullet skeletons, (3) streamed answer with citations as superscripts. Each phase is an SSE event.
- **Cursor**: animated diff skeleton + file-tree pulse while the agent is editing; tool calls collapse into a one-liner ("Edited 3 files") on completion.
- **Claude.ai (artifacts)**: skeleton card with the artifact title appearing first, then content streams.
- **ChatGPT**: simple gray pulsing dot for thinking; tool calls render as collapsible "Searching the web" rows.

Concrete rules for Hermes:

1. **Per-tool skeletons.** Each tool you register should have a matching `<ToolSkeleton variant="prospects" | "enrichment" | "outreach" />`. Render it on `state === 'input-streaming' | 'input-available'`.
2. **Show intent early.** When `input-streaming` first arrives, render "Searching Exa Websets for X…" using the partially-streamed input args (AI SDK v5 streams partial input JSON).
3. **Shimmer, don't spin.** Use Tailwind `animate-pulse` on bone-shaped blocks, not spinners. Spinners imply unbounded wait; shimmer implies content arriving.
4. **Collapse on completion.** After `output-available`, render a compact summary row with a chevron expanding to the full table. This keeps long agent traces scannable.
5. **Token streaming smoothing.** `smoothStream({ chunking: 'word', delayInMs: 12 })` on the server. This single line is the biggest perceived-quality win.
6. **Use `<Suspense>` boundaries** so a slow tool doesn't block sibling tools.

Skeleton component pattern:

    export function ProspectToolSkeleton({ query }: { query?: string }) {
      return (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-3" />
            <span>Searching Exa{query ? ` for "${query}"` : '…'}</span>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="size-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
                <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      );
    }

---

## 6. Memory Systems for AI Agents

For a B2B prospecting agent, the memory categories you actually need:

1. **Account/contact facts** — "Acme uses Salesforce, decision-maker is Jane, last touch 2026-01-12". Structured. Frequently filtered.
2. **User preferences** — tone, ICP definition, do-not-contact lists.
3. **Episodic** — past runs, what worked, follow-up state.
4. **Semantic** — long-form notes, call transcripts, web research.

Options:

| System | Type | Pros | Cons | Verdict |
|---|---|---|---|---|
| **mem0** (`mem0ai`) | Hybrid (LLM-extracted facts + vector + graph) | Plug-and-play, OSS + cloud, OpenAI-compat API, auto-fact-extraction | Opinionated schema; adds an LLM call to every write; cost at scale; you don't own the prompts | Good for episodic + prefs; not your system of record |
| **Letta / MemGPT** | Stateful agent server with self-editing memory blocks | True agent state, recall + archival memory, REST API | Heavy — runs as its own service; opinionated agent loop fights AI SDK | Skip unless you want their agent loop |
| **Zep** | Temporal knowledge graph + vector | Temporal facts, Cypher-ish queries, fact invalidation | Another service; pricing | Solid alternative to mem0; better for relationships |
| **pgvector on Supabase** | Vector | You own it; HNSW indexes are fast; cheap; collocated with your data | You build the recall logic | Yes, for semantic notes |
| **Plain Postgres tables** | Structured | Trivial; perfect filters; you already use Supabase | No semantic recall on its own | Yes, for facts & prefs |
| **LangMem** (LangChain) | Library | Decent abstractions | Couples you to LangChain | Skip; you're on AI SDK |

PICK for Hermes (layered):

1. **Postgres tables in Supabase** for the structured layer:
   - `account_facts(account_id, key, value, source, confidence, updated_at)`
   - `user_preferences(user_id, key, value)`
   - `agent_runs(id, user_id, intent, summary, outcome, created_at)`
   These are your system of record. Cheap, filterable, exportable.

2. **pgvector** (Supabase extension, HNSW index) for semantic recall over notes, transcripts, page snapshots:
   ```sql
   create extension if not exists vector;
   create table memory_chunks (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null,
     account_id uuid,
     content text not null,
     embedding vector(1536),
     metadata jsonb,
     created_at timestamptz default now()
   );
   create index on memory_chunks using hnsw (embedding vector_cosine_ops);
   ```
   Embed with `text-embedding-3-small` (cheap, 1536 dim) or `voyage-3-lite`.

3. **mem0 (optional, later)** as a thin episodic layer for "what does the agent know about how this user likes outreach phrased". Wire it as one tool: `recallUserContext({ query })`. Don't make it the system of record.

4. Expose memory to the agent as **tools**, not as a giant system prompt. The agent should *decide* when to recall. This keeps token costs sane and is debuggable.

   ```ts
   tools: {
     recallAccount: tool({
       inputSchema: z.object({ accountId: z.string(), question: z.string() }),
       execute: async ({ accountId, question }) => {
         const facts = await db.from('account_facts').select().eq('account_id', accountId);
         const semantic = await vectorSearch({ accountId, query: question, k: 5 });
         return { facts, semantic };
       },
     }),
     rememberFact: tool({
       inputSchema: z.object({ accountId: z.string(), key: z.string(), value: z.string() }),
       execute: async (args) => db.from('account_facts').upsert(args),
     }),
   }
   ```

Anti-pattern: dumping mem0 results into every system prompt. It blows context, hides retrieval bugs, and makes the agent confidently wrong.

---

## 7. MCP (Model Context Protocol) Server Scaffolding in TypeScript

State of the SDK (Q1 2026):
- `@modelcontextprotocol/sdk` ^1.x stable.
- Transports: **stdio** (local CLIs, Claude Desktop, Cursor), **Streamable HTTP** (the new transport that replaced SSE in spec rev 2025-03-26+; supports both POST request/response and server-initiated SSE on the same endpoint).
- The old pure-SSE transport is **deprecated** but still works for back-compat.
- New: **elicitations** (server asks user for input mid-tool), **resource templates with completions**, **structured tool output** (JSON schema on results), **OAuth 2.1** for HTTP transport with PKCE.

Minimal stdio server (for local dev, Cursor/Claude Desktop integration):

    // mcp/server.ts
    import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
    import { z } from 'zod';

    const server = new McpServer({ name: 'hermes', version: '0.1.0' });

    server.registerTool(
      'search_prospects',
      {
        title: 'Search prospects',
        description: 'Search Hermes prospect database',
        inputSchema: { query: z.string(), limit: z.number().default(20) },
      },
      async ({ query, limit }) => {
        const rows = await searchProspects(query, limit);
        return {
          content: [{ type: 'text', text: JSON.stringify(rows) }],
          structuredContent: { rows },
        };
      }
    );

    server.registerResource(
      'campaign',
      new ResourceTemplate('hermes://campaign/{id}', { list: undefined }),
      { title: 'Campaign', mimeType: 'application/json' },
      async (uri, { id }) => ({
        contents: [{ uri: uri.href, text: JSON.stringify(await getCampaign(id)) }],
      })
    );

    await server.connect(new StdioServerTransport());

Run it from Claude Desktop / Cursor:

    {
      "mcpServers": {
        "hermes": { "command": "node", "args": ["/abs/path/mcp/server.js"] }
      }
    }

Streamable HTTP server (for hosting on Vercel so the Hermes agent — or any external MCP client — can hit it):

    // app/api/mcp/route.ts
    import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

    export const runtime = 'nodejs';
    export const maxDuration = 300;

    async function buildServer() {
      const server = new McpServer({ name: 'hermes', version: '0.1.0' });
      // ...register tools/resources
      return server;
    }

    export async function POST(req: Request) {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      const server = await buildServer();
      await server.connect(transport);
      return transport.handleFetchRequest(req); // SDK helper for Web Fetch API
    }

Notes:
- Vercel‑friendly: stateless mode (`sessionIdGenerator: undefined`) — every POST is a fresh server instance. Works on serverless. Stateful sessions need a long‑lived process (Fly, Render, or Vercel's fluid compute with `after()`).
- For auth on HTTP, the SDK ships an OAuth 2.1 helper; for internal use, a simple bearer token middleware is fine.
- The `@vercel/mcp-adapter` package wraps all of the above and is the lowest-friction option on Vercel — recommended unless you need custom routing.

PICK:
- Local dev tools (Claude Desktop, Cursor): stdio server in `/mcp/server.ts`.
- Production exposure: `@vercel/mcp-adapter` mounted at `/api/mcp` with a bearer token. Same tool definitions, two transports.

Tooling for testing:
- `npx @modelcontextprotocol/inspector node mcp/server.js` — official MCP Inspector. Use it before wiring to a client.

---

## Concrete Action Plan for Hermes (in priority order)

1. **Kill the 200ms poll.** Replace with: AI SDK v5 SSE stream for chat + Supabase Realtime channel for background Webset progress rows. Expected: instant perceived speed.
2. **Migrate to AI SDK v5 message parts.** Delete any code that manually appends tool results into message text. Render `message.parts` directly. Add `smoothStream({ chunking: 'word', delayInMs: 12 })`.
3. **Per-tool skeletons.** One `<ToolCard>` per tool with `state`-driven rendering: skeleton → streaming → final → collapsed.
4. **Cmd-K.** `npx shadcn@latest add command dialog`. Wire actions: run agent, search prospects, jump to campaign, recent runs.
5. **Optimistic UI.** Wrap every list mutation in `useOptimistic`; every server action in `useTransition`.
6. **Resumable streams.** Upstash Redis + `experimental_resume` so refresh doesn't kill a run.
7. **Memory layering.** Postgres facts table + pgvector on Supabase. Expose as tools. Defer mem0 until you have a real episodic need.
8. **MCP server.** Stand up `@vercel/mcp-adapter` at `/api/mcp` exposing `search_prospects`, `get_campaign`, `recall_account`. Lets Cursor/Claude/your own agent share one tool surface.

---

## Versions Pinned (copy into package.json)

    "ai": "^5.0.0",
    "@ai-sdk/react": "^2.0.0",
    "@ai-sdk/openai": "^2.0.0",
    "@ai-sdk/anthropic": "^2.0.0",
    "@modelcontextprotocol/sdk": "^1.12.0",
    "@vercel/mcp-adapter": "^0.9.0",
    "cmdk": "^1.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@upstash/redis": "^1.34.0",
    "zod": "^3.23.0"

(Bump to current latest at install time; these are the floors known to work together.)
