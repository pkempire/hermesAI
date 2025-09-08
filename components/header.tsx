'use client'

import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
// import Link from 'next/link' // No longer needed directly here for Sign In button
import React from 'react'
// import { Button } from './ui/button' // No longer needed directly here for Sign In button
import { getStripeCheckoutUrl } from '@/lib/utils'
import Link from 'next/link'
import GuestMenu from './guest-menu'; // Import the new GuestMenu component
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { open } = useSidebar()
  return (
    <header
      className={cn(
        'absolute top-0 right-0 p-2 flex justify-between items-center z-10 backdrop-blur lg:backdrop-blur-none bg-[#0f0f11]/80 lg:bg-transparent transition-[width] duration-200 ease-linear',
        open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
        'w-full'
      )}
    >
      <div className="flex items-center gap-2 ml-auto">
        <Link href={getStripeCheckoutUrl()} className="hidden sm:inline-block text-xs px-3 py-1.5 rounded-full border bg-white/60 hover:bg-white transition">
          Upgrade $39/mo
        </Link>
        {user ? <UserMenu user={user} /> : <GuestMenu />}
      </div>
    </header>
  )
}

export default Header
