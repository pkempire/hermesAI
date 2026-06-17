import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function hasSupabaseAdminCredentials() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase service-role credentials missing')
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
