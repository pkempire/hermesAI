import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/trial-reminder
 *
 * Daily cron that finds trials expiring in ~48 hours and tags metadata so
 * the app can surface a "trial ending soon" banner. (Email send TBD.)
 *
 * Auth: Vercel Cron requires `Authorization: Bearer ${CRON_SECRET}`
 * which is automatically injected for cron-scheduled invocations. Any
 * non-cron request gets a 401. See:
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
  const nowIso = now.toISOString()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id, trial_expires_at, metadata')
    .gt('trial_expires_at', nowIso)
    .lte('trial_expires_at', in48h)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  for (const row of data || []) {
    const meta = {
      ...(row.metadata || {}),
      trial_reminder_scheduled_at: nowIso
    }
    await supabase.from('subscriptions').update({ metadata: meta }).eq('user_id', row.user_id)
  }

  return NextResponse.json({ scheduled: (data || []).length })
}
