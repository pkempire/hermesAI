import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'popular'

    const supabase = await createClient()

    if (type === 'saved') {
      const userId = await getCurrentUserId()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get user's saved templates
      const { data, error } = await supabase
        .from('user_saved_templates')
        .select(`
          template_id,
          saved_at,
          prospect_templates (
            id,
            name,
            description,
            message,
            category,
            params,
            save_count,
            use_count,
            tags,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({
        templates: data?.map(item => ({
          ...item.prospect_templates,
          saved_at: item.saved_at
        })) || []
      })
    } else {
      // Get popular templates
      const { data, error } = await supabase
        .from('prospect_templates')
        .select('*')
        .eq('is_public', true)
        .order('use_count', { ascending: false })
        .limit(20)

      if (error) throw error

      return NextResponse.json({ templates: data || [] })
    }
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}