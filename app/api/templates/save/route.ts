import { createClient } from '@/lib/supabase/server'
import { requireAuthUserId } from '@/lib/auth/require-auth-user'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthUserId()
    if ('response' in auth) return auth.response

    const { userId } = auth

    const { templateId } = await req.json()

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if already saved
    const { data: existing } = await supabase
      .from('user_saved_templates')
      .select('id')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .single()

    if (existing) {
      return NextResponse.json({ message: 'Template already saved' })
    }

    // Save template
    const { error } = await supabase
      .from('user_saved_templates')
      .insert({
        user_id: userId,
        template_id: templateId
      })

    if (error) throw error

    // Increment save count
    await supabase.rpc('increment_template_saves', { template_id: templateId })

    return NextResponse.json({ message: 'Template saved successfully' })
  } catch (error) {
    console.error('Error saving template:', error)
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuthUserId()
    if ('response' in auth) return auth.response

    const { userId } = auth

    const { searchParams } = new URL(req.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Remove from saved templates
    const { error } = await supabase
      .from('user_saved_templates')
      .delete()
      .eq('user_id', userId)
      .eq('template_id', templateId)

    if (error) throw error

    // Decrement save count
    await supabase.rpc('decrement_template_saves', { template_id: templateId })

    return NextResponse.json({ message: 'Template removed successfully' })
  } catch (error) {
    console.error('Error removing template:', error)
    return NextResponse.json(
      { error: 'Failed to remove template' },
      { status: 500 }
    )
  }
}
