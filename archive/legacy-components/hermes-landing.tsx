'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Search, Mail, TrendingUp, Zap, Target, Users, MessageSquare } from 'lucide-react'

interface HermesLandingProps {
  onStartChat?: () => void
}

export function HermesLanding({ onStartChat }: HermesLandingProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const handleGetStarted = () => {
    setIsVisible(false)
    onStartChat?.()
  }

  const exampleQueries = [
    "Find 25 CTOs at fintech companies who posted about API scaling issues",
    "Get marketing directors at Series A SaaS companies in SF",
    "Find VPs of Engineering at remote-first companies with 50-200 employees"
  ]

  const features = [
    {
      icon: <Search className="w-5 h-5" />,
      title: "AI Prospect Research",
      description: "Find qualified prospects using natural language queries"
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Personalized Emails", 
      description: "Generate tailored cold emails for each prospect"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Campaign Tracking",
      description: "Monitor opens, replies, and conversion metrics"
    }
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-[80vh]">
      <div className="w-full max-w-4xl mx-auto text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          {/* Logo & Badge */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HermesAI
              </h1>
              <Badge variant="secondary" className="mt-1">
                <Zap className="w-3 h-3 mr-1" />
                Beta
              </Badge>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
              Stop juggling 7 tools for
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                cold email outreach
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Just talk to Hermes. Find prospects, research backgrounds, write personalized emails, 
              and track results — all in one AI-powered conversation.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Example Queries */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center justify-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Try asking Hermes:
          </h3>
          <div className="space-y-2">
            {exampleQueries.map((query, index) => (
              <div
                key={index}
                className="inline-block mx-2 px-4 py-2 bg-white/70 border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  // You could pre-fill this query in the chat
                  handleGetStarted()
                }}
              >
                &quot;{query}&quot;
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Start Finding Prospects
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-sm text-gray-500">
            No credit card required • Find your first 10 prospects free
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">10k+</div>
            <div className="text-sm text-gray-600">Prospects Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">85%</div>
            <div className="text-sm text-gray-600">Email Match Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">3x</div>
            <div className="text-sm text-gray-600">Faster Outreach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">24%</div>
            <div className="text-sm text-gray-600">Avg. Response Rate</div>
          </div>
        </div>
      </div>
    </div>
  )
}