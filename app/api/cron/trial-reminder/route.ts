import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Idempotent daily cron that finds trials expiring in ~48 hours and marks for reminder.
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
  const nowIso = now.toISOString()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id, trial_expires_at, metadata')
    .gt('trial_expires_at', nowIso)
    .lte('trial_expires_at', in48h)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Here we would enqueue emails; for now we tag metadata so the app can surface a banner
  for (const row of data || []) {
    const meta = { ...(row.metadata || {}), trial_reminder_scheduled_at: nowIso }
    await supabase.from('subscriptions').update({ metadata: meta }).eq('user_id', row.user_id)
  }

  return NextResponse.json({ scheduled: (data || []).length })
}


