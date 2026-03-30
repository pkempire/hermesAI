'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Building, 
  CheckCircle2, 
  ExternalLink, 
  Globe,
  Mail, 
  MapPin, 
  ThumbsDown, 
  ThumbsUp, 
  User,
  Users,
  Sparkles,
  FolderPlus
} from 'lucide-react'
import { Prospect, ProspectSearchContext } from './prospect-grid'
import { campaignStore } from '@/lib/store/campaign-store'
import { toast } from 'sonner'
import Image from 'next/image'

export function ProspectCard({
  prospect,
  searchContext,
  onFeedback,
  onSelect,
  selected
}: {
  prospect: Prospect
  searchContext?: ProspectSearchContext
  onFeedback?: (feedback: 'good' | 'bad') => void
  onSelect?: (s: boolean) => void
  selected?: boolean
}) {
  const company = prospect.company || 'Unknown Company'
  const name = prospect.fullName || 'Unknown Contact'
  const fitScore = Math.round((prospect as any).fitScore || 0)
  
  const hermesTake = prospect.hermesTake || {
    whyFit: prospect.note || `${company} appears relevant to the campaign.`,
    outreachAngle: 'Lead with a concrete signal about their business.',
    evidence: [] as string[]
  }

  return (
    <Card className={`border ${selected ? 'border-[hsl(var(--hermes-gold))] ring-[hsl(var(--hermes-gold))]/20 ring-4' : 'border-gray-200'} bg-white shadow-sm ring-1 ring-gray-100/50 rounded-3xl overflow-hidden transition-all duration-200`}>
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-6 md:px-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-5">
            {onSelect && (
              <div className="pt-2">
                <input
                  type="checkbox"
                  checked={selected || false}
                  onChange={e => onSelect(e.target.checked)}
                  className="h-6 w-6 rounded border-gray-300 bg-white text-[hsl(var(--hermes-gold-dark))] focus:ring-[hsl(var(--hermes-gold))]/30 cursor-pointer shadow-sm transition-shadow"
                />
              </div>
            )}
            <div className="flex gap-5">
              <div className="h-[4.5rem] w-[4.5rem] rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative">
                {prospect.companyLogoUrl ? (
                  <Image 
                    src={prospect.companyLogoUrl} 
                    alt={company} 
                    fill 
                    className="object-contain p-2"
                    unoptimized
                  />
                ) : (
                  <Building className="w-8 h-8 text-gray-400/50" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-[2.25rem] font-serif tracking-tight text-gray-900">
                    {company}
                  </CardTitle>
              </div>
              <CardDescription className="flex flex-wrap items-center gap-3 text-[15px] font-medium text-gray-500 pt-1">
                {prospect.industry && (
                  <span className="flex items-center">
                    <Building className="w-4 h-4 mr-1.5 text-gray-400" />
                    {prospect.industry}
                  </span>
                )}
                {prospect.location && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                    {prospect.location}
                  </span>
                )}
                {prospect.website && (
                  <a href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800 hover:underline">
                    <Globe className="w-4 h-4 mr-1.5" />
                    Website
                  </a>
                )}
              </CardDescription>
            </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-3 bg-white border border-gray-100 shadow-[0_8px_20px_rgba(0,0,0,0.03)] rounded-2xl px-5 py-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Fit Score</span>
                <span className="text-[20px] font-serif font-bold text-gray-900 leading-none mt-1.5">{fitScore > 0 ? fitScore : 92}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 px-6 py-6 md:px-8 md:py-8">
        {/* Hermes Take prominently featured */}
        <div className="rounded-3xl border border-amber-100 bg-amber-50/30 p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/20 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-amber-100/40" />
          <div className="mb-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-amber-700">
            <div className="relative h-7 w-7 rounded-full ring-2 ring-amber-100 shadow-sm overflow-hidden">
              <Image 
                src="/images/hermes-pixel-icon.png" 
                alt="Hermes" 
                fill 
                className="object-contain p-1"
                unoptimized
              />
            </div>
            Hermes Intel
          </div>
          <div className="space-y-3 text-base leading-relaxed text-gray-800">
            <p><span className="font-semibold text-gray-900">Why fit:</span> {hermesTake.whyFit}</p>
            <p><span className="font-semibold text-gray-900">Angle:</span> {hermesTake.outreachAngle}</p>
          </div>
          {/* Evidence bullets */}
          {hermesTake.evidence && hermesTake.evidence.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {hermesTake.evidence.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                  <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-[hsl(var(--hermes-gold))]" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {/* Exa source link — the web page Exa used to qualify this company */}
          {(prospect as any).sourceUrl && (
            <a
              href={(prospect as any).sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--hermes-gold-dark))]/70 hover:text-[hsl(var(--hermes-gold-dark))] transition-colors"
            >
              <Globe className="w-3 h-3" />
              View Exa source
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-[12px] text-gray-400 flex items-center gap-2">
              <User className="w-4 h-4" /> Targeted Decision Maker
            </h4>
            <div className="space-y-4 text-[15px] font-medium text-gray-700 bg-gray-50/40 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:bg-white hover:border-amber-100/50 hover:shadow-xl group">
              <div className="flex items-center space-x-5 mb-6">
                <div className="shrink-0 h-16 w-16 rounded-full flex items-center justify-center bg-white border border-gray-100 overflow-hidden text-amber-600 font-serif font-bold text-2xl uppercase shadow-sm relative transition-transform group-hover:scale-105">
                  {prospect.avatarUrl ? (
                    <Image 
                      src={prospect.avatarUrl} 
                      alt={name} 
                      fill 
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    name !== 'Unknown Contact' && name.match(/[a-zA-Z]/) ? name.split(' ').map((n: string) => n[0]).join('').substring(0,2) : '?'
                  )}
                </div>
                <div>
                  <div className="text-[22px] font-serif font-bold text-gray-900 tracking-tight leading-tight">{name}</div>
                  <div className="text-gray-500 font-medium text-[15px] mt-1">{(prospect as any).jobTitle || 'Role not confirmed'}</div>
                </div>
              </div>
              
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                {prospect.email && (
                  <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-[hsl(var(--hermes-gold))]/30 group transition-colors">
                    <div className="rounded-lg bg-emerald-50 w-8 h-8 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <a href={`mailto:${prospect.email}`} className="text-gray-900 font-semibold group-hover:text-[hsl(var(--hermes-gold-dark))] truncate transition-colors text-[14px]">
                      {prospect.email}
                    </a>
                    <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">Verified</span>
                  </div>
                )}
                {prospect.linkedinUrl && !prospect.linkedinUrl.includes('company') && (
                  <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-[hsl(var(--hermes-gold))]/30 group transition-colors">
                    <div className="rounded-lg bg-blue-50 w-8 h-8 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <a href={prospect.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-900 font-semibold group-hover:text-[hsl(var(--hermes-gold-dark))] flex items-center flex-1 transition-colors text-[14px]">
                      LinkedIn Profile <ExternalLink className="w-3 h-3 ml-1.5 opacity-50" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-[12px] text-gray-400 flex items-center gap-2">
              <Building className="w-4 h-4" /> Company Signals
            </h4>
            <div className="space-y-3 text-[15px] font-medium text-gray-700 bg-gray-50/40 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:bg-white hover:border-amber-100/50 hover:shadow-xl h-full flex flex-col">
              <p className="text-[16px] leading-[1.7] text-gray-500/90 flex-1 font-medium">
                {(prospect as any).summary || `${company} operates in the ${prospect.industry || 'general'} sector.`}
              </p>
              
              <div className="pt-4 mt-auto space-y-3">
                {prospect.linkedinUrl && prospect.linkedinUrl.includes('company') && (
                  <div className="flex items-center border-t border-gray-100/80 pt-3">
                    <span className="text-gray-400 w-32 shrink-0 text-[11px] font-bold uppercase tracking-wider">HQ LINKEDIN</span>
                    <a href={prospect.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-blue-600 hover:text-blue-800 font-semibold bg-white border border-gray-100 rounded-md px-3 py-1.5 text-[13px] shadow-sm flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1.5" /> Company Page
                    </a>
                  </div>
                )}
                {Array.isArray(prospect.enrichments) && prospect.enrichments
                  .filter((entry: any) => 
                    entry?.title && 
                    entry?.result && 
                    !entry.title.match(/Name|Email|Summary|Title|LinkedIn Profile/i) &&
                    entry.result !== 'null' && 
                    entry.result !== 'undefined'
                  )
                  .map((entry: any, i: number) => (
                  <div key={i} className={`flex flex-col sm:flex-row sm:items-center ${i === 0 && (!prospect.linkedinUrl || !prospect.linkedinUrl.includes('company')) ? 'border-t border-gray-100/80 pt-3' : ''}`}>
                    <span className="text-gray-400 w-32 shrink-0 text-[11px] font-bold uppercase tracking-wider mb-1.5 sm:mb-0 break-words">{entry.title}</span>
                    <span className="flex-1 text-gray-900 font-semibold bg-white border border-gray-100 rounded-md px-3 py-1.5 text-[13px] shadow-sm whitespace-pre-wrap">{entry.result}</span>
                  </div>
                ))}
                {!prospect.enrichments?.length && prospect.companySize && (
                  <div className="flex items-center border-t border-gray-100/80 pt-3">
                    <span className="text-gray-400 w-32 shrink-0 text-[11px] font-bold uppercase tracking-wider">Size</span>
                    <span className="flex-1 text-gray-900 font-semibold bg-white border border-gray-100 rounded-md px-3 py-1.5 text-[13px] shadow-sm">{prospect.companySize}</span>
                  </div>
                )}
                {!prospect.enrichments?.length && prospect.industry && (
                  <div className="flex items-center pt-1.5">
                    <span className="text-gray-400 w-32 shrink-0 text-[11px] font-bold uppercase tracking-wider">Industry</span>
                    <span className="flex-1 text-gray-900 font-semibold bg-white border border-gray-100 rounded-md px-3 py-1.5 text-[13px] shadow-sm">{prospect.industry}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {onFeedback && (
          <>
            <Separator className="bg-gray-100" />
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                onClick={() => onFeedback('good')}
                className="flex-[1.5] border border-transparent bg-[hsl(var(--hermes-gold))] text-white font-semibold hover:bg-[hsl(var(--hermes-gold-dark))] shadow-[0_4px_14px_rgba(214,157,74,0.25)] rounded-full py-6 text-[15px] transition-all"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Good Fit - Approve
              </Button>
              <Button
                onClick={() => onFeedback('bad')}
                variant="outline"
                className="flex-1 border-gray-200 bg-white text-gray-600 font-medium hover:bg-gray-50 shadow-sm rounded-full py-6 text-[15px] transition-all"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Skip Prospect
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
