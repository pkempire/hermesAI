'use client'

import { Search } from 'lucide-react'
import { memo } from 'react'

interface ProspectSearchEmptyProps {
  /** When true, the tool finished resolving but produced no UI props yet. */
  ready?: boolean
}

/** Idle / loading shell while the configuration tool result is being computed. */
function ProspectSearchEmptyImpl({ ready }: ProspectSearchEmptyProps) {
  if (ready) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-[14px] font-medium text-gray-500">
          Ready to search for prospects. The search will execute automatically.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 mt-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm border border-gray-100">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-gray-900">Configuring search</p>
          <p className="text-[13px] text-gray-500 mt-1">
            Shaping the builder from your brief and offer.
          </p>
        </div>
      </div>
    </div>
  )
}

export const ProspectSearchEmpty = memo(ProspectSearchEmptyImpl)
