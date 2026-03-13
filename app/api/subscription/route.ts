import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuthUser } from '@/lib/auth/require-auth-user'

export async function GET(_req: NextRequest) {
  const auth = await requireAuthUser()
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data } = await supabase.from('subscriptions').select('quota_monthly, used_this_month, trial_expires_at').eq('user_id', auth.userId).maybeSingle()
  const quota = data?.quota_monthly ?? 0
  const used = data?.used_this_month ?? 0
  const remaining = Math.max(0, quota - used)
  return NextResponse.json({ remaining, trial_expires_at: data?.trial_expires_at || null })
}

