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
        'sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md transition-all',
        scrolled ? 'border-b border-gray-200 shadow-[0_1px_0_rgba(0,0,0,0.02)]' : 'border-b border-transparent'
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-5 md:px-8">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-baseline gap-2 transition-opacity hover:opacity-70"
        >
          <span className="font-serif text-[22px] tracking-[-0.01em] text-gray-900">
            Hermes
          </span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.22em] text-gray-400">
            outbound operator
          </span>
        </Link>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {user && credits !== null && (
            <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[13px] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-gray-900">{credits}</span>
              <span className="text-gray-500">credits</span>
            </div>
          )}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-gray-900 text-sm text-white hover:bg-gray-800"
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
