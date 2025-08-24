'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Search, 
  Mail, 
  Eye, 
  Send, 
  BarChart3,
  ArrowRight
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
    <Card className={`${className}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">{campaignTitle}</h3>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length} • {Math.round(progressPercentage)}% Complete
            </p>
          </div>
          <Badge variant={progressPercentage === 100 ? 'default' : 'secondary'}>
            {progressPercentage === 100 ? 'Complete' : 'In Progress'}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progressPercentage} className="w-full h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {updatedSteps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4">
              {/* Step Icon */}
              <div className="flex flex-col items-center">
                {getStepIcon(step)}
                {index < steps.length - 1 && (
                  <div className={`w-px h-8 mt-2 ${
                    step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Step Content */}
              <div className={`flex-1 min-w-0 pb-4 ${index === steps.length - 1 ? 'pb-0' : ''}`}>
                <div className={`p-4 rounded-lg border ${getStepColor(step)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${
                      step.status === 'completed' ? 'text-green-900' :
                      step.status === 'current' ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {step.status === 'completed' && step.completedAt && (
                        <span className="text-xs text-green-600">
                          Completed {step.completedAt.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                      {step.status === 'current' && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{step.estimatedTime}</span>
                        </div>
                      )}
                      {step.status === 'pending' && step.estimatedTime && (
                        <span className="text-xs text-gray-500">
                          ~{step.estimatedTime}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'current' ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>

                  {/* Current step indicator */}
                  {step.status === 'current' && (
                    <div className="flex items-center space-x-1 mt-2 text-blue-600">
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-xs font-medium">Currently working on this step</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {progressPercentage === 100 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Campaign Setup Complete!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Your campaign is ready to launch. All steps have been completed successfully.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}