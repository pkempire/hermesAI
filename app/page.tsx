/**
 * Root page.
 * Signed-out: designed landing (navy hero, pipeline cards, feature grid).
 * Signed-in:  workspace with chat input.
 */

import { LandingPage } from '@/components/landing'
import { HermesAppLoader } from '@/components/hermes-app-loader'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  return <HermesAppLoader />
}
