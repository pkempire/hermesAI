'use client'

import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const LANDING_NAV_LINKS = [
  ['Product', '/#services'],
  ['Workflow', '/#process'],
  ['Preview', '/#product'],
  ['Pricing', '/#pricing'],
  ['Start', '/#contact']
] as const

const APP_NAV_LINKS = [
  ['Campaigns', '/campaigns'],
  ['Studio', '/studio']
] as const

function HermesMark() {
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dfe4ee] bg-white text-[14px] font-semibold tracking-[-0.01em] text-[#071329] shadow-sm"
      aria-hidden="true"
    >
      H
    </span>
  )
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const pathname = usePathname()
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
        'sticky top-0 z-40 border-b border-[#dfe2eb] transition-colors',
        scrolled
          ? 'bg-[#faf9f8]/88 backdrop-blur'
          : 'bg-[#faf9f8]'
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-3 text-[#0b1732]" aria-label="Hermes GTM home">
          <HermesMark />
          <span className="text-[23px] font-semibold leading-none tracking-[-0.02em]">
            Hermes <span className="text-[#8b8d96]">GTM</span>
          </span>
        </Link>

        {!user && (
          <nav className="hidden items-center gap-9 text-[13px] font-medium text-[#252d42] md:flex">
            {LANDING_NAV_LINKS.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="transition-colors hover:text-[#315dff]"
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user && (
            <nav
              className="hidden items-center rounded-full border border-[#dfe2eb] bg-white/75 p-1 shadow-[0_10px_26px_rgba(5,18,47,0.05)] sm:flex"
              aria-label="Workspace navigation"
            >
              {APP_NAV_LINKS.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'flex h-8 items-center rounded-full px-3 text-[12px] font-semibold transition-colors',
                    pathname === href
                      ? 'bg-[#071329] text-white'
                      : 'text-[#46506a] hover:bg-[#f1f4ff] hover:text-[#071329]'
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {user && snapshot.status === 'trialing' && trialDays !== null && (
            <Link
              href="/pricing"
              className="hidden items-center rounded-full border border-[#d7dbe5] bg-white px-3 py-1 text-[12px] font-medium text-[#46506a] transition-colors hover:border-[#0b1732]/40 hover:text-[#0b1732] lg:inline-flex"
            >
              {trialDays} {trialDays === 1 ? 'day' : 'days'} left
            </Link>
          )}

          {user && snapshot.status === 'expired' && (
            <Link
              href="/pricing"
              className="hidden items-center rounded-full bg-[#0b1732] px-3 py-1 text-[12px] font-medium text-[#faf9f8] hover:bg-[#14254a] sm:inline-flex"
            >
              Trial ended · Upgrade
            </Link>
          )}

          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button
              asChild
              size="sm"
              className="h-[38px] rounded-[3px] bg-[#071735] px-6 text-[13px] font-medium text-white hover:bg-[#102448]"
            >
              <Link href="/auth/sign-up">Start Free</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
