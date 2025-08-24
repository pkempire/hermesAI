import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Target, TrendingUp, Users } from 'lucide-react'

const exampleMessages = [
  {
    heading: 'Recruiting',
    message: 'Find CTOs at fintech companies with 50-200 employees who recently posted about scaling their engineering teams. Pitch our technical recruiting services.',
    category: 'recruiting',
    icon: Users
  },
  {
    heading: 'Outbound Sales',
    message: 'Find VPs of Sales at Series B+ SaaS companies who recently closed funding. Pitch our sales automation platform that increased pipeline by 300%.',
    category: 'sales', 
    icon: TrendingUp
  },
  {
    heading: 'Partnership Outreach',
    message: 'Find business development directors at e-commerce platforms with $10M+ revenue. Propose a strategic partnership that could drive mutual growth.',
    category: 'partnerships',
    icon: Target
  },
  {
    heading: 'Vendor Outreach',
    message: 'Find procurement managers at Fortune 500 companies who might need our compliance software. Reference their recent regulatory announcements.',
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
        {/* Template buttons in Perplexity style */}
        <div className="grid grid-cols-2 gap-3">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 text-left justify-start bg-[#1a1a1e] border-[#2a2a2e] hover:bg-[#2a2a2e] hover:border-[#404040] transition-all duration-200 group"
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="w-8 h-8 bg-[#2a2a2e] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#404040] transition-all duration-200">
                  <message.icon className="w-4 h-4 text-[#20b2aa] transition-colors duration-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#e5e7eb] mb-1 text-sm">
                    {message.heading}
                  </div>
                  <div className="text-xs text-[#9ca3af] leading-relaxed line-clamp-2">
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
