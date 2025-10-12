'use client'

import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import GuestMenu from './guest-menu'
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { open } = useSidebar()
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        if (!user) { setCredits(null); return }
        const res = await fetch('/api/subscription', { cache: 'no-store' })
        const data = await res.json()
        if (mounted) setCredits(typeof data?.remaining === 'number' ? data.remaining : null)
      } catch {
        if (mounted) setCredits(null)
      }
    }
    load()
    return () => { mounted = false }
  }, [user])
  return (
    <header
        className={cn(
          'sticky top-0 right-0 left-0 p-4 flex justify-between items-center z-30 backdrop-blur-md bg-background/95 border-b border-border/50 shadow-sm transition-all duration-200',
          open ? 'md:pl-[calc(var(--sidebar-width)+1rem)]' : 'md:pl-4'
        )}
    >
      {/* Branding */}
      <Link href="/" className="flex items-center gap-3 transition-transform duration-200">
        <img
          src="/images/hermes-avatar.png"
          alt="Hermes"
          className="h-8 w-8 rounded-full border border-border"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <div className="hidden sm:block">
          <h1 className="text-base font-semibold text-foreground">Hermes</h1>
          <p className="text-xs text-muted-foreground">Prospecting Copilot</p>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {user && credits !== null && (
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            <span className="font-semibold">{credits}</span>
            <span>credits</span>
          </div>
        )}
        {user ? <UserMenu user={user} /> : <GuestMenu />}
      </div>
    </header>
  )
}

export default Header
