import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth/get-current-user'

export async function GET(_req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ campaigns: [] }, { status: 200 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('id,name,status,created_at,target_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ campaigns: [] }, { status: 200 })
  return NextResponse.json({ campaigns: data || [] })
}


