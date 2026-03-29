import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Bot, Plus, Send, FolderPlus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import type { CSSProperties } from 'react'
import { Suspense } from 'react'
import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'

export default function AppSidebar({ user }: { user: User | null }) {
  if (!user) return null

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="offcanvas"
      className="border-r border-gray-200 bg-gray-50 text-gray-900 [--sidebar-width:16rem]"
    >
      <SidebarHeader className="border-b border-gray-100 bg-gray-50 px-4 py-4">
        <Link href="/" className="flex items-center gap-3 px-1 py-1.5">
          <div className="relative h-10 w-10 overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm flex items-center justify-center">
            <Image src="/images/hermes-avatar.png" alt="Hermes" width={28} height={28} className="object-cover" />
          </div>
          <div>
            <span className="font-serif text-[1.4rem] leading-none text-gray-900 font-medium tracking-tight">Hermes Messenger</span>
            <div className="text-[10px] uppercase tracking-widest text-[hsl(var(--hermes-gold-dark))] mt-1 font-semibold">Campaign Studio</div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex h-full flex-col bg-gray-50 px-3 py-4">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200">
                <Plus className="size-4" />
                <span className="text-sm font-medium">New brief</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/campaigns" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200">
                <Send className="size-4" />
                <span className="text-sm font-medium">Campaigns</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/studio" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-colors hover:bg-white hover:text-[hsl(var(--hermes-gold-dark))] hover:shadow-sm border border-transparent hover:border-gray-200 font-bold">
                <FolderPlus className="size-4 text-[hsl(var(--hermes-gold))]" />
                <span className="text-sm">Draft Studio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Campaign brief removed per user feedback */}
        <div className="mt-6 flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
