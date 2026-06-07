'use client'

export function WorkspaceHome() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-4 pt-6 text-center sm:px-6 md:pt-8">
      <p className="mb-3 text-[11px] font-semibold uppercase text-[#315dff]">
        New GTM motion
      </p>
      <h1 className="text-[34px] font-semibold leading-[1.08] text-[hsl(var(--ink))] md:text-[44px]">
        Build the outbound engine.
      </h1>
      <p className="mx-auto mt-3 max-w-[610px] text-[14px] leading-[1.6] text-[hsl(var(--steel))]">
        Tell Hermes your offer, target market, buyer, geography, and constraints.
        It will read the site when needed, map source-backed accounts, enrich
        people, and draft the first emails for review.
      </p>
    </section>
  )
}
