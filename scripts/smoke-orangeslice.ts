// quick smoke test for orangeslice enrichment
// run with: bun run scripts/smoke-orangeslice.ts
import { enrichPersonData } from '@/lib/clients/orangeslice'

async function main() {
  const prospect: any = {
    id: 'test-1',
    company: 'Stripe',
    website: 'https://stripe.com',
    description: 'Online payments platform'
  }
  const ctx: any = {
    targetPersona: 'Founder or CEO',
    offer: 'Test offer',
    originalQuery: 'Find payments companies'
  }
  console.log('[smoke] enriching:', prospect.company)
  const t0 = Date.now()
  try {
    const out = await enrichPersonData(prospect, ctx)
    const dt = Date.now() - t0
    console.log(`[smoke] done in ${dt}ms`)
    console.log(JSON.stringify({
      contactName: out?.contactName,
      contactEmail: out?.contactEmail,
      contactTitle: out?.contactTitle,
      contactLinkedin: out?.contactLinkedin,
      enrichmentsCount: Array.isArray(out?.enrichments) ? out.enrichments.length : 0,
      reviewReady: out?.reviewReady
    }, null, 2))
  } catch (e: any) {
    console.error('[smoke] FAILED:', e?.message || e)
    console.error(e?.stack)
    process.exit(1)
  }
}

main()
