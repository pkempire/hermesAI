'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Bookmark, Eye, Mail, Target, TrendingUp, Users, Zap } from 'lucide-react'
import { memo, useCallback, useEffect, useState } from 'react'

type Template = {
  id: string
  name: string
  description: string
  message: string
  category: string
  params?: Array<{ key: string; label: string; placeholder?: string }>
  save_count: number
  use_count: number
  tags: string[]
  is_featured?: boolean
  saved_at?: string
}

const categoryIcons = {
  'Partnerships': Target,
  'Sales': TrendingUp,
  'Recruiting': Users,
  'Networking': Mail,
  'Growth': Zap
}

// Fallback templates when database is not available
const fallbackTemplates: Template[] = [
  {
    id: 'fallback-1',
    name: 'Partnership Finder',
    description: 'Find potential channel partners and directories for your business',
    message: 'Use my website {{url}} to infer our ICP/offer and find channel partners and directories that could list us. Start with top 20 high-fit partners and pull contacts to reach out.',
    category: 'Partnerships',
    save_count: 1247,
    use_count: 3891,
    tags: ['partnerships', 'business development', 'channels'],
    is_featured: true
  },
  {
    id: 'fallback-2',
    name: 'Localized Outreach',
    description: 'Target companies in specific geographic locations',
    message: 'Find {{niche}} companies in {{city}}. Start with 25 and enrich email + LinkedIn.',
    category: 'Sales',
    save_count: 987,
    use_count: 2456,
    tags: ['local', 'geographic', 'sales'],
    is_featured: true
  },
  {
    id: 'fallback-3',
    name: 'Tech Recruiting',
    description: 'Find decision-makers for technical recruitment',
    message: 'Find {{role}} at {{company_type}} companies in {{location}} who recently posted about {{topic}} on LinkedIn. Pitch {{your_offer}}.',
    category: 'Recruiting',
    save_count: 756,
    use_count: 1923,
    tags: ['recruiting', 'technical', 'hiring'],
    is_featured: true
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
      console.error('Error loading templates:', error)
      setPopularTemplates(fallbackTemplates)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = useCallback(async (_templateId: string, _isSaved: boolean) => {
    // Saved templates disabled in this build
  }, [])

  const handleUseTemplate = useCallback(async (template: Template) => {
    try {
      await fetch('/api/templates/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id })
      })
    } catch (error) {
      console.error('Error tracking template usage:', error)
    }

    onSelectTemplate(template)
  }, [onSelectTemplate])

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }, [])

  const TemplateCard = memo(({ template }: { template: Template }) => {
    const Icon = categoryIcons[template.category as keyof typeof categoryIcons] || Target
    const [values, setValues] = useState<Record<string, string>>({})

    const renderPreview = () => {
      if (!template.params || template.params.length === 0) return template.message
      let msg = template.message
      for (const p of template.params) {
        const v = values[p.key] ?? ''
        msg = msg.replace(new RegExp(`\\{\\{${p.key}\\}\\}`, 'g'), v.length ? v : (p.placeholder || `{{${p.key}}}`))
      }
      return msg
    }

    return (
      <Card className="group relative bg-white hover:shadow-xl hover:shadow-amber-200/20 transition-all duration-300 border-2 hover:border-amber-300 hover:scale-[1.02] cursor-pointer overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-10 w-10 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg flex items-center justify-center border border-amber-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-200/30">
                <Icon className="w-5 h-5 text-amber-600 group-hover:text-amber-700 transition-colors duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">
                  {template.name}
                  {template.is_featured && (
                    <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 text-xs">
                      Featured
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 line-clamp-2">
                  {template.description}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSaveTemplate(template.id, false)}
              className="shrink-0 hover:bg-amber-50"
            >
              <Bookmark className="w-4 h-4 text-gray-300" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              <span>{formatNumber(template.save_count)} saves</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{formatNumber(template.use_count)} uses</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags?.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                {tag}
              </Badge>
            ))}
          </div>
          {template.params && template.params.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {template.params.map((p) => (
                <div key={p.key} className="space-y-1">
                  <Label className="text-xs text-gray-600">{p.label}</Label>
                  <Input
                    value={values[p.key] ?? ''}
                    onChange={(e) => setValues(prev => ({ ...prev, [p.key]: e.target.value }))}
                    placeholder={p.placeholder || ''}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-wrap">
            {renderPreview()}
          </div>
          <Button
            onClick={(e) => {
              e.preventDefault()
              let msg = template.message
              if (template.params && template.params.length > 0) {
                for (const p of template.params) {
                  const v = (values[p.key] ?? '').trim() || (p.placeholder || `{{${p.key}}}`)
                  msg = msg.replace(new RegExp(`\\{\\{${p.key}\\}\\}`, 'g'), v)
                }
              }
              handleUseTemplate({ ...template, message: msg })
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-medium shadow-md hover:shadow-lg hover:shadow-amber-300/30 transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden group/btn"
          >
            <span className="relative z-10 flex items-center justify-center">
              Use Playbook
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-300/30 to-yellow-300/30 scale-0 group-hover/btn:scale-100 transition-transform duration-500 rounded-md" />
          </Button>
        </CardContent>
      </Card>
    )
  })

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Playbooks</h2>
        <p className="text-gray-600">Curated playbooks from the community to jumpstart your workflows</p>
      </div>
      <div className="space-y-6">
        {popularTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No popular playbooks available
          </div>
        )}
      </div>
    </div>
  )
})