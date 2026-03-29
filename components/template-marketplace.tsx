'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ArrowRight, Building, Sparkles, Target, Users } from 'lucide-react'
import { memo, useState } from 'react'

const HARDCODED_TEMPLATES = [
  {
    id: 't1',
    name: 'B2B Enterprise Outreach',
    category: 'Sales',
    description: 'Find VP of Engineering at {{size}} companies in {{industry}} to pitch {{offer}}.',
    message: 'Find VP of Engineering at {{size}} companies in {{industry}} to pitch {{offer}}.',
    icon: Building,
    params: [
      { key: 'size', placeholder: '500-1000 employee' },
      { key: 'industry', placeholder: 'Fintech' },
      { key: 'offer', placeholder: 'our cloud security API' }
    ]
  },
  {
    id: 't2',
    name: 'Strategic Partnerships',
    category: 'Partnerships',
    description: 'Identify Head of Partnerships at {{geo}} based {{type}} startups to offer {{value}}.',
    message: 'Identify Head of Partnerships at {{geo}} based {{type}} startups to offer {{value}}.',
    icon: Target,
    params: [
      { key: 'geo', placeholder: 'NYC' },
      { key: 'type', placeholder: 'SaaS' },
      { key: 'value', placeholder: 'co-marketing campaigns' }
    ]
  },
  {
    id: 't3',
    name: 'Executive Recruiting',
    category: 'Recruiting',
    description: 'Source Senior Product Managers from {{competitors}} who specialize in {{skill}}.',
    message: 'Source Senior Product Managers from {{competitors}} who specialize in {{skill}}.',
    icon: Users,
    params: [
      { key: 'competitors', placeholder: 'Stripe, Plaid, or Square' },
      { key: 'skill', placeholder: 'payment infrastructure' }
    ]
  }
]

export const TemplateMarketplace = memo(function TemplateMarketplace({
  onSelectTemplate,
  className
}: {
  onSelectTemplate: (template: any) => void
  className?: string
}) {
  const TemplateCard = memo(({ template }: { template: typeof HARDCODED_TEMPLATES[0] }) => {
    const Icon = template.icon
    const [values, setValues] = useState<Record<string, string>>({})

    const renderDescription = () => {
      const parts: (string | JSX.Element)[] = []
      let remainingText = template.description
      let partIndex = 0

      template.params.forEach((param, idx) => {
        const placeholder = `{{${param.key}}}`
        const placeholderIndex = remainingText.indexOf(placeholder)
        
        if (placeholderIndex !== -1) {
          if (placeholderIndex > 0) {
            parts.push(
              <span key={`text-${partIndex++}`} className="text-[15px] text-gray-500 font-medium">
                {remainingText.substring(0, placeholderIndex)}
              </span>
            )
          }
          
          parts.push(
            <Input
              key={`input-${idx}`}
              value={values[param.key] ?? ''}
              onChange={(e) => setValues(prev => ({ ...prev, [param.key]: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              placeholder={param.placeholder || ''}
              className="inline-block w-auto min-w-[130px] max-w-[200px] h-8 px-3 py-0 text-[15px] font-semibold border-b-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100 focus:border-[hsl(var(--hermes-gold))] focus:bg-white focus:outline-none focus:ring-0 rounded-md mx-1 align-middle transition-all shadow-none placeholder:text-gray-400 placeholder:font-medium text-gray-900"
            />
          )
          
          remainingText = remainingText.substring(placeholderIndex + placeholder.length)
        }
      })
      
      if (remainingText) {
        parts.push(
          <span key={`text-${partIndex++}`} className="text-[15px] text-gray-500 font-medium">
            {remainingText}
          </span>
        )
      }

      return <div className="leading-[2.2] flex flex-wrap items-center gap-y-2">{parts}</div>
    }

    const getFilledMessage = () => {
      let msg = template.message
      for (const p of template.params) {
        const v = (values[p.key] ?? '').trim() || (p.placeholder || `{{${p.key}}}`)
        msg = msg.replace(new RegExp(`\\{\\{${p.key}\\}\\}`, 'g'), v)
      }
      return msg
    }

    const allParamsFilled = template.params.every(p => (values[p.key] ?? '').trim().length > 0)

    return (
      <Card 
        onClick={(e) => {
          e.preventDefault()
          if (allParamsFilled) {
            onSelectTemplate({ ...template, message: getFilledMessage() })
          }
        }}
        className={cn(
          "group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[2rem] border bg-white p-6 md:p-8 transition-all duration-300 ring-1 ring-gray-100/50",
          allParamsFilled 
            ? "border-[hsl(var(--hermes-gold))]/30 shadow-[0_8px_30px_rgba(214,157,74,0.12)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(214,157,74,0.16)]" 
            : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
        )}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--hermes-gold))]/10 text-[hsl(var(--hermes-gold-dark))]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Playbook
              </span>
            </div>
          </div>
          
          <h3 className="mb-4 font-serif text-[1.7rem] tracking-tight text-gray-900 leading-none">
            {template.name}
          </h3>
          <div className="min-h-[100px]">
             {renderDescription()}
          </div>
        </div>
        
        <div className="mt-8 flex w-full items-center justify-between pt-5 border-t border-gray-100">
          <span className={cn("text-[13px] font-semibold transition-colors uppercase tracking-wider", allParamsFilled ? "text-[hsl(var(--hermes-gold-dark))]" : "text-gray-400")}>
            {allParamsFilled ? "Ready to run" : "Fill parameters to run"}
          </span>
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-all", allParamsFilled ? "bg-[hsl(var(--hermes-gold))] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200")}>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Card>
    )
  })

  TemplateCard.displayName = 'TemplateCard'

  return (
    <div className={cn("space-y-12", className)}>
      <div className="text-center space-y-4 pt-10">
        <h2 className="font-serif text-5xl leading-none text-gray-900 md:text-[3.6rem] tracking-tight">
          What can Hermes automate for you?
        </h2>
        <p className="text-[16px] font-medium text-gray-500 max-w-2xl mx-auto">
          Select a playbook below to instantly discover highly qualified prospects and draft personalized outreach.
        </p>
      </div>
      
      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {HARDCODED_TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  )
})
