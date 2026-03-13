import { requireAuthUserId } from '@/lib/auth/require-auth-user'
import { createGmailDraftRaw, toBase64Url } from '@/lib/clients/gmail'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const auth = await requireAuthUserId()
  if ('response' in auth) return auth.response

  const { userId } = auth
  const { to, subject, body } = await req.json()
  if (!to || !subject || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const raw = toBase64Url(`From: me
To: ${to}
Subject: ${subject}
Content-Type: text/html; charset=UTF-8

${body}`)
  try {
    const draft = await createGmailDraftRaw(userId, raw)
    return NextResponse.json({ draft })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
