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
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-blue-900">Preview Result</CardTitle>
            <CardDescription className="text-blue-700">
              Here&apos;s 1 example prospect that matches your search criteria. Review the quality and decide how to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-blue-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="font-medium">Query:</span>
                <p className="truncate">&quot;{searchSummary.query}&quot;</p>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <p className="capitalize">{searchSummary.entityType}</p>
              </div>
              <div>
                <span className="font-medium">Criteria:</span>
                <p>{searchSummary.criteria} filters</p>
              </div>
              <div>
                <span className="font-medium">Enrichments:</span>
                <p>{searchSummary.enrichments} fields</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prospect Card */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>{prospect.fullName}</span>
              </CardTitle>
              <CardDescription className="flex items-center space-x-2 text-base">
                <Building className="w-4 h-4" />
                <span>{prospect.jobTitle} at {prospect.company}</span>
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Match Found
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Contact Information</h4>
              <div className="space-y-2 text-sm">
                {prospect.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline">
                      {prospect.email}
                    </a>
                  </div>
                )}
                {prospect.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{prospect.phone}</span>
                  </div>
                )}
                {prospect.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{prospect.location}</span>
                  </div>
                )}
                {prospect.linkedinUrl && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <a 
                      href={prospect.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Company Information</h4>
              <div className="space-y-2 text-sm">
                {prospect.industry && (
                  <div>
                    <span className="text-gray-500">Industry:</span>
                    <span className="ml-2">{prospect.industry}</span>
                  </div>
                )}
                {prospect.companySize && (
                  <div>
                    <span className="text-gray-500">Company Size:</span>
                    <span className="ml-2">{prospect.companySize}</span>
                  </div>
                )}
                {prospect.website && (
                  <div>
                    <span className="text-gray-500">Website:</span>
                    <a 
                      href={prospect.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <span className="truncate">{prospect.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Feedback Form */}
          {showFeedbackForm && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">
                {actionType === 'reject' ? 'Why isn&apos;t this a good match?' : 'How should we refine the search?'}
              </h4>
              <Textarea
                placeholder={
                  actionType === 'reject' 
                    ? 'e.g., Wrong job level, company too small, not the right industry...'
                    : 'e.g., Focus more on senior roles, add geographic filters, exclude certain industries...'
                }
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-20"
              />
              <div className="flex space-x-2">
                <Button onClick={submitFeedback} size="sm">
                  Submit Feedback
                </Button>
                <Button variant="outline" onClick={() => setShowFeedbackForm(false)} size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showFeedbackForm && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => handleAction('approve')} 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Looks Good - Run Full Search
              </Button>
              <Button 
                onClick={() => handleAction('refine')} 
                variant="outline" 
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Refine Search Criteria
              </Button>
              <Button 
                onClick={() => handleAction('reject')} 
                variant="outline" 
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Not What I&apos;m Looking For
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}