import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Target, TrendingUp, Users } from 'lucide-react'

const exampleMessages = [
  {
    heading: '🎯 Sales: Target SaaS VPs hiring SDRs',
    message: 'Find VPs of Sales at SaaS companies that are currently hiring SDRs. Pitch our sales automation platform that increased pipeline by 3x for similar companies.',
    category: 'sales'
  },
  {
    heading: '👨‍💼 Recruiting: CTOs at scaling fintechs',
    message: 'Find 10 CTOs at fintech companies who posted about API scaling issues. I want to pitch them our monitoring tool that helped Stripe reduce latency by 60%.',
    category: 'recruiting'
  },
  {
    heading: '🚀 Marketing: E-commerce growth teams',
    message: 'Find marketing directors at e-commerce brands with 50-200 employees. I want to pitch our customer analytics platform that helped increase conversion rates.',
    category: 'marketing'
  },
  {
    heading: '⚡ DevTools: React teams needing speed',
    message: 'Find frontend engineers at companies using React who might be interested in our new development tool that reduces build times by 80%.',
    category: 'devtools'
  }
]

export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-background p-2">
        {/* HermesAI Introduction */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HermesAI
              </h1>
              <p className="text-sm text-muted-foreground">AI-Powered Cold Email Campaigns</p>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-muted-foreground mb-4">
              Stop juggling 7 tools for cold email. Just tell me who you want to reach and what you&apos;re selling - I&apos;ll find prospects, research their backgrounds, and write personalized emails.
            </p>
            
            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Find prospects</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <span>Research triggers</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span>Personalize at scale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Example Use Cases */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground text-center mb-4">
            Try these examples or describe your own campaign:
          </h3>
          
          <div className="grid gap-3">
            {exampleMessages.map((message, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 text-left justify-start hover:bg-accent/50 border-dashed"
                onClick={async () => {
                  submitMessage(message.message)
                }}
              >
                <ArrowRight size={16} className="mr-3 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{message.heading}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {message.message}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 <strong>Pro tip:</strong> Be specific about your target (job titles, company types, recent activities) and your value proposition for best results.
          </p>
        </div>
      </div>
    </div>
  )
}
