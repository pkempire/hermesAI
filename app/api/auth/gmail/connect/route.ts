import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId || userId === 'anonymous') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Gmail integration not configured' }, { status: 500 })
  }

  const requestOrigin = new URL(req.url).origin
  const appOrigin = process.env.NEXTAUTH_URL || requestOrigin
  const redirectUri = `${appOrigin}/api/auth/gmail/callback`
  const scopes = [
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ')

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.append('client_id', clientId)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', scopes)
  authUrl.searchParams.append('access_type', 'offline')
  authUrl.searchParams.append('prompt', 'consent')
  authUrl.searchParams.append('state', userId)

  return NextResponse.redirect(authUrl.toString())
}
