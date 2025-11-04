'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowRight, Copy, Mail, Target, TrendingUp, Users } from 'lucide-react'
import { memo, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'

type Template = {
  id: string
  name: string
  description: string
  message: string
  category: string
  params?: Array<{ key: string; label: string; placeholder?: string }>
}

const categoryIcons = {
  'Partnerships': Target,
  'Sales': TrendingUp,
  'Recruiting': Users,
  'Networking': Mail,
  'Growth': TrendingUp
}

// Match production templates exactly
const fallbackTemplates: Template[] = [
  {
    id: 'fallback-1',
    name: 'Partnership Finder',
    description: 'Use my website {{url}} to infer our ICP/offer and find channel partners and directories that could list us. Start with top 20 high-fit partners and pull contacts to reach out.',
    message: 'Use my website {{url}} to infer our ICP/offer and find channel partners and directories that could list us. Start with top 20 high-fit partners and pull contacts to reach out.',
    category: 'Partnerships',
    params: [{ key: 'url', label: 'Business URL', placeholder: 'https://example.com' }]
  },
  {
    id: 'fallback-2',
    name: 'Localized Finder',
    description: 'Find {{niche}} companies in {{city}}. Start with 25 and enrich email + LinkedIn.',
    message: 'Find {{niche}} companies in {{city}}. Start with 25 and enrich email + LinkedIn.',
    category: 'Sales',
    params: [
      { key: 'niche', label: 'Niche', placeholder: 'property managers' },
      { key: 'city', label: 'City/Region', placeholder: 'Austin, TX' }
    ]
  },
  {
    id: 'fallback-3',
    name: 'Tech Recruiting',
    description: 'Find VPs of Engineering at Series A-B fintech companies who recently posted on LinkedIn about hiring challenges. Pitch our AI-powered developer assessment platform.',
    message: 'Find VPs of Engineering at Series A-B fintech companies who recently posted on LinkedIn about hiring challenges. Pitch our AI-powered developer assessment platform.',
    category: 'Recruiting'
  },
  {
    id: 'fallback-4',
    name: 'SaaS Sales',
    description: 'Find CTOs at mid-market companies using Postgres databases who mentioned API performance issues. Pitch our monitoring tool that helped Stripe reduce latency by 40%.',
    message: 'Find CTOs at mid-market companies using Postgres databases who mentioned API performance issues. Pitch our monitoring tool that helped Stripe reduce latency by 40%.',
    category: 'Sales'
  },
  {
    id: 'fallback-5',
    name: 'Event Follow-up',
    description: 'From {{event}} speakers and sponsors in {{topic}} track, find contacts and draft tailored follow-ups.',
    message: 'From {{event}} speakers and sponsors in {{topic}} track, find contacts and draft tailored follow-ups.',
    category: 'Networking',
    params: [
      { key: 'event', label: 'Event Name', placeholder: 'Event Name' },
      { key: 'topic', label: 'Topic/Track', placeholder: 'Topic/Track' }
    ]
  },
  {
    id: 'fallback-6',
    name: 'Competitor Poach',
    description: 'Find users mentioning {{competitor}} who fit {{role}} roles and draft switch pitch.',
    message: 'Find users mentioning {{competitor}} who fit {{role}} roles and draft switch pitch.',
    category: 'Sales',
    params: [
      { key: 'competitor', label: 'Competitor', placeholder: 'Competitor' },
      { key: 'role', label: 'Role', placeholder: 'CTO' }
    ]
  }
]

export const TemplateMarketplace = memo(function TemplateMarketplace({
  onSelectTemplate,
  className
}: {
  onSelectTemplate: (template: Template) => void
  className?: string
}) {
  const [popularTemplates, setPopularTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      setPopularTemplates(fallbackTemplates)
    } catch (error) {
      setPopularTemplates(fallbackTemplates)
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = useCallback(async (template: Template, filledMessage: string) => {
    try {
      await fetch('/api/templates/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id })
      })
    } catch (error) {
      // Silent error
    }

    onSelectTemplate({ ...template, message: filledMessage })
  }, [onSelectTemplate])

  const TemplateCard = memo(({ template }: { template: Template }) => {
    const Icon = categoryIcons[template.category as keyof typeof categoryIcons] || Target
    const [values, setValues] = useState<Record<string, string>>({})
    const { copyToClipboard } = useCopyToClipboard()

    // Render description with inline inputs (matching production design exactly)
    const renderDescription = () => {
      if (!template.params || template.params.length === 0) {
        return <span className="text-sm text-gray-600">{template.description}</span>
      }

      // Split description by params and render inline inputs
      const parts: (string | JSX.Element)[] = []
      let remainingText = template.description
      let partIndex = 0

      template.params.forEach((param, idx) => {
        const placeholder = `{{${param.key}}}`
        const placeholderIndex = remainingText.indexOf(placeholder)
        
        if (placeholderIndex !== -1) {
          // Add text before placeholder
          if (placeholderIndex > 0) {
            parts.push(
              <span key={`text-${partIndex++}`} className="text-sm text-gray-600">
                {remainingText.substring(0, placeholderIndex)}
              </span>
            )
          }
          
          // Add inline input (styled to match production - minimal, clean)
          parts.push(
            <Input
              key={`input-${idx}`}
              value={values[param.key] ?? ''}
              onChange={(e) => setValues(prev => ({ ...prev, [param.key]: e.target.value }))}
              placeholder={param.placeholder || ''}
              className="inline-block w-auto min-w-[100px] max-w-[180px] h-6 px-2 py-0.5 text-xs border border-gray-300 rounded bg-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 mx-0.5 align-middle"
            />
          )
          
          // Update remaining text
          remainingText = remainingText.substring(placeholderIndex + placeholder.length)
        }
      })
      
      // Add remaining text
      if (remainingText) {
        parts.push(
          <span key={`text-${partIndex++}`} className="text-sm text-gray-600">
            {remainingText}
          </span>
        )
      }

      return <div className="text-sm text-gray-600 leading-relaxed flex flex-wrap items-center gap-0.5">{parts}</div>
    }

    const getFilledMessage = () => {
      let msg = template.message
      if (template.params && template.params.length > 0) {
        for (const p of template.params) {
          const v = (values[p.key] ?? '').trim() || (p.placeholder || `{{${p.key}}}`)
          msg = msg.replace(new RegExp(`\\{\\{${p.key}\\}\\}`, 'g'), v)
        }
      }
      return msg
    }

    const allParamsFilled = template.params ? template.params.every(p => (values[p.key] ?? '').trim().length > 0) : true

    return (
      <Card className="group relative bg-white border border-gray-200 hover:border-amber-300 transition-all duration-200 overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-gray-900 mb-1.5">
                {template.name}
              </CardTitle>
              <div className="text-xs text-gray-600 leading-relaxed">
                {renderDescription()}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={(e) => {
                e.preventDefault()
                const filledMessage = getFilledMessage()
                copyToClipboard(filledMessage)
                toast.success('Copied to clipboard')
              }}
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs border-gray-300 hover:bg-gray-50"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault()
                const filledMessage = getFilledMessage()
                handleUseTemplate(template, filledMessage)
              }}
              disabled={!allParamsFilled}
              className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-7"
            >
              Load into chat
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  })

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {popularTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No playbooks available</p>
        </div>
      )}
    </div>
  )
})
