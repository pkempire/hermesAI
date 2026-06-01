'use client'

import { ProspectSearchSection } from './prospect-search-section'
import RetrieveSection from './retrieve-section'
import { SearchSection } from './search-section'
import { ErrorBoundary } from './error-boundary'
import { CheckCircle2, ExternalLink, Globe2 } from 'lucide-react'

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
                if (Comp) return <ErrorBoundary label="EmailDrafter"><Comp {...props} /></ErrorBoundary>
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
        <ErrorBoundary label="ProspectSearch">
          <ProspectSearchSection
            tool={tool}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
          />
        </ErrorBoundary>
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
      const businessModel = typeof siteData?.businessModel === 'string' ? siteData.businessModel.trim() : ''
      const referralHook = typeof siteData?.referralHook === 'string' ? siteData.referralHook.trim() : ''
      const searchPlanningNotes = typeof siteData?.searchPlanningNotes === 'string' ? siteData.searchPlanningNotes.trim() : ''
      const proofPoints = Array.isArray(siteData?.proofPoints)
        ? siteData.proofPoints.filter((point: any) => typeof point === 'string' && point.trim()).slice(0, 4)
        : []
      const references = Array.isArray(siteData?.references)
        ? siteData.references.filter((ref: any) => ref?.url).slice(0, 3)
        : []
      const snapshotRows = [
        ['Offer', offer],
        ['Audience', audience],
        ['Model', businessModel],
        ['Why it matters', whyItMatters],
        ['Referral angle', referralHook],
        ['Search notes', searchPlanningNotes]
      ].filter(([, value]) => value)

      return (
        <div className="rounded-xl border border-[hsl(var(--mist))] bg-white p-4 shadow-[0_8px_24px_rgba(5,18,47,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[hsl(var(--mist))] bg-[hsl(var(--soft))] text-[hsl(var(--ink))]">
              <Globe2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-[hsl(var(--ink))] tracking-tight">
                {tool.state === 'call' ? 'Reading site' : 'Offer snapshot ready'}
              </div>
              <div className="text-[12px] text-[hsl(var(--steel))]">
                {tool.state === 'call' ? 'Analyzing homepage and key pages...' : 'Homepage signals extracted for search planning'}
              </div>
            </div>
            {tool.state === 'result' && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done
              </div>
            )}
          </div>

          {tool.state === 'result' && siteData && (
            <div className="space-y-3 mt-4">
              {siteData.companyName && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[hsl(var(--mist))] bg-[hsl(var(--soft))] px-3 py-2">
                  <span className="text-[12px] font-semibold text-[hsl(var(--steel))]">Company</span>
                  <span className="text-[13px] text-[hsl(var(--ink))] font-medium">{siteData.companyName}</span>
                </div>
              )}
              {snapshotRows.length > 0 && (
                <div className="divide-y divide-[hsl(var(--mist))] rounded-lg border border-[hsl(var(--mist))] bg-white">
                  {snapshotRows.map(([label, value]) => (
                    <div key={label} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[128px_1fr] sm:gap-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--steel))]">
                        {label}
                      </div>
                      <p className="text-[13px] leading-relaxed text-[hsl(var(--ink))]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {proofPoints.length > 0 && (
                <div className="rounded-lg border border-[hsl(var(--mist))] bg-[hsl(var(--soft))] px-3 py-2.5">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--steel))]">
                    Proof points
                  </div>
                  <ul className="space-y-1.5">
                    {proofPoints.map((point: string) => (
                      <li key={point} className="flex gap-2 text-[13px] leading-relaxed text-[hsl(var(--ink))]">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--steel))]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {references.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {references.map((ref: any) => (
                    <a
                      key={ref.url}
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[hsl(var(--mist))] bg-white px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--steel))] hover:text-[hsl(var(--ink))]"
                    >
                      <span className="truncate">{ref.title || ref.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {tool.state === 'call' && (
            <div className="mt-4 flex items-center justify-center gap-3 rounded-lg border border-[hsl(var(--mist))] bg-[hsl(var(--soft))] py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--ink))] border-t-transparent" />
              <span className="text-[13px] font-medium text-[hsl(var(--ink))]">Analyzing homepage content...</span>
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
