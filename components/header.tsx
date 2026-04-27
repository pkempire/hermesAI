'use client'

import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import GuestMenu from './guest-menu'
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
}

interface SubscriptionSnapshot {
  remaining: number | null
  status: 'trialing' | 'active' | 'expired' | 'none'
  trial_days_remaining: number | null
}

/**
 * Header — minimal, editorial, white-background.
 *
 * Logged-out: wordmark + sign-in. No background art, no busy ornaments.
 * Logged-in: wordmark + credit pill + trial chip + user menu.
 */
export const Header: React.FC<HeaderProps> = ({ user }) => {
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot>({
    remaining: null,
    status: 'none',
    trial_days_remaining: null
  })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        if (!user) {
          setSnapshot({ remaining: null, status: 'none', trial_days_remaining: null })
          return
        }
        const res = await fetch('/api/subscription', { cache: 'no-store' })
        const data = await res.json()
        if (!mounted) return
        setSnapshot({
          remaining: typeof data?.remaining === 'number' ? data.remaining : null,
          status: data?.status || 'none',
          trial_days_remaining:
            typeof data?.trial_days_remaining === 'number'
              ? data.trial_days_remaining
              : null
        })
      } catch {
        if (mounted) {
          setSnapshot({ remaining: null, status: 'none', trial_days_remaining: null })
        }
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user])

  const credits = snapshot.remaining
  const trialDays = snapshot.trial_days_remaining

  async function startCheckout() {
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ successPath: '/', cancelPath: '/' })
      })
      const data = await res.json().catch(() => ({}))
      if (data?.url) window.location.href = data.url
    } catch {
      /* swallow — UI shows error in /campaigns or settings */
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full bg-[hsl(var(--hermes-cream))]/85 backdrop-blur-md transition-all',
        scrolled
          ? 'border-b border-[hsl(var(--hermes-mist))] shadow-[0_1px_0_rgba(10,24,53,0.03)]'
          : 'border-b border-transparent'
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-5 md:px-8">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-baseline gap-2 transition-opacity hover:opacity-70"
        >
          <span className="font-serif text-[22px] tracking-[-0.01em] text-[hsl(var(--hermes-ink))]">
            Hermes
          </span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
            outbound operator
          </span>
        </Link>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {user && snapshot.status === 'trialing' && trialDays !== null && (
            <button
              type="button"
              onClick={startCheckout}
              className="hidden items-center gap-2 rounded-full border border-[hsl(var(--hermes-ink))] bg-[hsl(var(--hermes-ink))] px-3 py-1 text-[12px] font-medium text-[hsl(var(--hermes-cream))] hover:opacity-90 sm:inline-flex"
              title="Add a payment method to keep Hermes after the trial"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--hermes-gold))]" />
              {trialDays > 0
                ? `Trial · ${trialDays}d left`
                : 'Trial ended — upgrade'}
            </button>
          )}
          {user && snapshot.status === 'expired' && (
            <button
              type="button"
              onClick={startCheckout}
              className="hidden items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[12px] font-medium text-white hover:bg-red-700 sm:inline-flex"
            >
              Trial ended — upgrade
            </button>
          )}
          {user && credits !== null && (
            <div className="hidden items-center gap-2 rounded-full border border-[hsl(var(--hermes-mist))] bg-white px-3 py-1 text-[13px] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-[hsl(var(--hermes-ink))]">
                {credits}
              </span>
              <span className="text-[hsl(var(--hermes-steel))]">credits</span>
            </div>
          )}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="text-sm text-[hsl(var(--hermes-ink-soft))] hover:bg-[hsl(var(--hermes-mist))]/40 hover:text-[hsl(var(--hermes-ink))]"
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-[hsl(var(--hermes-ink))] text-sm text-[hsl(var(--hermes-cream))] hover:opacity-90"
              >
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
              <GuestMenu />
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
