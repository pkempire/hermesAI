import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth/get-current-user'

// POST /api/import  body: multipart/form-data with file, and optional { name, entityType }
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  const name = (form.get('name') as string) || 'Imported Campaign'
  const entityType = ((form.get('entityType') as string) || 'person') as 'person' | 'company'
  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

  const csv = await file.text()
  const rows = parse(csv, { columns: true, skip_empty_lines: true }) as Record<string, string>[]
  if (!rows.length) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 })

  const supabase = await createClient()

  // Create a campaign shell
  const { data: campaign, error: ce } = await supabase
    .from('campaigns')
    .insert({
      user_id: userId,
      name,
      status: 'active',
      prospect_query: { source: 'csv' },
      entity_type: entityType,
      target_count: rows.length,
      settings: { imported: true }
    })
    .select('id')
    .single()

  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  // Insert prospects
  const prospects = rows.map(r => ({
    campaign_id: campaign.id,
    email: r.email || null,
    first_name: r.first_name || null,
    last_name: r.last_name || null,
    full_name: r.full_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || null,
    company: r.company || null,
    job_title: r.job_title || null,
    linkedin_url: r.linkedin || r.linkedin_url || null,
    website: r.website || null,
    location: r.location || null,
    industry: r.industry || null,
    enrichments: {}
  }))

  // Chunk inserts for large files
  const chunkSize = 500
  for (let i = 0; i < prospects.length; i += chunkSize) {
    const chunk = prospects.slice(i, i + chunkSize)
    const { error } = await supabase.from('prospects').insert(chunk)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ campaignId: campaign.id, imported: prospects.length })
}


