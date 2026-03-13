import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'

type AuthorizationResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string }

export async function authorizeWebsetAccess(websetId: string): Promise<AuthorizationResult> {
  const userId = await getCurrentUserId()

  if (!userId || userId === 'anonymous') {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', userId)
    .contains('settings', { exa_webset_id: websetId } as any)
    .maybeSingle()

  if (error || !campaign) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  return { ok: true, userId }
}
