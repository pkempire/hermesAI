'use client'

import {
  BarChart3,
  CheckCircle2,
  Circle,
  Eye,
  Mail,
  Search,
  Send
} from 'lucide-react'

export interface CampaignStep {
  id: number
  title: string
  description: string
  status: 'completed' | 'current' | 'pending' | 'skipped'
  icon: React.ReactNode
  estimatedTime?: string
  completedAt?: Date
}

interface CampaignProgressTrackerProps {
  currentStep: number
  steps?: CampaignStep[]
  campaignTitle?: string
  className?: string
}

const DEFAULT_STEPS: CampaignStep[] = [
  {
    id: 1,
    title: 'Prospect Research',
    description: 'Find and validate target prospects using AI-powered search',
    status: 'pending',
    icon: <Search className="w-4 h-4" />,
    estimatedTime: '2-5 minutes'
  },
  {
    id: 2,
    title: 'Email Creation',
    description: 'Draft personalized email templates with AI assistance',
    status: 'pending',
    icon: <Mail className="w-4 h-4" />,
    estimatedTime: '3-7 minutes'
  },
  {
    id: 3,
    title: 'Campaign Review',
    description: 'Review prospects, emails, and campaign settings',
    status: 'pending',
    icon: <Eye className="w-4 h-4" />,
    estimatedTime: '2-3 minutes'
  },
  {
    id: 4,
    title: 'Send Campaign',
    description: 'Launch your personalized email campaign',
    status: 'pending',
    icon: <Send className="w-4 h-4" />,
    estimatedTime: '1 minute'
  },
  {
    id: 5,
    title: 'Track Results',
    description: 'Monitor opens, replies, and campaign performance',
    status: 'pending',
    icon: <BarChart3 className="w-4 h-4" />,
    estimatedTime: 'Ongoing'
  }
]

export function CampaignProgressTracker({
  currentStep,
  steps = DEFAULT_STEPS,
  campaignTitle = 'Cold Email Campaign',
  className = ''
}: CampaignProgressTrackerProps) {
  
  // Update step statuses based on current step
  const updatedSteps = steps.map(step => ({
    ...step,
    status: (step.id < currentStep ? 'completed' : 
            step.id === currentStep ? 'current' : 'pending') as 'completed' | 'current' | 'pending' | 'skipped'
  }))

  const completedSteps = updatedSteps.filter(step => step.status === 'completed').length
  const progressPercentage = (completedSteps / steps.length) * 100

  const getStepIcon = (step: CampaignStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'current':
        return (
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )
      case 'pending':
        return <Circle className="w-5 h-5 text-gray-400" />
      case 'skipped':
        return <Circle className="w-5 h-5 text-gray-300" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStepColor = (step: CampaignStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-900 bg-green-50 border-green-200'
      case 'current':
        return 'text-blue-900 bg-blue-50 border-blue-200'
      case 'pending':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'skipped':
        return 'text-gray-400 bg-gray-25 border-gray-100'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`rounded-md border bg-card ${className}`}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-foreground/80">{campaignTitle}</div>
          <div className="text-[10px] text-muted-foreground">{Math.round(progressPercentage)}%</div>
        </div>
        <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground truncate">
          Step {currentStep} of {steps.length}
        </div>
      </div>
    </div>
  )
}