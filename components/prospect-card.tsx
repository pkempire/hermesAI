"use client";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, CheckCircle, CheckCircle2, ExternalLink, Mail, MapPin, MessageSquare, Phone, User, XCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Prospect } from './prospect-grid';

export function ProspectCard({ prospect, onFeedback, onSelect, selected, note, onNoteChange }: {
  prospect: Prospect;
  onFeedback?: (feedback: 'good' | 'bad') => void;
  onSelect?: (s: boolean) => void;
  selected?: boolean;
  note?: string;
  onNoteChange?: (n: string) => void;
}) {
  // Determine the quality score based on available data
  const dataCompleteness = [
    prospect.email,
    prospect.linkedinUrl,
    prospect.jobTitle,
    prospect.company,
    prospect.location
  ].filter(Boolean).length;
  
  const qualityScore = Math.round((dataCompleteness / 5) * 100);
  const fitScore = (prospect as any).fitScore as number | undefined
  
  const [showFullEnrichments, setShowFullEnrichments] = useState(false);
  
  return (
    <Card className={`group relative overflow-hidden interactive-card ${
      selected ? 'ring-2 ring-amber-500 border-amber-300 shadow-lg' : 'border-gray-200'
    }`}>
      {/* Avatar / Company logo with glassmorphism */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 overflow-hidden blur-layer-1">
        <Image
          src={prospect.companyLogoUrl || prospect.avatarUrl || '/images/placeholder-image.png'}
          alt="Profile"
          width={96}
          height={96}
          className="object-cover"
        />
      </div>
      
      {/* Fit/Quality Score with radial progress */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-4 right-4 z-10 cursor-help">
              <div className="relative">
                {/* Radial progress circle */}
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - (fitScore ?? qualityScore) / 100)}`}
                    className={(fitScore ?? qualityScore) >= 80 ? "text-green-500" : (fitScore ?? qualityScore) >= 60 ? "text-amber-500" : "text-orange-500"}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold">{Math.round(fitScore ?? qualityScore)}</span>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Fit Score: {Math.round(fitScore ?? qualityScore)}%</p>
            <p className="text-xs text-gray-500">Data completeness: {dataCompleteness}/5</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-4 left-4 z-10">
          <input 
            type="checkbox" 
            checked={selected || false} 
            onChange={e => onSelect(e.target.checked)}
            className="w-4 h-4 text-hermes-sky bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      <CardHeader className="pb-3 pt-12">
        {/* Header with name and title */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            {prospect.fullName || 'Unknown Prospect'}
          </h3>
          {(prospect as any).summary && (
            <p className="text-xs text-gray-600">{(prospect as any).summary}</p>
          )}
          {prospect.jobTitle && (
            <p className="text-sm font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full inline-block">
              {prospect.jobTitle}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Company Information */}
        {prospect.company && (
          <div className="flex items-center gap-3 p-3 glass rounded-lg lift-on-hover">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400/10 to-orange-400/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{prospect.company}</p>
              {prospect.industry && (
                <p className="text-xs text-muted-foreground">{prospect.industry}</p>
              )}
            </div>
            {prospect.companySize && (
              <Badge variant="outline" className="text-xs glass">
                {prospect.companySize}
              </Badge>
            )}
          </div>
        )}

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 gap-3">
          {/* Email */}
          {prospect.email && (
            <div className="flex items-center gap-3 p-3 glass frosted-green rounded-lg lift-on-hover">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-success flex-shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <a 
                  href={`mailto:${prospect.email}`}
                  className="text-sm font-medium text-success hover:text-green-800 truncate block transition-colors"
                >
                  {prospect.email}
                </a>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          )}

          {/* LinkedIn */}
          {prospect.linkedinUrl && (
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 lift-on-hover">
              <ExternalLink className="w-4 h-4 text-hermes-sky flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <a 
                  href={prospect.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-hermes-sky hover:text-blue-800 transition-colors"
                >
                  LinkedIn Profile
                </a>
              </div>
              <CheckCircle2 className="w-3 h-3 text-blue-500" />
            </div>
          )}

          {/* Phone */}
          {prospect.phone && (
            <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100 lift-on-hover">
              <Phone className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-amber-700">{prospect.phone}</span>
              </div>
            </div>
          )}

          {/* Location */}
          {prospect.location && (
            <div className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
              <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-orange-700">{prospect.location}</span>
              </div>
            </div>
          )}
        </div>

        {/* Additional Enrichments */}
        {prospect.enrichments && Array.isArray(prospect.enrichments) && prospect.enrichments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Additional Information
            </h4>
            <div className="space-y-2">
              {prospect.enrichments.slice(0, showFullEnrichments ? undefined : 3).map((enrichment: any, i: number) => {
                const resultText = Array.isArray(enrichment.result) ? enrichment.result.join(', ') : enrichment.result;
                const isTruncated = resultText && resultText.length > 150;
                const displayText = isTruncated && !showFullEnrichments ? resultText.slice(0, 150) + '...' : resultText;
                
                return (
                  <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-600 flex-1">
                      <span className="font-medium text-amber-700">{enrichment.title || 'Info'}: </span>
                      <span>{displayText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {(prospect.enrichments.length > 3 || prospect.enrichments.some((e: any) => {
              const text = Array.isArray(e.result) ? e.result.join(', ') : e.result;
              return text && text.length > 150;
            })) && (
              <button
                onClick={() => setShowFullEnrichments(!showFullEnrichments)}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                {showFullEnrichments ? 'Show less' : `Show all ${prospect.enrichments.length} enrichments`}
              </button>
            )}
          </div>
        )}

        {/* Notes Section */}
        {onNoteChange && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Notes</label>
            </div>
            <Input
              type="text"
              placeholder="Add your notes about this prospect..."
              value={note || ''}
              onChange={e => onNoteChange(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        {/* Action Buttons */}
        {onFeedback && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onFeedback('good')}
              variant="default"
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Good Fit
            </Button>
            <Button
              onClick={() => onFeedback('bad')}
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Not a Fit
            </Button>
          </div>
        )}

        {/* Helper Text */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
          Review the prospect&apos;s information and LinkedIn profile before proceeding
        </div>
      </CardContent>
    </Card>
  );
} 