import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { createGmailDraftRaw, createRawEmail } from '@/lib/clients/gmail'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { to, subject, body } = await req.json()
  if (!to || !subject || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const raw = createRawEmail({ to, subject, body, html: true })
  try {
    const draft = await createGmailDraftRaw(userId, raw)
    return NextResponse.json({ draft })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

