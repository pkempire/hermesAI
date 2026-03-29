'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { SiDiscord, SiGithub, SiX } from 'react-icons/si'

const externalLinks = [
  {
    name: 'X',
    href: 'https://x.com/hermes_ai',
    icon: <SiX className="mr-2 h-4 w-4" />
  },
  {
    name: 'Discord',
    href: 'https://discord.gg/hermes',
    icon: <SiDiscord className="mr-2 h-4 w-4" />
  },
  {
    name: 'GitHub',
    href: 'https://github.com/hermes/hermesAI',
    icon: <SiGithub className="mr-2 h-4 w-4" />
  }
]

export function ExternalLinkItems() {
  return (
    <>
      {externalLinks.map(link => (
        <DropdownMenuItem key={link.name} asChild>
          <Link href={link.href} target="_blank" rel="noopener noreferrer">
            {link.icon}
            <span>{link.name}</span>
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  )
}
