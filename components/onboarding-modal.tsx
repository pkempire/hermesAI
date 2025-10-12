'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Mail, MessageSquare, Search, Sparkles, Target } from 'lucide-react'
import { useEffect, useState } from 'react'

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to Hermes',
    description: 'Your AI messenger of growth',
    icon: Sparkles,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Stop cold calling random numbers.
            <span className="font-semibold text-blue-600"> Hermes finds your next customers</span> with precision and speed.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">Smart Discovery</p>
                <p className="text-sm text-muted-foreground">Turn words into qualified leads</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-semibold text-gray-900">Personal Touch</p>
                <p className="text-sm text-muted-foreground">AI crafts emails that actually get responses</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Trusted by 1000+ sales teams • 98.9% delivery rate • SOC 2 compliant
          </p>
        </div>
      </div>
    )
  },
  {
    title: 'Describe Your Dream Customer',
    description: 'Natural language meets precision targeting',
    icon: Target,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Just describe who you want to find in plain English.
            <span className="font-semibold text-green-600">Hermes does the rest.</span>
          </p>
        </div>
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <p className="text-xs font-medium mb-2 text-green-800 uppercase tracking-wide">Example</p>
            <p className="text-sm font-medium text-gray-900">
              "Find CTOs at fintech startups who recently posted about API scaling challenges"
            </p>
          </div>
          <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <p className="text-xs font-medium mb-2 text-blue-800 uppercase tracking-wide">Another Example</p>
            <p className="text-sm font-medium text-gray-900">
              "VPs of Marketing at B2B SaaS companies with 50-200 employees in NYC"
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>10M+ prospects</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Real-time data</span>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Claim Your Free Credits',
    description: 'Start prospecting immediately with 50 free credits',
    icon: CheckCircle2,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            50 Free Credits
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Sign in to claim your free credits and start finding your next customers.
            <span className="font-semibold text-green-600"> No card required.</span>
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="text-center space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-700">50</div>
                <div className="text-sm text-gray-600">Free Credits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">50</div>
                <div className="text-sm text-gray-600">Prospects Found</div>
              </div>
            </div>
            <div className="pt-4 border-t border-green-200">
              <p className="text-sm text-gray-700">
                Each credit finds and enriches one qualified prospect with verified contact data
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-gradient-to-b from-blue-50 to-blue-100">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">1</div>
            <p className="text-sm font-medium text-gray-900">Discover</p>
            <p className="text-xs text-muted-foreground">AI finds prospects</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-b from-green-50 to-green-100">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">2</div>
            <p className="text-sm font-medium text-gray-900">Enrich</p>
            <p className="text-xs text-muted-foreground">Get contact data</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-b from-purple-50 to-purple-100">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">3</div>
            <p className="text-sm font-medium text-gray-900">Engage</p>
            <p className="text-xs text-muted-foreground">Send personalized emails</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Sub-second search • Enterprise security • Laser precision
          </p>
        </div>
      </div>
    ),
    action: {
      label: 'Claim Free Credits & Sign In',
      onClick: () => {
        window.location.href = '/auth/oauth?provider=google'
      }
    }
  }
]

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has seen onboarding
    const seen = localStorage.getItem('hermes_onboarding_completed')
    if (!seen) {
      setIsOpen(true)
    } else {
      setHasSeenOnboarding(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem('hermes_onboarding_completed', 'true')
    setIsOpen(false)
    setHasSeenOnboarding(true)
  }

  const handleSkip = () => {
    localStorage.setItem('hermes_onboarding_completed', 'true')
    setIsOpen(false)
  }

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100
  const step = ONBOARDING_STEPS[currentStep]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <step.icon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">{step.title}</DialogTitle>
                <DialogDescription>{step.description}</DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="py-6"
          >
            {step.content}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="glass"
              >
                Back
              </Button>
            )}
            <Button
              onClick={step.action?.onClick || handleNext}
              className="bg-amber-500 hover:bg-amber-600 text-amber-950"
            >
              {step.action?.label || (currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
