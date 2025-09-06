'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

function IconLogo({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('h-6 w-6 relative', className)} {...props}>
      <Image src="/images/hermes-logo.png" alt="HermesAI" fill sizes="24px" />
    </div>
  )
}

export { IconLogo }
