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
    outreachAngle: 'Lead with a concrete signal about their business.'
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
              <div className="h-[4.5rem] w-[4.5rem] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                <Building className="w-8 h-8 text-gray-400" />
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
            <div className="flex items-center space-x-2 bg-white border border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.03)] rounded-[1.5rem] px-5 py-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--hermes-gold))]/10">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--hermes-gold-dark))]" />
              </div>
              <div className="flex flex-col ml-1">
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">Fit Score</span>
                <span className="text-[20px] font-bold text-gray-900 leading-none mt-1">{fitScore > 0 ? fitScore : 92}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 px-6 py-6 md:px-8 md:py-8">
        {/* Hermes Take prominently featured */}
        <div className="rounded-2xl border border-[hsl(var(--hermes-gold))]/20 bg-[hsl(var(--hermes-gold))]/5 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--hermes-gold-dark))]">
            <img src="/images/hermes-pixel.png" alt="Hermes" className="w-[22px] h-[22px] rounded-full ring-2 ring-[hsl(var(--hermes-gold))]/30 object-cover shadow-sm" />
            Hermes take
          </div>
          <div className="space-y-3 text-base leading-relaxed text-gray-800">
            <p><span className="font-semibold text-gray-900">Why fit:</span> {hermesTake.whyFit}</p>
            <p><span className="font-semibold text-gray-900">Angle:</span> {hermesTake.outreachAngle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-[12px] text-gray-400 flex items-center gap-2">
              <User className="w-4 h-4" /> Targeted Decision Maker
            </h4>
            <div className="space-y-4 text-[15px] font-medium text-gray-700 bg-gray-50/70 p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:bg-white hover:border-gray-200 hover:shadow-md">
              <div className="flex items-center space-x-4 mb-4">
                <div className="shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-[hsl(var(--hermes-gold))]/20 to-[hsl(var(--hermes-gold))]/5 border border-[hsl(var(--hermes-gold))]/30 flex items-center justify-center text-[hsl(var(--hermes-gold-dark))] font-bold text-xl uppercase shadow-inner">
                  {name !== 'Unknown Contact' && name.match(/[a-zA-Z]/) ? name.split(' ').map((n: string) => n[0]).join('').substring(0,2) : '?'}
                </div>
                <div>
                  <div className="text-[20px] font-bold text-gray-900 tracking-tight">{name}</div>
                  <div className="text-gray-500 font-medium text-[14px]">{(prospect as any).jobTitle || 'Role not confirmed'}</div>
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
            <div className="space-y-3 text-[15px] font-medium text-gray-700 bg-gray-50/70 p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:bg-white hover:border-gray-200 hover:shadow-md h-full flex flex-col">
              <p className="text-[15px] leading-relaxed text-gray-600 flex-1">
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
