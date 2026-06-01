'use client'

export function WorkspaceHome() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-3 pt-6 text-center sm:px-6 md:pt-8">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--steel))]">
        GTM workflow
      </p>
      <h1 className="text-[clamp(1.85rem,4vw,2.65rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-[hsl(var(--ink))]">
        Describe the market.
        <br className="hidden sm:block" /> Review the evidence.
      </h1>
      <p className="mx-auto mt-3 max-w-[610px] text-[14px] leading-[1.6] text-[hsl(var(--steel))]">
        Paste a messy GTM idea, choose a template below, or describe the
        market, buyer, offer, and constraints in plain English. Hermes will map
        sources, enrich prospects, and keep drafts review-first.
      </p>
    </section>
  )
}
