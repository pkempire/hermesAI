/**
 * Root page.
 *
 * Server-renders the right surface based on auth:
 *   - Signed out → <SignedOutLanding />: marketing-only landing with a
 *     single Google CTA. No chat input, no internal product surface.
 *   - Signed in → <HermesApp />: the working chat workspace.
 *
 * This split was the source of the "is this a landing page or an app?"
 * confusion — fixing it forces a clean onboarding flow and lets us tune
 * each surface independently.
 */

import { HermesApp } from '@/components/hermes-app'
import { SignedOutLanding } from '@/components/marketing/signed-out-landing'
import { getModels } from '@/lib/config/models'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return <SignedOutLanding />
  }

  const models = await getModels()
  return <HermesApp models={models} />
}
