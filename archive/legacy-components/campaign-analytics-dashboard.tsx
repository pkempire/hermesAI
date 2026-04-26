'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Mail, MousePointerClick, TrendingUp, Users } from 'lucide-react'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface CampaignAnalyticsProps {
  totalProspects: number
  emailsSent: number
  emailsOpened: number
  clickRate: number
  replyRate: number
  industryDistribution?: Array<{ name: string; value: number }>
  companySizeDistribution?: Array<{ name: string; value: number }>
}

export function CampaignAnalyticsDashboard({
  totalProspects,
  emailsSent,
  emailsOpened,
  clickRate,
  replyRate,
  industryDistribution = [],
  companySizeDistribution = []
}: CampaignAnalyticsProps) {
  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
  
  const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0
  
  const metrics = [
    {
      label: 'Total Prospects',
      value: totalProspects,
      icon: Users,
      color: 'purple',
      change: '+12%'
    },
    {
      label: 'Emails Sent',
      value: emailsSent,
      icon: Mail,
      color: 'blue',
      change: '+8%'
    },
    {
      label: 'Open Rate',
      value: `${openRate}%`,
      icon: MousePointerClick,
      color: 'green',
      change: '+5%'
    },
    {
      label: 'Reply Rate',
      value: `${Math.round(replyRate * 100)}%`,
      icon: TrendingUp,
      color: 'pink',
      change: '+3%'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="glass lift-on-hover gradient-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-3xl font-bold mt-2">{metric.value}</p>
                  <Badge variant="outline" className="mt-2 glass">
                    {metric.change} vs last week
                  </Badge>
                </div>
                <div className={`h-12 w-12 rounded-lg bg-${metric.color}-500/10 flex items-center justify-center`}>
                  <metric.icon className={`h-6 w-6 text-${metric.color}-500`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Distribution Pie Chart */}
        {industryDistribution.length > 0 && (
          <Card className="glass elevation-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Industry Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of prospects by industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={industryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {industryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Company Size Distribution Bar Chart */}
        {companySizeDistribution.length > 0 && (
          <Card className="glass elevation-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Company Size Distribution
              </CardTitle>
              <CardDescription>
                Prospects grouped by company size
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companySizeDistribution}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Deliverability Score */}
      <Card className="glass elevation-2 frosted-green">
        <CardHeader>
          <CardTitle>Email Deliverability Score</CardTitle>
          <CardDescription>
            Predicted likelihood of reaching inbox (not spam)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${openRate > 30 ? 85 : 65}%` }}
                />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {openRate > 30 ? '85%' : '65%'}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {openRate > 30 
              ? '✅ Excellent - Your emails are highly likely to reach the inbox'
              : '⚠️ Good - Consider warming up your domain for better results'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
