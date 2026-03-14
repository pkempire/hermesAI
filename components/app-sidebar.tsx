import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Plus, Search, Send } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { IconLogo } from './ui/icons'

export default function AppSidebar() {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas" className="border-r border-black/5">
      <SidebarHeader className="flex flex-row items-center justify-between border-b border-black/5 px-3 py-3">
        <Link href="/" className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
            <IconLogo className={cn('size-4')} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-black/40">Hermes</div>
            <span className="font-serif text-lg text-gray-950">Operator</span>
          </div>
        </Link>
        <SidebarTrigger className="rounded-full border border-black/10 bg-white/70 shadow-sm" />
      </SidebarHeader>
      <SidebarContent className="flex h-full flex-col px-3 py-4">
        <div className="px-2 pb-4">
          <div className="rounded-[1.25rem] border border-amber-200/70 bg-white/80 p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.24em] text-black/45">Mission Control</div>
            <p className="mt-2 text-sm leading-6 text-black/70">
              Research prospects, write outreach, and launch campaigns from one messenger.
            </p>
          </div>
        </div>
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <Plus className="size-4" />
                <span>New Chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/prospect-search" className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <Search className="size-4" />
                <span>Find Prospects</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/campaigns" className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <Send className="size-4" />
                <span>Campaigns</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-6 px-2 text-[11px] uppercase tracking-[0.28em] text-black/35">
          Recent dispatches
        </div>
        <div className="mt-3 flex-1 overflow-y-auto rounded-[1.25rem] border border-black/5 bg-white/55 p-2">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
