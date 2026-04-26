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

/**
 * Header — minimal, editorial, white-background.
 *
 * Logged-out: wordmark + sign-in. No background art, no busy ornaments.
 * Logged-in: wordmark + credit pill + user menu.
 */
export const Header: React.FC<HeaderProps> = ({ user }) => {
  const [credits, setCredits] = useState<number | null>(null)
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
          setCredits(null)
          return
        }
        const res = await fetch('/api/subscription', { cache: 'no-store' })
        const data = await res.json()
        if (mounted) {
          setCredits(typeof data?.remaining === 'number' ? data.remaining : null)
        }
      } catch {
        if (mounted) setCredits(null)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user])

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
