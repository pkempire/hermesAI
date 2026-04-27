# Hermes MCP

Hermes ships a Model Context Protocol server so external agents (Claude
Desktop, Cursor, Windsurf, the MCP Inspector, custom LangGraph agents, …)
can call the same tools that power the in-app Hermes agent.

Versions used
- @modelcontextprotocol/sdk 1.29.0
- mcp-handler 1.1.0 (the relocated @vercel/mcp-adapter)

Two transports are exposed:
- stdio:           bin/hermes-mcp           (for local desktop apps)
- Streamable HTTP: /api/mcp                 (for hosted agents)

Tools registered

- hermes.prospect_search   Find B2B prospects (companies + decision makers)
- hermes.email_draft       Open the Hermes email drafter for a prospect list
- hermes.scrape_site       Compact offer snapshot for any company URL

The handlers are thin wrappers — they import the existing tool factories from
lib/tools/*, so behaviour stays identical to the in-app agent.

----------------------------------------------------------------------------
1. Add Hermes to Claude Desktop
----------------------------------------------------------------------------

Edit Claude Desktop's MCP config:

  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json

Add an entry under "mcpServers". Point "command" at bun (recommended) or
node, and "args" at the absolute path of bin/hermes-mcp:

  {
    "mcpServers": {
      "hermes": {
        "command": "bun",
        "args": ["/absolute/path/to/hermesAI/bin/hermes-mcp"],
        "env": {
          "OPENAI_API_KEY": "sk-...",
          "EXA_API_KEY": "...",
          "NEXT_PUBLIC_SUPABASE_URL": "https://xxx.supabase.co",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY": "...",
          "HERMES_MCP_MODEL": "openai:gpt-4o-mini"
        }
      }
    }
  }

Restart Claude Desktop. Tools appear under the 🛠 menu as
hermes.prospect_search, hermes.email_draft, hermes.scrape_site.

Cursor and Windsurf use the same JSON shape (different config locations).

----------------------------------------------------------------------------
2. Test with the MCP Inspector
----------------------------------------------------------------------------

Stdio:

  npx @modelcontextprotocol/inspector bun bin/hermes-mcp

Streamable HTTP (against your running Hermes dev server):

  bun run dev
  # in another shell
  npx @modelcontextprotocol/inspector
  # then in the inspector UI choose:
  #   Transport: Streamable HTTP
  #   URL:       http://localhost:3000/api/mcp
  #   Headers:   x-hermes-user-id=<your-supabase-uid>

The inspector lets you list tools, view their JSON schemas, and invoke them
with arbitrary arguments — useful for verifying enrichments, scrape output,
and prospect-search payloads.

----------------------------------------------------------------------------
3. Sample call — hermes.scrape_site
----------------------------------------------------------------------------

Stdio (raw JSON-RPC sent to bin/hermes-mcp on stdin):

  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "hermes.scrape_site",
      "arguments": { "url": "https://stripe.com" }
    }
  }

Streamable HTTP:

  curl -N -X POST http://localhost:3000/api/mcp \
    -H 'content-type: application/json' \
    -H 'accept: application/json, text/event-stream' \
    -H 'x-hermes-user-id: 00000000-0000-0000-0000-000000000000' \
    -d '{
      "jsonrpc":"2.0","id":1,"method":"tools/call",
      "params":{
        "name":"hermes.scrape_site",
        "arguments":{"url":"https://stripe.com"}
      }
    }'

Sample response payload (truncated):

  {
    "site": "https://stripe.com",
    "companyName": "stripe.com",
    "offer": "Payments + financial infrastructure for the internet",
    "targetAudience": "Online businesses, marketplaces, SaaS",
    "whyItMatters": "...",
    "proofPoints": ["..."]
  }

----------------------------------------------------------------------------
4. Auth & quotas (HTTP transport)
----------------------------------------------------------------------------

POST /api/mcp resolves the caller via, in order:
  1. The Supabase session cookie (lib/auth/get-current-user.ts)
  2. The `x-hermes-user-id` header (server-to-server / local dev)

Each tool invocation costs 1 quota unit, enforced through
lib/utils/quota.ts. Unauthenticated callers get 401, exhausted plans 429.

GET /api/mcp (capability/handshake) is unauthenticated by design so MCP
clients can discover the server before they hold a session.

----------------------------------------------------------------------------
5. Files
----------------------------------------------------------------------------

  lib/mcp/server.ts        Shared server factory + tool registration
  bin/hermes-mcp           Stdio entrypoint (chmod +x, in package.json bin)
  app/api/mcp/route.ts     Streamable HTTP route handler
