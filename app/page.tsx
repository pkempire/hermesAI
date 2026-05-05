/**
 * Root page.
 * Signed-out: designed landing (navy hero, pipeline cards, feature grid).
 * Signed-in:  workspace with chat input.
 */

import { LandingPage } from '@/components/landing'
import { HermesApp } from '@/components/hermes-app'
import { getModels } from '@/lib/config/models'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const models = await getModels()

  if (!user) {
    return <LandingPage />
  }

  return <HermesApp models={models} />
}
