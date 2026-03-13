import { createClient } from '@/lib/supabase/server'

export async function canAccessWebset(userId: string, websetId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', userId)
    .contains('settings', { exa_webset_id: websetId } as any)
    .limit(1)

  if (error) {
    return false
  }

  return Boolean(data && data.length > 0)
}
