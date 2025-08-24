import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Target, TrendingUp, Users } from 'lucide-react'

const exampleMessages = [
  {
    heading: '🏢 Enterprise Sales Leaders',
    message: 'Find VPs of Sales at Series B+ SaaS companies with 200+ employees who recently posted about scaling challenges. Pitch our revenue operations platform.',
    category: 'enterprise',
    icon: TrendingUp
  },
  {
    heading: '⚡ Fast-Growing Startups',
    message: 'Find CTOs at seed/Series A startups that raised funding in the last 6 months. Pitch our infrastructure monitoring tool that prevents downtime.',
    category: 'startups', 
    icon: Target
  },
  {
    heading: '🛒 E-commerce Directors',
    message: 'Find marketing directors at D2C brands with $10M+ revenue who might need better customer analytics. Reference their recent product launches.',
    category: 'ecommerce',
    icon: Users
  },
  {
    heading: '💼 Professional Services',
    message: 'Find partners at consulting firms who work with Fortune 500 clients. Pitch our client management platform that improved project delivery by 40%.',
    category: 'services',
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
    <div className={`mx-auto w-full max-w-4xl transition-all ${className}`}>
      <div className="space-y-8">
        {/* Value Proposition */}
        <div className="text-center space-y-6">
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-200 shadow-lg shadow-blue-500/25">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Smart Discovery</h3>
              <p className="text-sm text-slate-600">AI finds your ideal prospects across LinkedIn and company databases</p>
            </div>
            
            <div className="group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-200 shadow-lg shadow-purple-500/25">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Deep Research</h3>
              <p className="text-sm text-slate-600">Finds recent news, job changes, and company triggers automatically</p>
            </div>
            
            <div className="group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-200 shadow-lg shadow-pink-500/25">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Perfect Personalization</h3>
              <p className="text-sm text-slate-600">Writes compelling, personalized emails that actually get replies</p>
            </div>
          </div>
        </div>

        {/* Example Campaigns */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Start with a proven campaign template
            </h3>
            <p className="text-sm text-slate-600">
              Click any example below or describe your own ideal customer
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleMessages.map((message, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-6 text-left justify-start hover:bg-white hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-500/10 border-slate-200/60 bg-white/50 backdrop-blur-sm transition-all duration-200 group"
                onClick={async () => {
                  submitMessage(message.message)
                }}
              >
                <div className="flex items-start gap-4 w-full">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blue-50 group-hover:to-purple-50 transition-all duration-200">
                    <message.icon className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors duration-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 mb-1 group-hover:text-blue-900 transition-colors duration-200">
                      {message.heading}
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {message.message}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Success Stats */}
        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                3.2x
              </div>
              <p className="text-sm text-slate-600">Higher reply rates vs generic emails</p>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                89%
              </div>
              <p className="text-sm text-slate-600">Time saved on prospect research</p>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                10x
              </div>
              <p className="text-sm text-slate-600">Faster campaign launch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
