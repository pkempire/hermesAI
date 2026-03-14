'use client'

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
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
        'sticky top-0 right-0 left-0 z-30 transition-all duration-200',
        'border-b border-black/5 bg-[rgba(255,251,245,0.82)] backdrop-blur-xl',
        open ? 'md:pl-[calc(var(--sidebar-width)+1rem)]' : 'md:pl-4'
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 md:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="mr-1 rounded-full border border-black/10 bg-white/70 shadow-sm" />
          <Link 
            href="/" 
            className="group flex items-center gap-3 transition-all duration-200 hover:opacity-80"
          >
            <div className="relative flex items-center gap-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-500/20 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Image
                src="/images/hermes-avatar.png"
                alt="Hermes"
                width={32}
                height={32}
                className="relative h-8 w-8 rounded-full border border-amber-300/70 shadow-sm transition-colors object-cover md:h-9 md:w-9"
                unoptimized
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-[11px] uppercase tracking-[0.28em] text-black/45">Messenger OS</div>
              <span className="font-serif text-lg text-gray-950 md:text-xl">HermesAI</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user && credits !== null && (
            <div className="hidden items-center gap-2 rounded-full border border-amber-200/80 bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              <span className="font-semibold text-gray-900">{credits}</span>
              <span className="text-gray-500">credits</span>
            </div>
          )}
          {user ? <UserMenu user={user} /> : <GuestMenu />}
        </div>
      </div>
    </header>
  )
}

export default Header
