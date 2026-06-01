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

const NAV_LINKS = [
  ['Product', '/#services'],
  ['Workflow', '/#process'],
  ['Examples', '/#work'],
  ['Pricing', '/#pricing'],
  ['Launch', '/#contact']
] as const

function HermesMark() {
  return (
    <svg className="h-8 w-8 text-[#0b1732]" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7 4.5 25 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 10.5 22 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 16.5 19 22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 22.5 16 27" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

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
        'sticky top-0 z-40 border-b border-[#dfe2eb] transition-colors',
        scrolled
          ? 'bg-[#faf9f8]/88 backdrop-blur'
          : 'bg-[#faf9f8]'
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1160px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-4 text-[#0b1732]" aria-label="Hermes GTM home">
          <HermesMark />
          <span className="font-serif text-[27px] leading-none tracking-[-0.03em]">
            Hermes <span className="text-[#8b8d96]">GTM</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-11 text-[13px] font-medium text-[#252d42] md:flex">
          {NAV_LINKS.map(([label, href]) => (
            <Link key={label} href={href} className="transition-colors hover:text-[#315dff]">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user && snapshot.status === 'trialing' && trialDays !== null && (
            <Link
              href="/pricing"
              className="hidden items-center rounded-full border border-[#d7dbe5] bg-white px-3 py-1 text-[12px] font-medium text-[#46506a] transition-colors hover:border-[#0b1732]/40 hover:text-[#0b1732] sm:inline-flex"
            >
              {trialDays} {trialDays === 1 ? 'day' : 'days'} left in trial
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
