import { enrichPersonData } from '@/lib/clients/orangeslice'

async function main() {
  const prospect: any = {
    id: 'test-1',
    company: 'Stripe',
    website: 'https://stripe.com',
    description: 'Online payments platform',
    enrichments: [
      { title: 'Company LinkedIn', result: 'https://www.linkedin.com/company/stripe/' }
    ]
  }
  const ctx: any = {
    targetPersona: 'VP of Engineering',
    offer: 'AI infrastructure tooling',
    originalQuery: 'Find payments platforms hiring AI engineers'
  }
  console.log('[smoke] enriching:', prospect.company, 'with seed LinkedIn:', prospect.enrichments[0].result)
  const t0 = Date.now()
  try {
    const out = await enrichPersonData(prospect, ctx)
    const dt = Date.now() - t0
    console.log(`[smoke] done in ${dt}ms`)
    console.log(JSON.stringify({
      fullName: out?.fullName,
      jobTitle: out?.jobTitle,
      email: out?.email,
      linkedinUrl: out?.linkedinUrl,
      enrichmentsCount: Array.isArray(out?.enrichments) ? out.enrichments.length : 0,
      enrichments: out?.enrichments,
      reviewReady: out?.reviewReady
    }, null, 2))
  } catch (e: any) {
    console.error('[smoke] FAILED:', e?.message || e)
    console.error(e?.stack)
    process.exit(1)
  }
}

main()
