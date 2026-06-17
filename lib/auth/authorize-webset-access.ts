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

  if (data && data.length > 0) return true

  const { data: runData, error: runError } = await supabase
    .from('campaign_runs')
    .select('id')
    .eq('user_id', userId)
    .eq('webset_id', websetId)
    .limit(1)

  if (runError) {
    return false
  }

  return Boolean(runData && runData.length > 0)
}
