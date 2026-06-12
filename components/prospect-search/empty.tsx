'use client'

import { memo } from 'react'

interface ProspectSearchEmptyProps {
  /** When true, the tool finished resolving but produced no UI props yet. */
  ready?: boolean
}

/** Idle / loading shell while the configuration tool result is being computed. */
function ProspectSearchEmptyImpl({ ready }: ProspectSearchEmptyProps) {
  const bars = ready
    ? ['bg-[#12b981]', 'bg-[#12b981]', 'bg-[#dfe4ee]', 'bg-[#dfe4ee]']
    : ['bg-[#315dff]', 'bg-[#bfc9ff]', 'bg-[#dfe4ee]', 'bg-[#dfe4ee]']

  return (
    <div className="rounded-lg border border-[#edf0f6] bg-[#fbfcff] px-3 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 grid-cols-2 gap-1 rounded-md border border-[#dfe4ee] bg-white p-1.5 shadow-sm">
            {bars.map((tone, index) => (
              <span
                key={index}
                className={`rounded-[2px] ${tone} ${!ready && index === 0 ? 'animate-pulse' : ''}`}
              />
            ))}
          </span>
          <p className="text-[12px] font-semibold text-[#46506a]">
            {ready ? 'Run queued' : 'Preparing run'}
          </p>
        </div>
        <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-[#edf0f6] sm:block">
          <div className={`h-full rounded-full ${ready ? 'w-2/3 bg-[#12b981]' : 'w-1/3 bg-[#315dff]'}`} />
        </div>
      </div>
    </div>
  )
}

export const ProspectSearchEmpty = memo(ProspectSearchEmptyImpl)
