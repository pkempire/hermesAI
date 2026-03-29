'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

function IconLogo({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('h-7 w-7 relative overflow-hidden rounded-md shadow-sm border border-[hsl(var(--hermes-gold))]/20', className)} {...props}>
      <Image src="/hermes-chat-avatar.png" alt="HermesAI" fill sizes="28px" className="object-cover" />
    </div>
  )
}

export { IconLogo }
