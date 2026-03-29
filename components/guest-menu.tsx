'use client'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Link2, LogIn, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { ExternalLinkItems } from './external-link-items'

export default function GuestMenu() {
  return (
    <div className="flex items-center gap-3">
      <Button 
        asChild
        className="rounded-full border border-[rgba(214,157,74,0.35)] bg-[hsl(var(--hermes-gold))] text-sm font-medium text-black hover:bg-[hsl(var(--hermes-gold-dark))] hover:text-white"
      >
        <Link href="/auth/sign-up">
          Start with Google
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white/70 hover:bg-white/6 hover:text-white">
            <Settings2 className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem asChild>
            <Link href="/auth/login">
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Link2 className="mr-2 h-4 w-4" />
              <span>Links</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <ExternalLinkItems />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
