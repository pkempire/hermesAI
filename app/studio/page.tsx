'use client'

import { useCampaignBrief } from '@/lib/store/campaign-store'
import { InteractiveEmailDrafter } from '@/components/interactive-email-drafter'
import { useEffect, useMemo, useState } from 'react'

export default function StudioPage() {
  const { savedProspects } = useCampaignBrief()
  const [sessionProspects, setSessionProspects] = useState<any[]>([])

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem('hermes-studio-prospects') ||
        sessionStorage.getItem('hermes-latest-prospects')
      const parsed = stored ? JSON.parse(stored) : []
      if (Array.isArray(parsed)) setSessionProspects(parsed)
    } catch {}
  }, [])

  const prospects = useMemo(
    () => (savedProspects.length > 0 ? savedProspects : sessionProspects),
    [savedProspects, sessionProspects]
  )

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
      {prospects.length === 0 ? (
        <div className="rounded-xl border border-[#dfe4ee] bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-10 w-10 grid-cols-2 gap-1 rounded-lg border border-[#dfe4ee] bg-[#fbfcff] p-2">
            <span className="rounded-[3px] bg-[#315dff]" />
            <span className="rounded-[3px] bg-[#dfe4ee]" />
            <span className="rounded-[3px] bg-[#dfe4ee]" />
            <span className="rounded-[3px] bg-[#315dff]" />
          </div>
          <h3 className="text-[20px] font-bold text-[#071329]">Draft Studio is empty</h3>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-[#6a7283]">
            Save prospects from the results table or finish a search; Hermes will load the latest review queue here.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dfe4ee] bg-white shadow-sm">
          <InteractiveEmailDrafter 
            prospects={prospects}
            step={1} 
            totalSteps={1} 
          />
        </div>
      )}
    </div>
  )
}
