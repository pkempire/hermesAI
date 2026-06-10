'use client'

import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  ArrowRight,
  Building,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  Users
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import { campaignStore } from '@/lib/store/campaign-store'
import {
  getContactLookupStatus,
  getProspectContactFields
} from '@/lib/prospects/contact-fields'
import type { ContactLookupStatus } from '@/lib/prospects/contact-fields'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Prospect {
  id: string
  exaItemId?: string
  fullName: string
  jobTitle?: string
  company?: string
  email?: string
  contactEmail?: string
  linkedinUrl?: string
  contactLinkedinUrl?: string
  personLinkedinUrl?: string
  companyLinkedinUrl?: string
  phone?: string
  contactPhone?: string
  location?: string
  industry?: string
  companySize?: string
  website?: string
  enrichments?: Record<string, any>
  contactLookupStatus?: ContactLookupStatus
  contactLookupMessage?: string
  contactLookupCompletedAt?: string
  enrichmentError?: string
  note?: string
  hermesTake?: {
    whyFit: string
    outreachAngle: string
    evidence: string[]
  }
  reviewReady?: boolean
  avatarUrl?: string
  companyLogoUrl?: string
  /** URL of the page Exa found/indexed to surface this prospect */
  sourceUrl?: string
  /** Raw text excerpt Exa extracted from the source page */
  exaText?: string
}

function getContactStatusMeta(prospect: Prospect, isEnriching?: boolean) {
  const fields = getProspectContactFields(prospect)
  const status = getContactLookupStatus(prospect, isEnriching)

  if (status === 'searching') {
    return {
      label: 'Finding contact',
      className: 'border-[#cbd4ff] bg-[#edf1ff] text-[#315dff]',
      icon: Loader2,
      spinning: true
    }
  }

  if (status === 'failed') {
    return {
      label: 'Lookup failed',
      className: 'border-red-100 bg-red-50 text-red-700',
      icon: AlertCircle,
      spinning: false
    }
  }

  if (fields.email) {
    return {
      label: 'Email found',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      icon: CheckCircle2,
      spinning: false
    }
  }

  if (fields.phone) {
    return {
      label: 'Phone found',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      icon: Phone,
      spinning: false
    }
  }

  if (fields.personLinkedIn || fields.fullName) {
    return {
      label: 'Person found',
      className: 'border-blue-100 bg-blue-50 text-blue-700',
      icon: User,
      spinning: false
    }
  }

  if (status === 'no_contact') {
    return {
      label: 'No verified contact',
      className: 'border-[#e4e7ef] bg-[#f7f8fb] text-[#6a7283]',
      icon: CircleDashed,
      spinning: false
    }
  }

  return {
    label: 'Not searched',
    className: 'border-[#e4e7ef] bg-white text-[#8a92a6]',
    icon: CircleDashed,
    spinning: false
  }
}

export interface ProspectSearchContext {
  targetPersona?: string
  offer?: string
  originalQuery?: string
}

// ─── Row detail expand ────────────────────────────────────────────────────────

function ProspectRowDetail({
  prospect,
  isEnriching
}: {
  prospect: Prospect
  isEnriching?: boolean
}) {
  const hermesTake = prospect.hermesTake
  const fields = getProspectContactFields(prospect)
  const lookupStatus = getContactLookupStatus(prospect, isEnriching)
  const lookupMessage = prospect.contactLookupMessage || prospect.enrichmentError
  const enrichments = Array.isArray(prospect.enrichments)
    ? prospect.enrichments.filter(
        (e: any) =>
          e?.title &&
          e?.result &&
          !e.title.match(/Name|Email|Summary|Title|LinkedIn Profile/i) &&
          e.result !== 'null' &&
          e.result !== 'undefined'
      )
    : []

  return (
    <div className="grid grid-cols-1 gap-5 px-6 pb-6 pt-2 lg:grid-cols-2">
      {/* Take */}
      {hermesTake ? (
        <div className="rounded-lg border border-[#dfe4ee] bg-[#fbfcff] p-4">
          <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--steel))]">
            <Sparkles className="h-3.5 w-3.5 text-[#315dff]" strokeWidth={1.75} />
            Hermes take
          </div>
          <p className="text-[13px] leading-relaxed text-gray-700">
            <span className="font-semibold text-gray-900">Why fit: </span>
            {hermesTake.whyFit}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-gray-700">
            <span className="font-semibold text-gray-900">Angle: </span>
            {hermesTake.outreachAngle}
          </p>
          {hermesTake.evidence && hermesTake.evidence.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {hermesTake.evidence.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#315dff]" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {(prospect as any).sourceUrl && (
            <a
              href={(prospect as any).sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#315dff]/70 transition-colors hover:text-[#315dff]"
            >
              <Globe className="h-2.5 w-2.5" />
              View Exa source
              <ExternalLink className="h-2 w-2" />
            </a>
          )}
        </div>
      ) : isEnriching ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-4 text-[13px] text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Enriching with Take...
        </div>
      ) : null}

      {/* Contact + Enrichments */}
      <div className="space-y-3">
        {fields.email && (
          <div className="flex items-center gap-2.5 rounded-md border border-[#dfe4ee] bg-white px-3 py-2 shadow-sm">
            <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <a href={`mailto:${fields.email}`} className="flex-1 text-[13px] font-medium text-gray-800 hover:text-emerald-700 truncate">
              {fields.email}
            </a>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">Verified</span>
          </div>
        )}
        {fields.personLinkedIn && (
          <div className="flex items-center gap-2.5 rounded-md border border-[#dfe4ee] bg-white px-3 py-2 shadow-sm">
            <User className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            <a href={fields.personLinkedIn} target="_blank" rel="noopener noreferrer" className="flex-1 text-[13px] font-medium text-gray-800 hover:text-blue-700 flex items-center gap-1">
              LinkedIn Profile <ExternalLink className="h-2.5 w-2.5 opacity-50" />
            </a>
            <span className="rounded bg-[#edf1ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#315dff]">Auto-message soon</span>
          </div>
        )}
        {fields.phone && (
          <div className="flex items-center gap-2.5 rounded-md border border-[#dfe4ee] bg-white px-3 py-2 shadow-sm">
            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-500" />
            <span className="flex-1 text-[13px] font-medium text-gray-800 truncate">
              {fields.phone}
            </span>
            <span className="rounded bg-[#f5f7ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#6a7283]">Phone</span>
          </div>
        )}
        {lookupStatus === 'failed' && (
          <div className="flex items-start gap-2.5 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="leading-relaxed">{lookupMessage || 'Contact lookup failed. Try again or narrow the persona.'}</span>
          </div>
        )}
        {lookupStatus === 'no_contact' && !fields.hasAnyContact && (
          <div className="flex items-start gap-2.5 rounded-md border border-[#e4e7ef] bg-[#f7f8fb] px-3 py-2 text-[12px] text-[#6a7283]">
            <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="leading-relaxed">No verified email or decision-maker match came back. Try a different persona, broader geography, or manual review.</span>
          </div>
        )}
        {enrichments.slice(0, 4).map((e: any, i: number) => (
          <div key={i} className="flex items-start gap-2.5 rounded-md border border-[#dfe4ee] bg-white px-3 py-2 shadow-sm">
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0">{e.title}</span>
            <span className="flex-1 text-[12px] text-gray-700 leading-snug">{e.result}</span>
          </div>
        ))}
        {!fields.email && lookupStatus !== 'failed' && lookupStatus !== 'no_contact' && !isEnriching && (
          <p className="px-1 text-[12px] italic text-[#8a92a6]">
            {fields.hasAnyContact
              ? 'Decision-maker found. Verified email is still missing for this prospect.'
              : 'Select this company and run Find Contacts to resolve a decision-maker and verified email.'}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main table ───────────────────────────────────────────────────────────────

export function ProspectGrid({
  prospects,
  searchContext,
  onSelectionChange,
  onFindContacts
}: {
  prospects: Prospect[]
  searchContext?: ProspectSearchContext
  onSelectionChange?: (ids: string[]) => void
  onReviewComplete?: () => void
  /** Called with selected prospect IDs to trigger person enrichment */
  onFindContacts?: (ids: string[]) => void | Promise<void>
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set())

  if (!prospects || prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-[#dfe4ee] bg-[#fbfcff] py-12">
        <Users className="mb-3 h-8 w-8 text-gray-300" />
        <p className="text-[14px] font-medium text-[#6a7283]">No prospects yet</p>
        <p className="mt-0.5 text-[13px] text-[#8a92a6]">Results will appear here as Hermes finds them.</p>
      </div>
    )
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      onSelectionChange?.(Array.from(next))
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === prospects.length) {
      setSelected(new Set())
      onSelectionChange?.([])
    } else {
      const all = new Set(prospects.map(p => p.id))
      setSelected(all)
      onSelectionChange?.(Array.from(all))
    }
  }

  const handleSave = (prospect: Prospect) => {
    if (saved.has(prospect.id)) return
    setSaved(prev => new Set(prev).add(prospect.id))
    const currentSaved = campaignStore.getState().savedProspects
    if (!currentSaved.find((p: Prospect) => p.id === prospect.id)) {
      campaignStore.setState({ savedProspects: [...currentSaved, prospect] })
    }
    toast.success(`${prospect.company || prospect.fullName} added to Draft Studio`)
  }

  const handleFindContacts = async () => {
    if (selected.size === 0) return
    const selectedIds = Array.from(selected)
    setEnrichingIds(new Set(selectedIds))
    try {
      await onFindContacts?.(selectedIds)
    } finally {
      setEnrichingIds(new Set())
    }
  }

  const allSelected = selected.size === prospects.length && prospects.length > 0
  const contactsFound = prospects.filter(p => getProspectContactFields(p).hasAnyContact).length
  const lookupFailures = prospects.filter(p => getContactLookupStatus(p) === 'failed').length
  const isFindingContacts = enrichingIds.size > 0

  return (
    <div className="overflow-hidden rounded-lg border border-[#dfe4ee] bg-white shadow-sm">
      {/* Table toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#edf0f6] bg-[#fbfcff] px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4 cursor-pointer rounded border-[#cfd6e4] accent-[#315dff]"
          />
          <span className="text-[12px] font-semibold text-[#5f687a]">
            {selected.size > 0 ? `${selected.size} selected` : `${prospects.length} prospects`}
          </span>
          {contactsFound > 0 && (
            <span className="text-[11px] font-semibold text-emerald-600">
              · {contactsFound} with contacts
            </span>
          )}
          {lookupFailures > 0 && (
            <span className="text-[11px] font-semibold text-red-600">
              · {lookupFailures} lookup failed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-md border-[#dfe4ee] text-[12px] font-semibold text-[#46506a] hover:border-[#bfc9ff]"
                onClick={() => {
                  selected.forEach(id => {
                    const p = prospects.find(p => p.id === id)
                    if (p) handleSave(p)
                  })
                }}
              >
                Save to Studio
              </Button>
              {onFindContacts && (
                <Button
                  size="sm"
                  className="h-8 rounded-md bg-[#071329] text-[12px] font-semibold text-white hover:bg-[#102448]"
                  onClick={handleFindContacts}
                  disabled={isFindingContacts}
                >
                  {isFindingContacts ? (
                    <>
                      Finding {enrichingIds.size}
                      <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
                    </>
                  ) : (
                    <>
                      Find Contacts
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#edf0f6]">
        {prospects.map((prospect) => {
          const isExpanded = expanded.has(prospect.id)
          const isSelected = selected.has(prospect.id)
          const isEnriching = enrichingIds.has(prospect.id)
          const fields = getProspectContactFields(prospect)
          const contactStatus = getContactLookupStatus(prospect, isEnriching)
          const statusMeta = getContactStatusMeta(prospect, isEnriching)
          const StatusIcon = statusMeta.icon
          const hasName = Boolean(fields.fullName)

          return (
            <div
              key={prospect.id}
              className={`transition-colors duration-100 ${isSelected ? 'bg-[#eef3ff]' : 'hover:bg-[#fbfcff]'}`}
            >
              {/* Main row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Select */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(prospect.id)}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#cfd6e4] accent-[#315dff]"
                />

                {/* Company logo */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#cbd4ff] bg-[#edf1ff]">
                  {prospect.companyLogoUrl ? (
                    <Image
                      src={prospect.companyLogoUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Building className="h-3.5 w-3.5 text-[#315dff]" strokeWidth={1.9} />
                  )}
                </div>

                {/* Company + location */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[14px] font-semibold text-[#071329]">
                      {prospect.company || 'Unknown Company'}
                    </span>
                    {prospect.companySize && (
                      <span className="shrink-0 text-[11px] text-[#8a92a6]">{prospect.companySize}</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#8a92a6]">
                    {prospect.location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {prospect.location}
                      </span>
                    )}
                    {prospect.industry && (
                      <span className="hidden sm:block truncate max-w-[120px]">{prospect.industry}</span>
                    )}
                  </div>
                </div>

                {/* Contact person */}
                <div className="hidden md:flex flex-col items-start min-w-[140px] max-w-[180px]">
                  {hasName ? (
                    <>
                      <span className="w-full truncate text-[13px] font-medium text-[#25304a]">{fields.fullName}</span>
                      {fields.jobTitle && (
                        <span className="w-full truncate text-[11px] text-[#8a92a6]">{fields.jobTitle}</span>
                      )}
                    </>
                  ) : isEnriching ? (
                    <span className="flex items-center gap-1.5 text-[11px] text-[#8a92a6]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Finding contact...
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#b0b6c5]">
                      {contactStatus === 'no_contact' ? 'No verified match' : 'No contact yet'}
                    </span>
                  )}
                </div>

                {/* Email badge */}
                <div className="hidden w-[170px] sm:block">
                  {fields.email ? (
                    <span
                      title={fields.email}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
                    >
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{fields.email}</span>
                    </span>
                  ) : (
                    <span
                      title={prospect.contactLookupMessage || prospect.enrichmentError || statusMeta.label}
                      className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                    >
                      <StatusIcon className={`h-3 w-3 shrink-0 ${statusMeta.spinning ? 'animate-spin' : ''}`} />
                      <span className="truncate">{statusMeta.label}</span>
                    </span>
                  )}
                </div>

                {/* Fit score */}
                {(prospect as any).fitScore > 0 && (
                  <div className="hidden items-center gap-1 text-[11px] font-bold text-[#071329] lg:flex">
                    <Sparkles className="h-2.5 w-2.5 text-[#315dff]" />
                    {Math.round((prospect as any).fitScore)}
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={() => handleSave(prospect)}
                  className={`hidden rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:block ${
                    saved.has(prospect.id)
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-[#8a92a6] hover:bg-[#f5f7ff] hover:text-[#315dff]'
                  }`}
                >
                  {saved.has(prospect.id) ? 'Saved' : 'Save'}
                </button>

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(prospect.id)}
                  className="rounded-md p-1 text-[#b0b6c5] transition-colors hover:bg-[#f5f7ff] hover:text-[#315dff]"
                  aria-label={isExpanded ? 'Collapse prospect details' : 'Expand prospect details'}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <ProspectRowDetail
                  prospect={prospect}
                  isEnriching={isEnriching}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
