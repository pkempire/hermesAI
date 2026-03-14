'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Send, TrendingUp, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  created_at: string
  target_count: number
  total_prospects: number
  emails_sent: number
  prospects: Array<{
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
    company: string | null
    status: string
  }>
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-emerald-200 bg-emerald-50 text-emerald-800'
      case 'draft': return 'border-stone-200 bg-stone-100 text-stone-800'
      case 'paused': return 'border-amber-200 bg-amber-50 text-amber-800'
      case 'completed': return 'border-sky-200 bg-sky-50 text-sky-800'
      case 'cancelled': return 'border-rose-200 bg-rose-50 text-rose-800'
      default: return 'border-stone-200 bg-stone-100 text-stone-800'
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-serif text-4xl text-gray-950">Campaigns</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-[1.5rem] bg-white/70" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-black/5 bg-white/70 px-6 py-8 shadow-[0_24px_80px_rgba(62,45,18,0.08)] backdrop-blur-sm md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.32em] text-black/40">Delivery board</div>
          <h1 className="mt-3 font-serif text-4xl text-gray-950 md:text-5xl">Campaigns</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/60 md:text-base">
            Track the lists you&apos;ve built, how many contacts are ready, and where each outreach motion stands.
          </p>
        </div>
        <Link href="/prospect-search">
          <Button className="bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="hermes-surface">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Send className="mb-4 h-12 w-12 text-black/45" />
            <h3 className="mb-2 font-serif text-2xl text-gray-950">No campaigns yet</h3>
            <p className="mb-4 max-w-md text-center text-black/60">
              Start your first cold email campaign by finding prospects
            </p>
            <Link href="/prospect-search">
              <Button className="bg-black text-white hover:bg-black/90">
                <Plus className="w-4 h-4 mr-2" />
                Create First Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hermes-surface overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-serif text-2xl">{campaign.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(campaign.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
                    <div className="mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs uppercase tracking-[0.2em] text-black/45">Audience</span>
                    </div>
                    <div className="text-sm font-medium">
                      {campaign.total_prospects || campaign.prospects?.length || 0} prospects
                    </div>
                    <div className="text-xs text-muted-foreground">Target: {campaign.target_count}</div>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
                    <div className="mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs uppercase tracking-[0.2em] text-black/45">Delivery</span>
                    </div>
                    <div className="text-sm font-medium">{campaign.emails_sent || 0} sent</div>
                    <div className="text-xs text-muted-foreground">Emails launched</div>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
                    <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs uppercase tracking-[0.2em] text-black/45">Coverage</span>
                    </div>
                    <div className="text-sm font-medium">
                      {campaign.emails_sent > 0
                        ? `${Math.round((campaign.emails_sent / (campaign.total_prospects || 1)) * 100)}%`
                        : '0%'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">Prospects touched</div>
                  </div>
                  <div className="flex flex-col justify-between gap-2 rounded-2xl border border-black/5 bg-white/70 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-black/45">Actions</div>
                    <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/campaigns/${campaign.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {campaign.status === 'draft' && (
                      <Button size="sm" className="bg-black text-white hover:bg-black/90" asChild>
                        <Link href={`/campaigns/${campaign.id}/send`}>
                          Start Campaign
                        </Link>
                      </Button>
                    )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
