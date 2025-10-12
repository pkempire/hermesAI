import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { templateId } = await req.json()

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Increment use count
    const { error } = await supabase.rpc('increment_template_uses', {
      template_id: templateId
    })

    if (error) throw error

    return NextResponse.json({ message: 'Template usage tracked' })
  } catch (error) {
    console.error('Error tracking template usage:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}