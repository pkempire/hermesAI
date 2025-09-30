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

export async function createGmailDraftRaw(userId: string, raw: string) {
  const tokens = await getGmailTokens(userId)
  if (!tokens?.access_token) throw new Error('No Gmail token')
  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: { raw } })
  })
  if (!resp.ok) throw new Error(`Gmail draft failed: ${resp.status}`)
  return await resp.json()
}

export async function sendGmailRaw(userId: string, raw: string) {
  const tokens = await getGmailTokens(userId)
  if (!tokens?.access_token) throw new Error('No Gmail token')
  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  })
  if (!resp.ok) throw new Error(`Gmail send failed: ${resp.status}`)
  return await resp.json()
}

export function toBase64Url(str: string) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}


