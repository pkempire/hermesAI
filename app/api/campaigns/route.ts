import { requireAuthUser } from '@/lib/auth/require-auth-user'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const auth = await requireAuthUser()
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      id, name, status, created_at, target_count, total_prospects, emails_sent,
      prospects(id, email, first_name, last_name, company, status)
    `)
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Campaign fetch error:', error)
    return NextResponse.json({ campaigns: [] }, { status: 200 })
  }

  return NextResponse.json({ campaigns: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUser()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()
    const { name, prospect_query, entity_type = 'person', target_count = 10 } = body

    if (!name || !prospect_query) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: auth.userId,
        name,
        prospect_query,
        entity_type,
        target_count,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Campaign creation error:', error)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign: data })
  } catch (error) {
    console.error('Campaign POST error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
