'use client'

import { Button } from '@/components/ui/button'
import { campaignStore } from '@/lib/store/campaign-store'
import {
  getContactLookupStatus,
  getProspectContactFields
} from '@/lib/prospects/contact-fields'
import type { ContactLookupStatus } from '@/lib/prospects/contact-fields'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

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
  sourceUrl?: string
  exaText?: string
}

export interface ProspectSearchContext {
  targetPersona?: string
  offer?: string
  originalQuery?: string
}

const CORE_SIGNAL_PATTERNS = [
  /company name/i,
  /company domain/i,
  /company linkedin/i,
  /decision maker linkedin/i,
  /decision maker email/i,
  /decision maker name/i,
  /decision maker title/i,
  /email$/i,
  /linkedin profile/i,
  /^url$/i,
  /^content$/i
]

function cleanText(value?: string | null, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getHost(value?: string) {
  const clean = cleanText(value)
  if (!clean) return ''
  try {
    return new URL(clean.startsWith('http') ? clean : `https://${clean}`).hostname.replace(/^www\./, '')
  } catch {
    return clean.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

function initials(value?: string) {
  const clean = cleanText(value, 'H')
  return clean
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'H'
}

function displayCompany(prospect: Prospect) {
  const company = cleanText(prospect.company)
  if (company && !/^unknown/i.test(company)) return company
  const host = getHost(prospect.website)
  if (host) {
    return host
      .split('.')
      .slice(0, -1)
      .join(' ')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
  }
  return cleanText(prospect.fullName, 'Unknown company')
}

function statusLabel(prospect: Prospect, isEnriching?: boolean) {
  const fields = getProspectContactFields(prospect)
  const status = getContactLookupStatus(prospect, isEnriching)

  if (status === 'searching') {
    return { label: 'Resolving', tone: 'border-[#cbd4ff] bg-[#edf1ff] text-[#315dff]' }
  }
  if (status === 'failed') {
    return { label: 'Failed', tone: 'border-red-100 bg-red-50 text-red-700' }
  }
  if (fields.email) {
    return { label: 'Email ready', tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' }
  }
  if (fields.phone) {
    return { label: 'Phone ready', tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' }
  }
  if (fields.fullName || fields.personLinkedIn) {
    return { label: 'Person found', tone: 'border-blue-100 bg-blue-50 text-blue-700' }
  }
  if (status === 'no_contact') {
    return { label: 'No match', tone: 'border-[#e4e7ef] bg-[#f7f8fb] text-[#6a7283]' }
  }
  return { label: 'Queued', tone: 'border-[#e4e7ef] bg-white text-[#8a92a6]' }
}

function signalRows(prospect: Prospect) {
  const rows = Array.isArray(prospect.enrichments) ? prospect.enrichments : []
  return rows
    .map((entry: any) => ({
      title: cleanText(entry?.title),
      value: cleanText(entry?.result) || cleanText(entry?.value)
    }))
    .filter(entry => {
      if (!entry.title || !entry.value) return false
      return !CORE_SIGNAL_PATTERNS.some(pattern => pattern.test(entry.title))
    })
    .slice(0, 8)
}

function fitScore(prospect: Prospect) {
  const explicit = (prospect as any).fitScore
  if (typeof explicit === 'number' && explicit > 0) return Math.round(explicit)
  const fields = getProspectContactFields(prospect)
  return [
    prospect.company ? 18 : 0,
    prospect.website ? 14 : 0,
    prospect.industry ? 12 : 0,
    prospect.companySize ? 10 : 0,
    fields.fullName ? 16 : 0,
    fields.email ? 22 : 0,
    fields.personLinkedIn || fields.companyLinkedIn ? 8 : 0
  ].reduce((sum, value) => sum + value, 0)
}

function RowDetail({ prospect, isEnriching }: { prospect: Prospect; isEnriching?: boolean }) {
  const fields = getProspectContactFields(prospect)
  const lookupStatus = getContactLookupStatus(prospect, isEnriching)
  const signals = signalRows(prospect)
  const source = (prospect as any).sourceUrl || prospect.website

  return (
    <tr className="border-b border-[#edf0f6] bg-[#fbfcff]">
      <td colSpan={7} className="px-4 pb-4 pt-1">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,.9fr)_minmax(260px,1fr)_minmax(260px,1fr)]">
          <div className="rounded-lg border border-[#edf0f6] bg-white p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a92a6]">
              Contact
            </div>
            <div className="space-y-2 text-[12px]">
              {fields.email ? (
                <a href={`mailto:${fields.email}`} className="block truncate font-semibold text-emerald-700">
                  {fields.email}
                </a>
              ) : (
                <div className="text-[#8a92a6]">
                  {isEnriching ? 'Resolving verified email...' : 'No verified email yet'}
                </div>
              )}
              {fields.personLinkedIn ? (
                <a
                  href={fields.personLinkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-semibold text-[#315dff]"
                >
                  LinkedIn profile
                </a>
              ) : null}
              {fields.phone ? (
                <div className="truncate font-semibold text-[#071329]">{fields.phone}</div>
              ) : null}
              {lookupStatus === 'failed' ? (
                <div className="rounded-md border border-red-100 bg-red-50 px-2 py-1.5 text-red-700">
                  {prospect.contactLookupMessage || prospect.enrichmentError || 'Lookup failed'}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-[#edf0f6] bg-white p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a92a6]">
              Hermes take
            </div>
            {prospect.hermesTake ? (
              <div className="space-y-2 text-[12px] leading-5 text-[#46506a]">
                <p>
                  <span className="font-bold text-[#071329]">Fit: </span>
                  {prospect.hermesTake.whyFit}
                </p>
                <p>
                  <span className="font-bold text-[#071329]">Angle: </span>
                  {prospect.hermesTake.outreachAngle}
                </p>
              </div>
            ) : (
              <p className="text-[12px] text-[#8a92a6]">
                {isEnriching ? 'Generating take after contact resolution...' : (prospect as any).summary || 'No take yet.'}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-[#edf0f6] bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a92a6]">
                Signals
              </span>
              {source ? (
                <a
                  href={String(source).startsWith('http') ? String(source) : `https://${source}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#315dff]"
                >
                  {getHost(String(source))}
                </a>
              ) : null}
            </div>
            {signals.length > 0 ? (
              <div className="grid gap-2">
                {signals.map((signal, index) => (
                  <div key={`${prospect.id}-signal-${index}`} className="text-[12px] leading-5">
                    <span className="font-bold text-[#071329]">{signal.title}: </span>
                    <span className="text-[#6a7283]">{signal.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#8a92a6]">Custom enrichments and source proof will appear here.</p>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

export function ProspectGrid({
  prospects,
  searchContext,
  onSelectionChange,
  onFindContacts,
  autoFindContacts = false,
  autoFindLimit = 25
}: {
  prospects: Prospect[]
  searchContext?: ProspectSearchContext
  onSelectionChange?: (ids: string[]) => void
  onReviewComplete?: () => void
  onFindContacts?: (ids: string[]) => void | Promise<void>
  autoFindContacts?: boolean
  autoFindLimit?: number
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set(campaignStore.getState().savedProspects.map((prospect: Prospect) => prospect.id))
  )
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set())
  const autoStartedRef = useRef(false)

  const rows = useMemo(
    () =>
      prospects.map(prospect => ({
        ...prospect,
        displayCompany: displayCompany(prospect),
        fields: getProspectContactFields(prospect),
        score: fitScore(prospect)
      })),
    [prospects]
  )

  useEffect(() => {
    setSaved(new Set(campaignStore.getState().savedProspects.map((prospect: Prospect) => prospect.id)))
  }, [])

  const runContactLookup = async (ids: string[]) => {
    if (ids.length === 0 || !onFindContacts) return
    setEnrichingIds(new Set(ids))
    try {
      await onFindContacts(ids)
    } finally {
      setEnrichingIds(new Set())
    }
  }

  useEffect(() => {
    if (!autoFindContacts || !onFindContacts || autoStartedRef.current || rows.length === 0) return
    const ids = rows
      .filter(row => {
        const status = getContactLookupStatus(row)
        return !row.fields.email && status !== 'searching' && status !== 'failed'
      })
      .slice(0, autoFindLimit)
      .map(row => row.id)

    if (ids.length === 0) return
    autoStartedRef.current = true
    runContactLookup(ids)
  // runContactLookup intentionally omitted to keep this one-shot.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFindContacts, autoFindLimit, onFindContacts, rows.length])

  if (!prospects || prospects.length === 0) {
    return (
      <div className="rounded-lg border border-[#dfe4ee] bg-[#fbfcff] px-4 py-8 text-center">
        <p className="text-[14px] font-semibold text-[#071329]">No prospects yet</p>
        <p className="mt-1 text-[12px] text-[#6a7283]">Matched accounts will appear here.</p>
      </div>
    )
  }

  const toggleExpand = (id: string) => {
    setExpanded(previous => {
      const next = new Set(previous)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelected(previous => {
      const next = new Set(previous)
      next.has(id) ? next.delete(id) : next.add(id)
      onSelectionChange?.(Array.from(next))
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === prospects.length) {
      setSelected(new Set())
      onSelectionChange?.([])
      return
    }

    const all = new Set(prospects.map(prospect => prospect.id))
    setSelected(all)
    onSelectionChange?.(Array.from(all))
  }

  const saveProspects = (items: Prospect[]) => {
    if (items.length === 0) return
    const currentSaved = campaignStore.getState().savedProspects
    const byId = new Map(currentSaved.map((prospect: Prospect) => [prospect.id, prospect]))
    for (const item of items) byId.set(item.id, item)
    const savedProspects = Array.from(byId.values())
    campaignStore.setState({
      savedProspects,
      summary: searchContext?.originalQuery || campaignStore.getState().summary,
      offer: searchContext?.offer || campaignStore.getState().offer,
      motionIcp: searchContext?.targetPersona || campaignStore.getState().motionIcp
    })
    try {
      window.localStorage.setItem('hermes-studio-prospects', JSON.stringify(savedProspects))
      window.sessionStorage.setItem('hermes-latest-prospects', JSON.stringify(savedProspects))
    } catch {}
    setSaved(new Set(Array.from(byId.keys())))
    toast.success(`${items.length} prospect${items.length === 1 ? '' : 's'} saved to Draft Studio`)
  }

  const selectedIds = Array.from(selected)
  const selectedRows = rows.filter(row => selected.has(row.id))
  const emailCount = rows.filter(row => row.fields.email).length
  const peopleCount = rows.filter(row => row.fields.fullName || row.fields.personLinkedIn).length
  const failedCount = rows.filter(row => getContactLookupStatus(row) === 'failed').length
  const isFindingContacts = enrichingIds.size > 0

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-[#dfe4ee] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#edf0f6] bg-[#fbfcff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] font-semibold text-[#46506a]">
            <input
              type="checkbox"
              checked={selected.size === prospects.length && prospects.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 cursor-pointer rounded border-[#cfd6e4] accent-[#315dff]"
            />
            {selected.size > 0 ? `${selected.size} selected` : `${prospects.length} prospects`}
          </label>
          <span className="text-[12px] font-semibold text-emerald-700">{emailCount} emails</span>
          <span className="text-[12px] font-semibold text-blue-700">{peopleCount} people</span>
          {failedCount > 0 ? (
            <span className="text-[12px] font-semibold text-red-700">{failedCount} failed</span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-md border-[#dfe4ee] text-[12px] font-semibold"
            disabled={selectedRows.length === 0}
            onClick={() => saveProspects(selectedRows as Prospect[])}
          >
            Save selected
          </Button>
          {onFindContacts ? (
            <Button
              size="sm"
              className="h-8 rounded-md bg-[#071329] text-[12px] font-semibold text-white hover:bg-[#102448]"
              onClick={() => runContactLookup(selectedIds)}
              disabled={selectedIds.length === 0 || isFindingContacts}
            >
              {isFindingContacts ? `Resolving ${enrichingIds.size}` : 'Find selected contacts'}
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline" className="h-8 rounded-md border-[#dfe4ee] text-[12px] font-semibold">
            <Link href="/studio">Draft Studio</Link>
          </Button>
        </div>
      </div>

      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
          <thead className="bg-white">
            <tr className="border-b border-[#edf0f6] text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a92a6]">
              <th className="w-10 px-4 py-2"> </th>
              <th className="w-[30%] px-2 py-2">Company</th>
              <th className="w-[19%] px-2 py-2">Decision maker</th>
              <th className="w-[24%] px-2 py-2">Email / contact</th>
              <th className="w-[8%] px-2 py-2">Fit</th>
              <th className="w-[12%] px-2 py-2">Actions</th>
              <th className="w-[7%] px-2 py-2"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isExpanded = expanded.has(row.id)
              const isSelected = selected.has(row.id)
              const isEnriching = enrichingIds.has(row.id)
              const status = statusLabel(row, isEnriching)
              const website = row.website
              const linkedin = row.fields.personLinkedIn || row.fields.companyLinkedIn

              return (
                <Fragment key={row.id}>
                  <tr
                    className={cn(
                      'border-b border-[#edf0f6] transition-colors hover:bg-[#fbfcff]',
                      isSelected && 'bg-[#eef3ff]'
                    )}
                  >
                    <td className="px-4 py-3 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(row.id)}
                        className="h-4 w-4 cursor-pointer rounded border-[#cfd6e4] accent-[#315dff]"
                        aria-label={`Select ${row.displayCompany}`}
                      />
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#dfe4ee] bg-[#f7f8fb] text-[11px] font-bold text-[#46506a]">
                          {row.companyLogoUrl ? (
                            <Image
                              src={row.companyLogoUrl}
                              alt=""
                              width={36}
                              height={36}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            initials(row.displayCompany)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-bold text-[#071329]">
                            {row.displayCompany}
                          </div>
                          <div className="mt-0.5 flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[#8a92a6]">
                            {row.location ? <span className="truncate">{row.location}</span> : null}
                            {row.companySize ? <span className="truncate">{row.companySize}</span> : null}
                            {website ? (
                              <a
                                href={website.startsWith('http') ? website : `https://${website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate font-semibold text-[#315dff]"
                              >
                                {getHost(website)}
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="max-w-[210px]">
                        <div className="truncate text-[13px] font-semibold text-[#25304a]">
                          {row.fields.fullName || 'Resolving'}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-[#8a92a6]">
                          {row.fields.jobTitle || row.jobTitle || 'Role pending'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex max-w-[230px] flex-col gap-1">
                        {row.fields.email ? (
                          <a
                            href={`mailto:${row.fields.email}`}
                            className="truncate text-[12px] font-bold text-emerald-700"
                            title={row.fields.email}
                          >
                            {row.fields.email}
                          </a>
                        ) : (
                          <span
                            className={cn(
                              'inline-flex w-fit max-w-full rounded-md border px-2 py-1 text-[11px] font-bold',
                              status.tone
                            )}
                            title={row.contactLookupMessage || row.enrichmentError || status.label}
                          >
                            {status.label}
                          </span>
                        )}
                        {linkedin ? (
                          <a
                            href={linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-[11px] font-semibold text-[#315dff]"
                          >
                            LinkedIn
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="w-16">
                        <div className="mb-1 text-[12px] font-bold text-[#071329]">{row.score}</div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#e8ebf2]">
                          <div
                            className="h-full rounded-full bg-[#315dff]"
                            style={{ width: `${Math.min(100, row.score)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveProspects([row as Prospect])}
                          className={cn(
                            'rounded-md px-2 py-1 text-[11px] font-bold transition-colors',
                            saved.has(row.id)
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-[#6a7283] hover:bg-[#f5f7ff] hover:text-[#315dff]'
                          )}
                        >
                          {saved.has(row.id) ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleExpand(row.id)}
                        className="rounded-md px-2 py-1 text-[12px] font-bold text-[#8a92a6] hover:bg-[#f5f7ff] hover:text-[#315dff]"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Hide prospect details' : 'Show prospect details'}
                      >
                        {isExpanded ? 'Less' : 'More'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <RowDetail
                      key={`${row.id}-detail`}
                      prospect={row as Prospect}
                      isEnriching={isEnriching}
                    />
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
