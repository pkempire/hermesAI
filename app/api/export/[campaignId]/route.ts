import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const supabase = await createClient()

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


