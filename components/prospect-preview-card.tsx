'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { 
  Building, 
  CheckCircle2, 
  ExternalLink, 
  Mail, 
  MapPin, 
  Phone, 
  ThumbsDown, 
  ThumbsUp, 
  User,
  Users,
  ArrowRight
} from 'lucide-react'
import { useState } from 'react'
import { Prospect } from './prospect-grid'

interface ProspectPreviewCardProps {
  prospect: Prospect
  searchSummary?: {
    query: string
    entityType: string
    totalFound: number
    criteria: number
    enrichments: number
  }
  onApprove: (feedback?: string) => void
  onReject: (feedback: string) => void
  onRefineSearch: (feedback: string) => void
}

export function ProspectPreviewCard({ 
  prospect, 
  searchSummary,
  onApprove, 
  onReject, 
  onRefineSearch 
}: ProspectPreviewCardProps) {
  const [feedback, setFeedback] = useState('')
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'refine'>('approve')

  const handleAction = (action: 'approve' | 'reject' | 'refine') => {
    setActionType(action)
    if (action === 'approve') {
      onApprove(feedback || undefined)
    } else if (action === 'reject' || action === 'refine') {
      if (!feedback.trim()) {
        setShowFeedbackForm(true)
        return
      }
      if (action === 'reject') {
        onReject(feedback)
      } else {
        onRefineSearch(feedback)
      }
    }
  }

  const submitFeedback = () => {
    if (!feedback.trim()) return
    
    if (actionType === 'reject') {
      onReject(feedback)
    } else if (actionType === 'refine') {
      onRefineSearch(feedback)
    }
    setShowFeedbackForm(false)
    setFeedback('')
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      {searchSummary && (
        <Card className="border border-gray-100 bg-gray-50 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-900 font-serif text-[1.4rem]">Preview Result</CardTitle>
            <CardDescription className="text-gray-500 font-medium text-[13px]">
              Here&apos;s 1 example prospect that matches your search criteria. Review the quality and decide how to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-[13px] text-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="font-semibold text-gray-800 block mb-1">Query:</span>
                <p className="truncate text-gray-500">&quot;{searchSummary.query}&quot;</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="font-semibold text-gray-800 block mb-1">Type:</span>
                <p className="capitalize text-gray-500">{searchSummary.entityType}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="font-semibold text-gray-800 block mb-1">Criteria:</span>
                <p className="text-gray-500">{searchSummary.criteria} filters</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-200">
                <span className="font-semibold text-gray-800 block mb-1">Enrichments:</span>
                <p className="text-gray-500">{searchSummary.enrichments} fields</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prospect Card */}
      <Card className="border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100/50 rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-100 px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-[2rem] font-serif tracking-tight flex items-center space-x-3 text-gray-900">
                <div className="bg-[hsl(var(--hermes-gold))]/10 w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  {prospect.avatarUrl ? (
                    <img src={prospect.avatarUrl} alt={prospect.fullName || 'Contact'} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-[hsl(var(--hermes-gold-dark))]" />
                  )}
                </div>
                <span>{prospect.fullName}</span>
              </CardTitle>
              <CardDescription className="flex items-center space-x-2 text-[14px] font-medium text-gray-500 pt-1 ml-[3.75rem]">
                <div className="w-5 h-5 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
                  {prospect.companyLogoUrl ? (
                    <img src={prospect.companyLogoUrl} alt={prospect.company || 'Company'} className="w-full h-full object-cover" />
                  ) : (
                    <Building className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                <span>{prospect.jobTitle} at {prospect.company}</span>
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Match Found
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8 p-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-400">Contact Information</h4>
              <div className="space-y-3 text-[14px] font-medium text-gray-700">
                {prospect.email && (
                  <div className="flex items-center space-x-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-100">
                        <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline hover:text-blue-800">
                      {prospect.email}
                    </a>
                  </div>
                )}
                {prospect.phone && (
                  <div className="flex items-center space-x-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-100">
                        <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <span>{prospect.phone}</span>
                  </div>
                )}
                {prospect.location && (
                  <div className="flex items-center space-x-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-100">
                        <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <span>{prospect.location}</span>
                  </div>
                )}
                {prospect.linkedinUrl && (
                  <div className="flex items-center space-x-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-100">
                         <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <a 
                      href={prospect.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:underline hover:text-blue-800"
                    >
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-400">Company Information</h4>
              <div className="space-y-3 text-[14px] font-medium text-gray-700">
                {prospect.industry && (
                  <div className="flex items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-400 w-32">Industry</span>
                    <span className="flex-1 text-gray-900">{prospect.industry}</span>
                  </div>
                )}
                {prospect.companySize && (
                  <div className="flex items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-400 w-32">Company Size</span>
                    <span className="flex-1 text-gray-900">{prospect.companySize}</span>
                  </div>
                )}
                {prospect.website && (
                  <div className="flex items-center pt-1">
                    <span className="text-gray-400 w-32">Website</span>
                    <a 
                      href={prospect.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center space-x-1 text-blue-600 hover:underline hover:text-blue-800"
                    >
                      <span className="truncate">{prospect.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Enrichments */}
          {Array.isArray(prospect.enrichments) && prospect.enrichments.filter(e => e?.title && e?.result && !e.title.match(/Name|Email|Summary|Title|LinkedIn Profile/i) && e.result !== 'null' && e.result !== 'undefined').length > 0 && (
            <>
              <Separator className="bg-gray-100" />
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-gray-400">Custom Enrichments</h4>
                <div className="space-y-3 text-[14px] font-medium text-gray-700 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  {prospect.enrichments
                    .filter((entry: any) => 
                      entry?.title && 
                      entry?.result && 
                      !entry.title.match(/Name|Email|Summary|Title|LinkedIn Profile/i) &&
                      entry.result !== 'null' && 
                      entry.result !== 'undefined'
                    )
                    .map((entry: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start border-b border-gray-100/80 pb-3 last:border-0 last:pb-0">
                      <span className="text-gray-400 w-40 shrink-0 text-[11px] font-bold uppercase tracking-wider mb-1 sm:mb-0 mt-0.5">{entry.title}</span>
                      <span className="flex-1 text-gray-900 font-semibold bg-white border border-gray-100 rounded-md px-3 py-1.5 text-[13px] shadow-sm whitespace-pre-wrap">{entry.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Hermes Take (if exists) */}
          {prospect.hermesTake && prospect.note && (
            <>
              <Separator className="bg-gray-100" />
              <div className="rounded-2xl border border-[hsl(var(--hermes-gold))]/20 bg-[hsl(var(--hermes-gold))]/5 p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--hermes-gold-dark))]">
                  <img src="/images/hermes-pixel-icon.png" alt="Hermes" className="w-5 h-5 rounded-full object-contain" />
                  Hermes take
                </div>
                <div className="space-y-2 text-[14px] leading-relaxed text-gray-800">
                  <p><span className="font-semibold text-gray-900">Why fit:</span> {prospect.hermesTake.whyFit || prospect.note}</p>
                  {prospect.hermesTake.outreachAngle && (
                    <p><span className="font-semibold text-gray-900">Angle:</span> {prospect.hermesTake.outreachAngle}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator className="bg-gray-100" />

          {/* Feedback Form */}
          {showFeedbackForm && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <h4 className="font-semibold text-[15px] text-gray-900">
                {actionType === 'reject' ? 'Why isn\'t this a good match?' : 'How should we refine the search?'}
              </h4>
              <Textarea
                placeholder={
                  actionType === 'reject' 
                    ? 'e.g., Wrong job level, company too small, not the right industry...'
                    : 'e.g., Focus more on senior roles, add geographic filters, exclude certain industries...'
                }
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-20 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm"
              />
              <div className="flex space-x-2 pt-2">
                <Button onClick={submitFeedback} size="sm" className="bg-[hsl(var(--hermes-gold))] text-white font-semibold hover:bg-[hsl(var(--hermes-gold-dark))] shadow-sm rounded-full px-5">
                  Submit Feedback
                </Button>
                <Button variant="outline" onClick={() => setShowFeedbackForm(false)} size="sm" className="border-gray-200 bg-white text-gray-600 hover:bg-gray-50 rounded-full px-5 shadow-sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showFeedbackForm && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={() => handleAction('approve')} 
                className="flex-1 border border-transparent bg-[hsl(var(--hermes-gold))] text-white font-semibold hover:bg-[hsl(var(--hermes-gold-dark))] shadow-[0_4px_14px_rgba(214,157,74,0.25)] rounded-full py-6 text-[14px]"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Looks Good - Run Full Search
              </Button>
              <Button 
                onClick={() => handleAction('refine')} 
                variant="outline" 
                className="flex-1 border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 shadow-sm rounded-full py-6 text-[14px]"
              >
                <ArrowRight className="w-4 h-4 mr-2 text-gray-400" />
                Refine Search Criteria
              </Button>
              <Button 
                onClick={() => handleAction('reject')} 
                variant="outline" 
                className="flex-[0.5] border-gray-200 bg-gray-50 text-gray-500 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm rounded-full py-6 text-[14px] px-2"
              >
                <ThumbsDown className="w-4 h-4 mr-1.5" />
                Not What I&apos;m Looking For
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
