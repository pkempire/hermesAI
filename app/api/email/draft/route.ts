import { generatePersonalizedEmail } from '@/lib/clients/openai-query-optimizer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prospect, template, campaignContext } = await req.json()
    const draft = await generatePersonalizedEmail(prospect, template, campaignContext || '')
    return NextResponse.json({ draft })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


