import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuthUserId } from '@/lib/auth/require-auth-user'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUserId()
  if ('response' in auth) return auth.response

  const { userId } = auth
  const { id } = await params
  const body = await req.json()
  const supabase = await createClient()
  const { error } = await supabase
    .from('campaigns')
    .update({ email_sequence: body?.sequence || [] })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
