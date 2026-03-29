'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  FolderPlus,
  MessageSquare,
  X,
  Clock
} from 'lucide-react'
import { Suspense } from 'react'
import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS = [
  { href: '/', icon: Plus, label: 'New brief', description: 'Start a campaign' },
  { href: '/campaigns', icon: Send, label: 'Campaigns', description: 'View all campaigns' },
  { href: '/studio', icon: FolderPlus, label: 'Draft Studio', description: 'Review saved prospects', gold: true },
]

// Icon rail — always visible
function IconRail({
  onToggle,
  isOpen
}: {
  onToggle: () => void
  isOpen: boolean
}) {
  return (
    <div className="fixed left-0 top-0 bottom-0 z-50 flex flex-col items-center gap-2 py-5 w-14 border-r border-gray-100 bg-white/95 backdrop-blur-xl shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
      {/* Logo */}
      <Link href="/" className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-100 bg-white shadow-sm hover:border-amber-200 transition-all ring-1 ring-amber-50/50">
        <Image
          src="/images/hermes-icon.png"
          alt="Hermes"
          width={24}
          height={24}
          className="object-contain"
          unoptimized
        />
      </Link>

      {/* Nav icons */}
      {NAV_ITEMS.map(({ href, icon: Icon, label, gold }) => (
        <Link
          key={href}
          href={href}
          title={label}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-150 group',
            gold
              ? 'border-amber-100 bg-amber-50/60 text-amber-600 hover:bg-amber-50 hover:border-amber-200'
              : 'border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-200'
          )}
        >
          <Icon className="h-4 w-4" />
        </Link>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Toggle history panel */}
      <button
        onClick={onToggle}
        title={isOpen ? 'Hide history' : 'Show history'}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-200 transition-all"
      >
        <Clock className="h-4 w-4" />
      </button>
    </div>
  )
}

// History panel — floats as an overlay
function HistoryPanel({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <div
      className={cn(
        'fixed top-[10px] bottom-[10px] left-[60px] z-[49] w-[260px] transition-all duration-300 ease-in-out',
        isOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-4 pointer-events-none'
      )}
    >
      <div className="h-full flex flex-col rounded-2xl border border-gray-200/80 bg-white/97 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600/70">Campaign history</div>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>

        {/* Footer — new brief */}
        <div className="border-t border-gray-100 p-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl bg-gray-900 px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New brief
          </Link>
        </div>
      </div>
    </div>
  )
}

// Main exported component - bypasses shadcn SidebarProvider
export function FloatingSidebar({ user }: { user: User | null }) {
  const [isOpen, setIsOpen] = useState(false)

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  if (!user) return null

  return (
    <>
      <IconRail isOpen={isOpen} onToggle={() => setIsOpen(p => !p)} />
      <HistoryPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {/* Transparent backdrop that closes panel on click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[48]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
