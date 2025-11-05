'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, User, Building, Send, X } from 'lucide-react'
import { Prospect } from './prospect-grid'

interface EmailTemplate {
  subject: string
  body: string
  type?: string
  tone?: string
}

interface EmailPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSend?: () => void
  template: EmailTemplate
  prospect: Prospect
  isSending?: boolean
}

/**
 * Replaces personalization variables in email content with prospect data
 */
function personalizeContent(content: string, prospect: Prospect): string {
  let personalized = content

  // Replace common variables
  const replacements: Record<string, string> = {
    '{{firstName}}': prospect.firstName || prospect.fullName?.split(' ')[0] || '',
    '{{lastName}}': prospect.lastName || prospect.fullName?.split(' ').slice(1).join(' ') || '',
    '{{fullName}}': prospect.fullName || '',
    '{{company}}': prospect.company || '',
    '{{jobTitle}}': prospect.jobTitle || '',
    '{{location}}': prospect.location || '',
    '{{industry}}': prospect.industry || '',
    '{{email}}': prospect.email || '',
  }

  Object.entries(replacements).forEach(([variable, value]) => {
    personalized = personalized.replace(new RegExp(variable, 'g'), value)
  })

  return personalized
}

export function EmailPreviewModal({
  isOpen,
  onClose,
  onSend,
  template,
  prospect,
  isSending = false
}: EmailPreviewModalProps) {
  const personalizedSubject = personalizeContent(template.subject, prospect)
  const personalizedBody = personalizeContent(template.body, prospect)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-amber-600" />
              <DialogTitle>Email Preview</DialogTitle>
            </div>
            {template.tone && (
              <Badge variant="secondary" className="capitalize">
                {template.tone}
              </Badge>
            )}
          </div>
          <DialogDescription>
            Review the personalized email before sending to {prospect.fullName || prospect.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{prospect.fullName || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{prospect.jobTitle || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{prospect.company || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{prospect.email || 'No email'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Email Content */}
          <div className="space-y-4">
            {/* Subject Line */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Subject</label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="font-medium">{personalizedSubject}</p>
              </div>
            </div>

            {/* Email Body */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Message</label>
              <div className="mt-1 p-4 bg-muted rounded-md border border-border min-h-[200px]">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {personalizedBody}
                </pre>
              </div>
            </div>
          </div>

          {/* Warning if missing data */}
          {(!prospect.email || !prospect.fullName) && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <p className="text-sm text-amber-800">
                  ⚠️ Warning: This prospect is missing some required information.
                  {!prospect.email && ' No email address found.'}
                  {!prospect.fullName && ' No name found.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          {onSend && (
            <Button
              onClick={onSend}
              disabled={isSending || !prospect.email}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
