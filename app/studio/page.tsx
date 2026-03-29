'use client'

import { useCampaignBrief } from '@/lib/store/campaign-store'
import { ProspectCard } from '@/components/prospect-card'
import { InteractiveEmailDrafter } from '@/components/interactive-email-drafter'
import { FolderOpen } from 'lucide-react'

export default function StudioPage() {
  const { savedProspects } = useCampaignBrief()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-10 px-4 md:px-8">
      {/* Header section */}
      {/* Header section (removed to let InteractiveEmailDrafter take over) */}

      {savedProspects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 py-24 shadow-sm">
          <FolderOpen className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="font-serif text-[1.8rem] text-gray-900">Studio is empty</h3>
          <p className="text-[14px] text-gray-500 mt-2">Add prospects to the studio from the chat interface to edit their drafts.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {/* Top section: Full Prospect Cards */}
        <div className="flex flex-col flex-1 h-full min-h-0 bg-gray-50/30 rounded-3xl overflow-hidden mt-6 shadow-sm border border-gray-100">
          <InteractiveEmailDrafter 
            prospects={savedProspects} 
            step={1} 
            totalSteps={1} 
          />
        </div>
        </div>
      )}
    </div>
  )
}
