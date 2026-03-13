import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'

export async function requireAuthUser() {
  const userId = await getCurrentUserId()
  if (!userId || userId === 'anonymous') {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return {
    ok: true as const,
    userId
  }
}
