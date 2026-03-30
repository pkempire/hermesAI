'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Plus, 
  Send, 
  FolderPlus, 
  Clock, 
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatHistoryClient } from './sidebar/chat-history-client'
import { Suspense } from 'react'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS = [
  { href: '/', icon: Plus, label: 'New brief', gold: false },
  { href: '/campaigns', icon: Send, label: 'Campaigns', gold: false },
  { href: '/studio', icon: FolderPlus, label: 'Studio', gold: true },
]

export function CommandOrbit({ user }: { user: User | null }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!user || !hasMounted) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[400px] px-4 pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="mb-3 overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 backdrop-blur-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)]"
            >
              <div className="h-[380px] flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-600/80">Search History</span>
                  <button 
                    onClick={() => setIsExpanded(false)}
                    className="p-1 rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Suspense fallback={<ChatHistorySkeleton />}>
                    <ChatHistoryClient />
                  </Suspense>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          layout
          className="relative flex items-center justify-between gap-2 rounded-[2rem] border border-gray-200/80 bg-white/90 p-2 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-black/[0.03]"
        >
          {/* Logo / Home */}
          <Link 
            href="/" 
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-100 bg-white shadow-sm hover:border-amber-200 transition-all active:scale-95"
          >
            <Image
              src="/images/hermes-icon.png"
              alt="H"
              width={26}
              height={26}
              className="object-contain"
              unoptimized
            />
          </Link>

          {/* Navigation icons */}
          <div className="flex flex-1 items-center justify-around px-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 w-10 flex-col items-center justify-center rounded-2xl transition-all active:scale-95 group",
                  item.gold 
                    ? "text-amber-600 hover:bg-amber-50" 
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                )}
                title={item.label}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </Link>
            ))}
          </div>

          {/* History Toggle */}
          <div className="h-6 w-[1px] bg-gray-100 mx-1" />
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all active:scale-95",
              isExpanded 
                ? "bg-gray-900 text-white shadow-lg" 
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            )}
            title="Toggle history"
          >
            <Clock className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
