import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Target, TrendingUp, Users } from 'lucide-react'

const exampleMessages = [
  {
    heading: 'Tech Recruiting',
    message: 'Find VPs of Engineering at Series A-B fintech companies who recently posted on LinkedIn about hiring challenges. I want to pitch our AI-powered developer assessment platform.',
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
    heading: 'Agency Outreach',
    message: 'Find marketing directors at B2B SaaS companies with $5-50M ARR who recently hired new CMOs. Propose our content marketing services that generated 300% more SQLs.',
    category: 'partnerships',
    icon: Target
  },
  {
    heading: 'Enterprise Sales',
    message: 'Find IT security managers at Fortune 1000 companies who were recently mentioned in cybersecurity incident news. Pitch our zero-trust security platform.',
    category: 'vendor',
    icon: Mail
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
    <div className={`mx-auto w-full max-w-3xl transition-all ${className}`}>
      <div className="space-y-6">
        {/* Intent-based template buttons */}
        <div className="grid grid-cols-2 gap-3">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 text-left justify-start bg-card border-border hover:bg-muted hover:border-border/80 transition-all duration-200 group"
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-all duration-200">
                  <message.icon className="w-4 h-4 text-primary transition-colors duration-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground mb-1 text-sm">
                    {message.heading}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {message.message}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
