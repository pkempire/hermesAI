'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Chat } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Spinner } from '../ui/spinner'

interface ChatMenuItemProps {
  chat: Chat
}

const formatDateWithTime = (date: Date | string) => {
  const parsedDate = new Date(date)
  const now = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (
    parsedDate.getDate() === now.getDate() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getFullYear() === now.getFullYear()
  ) {
    return `Today, ${formatTime(parsedDate)}`
  } else if (
    parsedDate.getDate() === yesterday.getDate() &&
    parsedDate.getMonth() === yesterday.getMonth() &&
    parsedDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday, ${formatTime(parsedDate)}`
  } else {
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

export function ChatMenuItem({ chat }: ChatMenuItemProps) {
  const pathname = usePathname()
  const isActive = pathname === chat.path
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const onDelete = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/chat/${chat.id}`, { method: 'DELETE' })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to delete chat')
        }

        toast.success('Chat deleted')
        setIsMenuOpen(false) // Close menu on success
        setDialogOpen(false) // Close dialog on success

        // If deleting the currently active chat, navigate home
        if (isActive) {
          router.push('/')
        }
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
      } catch (error) {
        console.error('Failed to delete chat:', error)
        toast.error((error as Error).message || 'Failed to delete chat')
        setIsMenuOpen(false) // Close menu on error
        setDialogOpen(false) // Close dialog on error
      }
    })
  }

  return (
    <li className="group/menu-item relative list-none">
      <Link 
        href={chat.path}
        className={cn(
          "flex flex-col items-start gap-0.5 rounded-xl p-2 pr-10 text-gray-700 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200 transition-colors cursor-pointer",
          isActive && "bg-white text-gray-900 border-gray-200 shadow-sm"
        )}
      >
        <div className="text-xs font-medium truncate select-none w-full">
          {chat.title}
        </div>
        <div className="w-full text-xs text-gray-400">
          {formatDateWithTime(chat.createdAt)}
        </div>
      </Link>

      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button 
            disabled={isPending} 
            className={cn(
              "absolute right-1 top-2 size-7 p-1 text-gray-400 hover:text-gray-900 transition-opacity disabled:cursor-not-allowed items-center justify-center flex rounded-lg hover:bg-gray-100",
              isMenuOpen ? "opacity-100" : "opacity-0 group-hover/menu-item:opacity-100"
            )}
          >
            {isPending ? (
              <div className="flex items-center justify-center size-full">
                <Spinner />
              </div>
            ) : (
              <MoreHorizontal size={16} />
            )}
            <span className="sr-only">Chat Actions</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                disabled={isPending}
                className="gap-2 text-destructive focus:text-destructive"
                onSelect={e => {
                  e.preventDefault()
                }}
              >
                <Trash2 size={14} />
                Delete Chat
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this chat history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isPending}
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isPending ? (
                    <div className="flex items-center justify-center">
                      <Spinner />
                    </div>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
