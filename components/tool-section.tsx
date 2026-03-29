'use client'

import { ProspectSearchSection } from './prospect-search-section'
import RetrieveSection from './retrieve-section'
import { SearchSection } from './search-section'
import { VideoSearchSection } from './video-search-section'

interface ToolSectionProps {
  tool: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  addToolResult?: (params: { toolCallId: string; result: any }) => void
}

import { useEffect } from 'react'
import { campaignStore } from '@/lib/store/campaign-store'

export function ToolSection({
  tool,
  isOpen,
  onOpenChange,
  addToolResult
}: ToolSectionProps) {
  
  useEffect(() => {
    if (tool?.toolName === 'scrape_site' && tool.state === 'result') {
      try {
        const res = typeof tool.result === 'string' ? JSON.parse(tool.result) : tool.result
        const data = res?.siteData || res
        if (data?.offer || data?.targetAudience || data?.companyName) {
          campaignStore.setState({
             businessName: data.companyName || campaignStore.getState().businessName,
             offer: data.offer || campaignStore.getState().offer,
             motionIcp: data.targetAudience || campaignStore.getState().motionIcp
          })
        }
      } catch (e) {
        // no-op
      }
    }
  }, [tool])

  switch (tool.toolName) {
    case 'email_drafter':
      return (
        <div className="w-full mt-4">
          {/* Inline renderer if model calls the tool with UI props */}
          {tool?.state === 'result' && tool?.result && (() => {
            try {
              const res = typeof tool.result === 'string' ? JSON.parse(tool.result) : tool.result
              if (res?.type === 'drafter_ui') {
                const props = res.props || {}
                
                // Inject prospects from sessionStorage if not provided
                if (!props.prospects || props.prospects.length === 0) {
                  try {
                    const storedProspects = sessionStorage.getItem('hermes-latest-prospects')
                    const storedSummary = sessionStorage.getItem('hermes-search-summary')
                    if (storedProspects) {
                      props.prospects = JSON.parse(storedProspects)
                    }
                    if (storedSummary && !props.searchSummary) {
                      props.searchSummary = JSON.parse(storedSummary)
                    }
                  } catch (e) {
                    if (process.env.NODE_ENV !== 'production') {
                      console.warn('Failed to load prospects from storage:', e)
                    }
                  }
                }
                
                const { InteractiveEmailDrafter } = require('./interactive-email-drafter') as any
                const Comp = InteractiveEmailDrafter
                if (Comp) return <Comp {...props} />
              }
            } catch {}
            return null
          })()}
        </div>
      )
    case 'ask_question':
      // Render question as plain text inline - it will appear naturally in chat
      // The result is already formatted as text, so it will be shown in the answer section
      // No special UI needed - questions flow naturally in conversation
      return null
    case 'search':
      return (
        <SearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'videoSearch':
      return (
        <VideoSearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'retrieve':
      return (
        <RetrieveSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'prospect_search':
      return (
        <ProspectSearchSection
          tool={tool}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )
    case 'scrape_site':

      // Parse the result to show key insights
      let siteData = null
      try {
        const result = typeof tool.result === 'string' ? JSON.parse(tool.result) : tool.result
        // Handle both old format (siteData) and new format (direct properties)
        siteData = result?.siteData || result
        // If result has site/summary/references structure, extract useful info
        if (result?.site && result?.summary) {
          siteData = {
            ...result,
            site: result.site,
            summary: result.summary,
            companyName: result.companyName || result.site?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || ''
          }
        }
      } catch {}

      const offer = typeof siteData?.offer === 'string' ? siteData.offer.trim() : ''
      const audience = typeof siteData?.targetAudience === 'string' ? siteData.targetAudience.trim() : ''
      const whyItMatters =
        typeof siteData?.whyItMatters === 'string'
          ? siteData.whyItMatters.trim()
          : typeof siteData?.referralHook === 'string'
          ? siteData.referralHook.trim()
          : ''

      return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-gray-100/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-gray-900 tracking-tight">
                {tool.state === 'call' ? 'Reading site' : 'Offer snapshot ready'}
              </div>
              <div className="text-[13px] text-gray-500">
                {tool.state === 'call' ? 'Analyzing homepage and key pages...' : 'Homepage signals extracted for search planning'}
              </div>
            </div>
            {tool.state === 'result' && (
              <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                ✓ Done
              </div>
            )}
          </div>

          {tool.state === 'result' && siteData && (
            <div className="space-y-3 mt-4">
              {siteData.companyName && (
                <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-[13px] font-semibold text-gray-600">Company:</span>
                  <span className="text-[13px] text-gray-900 font-medium">{siteData.companyName}</span>
                </div>
              )}
              {(offer || audience || whyItMatters) && (
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-50">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Offer Snapshot</div>
                  <div className="space-y-4">
                    {offer ? (
                      <div>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--hermes-gold-dark))]">Offer</div>
                        <p className="text-[14px] leading-relaxed text-gray-700">{offer}</p>
                      </div>
                    ) : null}
                    {audience ? (
                      <div>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--hermes-gold-dark))]">Audience</div>
                        <p className="text-[14px] leading-relaxed text-gray-700">{audience}</p>
                      </div>
                    ) : null}
                    {whyItMatters ? (
                      <div>
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--hermes-gold-dark))]">Why Hermes cares</div>
                        <p className="text-[14px] leading-relaxed text-gray-700">{whyItMatters}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {tool.state === 'call' && (
            <div className="mt-4 flex items-center justify-center gap-3 rounded-xl bg-gray-50 py-3 border border-gray-100">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-[13px] font-medium text-blue-600">Analyzing homepage content...</span>
            </div>
          )}
        </div>
      )
    default:
      // Generic fallback renderer so the user sees what's happening for unknown tools
      const resultText = (() => {
        try {
          if (typeof (tool as any).result === 'string') return (tool as any).result
          if ((tool as any).result) return JSON.stringify((tool as any).result, null, 2)
        } catch {}
        return undefined
      })()
      return (
        <div className="rounded-md border p-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="font-medium">{tool.toolName}</div>
            <div className="text-muted-foreground">{tool.state === 'call' ? 'Working…' : 'Done'}</div>
          </div>
          {resultText && (
            <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] opacity-90">
              {resultText}
            </pre>
          )}
        </div>
      )
  }
}
