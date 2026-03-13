import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { requireAuthUser } from '@/lib/auth/require-auth-user'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const auth = await requireAuthUser()
  if (!auth.ok) {
    return auth.response
  }

  const { campaignId } = await params
  const currentUserId = await getCurrentUserId()
  if (!currentUserId || currentUserId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', currentUserId)
    .maybeSingle()

  if (campaignError) return NextResponse.json({ error: campaignError.message }, { status: 500 })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const { data: rows, error } = await supabase
    .from('prospects')
    .select('full_name,first_name,last_name,email,company,job_title,linkedin_url,website,location,industry')
    .eq('campaign_id', campaignId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = ['full_name','first_name','last_name','email','company','job_title','linkedin_url','website','location','industry']
  const csvLines = [headers.join(',')]
  for (const r of rows || []) {
    const line = headers.map(h => (r as any)[h] ? String((r as any)[h]).replaceAll('"','""') : '').map(v => `"${v}"`).join(',')
    csvLines.push(line)
  }
  const csv = csvLines.join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=campaign_${campaignId}.csv`
    }
  })
}

