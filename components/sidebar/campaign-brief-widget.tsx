'use client'

import { campaignStore, useCampaignBrief } from '@/lib/store/campaign-store'
import { Check, Edit2, Target } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function CampaignBriefWidget() {
  const brief = useCampaignBrief()
  const [editingField, setEditingField] = useState<keyof typeof brief | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (field: keyof typeof brief, currentValue: string | number) => {
    setEditingField(field)
    setEditValue(currentValue.toString())
  }

  const saveEdit = () => {
    if (!editingField) return

    let finalValue: string | number = editValue
    if (editingField === 'prospectsTarget') {
      finalValue = parseInt(editValue, 10) || 0
    }

    campaignStore.setState({ [editingField]: finalValue })
    setEditingField(null)
    toast.success(`Updated ${editingField.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    }
  }

  // If there's no data at all yet, we can show a placeholder or just a clean empty state
  const hasData = brief.businessName || brief.offer || brief.motionIcp

  return (
    <div className="mt-4 rounded-xl border border-[hsl(var(--hermes-gold))]/20 bg-white p-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--hermes-gold))]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--hermes-gold))] mb-4 relative z-10">
        <Target className="h-3.5 w-3.5" />
        Campaign Brief
      </div>

      <div className="space-y-4 relative z-10">
        {/* Business Name */}
        <div className="group">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex justify-between items-center">
            Business Name
            {!editingField && <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-[hsl(var(--hermes-gold))]" onClick={() => startEdit('businessName', brief.businessName)} />}
          </div>
          {editingField === 'businessName' ? (
            <div className="flex gap-2 mt-1">
              <input 
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                className="w-full text-[13px] font-medium text-gray-900 border-b border-[hsl(var(--hermes-gold))]/30 focus:border-[hsl(var(--hermes-gold))] outline-none bg-transparent pb-1"
              />
            </div>
          ) : (
            <div 
              className="text-[13px] font-medium text-gray-900 mt-1 cursor-pointer truncate"
              onClick={() => startEdit('businessName', brief.businessName)}
            >
              {brief.businessName || <span className="text-gray-300 italic">Listening...</span>}
            </div>
          )}
        </div>

        {/* Offer */}
        <div className="group">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex justify-between items-center">
            Core Offer
            {!editingField && <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-[hsl(var(--hermes-gold))]" onClick={() => startEdit('offer', brief.offer)} />}
          </div>
          {editingField === 'offer' ? (
            <div className="flex gap-2 mt-1">
              <textarea 
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                rows={2}
                className="w-full text-[13px] font-medium text-gray-900 border rounded-md border-[hsl(var(--hermes-gold))]/30 focus:border-[hsl(var(--hermes-gold))] outline-none p-2 resize-none"
              />
            </div>
          ) : (
            <div 
              className="text-[13px] font-medium text-gray-600 mt-1 cursor-pointer leading-tight line-clamp-3"
              onClick={() => startEdit('offer', brief.offer)}
            >
              {brief.offer || <span className="text-gray-300 italic">Listening...</span>}
            </div>
          )}
        </div>

        {/* ICP & Motion */}
        <div className="group">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex justify-between items-center">
            Motion / ICP
            {!editingField && <Edit2 className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-[hsl(var(--hermes-gold))]" onClick={() => startEdit('motionIcp', brief.motionIcp)} />}
          </div>
          {editingField === 'motionIcp' ? (
            <div className="flex gap-2 mt-1">
              <textarea 
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                rows={2}
                className="w-full text-[13px] font-medium text-gray-900 border rounded-md border-[hsl(var(--hermes-gold))]/30 focus:border-[hsl(var(--hermes-gold))] outline-none p-2 resize-none"
              />
            </div>
          ) : (
            <div 
              className="text-[13px] font-medium text-gray-600 mt-1 cursor-pointer leading-tight line-clamp-3"
              onClick={() => startEdit('motionIcp', brief.motionIcp)}
            >
              {brief.motionIcp || <span className="text-gray-300 italic">Listening...</span>}
            </div>
          )}
        </div>

        {hasData && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase">
            <span>Prospect Target</span>
            <span className="text-[hsl(var(--hermes-gold-dark))] font-bold">{brief.prospectsTarget || '--'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
