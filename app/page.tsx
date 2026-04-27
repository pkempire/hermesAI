/**
 * Root page — same workspace for everyone.
 *
 * If signed out, the chat input renders as a single "Start 7-day trial —
 * Continue with Google" CTA. After auth we land back on `/` with a real
 * trial row in `subscriptions` (provisioned by app/auth/oauth/route.ts) and
 * the chat input becomes interactive. Same layout shift-free experience.
 */

import { HermesApp } from '@/components/hermes-app'
import { getModels } from '@/lib/config/models'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const models = await getModels()
  return <HermesApp models={models} signedIn={!!user} />
}
