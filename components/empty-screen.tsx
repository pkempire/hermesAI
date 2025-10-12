import { Mail, Target, TrendingUp, Users } from 'lucide-react'
import { lazy, memo, Suspense, useEffect, useMemo, useState } from 'react'

// Lazy load template marketplace for better initial load performance
const TemplateMarketplace = lazy(() => import('./template-marketplace').then(module => ({ default: module.TemplateMarketplace })))

type Template = {
  heading: string
  message: string
  category: string
  icon: any
  params?: Array<{ key: string; label: string; placeholder?: string }>
}

const exampleMessages: Template[] = [
  {
    heading: 'Partnership Finder',
    message: 'Use my website {{url}} to infer our ICP/offer and find channel partners and directories that could list us. Start with top 20 high-fit partners and pull contacts to reach out.',
    category: 'Analyze your site, find relevant partner directories and channels, extract decision-maker contacts',
    icon: Target,
    params: [{ key: 'url', label: 'Business URL', placeholder: 'https://lucid-education.com' }]
  },
  {
    heading: 'Localized Outreach',
    message: 'Find {{niche}} companies in {{city}}. Start with 25 and enrich email + LinkedIn.',
    category: 'Search companies in specific city, verify contact info, draft personalized emails',
    icon: Users,
    params: [
      { key: 'niche', label: 'Niche', placeholder: 'real estate brokerages' },
      { key: 'city', label: 'City/Region', placeholder: 'Miami, FL' }
    ]
  },
  {
    heading: 'Tech Recruiting',
    message: 'Find {{role}} at {{company_type}} companies in {{location}} who recently posted about {{topic}} on LinkedIn. Pitch {{your_offer}}.',
    category: 'Find companies hiring, identify decision-makers, draft recruitment pitch emails',
    icon: Users,
    params: [
      { key: 'role', label: 'Role', placeholder: 'VP of Engineering' },
      { key: 'company_type', label: 'Company Type', placeholder: 'Series A-B SaaS' },
      { key: 'location', label: 'Location', placeholder: 'San Francisco' },
      { key: 'topic', label: 'Topic', placeholder: 'hiring challenges' },
      { key: 'your_offer', label: 'Your Offer', placeholder: 'AI developer assessment platform' }
    ]
  },
  {
    heading: 'SaaS Sales',
    message: 'Find {{role}} at companies using {{tech_stack}} who mentioned {{pain_point}}. Pitch {{solution}}.',
    category: 'Identify companies with specific tech stack, find decision-makers, draft value-driven pitch',
    icon: TrendingUp,
    params: [
      { key: 'role', label: 'Role', placeholder: 'CTO' },
      { key: 'tech_stack', label: 'Tech Stack', placeholder: 'Postgres + Kubernetes' },
      { key: 'pain_point', label: 'Pain Point', placeholder: 'database performance issues' },
      { key: 'solution', label: 'Your Solution', placeholder: 'automated query optimization tool' }
    ]
  },
  {
    heading: 'Event Follow-up',
    message: 'From {{event}} speakers and sponsors in {{topic}} track, find contacts and draft tailored follow-ups.',
    category: 'Scrape event attendee list, enrich contact info, draft contextual follow-up emails',
    icon: Mail,
    params: [
      { key: 'event', label: 'Event Name', placeholder: 'SaaStr Annual 2025' },
      { key: 'topic', label: 'Topic/Track', placeholder: 'AI & Automation' }
    ]
  },
  {
    heading: 'Competitor Research',
    message: 'Find companies mentioning {{competitor}} on LinkedIn or Twitter who fit {{icp}}. Draft switch pitch emphasizing {{differentiator}}.',
    category: 'Monitor competitor mentions, identify unhappy customers, draft targeted switch emails',
    icon: TrendingUp,
    params: [
      { key: 'competitor', label: 'Competitor', placeholder: 'HubSpot' },
      { key: 'icp', label: 'Target Profile', placeholder: 'B2B SaaS companies 10-50 employees' },
      { key: 'differentiator', label: 'Your Edge', placeholder: 'better pricing and native AI features' }
    ]
  }
] 

// Memoize the component for better performance
export const EmptyScreen = memo(function EmptyScreen({
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
  }, [rotating.length])

  // Memoize expensive computations
  const memoizedRotating = useMemo(() => rotating, [])

  // Memoize the role buttons to prevent re-renders
  const roleButtons = useMemo(() => [
    { role: 'VP of Sales', dept: 'Sales' },
    { role: 'Head of Marketing', dept: 'Marketing' },
    { role: 'CTO', dept: 'Engineering' },
    { role: 'VP of Partnerships', dept: 'Business' },
    { role: 'Head of Growth', dept: 'Growth' },
    { role: 'VP of Engineering', dept: 'Engineering' },
    { role: 'Chief Marketing Officer', dept: 'Executive' },
    { role: 'Director of Partnerships', dept: 'Business' }
  ], [])
  return (
    <div className={`mx-auto w-full max-w-7xl transition-all ${className}`}>
      {!hideHeader && (
        <div className="text-center py-16 px-4 mb-12">
          {/* Hero Section */}
          <div className="mx-auto mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full blur-2xl opacity-30 animate-pulse" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/hermes-avatar.png" 
                alt="Hermes" 
                className="relative h-32 w-32 rounded-full shadow-2xl border-4 border-white/80 ring-4 ring-amber-400/20" 
              />
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-4 text-gray-900 leading-tight tracking-tight">
              Hermes
            </h1>
            <p className="text-xl text-gray-600 font-medium mb-8">AI-Powered Prospecting</p>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
            Your messenger of sales success
          </h2>

          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            Just tell me who you need to reach. I'll find them, verify their details,<br className="hidden sm:block" /> and craft the perfect introduction—faster than the speed of thought.
          </p>

          <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-10">
            No more cold calling strangers. No endless spreadsheets. No generic pitches.<br />
            Start with 50 free prospects—your first victories await.
          </p>
          
          <div className="flex items-center justify-center gap-6 mb-4 flex-wrap text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>50 free credits to start</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
              <span>1 credit per email</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>$39/mo for 200 emails</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-12">

        {/* Template Marketplace with Suspense for lazy loading */}
        <Suspense fallback={
          <div className="space-y-6">
            <div className="text-center">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        }>
          <TemplateMarketplace
            onSelectTemplate={(template) => {
              // Convert template to message format and fill in any available inputs
              let message = template.message

              // Check for any filled template inputs (for backward compatibility)
              const templateIndex = exampleMessages.findIndex(t => t.heading === template.name)
              if (templateIndex !== -1) {
                const values = templateInputs[templateIndex] || {}
                if (template.params) {
                  message = template.params.reduce((acc, p) =>
                    acc.replace(new RegExp(`{{${p.key}}}`, 'g'), values[p.key] || p.placeholder || `{{${p.key}}}`),
                    message
                  )
                }
              }

              submitMessage(message)
            }}
          />
        </Suspense>
      </div>
    </div>
  )
})
