'use client'

import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import { ArrowUpRight, Mail, Network, UserRound } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import GuestMenu from './guest-menu'
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
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
  
  if (!user) {
    return (
      <header className="sticky top-0 right-0 left-0 z-30 border-b border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-white">
          <Image src="/images/socrates.jpg" alt="Header Art" fill className="object-cover object-[center_22%] opacity-[0.15] mix-blend-multiply filter grayscale-[30%]" priority unoptimized />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white to-transparent" />
        </div>
        
        <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <Link
            href="/"
            className="group flex items-center gap-3 transition-opacity duration-200 hover:opacity-80"
          >
            <div className="relative h-11 w-11 overflow-hidden rounded-[10px] border border-amber-100 bg-white shadow-sm flex items-center justify-center p-1.5 ring-1 ring-amber-50">
              <Image src="/images/hermes-icon.png" alt="Hermes" width={44} height={44} className="object-contain" unoptimized />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--hermes-gold-dark))] font-semibold">Campaign messenger</div>
              <span className="font-serif text-2xl text-gray-900 leading-none tracking-tight">Hermes</span>
            </div>
          </Link>



          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-sm text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 font-medium">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <GuestMenu />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={cn(
        'sticky top-0 right-0 left-0 z-30 transition-all duration-200 relative overflow-hidden',
        'border-b border-gray-200 bg-white/90 backdrop-blur-md shadow-sm'
      )}
    >
      <div className="absolute inset-0 z-0 bg-white pointer-events-none">
        <Image src="/images/socrates.jpg" alt="Header Art" fill className="object-cover object-[center_30%] opacity-[0.18] mix-blend-multiply filter pointer-events-none brightness-110" priority unoptimized />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="relative z-20 flex items-center justify-between px-4 py-2 md:px-5">
        <Link href="/" className="flex items-center gap-2 group">
           <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-amber-100 bg-white shadow-sm flex items-center justify-center p-1.5 group-hover:border-amber-200 transition-colors">
              <Image src="/images/hermes-icon.png" alt="Hermes" width={24} height={24} className="object-contain" unoptimized />
           </div>
           <span className="font-serif text-xl text-gray-900 tracking-tight">Hermes</span>
        </Link>
        <div className="flex items-center gap-3">
          {user && credits !== null && (
            <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm sm:inline-flex">
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
