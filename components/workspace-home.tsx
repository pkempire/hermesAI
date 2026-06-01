'use client'

export function WorkspaceHome() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-2 pt-10 sm:px-6 md:pt-14">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--steel))]">
        New campaign
      </p>
      <h1 className="text-[clamp(1.75rem,4vw,2.35rem)] font-semibold leading-[1.06] text-[hsl(var(--ink))]">
        Who do you want to reach?
      </h1>
      <p className="mt-3 max-w-[620px] text-[14px] leading-[1.55] text-[hsl(var(--steel))]">
        Paste a messy GTM idea, choose a template below, or describe the
        market, buyer, offer, and constraints in plain English. Hermes will
        keep the run review-first before any email leaves your account.
      </p>
    </section>
  )
}
