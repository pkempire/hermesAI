import { HermesApp } from '@/components/hermes-app'
import { getModels } from '@/lib/config/models'

export default async function Page() {
  const models = await getModels()
  return <HermesApp models={models} />
}
