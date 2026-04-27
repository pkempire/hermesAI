/**
 * Streamable HTTP MCP endpoint for Hermes.
 *
 * - mcp-handler@1.1.0 (formerly @vercel/mcp-adapter, now relocated)
 *   https://www.npmjs.com/package/mcp-handler
 * - @modelcontextprotocol/sdk@1.29.0
 *
 * Auth: the existing Hermes Supabase session cookie (lib/auth/get-current-user).
 * Server-to-server callers may pass `x-hermes-user-id`. Otherwise we 401.
 *
 * Quotas: enforced via lib/utils/quota.ts on each request (1 unit per call).
 */

import { createMcpHandler } from 'mcp-handler'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { registerHermesTools } from '@/lib/mcp/server'
import { requireQuota } from '@/lib/utils/quota'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Bumped because tools (Exa scrape, Websets preview, OpenAI generateObject)
// can take a while.
export const maxDuration = 60

const HERMES_USER_HEADER = 'x-hermes-user-id'

/**
 * Resolve the calling user. Preference order:
 *   1. Supabase session cookie (browser / authenticated app calls).
 *   2. `x-hermes-user-id` header (server-to-server, dev tooling).
 */
async function resolveUserId(req: Request): Promise<string | null> {
  try {
    const user = await getCurrentUser()
    if (user?.id) return user.id
  } catch {
    // fall through to header-based auth
  }

  const headerId = req.headers.get(HERMES_USER_HEADER)
  if (headerId && headerId.trim().length > 0) return headerId.trim()
  return null
}

const baseHandler = createMcpHandler(
  server => {
    registerHermesTools(server)
  },
  {
    serverInfo: { name: 'hermes', version: '0.1.0' }
  },
  {
    // The handler matches request.url.pathname against these endpoints.
    // We mount the streamable HTTP transport directly at /api/mcp so the
    // single route file owns the surface.
    streamableHttpEndpoint: '/api/mcp',
    disableSse: true,
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== 'production'
  }
)

async function authedHandler(req: Request): Promise<Response> {
  // GETs (capability discovery) bypass quota — they don't run tools.
  if (req.method !== 'POST') return baseHandler(req)

  const userId = await resolveUserId(req)
  if (!userId) {
    return new Response(
      JSON.stringify({
        error: 'unauthorized',
        message:
          'Hermes MCP requires an authenticated session cookie or an x-hermes-user-id header.'
      }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    )
  }

  const quota = await requireQuota({
    userId,
    cost: 1,
    kind: 'mcp.request'
  })
  if (!quota.ok) {
    return new Response(
      JSON.stringify({ error: 'quota_exceeded', message: quota.reason }),
      { status: 429, headers: { 'content-type': 'application/json' } }
    )
  }

  return baseHandler(req)
}

export {
  authedHandler as GET,
  authedHandler as POST,
  authedHandler as DELETE
}
