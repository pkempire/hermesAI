import { Button } from '@/components/ui/button'
import { Mail, Target, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

type Template = {
  heading: string
  message: string
  category: string
  icon: any
  params?: Array<{ key: string; label: string; placeholder?: string }>
}

const exampleMessages: Template[] = [
  {
    heading: 'Partnerships Finder',
    message: 'Use my website {{url}} to infer our ICP/offer and find channel partners and directories that could list us. Start with top 20 high-fit partners and pull contacts to reach out.',
    category: 'partnerships',
    icon: Target,
    params: [{ key: 'url', label: 'Business URL', placeholder: 'https://example.com' }]
  },
  {
    heading: 'Localized Finder',
    message: 'Find {{niche}} companies in {{city}}. Start with 25 and enrich email + LinkedIn.',
    category: 'local',
    icon: Users,
    params: [
      { key: 'niche', label: 'Niche', placeholder: 'property managers' },
      { key: 'city', label: 'City/Region', placeholder: 'Austin, TX' }
    ]
  },
  {
    heading: 'Tech Recruiting',
    message: 'Find VPs of Engineering at Series A-B fintech companies who recently posted on LinkedIn about hiring challenges. Pitch our AI-powered developer assessment platform.',
    category: 'recruiting',
    icon: Users
  },
  {
    heading: 'SaaS Sales',
    message: 'Find CTOs at mid-market companies using Postgres databases who mentioned API performance issues. Pitch our monitoring tool that helped Stripe reduce latency by 40%.',
    category: 'sales', 
    icon: TrendingUp
  },
  {
    heading: 'Event Follow-up',
    message: 'From {{event}} speakers and sponsors in {{topic}} track, find contacts and draft tailored follow-ups.',
    category: 'event',
    icon: Mail,
    params: [
      { key: 'event', label: 'Event Name' },
      { key: 'topic', label: 'Topic/Track' }
    ]
  },
  {
    heading: 'Competitor Poach',
    message: 'Find users mentioning {{competitor}} who fit {{role}} roles and draft switch pitch.',
    category: 'poach',
    icon: TrendingUp,
    params: [
      { key: 'competitor', label: 'Competitor' },
      { key: 'role', label: 'Role', placeholder: 'CTO' }
    ]
  }
] 

export function EmptyScreen({
  submitMessage,
  className,
  hideHeader = false
}: {
  submitMessage: (message: string) => void
  className?: string
  hideHeader?: boolean
}) {
  const rotating = [
    'perfect partnership',
    'ideal customer',
    'AI sales engineer',
    'local lead',
    'channel partner'
  ]
  const [wordIndex, setWordIndex] = useState(0)
  const [templateInputs, setTemplateInputs] = useState<Record<number, Record<string, string>>>({})
  useEffect(() => {
    const id = setInterval(() => setWordIndex(i => (i + 1) % rotating.length), 2200)
    return () => clearInterval(id)
  }, [])
  return (
    <div className={`mx-auto w-full max-w-3xl transition-all ${className}`}>
      <div className="space-y-6">
        {!hideHeader && (
          <div className="text-center py-6">
            <h1 className="text-3xl font-semibold">
              Find your <span className="text-primary transition-colors">{rotating[wordIndex]}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Ready-to-use templates from the community. Click to load into chat and edit before running.</p>
          </div>
        )}
        {/* Intent-based template buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exampleMessages.map((tpl, index) => {
            const requiresParams = tpl.params && tpl.params.length > 0
            const values = templateInputs[index] || {}
            const canSend = !requiresParams || tpl.params!.every(p => (values[p.key] || '').trim().length > 0)
            const filledMessage = requiresParams
              ? tpl.params!.reduce((acc, p) => acc.replace(new RegExp(`{{${p.key}}}`, 'g'), values[p.key] || p.placeholder || ''), tpl.message)
              : tpl.message
            return (
              <div key={index} className="p-4 bg-card border rounded-lg">
                <div className="flex items-start gap-3 w-full">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <tpl.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground mb-1 text-sm">{tpl.heading}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed mb-2">{tpl.message}</div>
                    {requiresParams && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        {tpl.params!.map(p => (
                          <input
                            key={p.key}
                            placeholder={p.placeholder || p.label}
                            className="w-full text-sm bg-white border rounded px-2 py-1"
                            value={values[p.key] || ''}
                            onChange={e => setTemplateInputs(prev => ({ ...prev, [index]: { ...(prev[index] || {}), [p.key]: e.target.value } }))}
                          />
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      disabled={!canSend}
                      onClick={() => submitMessage(filledMessage)}
                    >
                      Load into chat
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
