import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth/get-current-user'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId || userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prospects } = await req.json()
    const params = await context.params
    const campaignId = params.id

    if (!prospects || !Array.isArray(prospects)) {
      return NextResponse.json({ error: 'Invalid prospects data' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user owns this campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Insert prospects
    const prospectData = prospects.map((p: any) => ({
      campaign_id: campaignId,
      exa_item_id: p.exaItemId || p.id,
      email: p.email,
      first_name: p.firstName,
      last_name: p.lastName,
      full_name: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
      company: p.company,
      job_title: p.jobTitle,
      linkedin_url: p.linkedinUrl,
      website: p.website,
      location: p.location,
      industry: p.industry,
      enrichments: p.enrichments || {},
      status: 'new'
    }))

    const { data, error } = await supabase
      .from('prospects')
      .insert(prospectData)
      .select()

    if (error) {
      console.error('Prospect insertion error:', error)
      return NextResponse.json({ error: 'Failed to save prospects' }, { status: 500 })
    }

    // Update campaign prospect count
    await supabase
      .from('campaigns')
      .update({
        total_prospects: data.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    return NextResponse.json({
      message: `Added ${data.length} prospects to campaign`,
      prospects: data
    })

  } catch (error) {
    console.error('Add prospects error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId || userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = await context.params
  const campaignId = params.id
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Prospects fetch error:', error)
    return NextResponse.json({ prospects: [] }, { status: 200 })
  }

  return NextResponse.json({ prospects: data || [] })
}