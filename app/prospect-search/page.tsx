import { ProspectSearchBuilder } from '@/components/prospect-search-builder'

export default function ProspectSearchPage() {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border border-black/5 bg-white/70 px-6 py-8 shadow-[0_24px_80px_rgba(62,45,18,0.08)] backdrop-blur-sm md:px-8">
          <div className="text-[11px] uppercase tracking-[0.32em] text-black/40">Prospecting Studio</div>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-gray-950 md:text-5xl">
            Build a prospect list with a sharper brief.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-black/65 md:text-base">
            Configure your target, stage the enrichments, and review results in a workspace that feels more like an operator console than a form.
          </p>
        </div>
        <ProspectSearchBuilder />
      </div>
    </div>
  )
}
