import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 *
 * Production readiness probe. Returns 200 if all dependencies respond,
 * 503 otherwise. Each subsystem reported individually so dashboards can
 * show partial degradation.
 *
 * Public endpoint — does not leak secrets, just up/down status. Useful
 * for uptime monitors and Vercel deployment verification.
 */
export async function GET() {
  const start = Date.now()
  const checks: Record<string, { ok: boolean; ms: number; error?: string }> = {}

  async function check(name: string, fn: () => Promise<unknown>) {
    const t0 = Date.now()
    try {
      await fn()
      checks[name] = { ok: true, ms: Date.now() - t0 }
    } catch (err) {
      checks[name] = {
        ok: false,
        ms: Date.now() - t0,
        error: err instanceof Error ? err.message.slice(0, 200) : String(err)
      }
    }
  }

  // Run checks in parallel
  await Promise.all([
    check('supabase', async () => {
      const sb = await createClient()
      const { error } = await sb.from('subscriptions').select('user_id').limit(1)
      if (error) throw error
    }),
    check('exa', async () => {
      if (!process.env.EXA_API_KEY) throw new Error('EXA_API_KEY missing')
      // Cheap auth probe: list websets, limit 1
      const r = await fetch('https://api.exa.ai/websets/v0/websets?limit=1', {
        headers: { 'x-api-key': process.env.EXA_API_KEY }
      })
      if (!r.ok) throw new Error(`exa ${r.status}`)
    }),
    check('orangeslice', async () => {
      if (!process.env.ORANGESLICE_API_KEY) throw new Error('ORANGESLICE_API_KEY missing')
    }),
    check('openai', async () => {
      if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing')
    }),
    check('stripe', async () => {
      const k = process.env.STRIPE_SECRET_KEY
      if (!k) throw new Error('STRIPE_SECRET_KEY missing')
      if (k.includes('*')) throw new Error('STRIPE_SECRET_KEY is placeholder')
    })
  ])

  const allOk = Object.values(checks).every(c => c.ok)
  return NextResponse.json(
    {
      ok: allOk,
      ms: Date.now() - start,
      checks,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV
    },
    { status: allOk ? 200 : 503 }
  )
}
