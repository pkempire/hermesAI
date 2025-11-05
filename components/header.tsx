'use client'

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
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
        'sticky top-0 right-0 left-0 z-30 transition-all duration-200',
        'backdrop-blur-xl bg-white/80 border-b border-gray-200/50',
        'shadow-sm',
        open ? 'md:pl-[calc(var(--sidebar-width)+1rem)]' : 'md:pl-4'
      )}
    >
      <div className="flex items-center justify-between py-1.5 px-4 md:px-6">
        {/* Left: Sidebar toggle + Branding */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="mr-1" />
          <Link 
            href="/" 
            className="flex items-center gap-2 transition-all duration-200 hover:opacity-80 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <img
                src="/images/hermes-avatar.png"
                alt="Hermes"
                className="relative h-7 w-7 md:h-8 md:w-8 rounded-full border-2 border-amber-200 shadow-sm group-hover:border-amber-300 transition-colors"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm md:text-base font-semibold text-gray-900">HermesAI</span>
            </div>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user && credits !== null && (
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 text-sm font-medium text-gray-700 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="font-bold text-gray-900">{credits}</span>
              <span className="text-gray-600">credits</span>
            </div>
          )}
          {user ? <UserMenu user={user} /> : <GuestMenu />}
        </div>
      </div>
    </header>
  )
}

export default Header
