import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface SharePageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata(
  props: SharePageProps
): Promise<Metadata> {
  // Chat sharing is disabled in HermesAI
  return notFound()
}

export default async function SharePage(props: SharePageProps) {
  // Chat sharing is disabled in HermesAI
  return notFound()
}
