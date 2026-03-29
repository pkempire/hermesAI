"use client";

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, ExternalLink, Linkedin, Mail } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Prospect } from './prospect-grid';

interface ProspectTableProps {
  prospects: Prospect[];
  onSelectionChange?: (ids: string[]) => void;
}

function normalizeEnrichmentTitle(title?: string) {
  return (title || '').toLowerCase().trim();
}

function titleCaseFromHostname(value: string) {
  return value
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('.')
    .slice(0, -1)
    .join(' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function deriveCompanyLabel(prospect: Prospect) {
  const company = (prospect.company || '').trim();
  if (company && !/^unknown company$/i.test(company)) {
    return company;
  }

  if (prospect.website) {
    const derived = titleCaseFromHostname(prospect.website);
    if (derived) return derived;
  }

  if (prospect.linkedinUrl && prospect.linkedinUrl.includes('linkedin.com/company/')) {
    const slug = prospect.linkedinUrl.split('/company/')[1]?.split(/[/?#]/)[0];
    if (slug) {
      return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }
  }

  return 'Unknown company';
}

function getCompanyInitials(value: string) {
  const parts = value.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return 'H';
  return parts.map(part => part[0]?.toUpperCase()).join('');
}

function getWebsiteHost(value?: string) {
  if (!value) return '';
  return value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}

function getPrimarySummary(prospect: Prospect) {
  const enrichments = Array.isArray(prospect.enrichments) ? prospect.enrichments : [];
  const preferred = enrichments.find((entry: any) => {
    const title = normalizeEnrichmentTitle(entry?.title);
    return title.includes('specialization') || title.includes('offering') || title.includes('fit') || title.includes('proof');
  });

  return preferred?.value || preferred?.result || (prospect as any).summary || prospect.industry || 'No summary available';
}

function getSignalRows(prospect: Prospect) {
  const enrichments = Array.isArray(prospect.enrichments) ? prospect.enrichments : [];

  return enrichments
    .filter((entry: any) => {
      const title = normalizeEnrichmentTitle(entry?.title);
      return (
        title &&
        !title.includes('company name') &&
        !title.includes('company domain') &&
        !title.includes('company linkedin') &&
        !title.includes('decision maker linkedin') &&
        !title.includes('decision maker email') &&
        !title.includes('decision maker name') &&
        !title.includes('decision maker title') &&
        !title.includes('location') &&
        !title.includes('type') &&
        !title.includes('url') &&
        !title.includes('content') &&
        !title.includes('description')
      );
    })
    .slice(0, 6)
    .map((entry: any) => ({
      title: entry.title,
      value: typeof entry.value === 'string' ? entry.value : entry.result
    }))
    .filter((entry: any) => entry.value);
}

export function ProspectTable({ prospects, onSelectionChange }: ProspectTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const toggleSelectAll = () => {
    if (selected.size === prospects.length) {
      setSelected(new Set());
      onSelectionChange?.([]);
      return;
    }

    const allIds = new Set(prospects.map(prospect => prospect.id));
    setSelected(allIds);
    onSelectionChange?.(Array.from(allIds));
  };

  const rows = useMemo(() => {
    return prospects.map(prospect => {
      const displayCompany = deriveCompanyLabel(prospect);
      const displayContact =
        prospect.fullName && prospect.fullName !== displayCompany ? prospect.fullName : undefined;

      return {
        ...prospect,
        displayCompany,
        displayContact,
        summary: getPrimarySummary(prospect),
        signals: getSignalRows(prospect)
      };
    });
  }, [prospects]);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white/90 shadow-[0_18px_48px_rgba(62,45,18,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-black/5 bg-stone-50/80 text-left">
            <tr className="text-[11px] uppercase tracking-[0.16em] text-black/45">
              <th className="w-12 px-4 py-4">
                <Checkbox
                  checked={selected.size === prospects.length && prospects.length > 0}
                  onCheckedChange={() => toggleSelectAll()}
                />
              </th>
              <th className="min-w-[300px] px-4 py-4">Company</th>
              <th className="min-w-[420px] px-4 py-4">Fit Summary</th>
              <th className="min-w-[240px] px-4 py-4">Decision Maker</th>
              <th className="min-w-[320px] px-4 py-4">Signals</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((prospect, index) => (
              <tr
                key={prospect.id}
                className={`border-b border-black/5 align-top transition-colors hover:bg-amber-50/30 ${
                  selected.has(prospect.id) ? 'bg-amber-50/40' : ''
                }`}
              >
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selected.has(prospect.id)}
                    onCheckedChange={() => toggleSelect(prospect.id)}
                  />
                </td>

                <td className="px-4 py-4">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 text-white shadow-[0_10px_30px_rgba(203,126,40,0.22)]">
                      {prospect.companyLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prospect.companyLogoUrl}
                          alt={prospect.displayCompany}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-semibold tracking-[0.08em]">
                          {getCompanyInitials(prospect.displayCompany)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="font-serif text-[1.6rem] leading-tight text-gray-950">
                        {prospect.displayCompany}
                      </div>
                      {prospect.location ? (
                        <div className="text-xs uppercase tracking-[0.16em] text-black/40">{prospect.location}</div>
                      ) : null}
                      {prospect.website ? (
                        <a
                          href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:text-sky-800"
                        >
                          {getWebsiteHost(prospect.website)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="max-w-[520px] text-[15px] leading-7 text-gray-700">
                    {prospect.summary}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-2">
                    {prospect.displayContact ? (
                      <div className="text-[15px] font-semibold text-gray-900">{prospect.displayContact}</div>
                    ) : (
                      <div className="text-black/35">No named contact yet</div>
                    )}
                    {prospect.jobTitle ? (
                      <div className="text-sm text-black/55">{prospect.jobTitle}</div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {prospect.email ? (
                        <a
                          href={`mailto:${prospect.email}`}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </a>
                      ) : null}
                      {prospect.linkedinUrl ? (
                        <a
                          href={prospect.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
                        >
                          <Linkedin className="h-3 w-3" />
                          LinkedIn
                        </a>
                      ) : null}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="space-y-2">
                    {prospect.signals.length > 0 ? (
                      prospect.signals.map((signal, signalIndex) => (
                        <div key={`${prospect.id}-signal-${signalIndex}`} className="rounded-xl border border-black/5 bg-stone-50/70 p-3">
                          <div className="mb-1 text-[11px] uppercase tracking-[0.14em] text-black/40">
                            {signal.title}
                          </div>
                          <div className="text-sm leading-6 text-gray-700">
                            {String(signal.value)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-black/35">Signals will populate as enrichments complete.</div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 ? (
        <div className="flex items-center justify-between border-t border-black/5 bg-stone-50/80 px-4 py-3">
          <div className="text-sm text-gray-700">{selected.size} selected</div>
          <Button size="sm" variant="outline">
            Export CSV
          </Button>
        </div>
      ) : null}
    </div>
  );
}
