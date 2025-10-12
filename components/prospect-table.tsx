"use client";

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, ChevronDown, ExternalLink, Linkedin, Mail } from 'lucide-react';
import { useState } from 'react';
import { Prospect } from './prospect-grid';

interface ProspectTableProps {
  prospects: Prospect[];
  onSelectionChange?: (ids: string[]) => void;
}

export function ProspectTable({ prospects, onSelectionChange }: ProspectTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const toggleSelectAll = () => {
    if (selected.size === prospects.length) {
      setSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = new Set(prospects.map(p => p.id));
      setSelected(allIds);
      onSelectionChange?.(Array.from(allIds));
    }
  };

  // Get all unique enrichment titles (visible up to 5)
  const enrichmentTitles = Array.from(
    new Set(
      prospects.flatMap(p => 
        Array.isArray(p.enrichments) 
          ? (p.enrichments as any[]).map((e: any) => e.title) 
          : []
      )
    )
  ).slice(0, 5); // Show first 5 enrichment columns

  return (
    <div className="w-full overflow-auto border rounded-lg bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b sticky top-0">
          <tr>
            <th className="p-3 text-left w-12">
              <Checkbox
                checked={selected.size === prospects.length && prospects.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </th>
            <th className="p-3 text-left font-semibold text-gray-700 min-w-[200px]">Name</th>
            <th className="p-3 text-left font-semibold text-gray-700 min-w-[250px]">Description</th>
            <th className="p-3 text-left font-semibold text-gray-700 min-w-[150px]">URL</th>
            <th className="p-3 text-left font-semibold text-gray-700">Contact</th>
            {enrichmentTitles.map((title, i) => (
              <th key={i} className="p-3 text-left font-semibold text-gray-700 min-w-[180px]">
                {title}
              </th>
            ))}
            <th className="p-3 text-left font-semibold text-gray-700 w-24">More</th>
          </tr>
        </thead>
        <tbody>
          {prospects.map((prospect, idx) => {
            const enrichmentsArray = Array.isArray(prospect.enrichments) ? prospect.enrichments : [];
            const enrichmentMap = new Map(
              enrichmentsArray.map((e: any) => [e.title, e.value])
            );

            return (
              <tr 
                key={prospect.id}
                className={`border-b hover:bg-gray-50 transition-all duration-200 ${
                  selected.has(prospect.id) ? 'bg-amber-50' : ''
                } ${idx < 3 ? 'animate-in fade-in slide-in-from-top-2' : ''}`}
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
              >
                <td className="p-3">
                  <Checkbox
                    checked={selected.has(prospect.id)}
                    onCheckedChange={() => toggleSelect(prospect.id)}
                  />
                </td>
                
                {/* Name */}
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {prospect.companyLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={prospect.companyLogoUrl} alt="logo" className="h-8 w-8 rounded border flex-shrink-0 object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{prospect.fullName || prospect.company}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {prospect.companySize && <span>{prospect.companySize} employees</span>}
                        {enrichmentsArray.find((e: any) => 
                          e.title?.toLowerCase().includes('role') || 
                          e.title?.toLowerCase().includes('persona') ||
                          e.title?.toLowerCase().includes('who')
                        )?.value && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 font-medium">
                              Contact: {enrichmentsArray.find((e: any) => 
                                e.title?.toLowerCase().includes('role') || 
                                e.title?.toLowerCase().includes('persona') ||
                                e.title?.toLowerCase().includes('who')
                              )?.value}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Description */}
                <td className="p-3">
                  <div className="text-gray-700 line-clamp-2">
                    {enrichmentsArray.find((e: any) => 
                      e.title?.toLowerCase().includes('segment') || 
                      e.title?.toLowerCase().includes('description')
                    )?.value || prospect.industry || 'No description available'}
                  </div>
                </td>

                {/* URL */}
                <td className="p-3">
                  {prospect.website && (
                    <a 
                      href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                    >
                      {prospect.website.replace(/^https?:\/\//,'').split('/')[0]}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>

                {/* Contact */}
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    {prospect.email && (
                      <a 
                        href={`mailto:${prospect.email}`}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{prospect.email}</span>
                      </a>
                    )}
                    {prospect.linkedinUrl && (
                      <a 
                        href={prospect.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Linkedin className="h-3 w-3" />
                        Profile
                      </a>
                    )}
                  </div>
                </td>

                {/* Enrichments */}
                {enrichmentTitles.map((title, i) => {
                  const value = enrichmentMap.get(title);
                  return (
                    <td key={i} className="p-3">
                      {value ? (
                        <div className="text-gray-700 text-xs line-clamp-2">
                          {typeof value === 'string' && value.length > 100 
                            ? value.substring(0, 100) + '...' 
                            : String(value)}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  );
                })}
                {/* More popover: show remaining enrichments */}
                <td className="p-3">
                  {enrichmentsArray.length > enrichmentTitles.length ? (
                    <details>
                      <summary className="cursor-pointer text-xs text-gray-600 inline-flex items-center gap-1">
                        <ChevronDown className="h-3 w-3" /> More
                      </summary>
                      <div className="mt-2 space-y-1">
                        {enrichmentsArray
                          .filter((e: any) => !enrichmentTitles.includes(e.title))
                          .map((e: any, i: number) => (
                            <div key={i} className="text-xs text-gray-600">
                              <span className="font-medium">{e.title}: </span>
                              <span>{typeof e.value === 'string' ? e.value : JSON.stringify(e.value)}</span>
                            </div>
                          ))}
                      </div>
                    </details>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl border-2 border-amber-400 p-4 flex items-center gap-4 z-50">
          <span className="text-sm font-medium text-gray-900">
            {selected.size} selected
          </span>
          <Button 
            size="sm" 
            className="bg-amber-500 hover:bg-amber-600 text-amber-950"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('chat-system-suggest', {
                detail: { text: `Draft personalized emails for the ${selected.size} selected prospects` }
              }));
            }}
          >
            Draft Emails
          </Button>
          <Button size="sm" variant="outline">
            Export CSV
          </Button>
        </div>
      )}
    </div>
  );
}

