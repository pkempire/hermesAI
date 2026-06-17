'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  websetId?: string
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    initialize()
  }, [])

  const initialize = async () => {
    try {
      const authResponse = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authResponse.json().catch(() => null)
      const authenticated = Boolean(authData?.user?.id)
      setIsAuthenticated(authenticated)

      if (!authenticated) {
        setCampaigns([])
        return
      }

      const response = await fetch('/api/campaigns')
      let serverCampaigns: Campaign[] = []
      if (!response.ok) {
        serverCampaigns = []
      } else {
        const data = await response.json()
        serverCampaigns = data.campaigns || []
      }

      const localCampaigns = (() => {
        try {
          const parsed = JSON.parse(localStorage.getItem('hermes-campaigns') || '[]')
          if (!Array.isArray(parsed)) return []
          return parsed.map((campaign: any) => ({
            id: campaign.id,
            websetId: campaign.websetId,
            name: campaign.name || campaign.query || 'Untitled campaign',
            status: campaign.status || 'completed',
            created_at: campaign.createdAt || new Date().toISOString(),
            target_count: campaign.totalFound || 0,
            total_prospects: campaign.totalFound || 0,
            emails_sent: 0,
            prospects: []
          })) as Campaign[]
        } catch {
          return []
        }
      })()

      const serverIds = new Set(serverCampaigns.map(campaign => campaign.websetId || campaign.id))
      setCampaigns([
        ...serverCampaigns,
        ...localCampaigns.filter(campaign => !serverIds.has(campaign.websetId || campaign.id))
      ])
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
          <h1 className="text-4xl text-gray-950">Campaigns</h1>
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-[#dfe4ee] bg-white px-5 py-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a92a6]">Delivery board</div>
          <h1 className="mt-2 text-[26px] font-bold text-[#071329]">Campaigns</h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-6 text-[#6a7283]">
            Recent prospect runs and saved audiences.
          </p>
        </div>
        <Link href="/">
          <Button className="h-9 rounded-md bg-[#071329] text-[12px] font-semibold text-white hover:bg-[#102448]">
            {isAuthenticated ? 'New Campaign' : 'Start from Brief'}
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="hermes-surface">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <h3 className="mb-2 text-[20px] font-bold text-[#071329]">No campaigns yet</h3>
            <p className="mb-4 max-w-md text-[13px] leading-6 text-[#6a7283]">
              {isAuthenticated
                ? 'Start your first cold email campaign by finding prospects'
                : 'Sign in, run a brief, and your campaign queue will show up here.'}
            </p>
            <Link href="/">
              <Button className="h-9 rounded-md bg-[#071329] text-[12px] font-semibold text-white hover:bg-[#102448]">
                {isAuthenticated ? 'Create First Campaign' : 'Open Hermes'}
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
                  <div className="min-w-0">
                    <CardTitle className="truncate text-[18px] font-bold">{campaign.name}</CardTitle>
                    <CardDescription className="mt-1 text-[12px]">
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
                  <div className="rounded-lg border border-[#edf0f6] bg-[#fbfcff] p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a92a6]">Audience</div>
                    <div className="text-sm font-medium">
                      {campaign.total_prospects || campaign.prospects?.length || 0} prospects
                    </div>
                    <div className="text-xs text-muted-foreground">Target: {campaign.target_count}</div>
                  </div>
                  <div className="rounded-lg border border-[#edf0f6] bg-[#fbfcff] p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a92a6]">Delivery</div>
                    <div className="text-sm font-medium">{campaign.emails_sent || 0} sent</div>
                    <div className="text-xs text-muted-foreground">Emails launched</div>
                  </div>
                  <div className="rounded-lg border border-[#edf0f6] bg-[#fbfcff] p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a92a6]">Coverage</div>
                    <div className="text-sm font-medium">
                      {campaign.emails_sent > 0
                        ? `${Math.round((campaign.emails_sent / (campaign.total_prospects || 1)) * 100)}%`
                        : '0%'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">Prospects touched</div>
                  </div>
                  <div className="flex flex-col justify-between gap-2 rounded-lg border border-[#edf0f6] bg-[#fbfcff] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a92a6]">Actions</div>
                    <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/studio">
                        Open Studio
                      </Link>
                    </Button>
                    {campaign.status === 'draft' || campaign.status === 'completed' ? (
                      <Button size="sm" className="bg-black text-white hover:bg-black/90" asChild>
                        <Link href="/">
                          Continue
                        </Link>
                      </Button>
                    ) : null}
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
