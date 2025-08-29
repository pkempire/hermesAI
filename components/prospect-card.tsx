"use client";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image'
import { Building2, CheckCircle, CheckCircle2, ExternalLink, Mail, MapPin, MessageSquare, Phone, User, XCircle } from 'lucide-react';
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
  
  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
      selected ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-gradient-to-br from-white to-gray-50/50'
    }`}>
      {/* Avatar / Company logo */}
      {(prospect.avatarUrl || prospect.companyLogoUrl) && (
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 overflow-hidden">
          <Image
            src={prospect.avatarUrl || prospect.companyLogoUrl!}
            alt="Profile"
            width={96}
            height={96}
            className="object-cover"
          />
        </div>
      )}
      {/* Quality Score Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant={qualityScore >= 80 ? "default" : qualityScore >= 60 ? "secondary" : "destructive"}>
          {qualityScore}% Complete
        </Badge>
      </div>

      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-4 left-4 z-10">
          <input 
            type="checkbox" 
            checked={selected || false} 
            onChange={e => onSelect(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      <CardHeader className="pb-3 pt-12">
        {/* Header with name and title */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            {prospect.fullName || 'Unknown Prospect'}
          </h3>
          {prospect.jobTitle && (
            <p className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
              {prospect.jobTitle}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Company Information */}
        {prospect.company && (
          <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-lg">
            <Building2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{prospect.company}</p>
              {prospect.industry && (
                <p className="text-xs text-gray-600">{prospect.industry}</p>
              )}
            </div>
            {prospect.companySize && (
              <Badge variant="outline" className="text-xs">
                {prospect.companySize}
              </Badge>
            )}
          </div>
        )}

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 gap-3">
          {/* Email */}
          {prospect.email && (
            <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
              <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <a 
                  href={`mailto:${prospect.email}`}
                  className="text-sm font-medium text-green-700 hover:text-green-800 truncate block"
                >
                  {prospect.email}
                </a>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          )}

          {/* LinkedIn */}
          {prospect.linkedinUrl && (
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <a 
                  href={prospect.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  LinkedIn Profile
                </a>
              </div>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </div>
          )}

          {/* Phone */}
          {prospect.phone && (
            <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-lg border border-purple-100">
              <Phone className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-purple-700">{prospect.phone}</span>
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
              {prospect.enrichments.slice(0, 3).map((enrichment: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600 flex-1">
                    <span className="font-medium">{enrichment.title || 'Info'}: </span>
                    {Array.isArray(enrichment.result) ? enrichment.result.join(', ') : enrichment.result}
                  </div>
                </div>
              ))}
            </div>
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