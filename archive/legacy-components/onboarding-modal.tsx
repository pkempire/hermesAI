'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Mail, Search, Sparkles, Target, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to Hermes',
    description: 'Your AI messenger of growth',
    icon: Sparkles,
    content: (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 shadow-lg shadow-amber-500/20 mb-6">
          <Sparkles className="w-10 h-10 text-amber-950" />
        </div>
          <p className="text-xl text-gray-700 leading-relaxed max-w-lg mx-auto">
            Stop cold calling random numbers.
            <span className="font-bold text-amber-600"> Hermes finds your next customers</span> with precision and speed.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative p-6 rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50/30 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <Search className="h-6 w-6 text-amber-950" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg mb-1">Smart Discovery</p>
                <p className="text-sm text-gray-600">Turn words into qualified leads</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative p-6 rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-yellow-50 via-amber-50/50 to-yellow-50/30 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <Mail className="h-6 w-6 text-amber-950" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg mb-1">Personal Touch</p>
                <p className="text-sm text-gray-600">AI crafts emails that actually get responses</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-6 text-xs text-gray-500 bg-gray-50/80 px-6 py-3 rounded-full border border-gray-200">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span>Trusted by 1000+ teams</span>
            </span>
            <span className="w-px h-4 bg-gray-300"></span>
            <span>98.9% delivery rate</span>
            <span className="w-px h-4 bg-gray-300"></span>
            <span>SOC 2 compliant</span>
          </div>
        </div>
      </div>
    )
  },
  {
    title: 'Describe Your Dream Customer',
    description: 'Natural language meets precision targeting',
    icon: Target,
    content: (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 shadow-lg shadow-amber-500/20">
            <Target className="w-10 h-10 text-amber-950" />
          </div>
          <p className="text-xl text-gray-700 leading-relaxed max-w-lg mx-auto">
            Just describe who you want to find in plain English.
            <span className="font-bold text-amber-600"> Hermes does the rest.</span>
          </p>
        </div>
        
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-white hover:border-amber-300 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Example</p>
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  &quot;Find CTOs at fintech startups who recently posted about API scaling challenges&quot;
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-yellow-50/50 to-white hover:border-amber-300 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">Another Example</p>
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  &quot;VPs of Marketing at B2B SaaS companies with 50-200 employees in NYC&quot;
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="flex items-center justify-center gap-8 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="font-medium">10M+ prospects</span>
          </div>
          <div className="w-px h-6 bg-gray-300"></div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="font-medium">Real-time data</span>
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
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 shadow-xl shadow-green-500/30 mx-auto"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <div>
            <p className="text-3xl font-bold text-gray-900 mb-2">50 Free Credits</p>
            <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
              Sign in to claim your free credits and start finding your next customers.
              <span className="font-semibold text-green-600"> No card required.</span>
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-yellow-400/20 to-amber-400/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50 rounded-2xl p-8 border-2 border-amber-200/50">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">50</p>
                <p className="text-sm font-medium text-gray-600">Free Credits</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">50</p>
                <p className="text-sm font-medium text-gray-600">Prospects Found</p>
              </div>
            </div>
            <div className="pt-6 border-t border-amber-200">
              <p className="text-sm text-center text-gray-700">
                Each credit finds and enriches one qualified prospect with verified contact data
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { num: 1, title: 'Discover', desc: 'AI finds prospects', gradient: 'from-amber-400 to-yellow-500' },
            { num: 2, title: 'Enrich', desc: 'Get contact data', gradient: 'from-yellow-400 to-amber-500' },
            { num: 3, title: 'Engage', desc: 'Send emails', gradient: 'from-amber-500 to-yellow-600' }
          ].map((step, idx) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="text-center p-5 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} text-white text-lg font-bold flex items-center justify-center mx-auto mb-3 shadow-md`}>
                {step.num}
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">{step.title}</p>
              <p className="text-xs text-gray-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-4 text-xs text-gray-500 bg-gray-50/80 px-6 py-2.5 rounded-full border border-gray-200">
            <span>Sub-second search</span>
            <span className="w-1 h-1 rounded-full bg-amber-500"></span>
            <span>Enterprise security</span>
            <span className="w-1 h-1 rounded-full bg-amber-500"></span>
            <span>Laser precision</span>
          </div>
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
  const [isUser, setIsUser] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = await res.json()
        const userExists = !!data?.user?.id
        setIsUser(userExists)
        
        // Only show onboarding if user hasn't seen it AND is not logged in
        const seen = localStorage.getItem('hermes_onboarding_completed')
        if (!seen && !userExists) {
          setIsOpen(true)
        } else {
          setHasSeenOnboarding(true)
        }
      } catch {
        setIsUser(false)
        const seen = localStorage.getItem('hermes_onboarding_completed')
        if (!seen) {
          setIsOpen(true)
        }
      }
    }
    checkUser()
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

  // Don't render if user is logged in or has seen onboarding
  if (isUser === true || hasSeenOnboarding) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleSkip()
      }
    }}>
      <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-xl" hideCloseButton>
        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <step.icon className="h-6 w-6 text-amber-950" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">{step.title}</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">{step.description}</DialogDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg h-8 w-8 p-0"
            >
              <span className="sr-only">Skip</span>
              ✕
            </Button>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2 bg-gray-100">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/30"
                style={{ width: `${progress}%` }}
              />
            </Progress>
            <p className="text-xs text-gray-500 text-right">Step {currentStep + 1} of {ONBOARDING_STEPS.length}</p>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="py-6"
          >
            {step.content}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div></div>
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="border-gray-300 hover:bg-gray-50"
              >
                Back
              </Button>
            )}
            <Button
              onClick={step.action?.onClick || handleNext}
              className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-amber-950 font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {step.action?.label || (currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
