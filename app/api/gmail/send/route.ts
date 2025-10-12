import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { sendGmailRaw, toBase64Url } from '@/lib/clients/gmail'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId || userId === 'anonymous') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { to, subject, body } = await req.json()
  if (!to || !subject || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const raw = toBase64Url(`From: me\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/html; charset=UTF-8\n\n${body}`)
  try {
    const sent = await sendGmailRaw(userId, raw)
    return NextResponse.json({ sent })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


