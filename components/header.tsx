'use client'

import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
}

interface SubscriptionSnapshot {
  status: 'trialing' | 'active' | 'expired' | 'none'
  trial_days_remaining: number | null
}

/**
 * Header — wordmark + trial chip + user menu. Nothing else.
 * Signed-out: wordmark + Sign in. No marketing nav.
 */
export const Header: React.FC<HeaderProps> = ({ user }) => {
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot>({
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
      if (!user) return
      try {
        const res = await fetch('/api/subscription', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        setSnapshot({
          status: data.status ?? 'none',
          trial_days_remaining: data.trial_days_remaining ?? null
        })
      } catch {
        /* noop */
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user])

  const trialDays = snapshot.trial_days_remaining

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between px-5 md:px-8 transition-colors',
        scrolled
          ? 'border-b border-[hsl(var(--mist))] bg-[hsl(var(--paper))]/85 backdrop-blur'
          : 'bg-[hsl(var(--paper))]'
      )}
    >
      <Link
        href="/"
        className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-[hsl(var(--ink))]"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--ink))] text-[10px] font-bold text-[hsl(var(--paper))]">
          O
        </span>
        Outfield
      </Link>

      <div className="flex items-center gap-3">
        {user && snapshot.status === 'trialing' && trialDays !== null && (
          <Link
            href="/pricing"
            className="hidden sm:inline-flex items-center rounded-full border border-[hsl(var(--mist))] bg-white px-3 py-1 text-[12px] font-medium text-[hsl(var(--steel))] transition-colors hover:border-[hsl(var(--ink)/0.4)] hover:text-[hsl(var(--ink))]"
          >
            {trialDays} {trialDays === 1 ? 'day' : 'days'} left in trial
          </Link>
        )}

        {user && snapshot.status === 'expired' && (
          <Link
            href="/pricing"
            className="hidden sm:inline-flex items-center rounded-full bg-[hsl(var(--ink))] px-3 py-1 text-[12px] font-medium text-[hsl(var(--paper))] hover:bg-[hsl(var(--ink)/0.9)]"
          >
            Trial ended · Upgrade
          </Link>
        )}

        {user ? (
          <UserMenu user={user} />
        ) : (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-[13px] font-medium text-[hsl(var(--steel))] hover:text-[hsl(var(--ink))]"
          >
            <Link href="/auth/login">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  )
}

export default Header
