import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function requireAuthUserId() {
  const userId = await getCurrentUserId()

  if (!userId || userId === 'anonymous') {
    return { response: unauthorizedResponse() } as const
  }

  return { userId } as const
}
