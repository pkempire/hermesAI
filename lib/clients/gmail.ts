import { createClient } from '@/lib/supabase/server'

export interface GmailTokens {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

export async function getGmailTokens(userId: string): Promise<GmailTokens | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gmail_credentials')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return null
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || undefined,
    expires_at: data.expires_at ? new Date(data.expires_at).getTime() : undefined
  }
}

export async function saveGmailTokens(userId: string, tokens: GmailTokens) {
  const supabase = await createClient()
  await supabase
    .from('gmail_credentials')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at ? new Date(tokens.expires_at) : null
    }, { onConflict: 'user_id' })
}

async function refreshGmailAccessToken(userId: string, refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to refresh Gmail token: ${response.status}`)
  }

  const tokens = await response.json()
  const nextTokens: GmailTokens = {
    access_token: tokens.access_token,
    refresh_token: refreshToken,
    expires_at: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined
  }

  await saveGmailTokens(userId, nextTokens)
  return nextTokens
}

async function getValidGmailAccessToken(userId: string) {
  const tokens = await getGmailTokens(userId)
  if (!tokens?.access_token) {
    throw new Error('No Gmail token')
  }

  const expiresSoon =
    typeof tokens.expires_at === 'number' &&
    tokens.expires_at <= Date.now() + 60_000

  if ((expiresSoon || !tokens.access_token) && tokens.refresh_token) {
    const refreshed = await refreshGmailAccessToken(userId, tokens.refresh_token)
    return refreshed.access_token
  }

  return tokens.access_token
}

async function gmailRequest(userId: string, path: string, body: Record<string, any>) {
  let accessToken = await getValidGmailAccessToken(userId)

  const send = async (token: string) =>
    fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

  let response = await send(accessToken)

  if (response.status === 401) {
    const tokens = await getGmailTokens(userId)
    if (!tokens?.refresh_token) {
      throw new Error('Gmail authorization expired')
    }

    const refreshed = await refreshGmailAccessToken(userId, tokens.refresh_token)
    accessToken = refreshed.access_token
    response = await send(accessToken)
  }

  if (!response.ok) {
    throw new Error(`Gmail request failed: ${response.status}`)
  }

  return response.json()
}

export async function createGmailDraftRaw(userId: string, raw: string) {
  return gmailRequest(userId, 'drafts', { message: { raw } })
}

export async function sendGmailRaw(userId: string, raw: string) {
  return gmailRequest(userId, 'messages/send', { raw })
}

export function toBase64Url(str: string) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

