'use client'

const STARTERS = [
  {
    label: 'Event sponsor sweep',
    kicker: 'Events',
    prompt:
      'Find 30 companies sponsoring supply chain or manufacturing conferences in the US this quarter. I sell field marketing content production. Reach the VP Marketing, events lead, or demand gen leader and draft a post-event campaign pitch.'
  },
  {
    label: 'Review-pain conquest',
    kicker: 'Local sales',
    prompt:
      'Find 30 home service companies in Texas with recent reviews mentioning scheduling delays, missed appointments, or slow follow-up. I sell call answering and booking automation. Reach the owner or operations manager and draft one respectful, evidence-backed email.'
  },
  {
    label: 'Partner referral map',
    kicker: 'Partnerships',
    prompt:
      'Find 25 boutique college counseling firms in the Bay Area that serve STEM or Ivy-focused students. I run Lucid Academy, an AI and research coaching program for high school students. Reach the founder and draft a referral partnership email.'
  }
]

export function WorkspaceHome({
  onSelectPrompt
}: {
  onSelectPrompt?: (prompt: string) => void
}) {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 pb-2 pt-9 sm:px-6 md:pt-12">
      <div className="max-w-[780px]">
        <div className="mb-4 inline-flex items-center rounded-full border border-[#dfe4ee] bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#315dff] shadow-sm">
          AI GTM engineer
        </div>
        <h1 className="font-serif text-[42px] font-normal leading-[0.96] text-[hsl(var(--ink))] md:text-[62px]">
          Build the outbound engine.
        </h1>
        <p className="mt-4 max-w-[640px] text-[16px] leading-[1.55] text-[hsl(var(--steel))]">
          Describe the market, offer, and buyer. Hermes finds live accounts,
          resolves the right person, and drafts the first emails for review.
        </p>
      </div>

      <div className="mt-7 grid gap-2.5 md:grid-cols-3">
        {STARTERS.map(starter => (
          <button
            key={starter.label}
            type="button"
            onClick={() => onSelectPrompt?.(starter.prompt)}
            className="group rounded-lg border border-[#dfe4ee] bg-white/88 p-3.5 text-left shadow-[0_10px_28px_rgba(5,18,47,0.04)] transition-colors hover:border-[#aebcff] hover:bg-white"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a92a6]">
                  {starter.kicker}
                </span>
                <span className="mt-1 block truncate text-[13px] font-semibold text-[#071329]">
                  {starter.label}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-[#edf0f6] bg-[#fbfcff] px-2.5 py-1 text-[11px] font-semibold text-[#6a7283] transition-colors group-hover:border-[#315dff] group-hover:text-[#315dff]">
                Use
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
