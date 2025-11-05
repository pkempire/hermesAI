import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { sendGmailRaw, toBase64Url } from '@/lib/clients/gmail'
import { checkRateLimit, emailSendRateLimit, getRateLimitErrorMessage } from '@/lib/utils/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId || userId === 'anonymous') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check rate limit for email sending
  const rateLimitResult = await checkRateLimit(userId, emailSendRateLimit)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: getRateLimitErrorMessage('email sending', rateLimitResult.reset),
        retryAfter: rateLimitResult.reset
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
        }
      }
    )
  }

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


