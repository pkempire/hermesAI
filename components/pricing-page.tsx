'use client'

import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

const TIERS = [
  {
    name: 'Free Trial',
    price: '$0',
    body: 'No card required. Run Hermes on real prospecting work before paying.',
    features: ['30-day invite trial', 'Prospect previews', 'Gmail draft creation']
  },
  {
    name: 'Operator',
    price: '$40/mo',
    body: 'The launch plan for founders and lean sales teams.',
    features: ['Monthly prospect credits', 'Source-backed enrichment', 'Templates and campaign memory']
  },
  {
    name: 'Premium',
    price: 'Roadmap',
    body: 'Richer channels once the core search-to-Gmail loop is stable.',
    features: ['Send with LinkedIn', 'Find in your network', 'Phone enrichment']
  }
]

export function PricingPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function startCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ successPath: '/', cancelPath: '/pricing' })
      })

      if (res.status === 401) {
        router.push('/auth/login')
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Checkout is not available yet.')
      }
      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-[hsl(var(--paper))]">
      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase text-[hsl(var(--steel))]">
            Pricing
          </p>
          <h1 className="mt-3 text-[42px] font-semibold leading-tight text-[hsl(var(--ink))] md:text-[58px]">
            Launch with one prompt, then scale what proves useful.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-[hsl(var(--steel))]">
            Hermes starts with no-card trial access and upgrades into a simple
            monthly operator seat. Premium channel features stay on the roadmap
            until the core search, enrichment, and Gmail draft loop is reliable.
          </p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {TIERS.map(tier => (
            <article key={tier.name} className="border border-[hsl(var(--mist))] bg-white p-6">
              <h2 className="text-[18px] font-semibold text-[hsl(var(--ink))]">{tier.name}</h2>
              <p className="mt-4 text-[34px] font-semibold leading-none text-[hsl(var(--ink))]">
                {tier.price}
              </p>
              <p className="mt-4 min-h-[68px] text-[14px] leading-relaxed text-[hsl(var(--steel))]">
                {tier.body}
              </p>
              <ul className="mt-5 space-y-2">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-[13px] text-[hsl(var(--steel))]">
                    <Check className="h-4 w-4 text-[hsl(var(--ink))]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 border border-[hsl(var(--ink))] bg-[hsl(var(--ink))] p-6 text-[hsl(var(--paper))] md:flex md:items-center md:justify-between">
          <div>
            <h2 className="text-[28px] font-semibold">Upgrade when Hermes is driving pipeline.</h2>
            <p className="mt-2 text-[14px] text-[hsl(var(--paper))]/72">
              Checkout uses your current account and keeps the no-card trial behavior for first-time users.
            </p>
          </div>
          <Button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="mt-5 h-11 rounded-md bg-[hsl(var(--paper))] px-5 text-[13px] font-semibold text-[hsl(var(--ink))] hover:bg-white md:mt-0"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Start checkout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </main>
  )
}
