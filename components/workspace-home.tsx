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

const RUN_STEPS = [
  { label: 'Brief', tone: 'bg-[#315dff]' },
  { label: 'Source', tone: 'bg-[#12b981]' },
  { label: 'Resolve', tone: 'bg-[#d38a00]' },
  { label: 'Draft', tone: 'bg-[#071329]' }
]

const RUN_FACTS = [
  ['live', 'web'],
  ['verified', 'people'],
  ['review', 'send']
]

export function WorkspaceHome({
  onSelectPrompt
}: {
  onSelectPrompt?: (prompt: string) => void
}) {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 pb-3 pt-5 sm:px-6 md:pt-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
        <div className="text-center lg:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dfe4ee] bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#315dff] shadow-sm">
            <span className="grid h-4 w-4 grid-cols-2 gap-0.5 rounded-[5px] bg-[#edf1ff] p-1">
              <span className="rounded-[1px] bg-[#315dff]" />
              <span className="rounded-[1px] bg-[#12b981]" />
              <span className="rounded-[1px] bg-[#d38a00]" />
              <span className="rounded-[1px] bg-[#071329]" />
            </span>
            New GTM motion
          </div>
          <h1 className="max-w-[720px] font-serif text-[42px] font-normal leading-[0.96] text-[hsl(var(--ink))] md:text-[58px]">
            Build the outbound engine.
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.45] text-[hsl(var(--steel))] lg:mx-0">
            One brief. Live accounts. Review-ready emails.
          </p>
        </div>

        <div className="hidden rounded-lg border border-[#dfe4ee] bg-white/85 p-4 shadow-[0_18px_48px_rgba(5,18,47,0.06)] lg:block">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6a7283]">
              Run map
            </p>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              guided
            </span>
          </div>
          <div className="rounded-md border border-[#edf0f6] bg-[#fbfcff] p-3">
            <div className="grid grid-cols-4 gap-2">
              {RUN_STEPS.map((step, index) => (
                <div key={step.label} className="min-w-0">
                  <span className="flex h-9 items-center rounded-md border border-[#dfe4ee] bg-white px-2 shadow-sm">
                    <span className={`mr-2 h-2 w-2 rounded-full ${step.tone}`} />
                    <span className="truncate text-[11px] font-semibold text-[#071329]">
                      {step.label}
                    </span>
                  </span>
                  {index < RUN_STEPS.length - 1 && (
                    <span className="mx-auto mt-2 block h-0.5 w-[72%] rounded-full bg-[#dfe4ee]" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-6 gap-1">
              {Array.from({ length: 18 }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full ${
                    index % 5 === 0
                      ? 'bg-[#315dff]'
                      : index % 4 === 0
                      ? 'bg-[#12b981]'
                      : 'bg-[#dfe4ee]'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {RUN_FACTS.map(([value, label]) => (
              <div key={label} className="rounded-md border border-[#edf0f6] bg-white px-3 py-2 text-center">
                <div className="text-[12px] font-semibold capitalize text-[#071329]">{value}</div>
                <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a92a6]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 md:grid-cols-3">
        {STARTERS.map(starter => (
          <button
            key={starter.label}
            type="button"
            onClick={() => onSelectPrompt?.(starter.prompt)}
            className="group rounded-lg border border-[#dfe4ee] bg-white/85 p-3 text-left shadow-[0_10px_28px_rgba(5,18,47,0.04)] transition-colors hover:border-[#bfc9ff] hover:bg-white"
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
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#edf0f6] bg-[#fbfcff] transition-colors group-hover:border-[#bfc9ff]">
                <span className="h-2 w-2 rounded-full bg-[#315dff] transition-transform group-hover:translate-x-0.5" />
                <span className="absolute right-2.5 h-px w-3 bg-[#315dff] opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
