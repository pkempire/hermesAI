'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { SiGithub } from 'react-icons/si'

const externalLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/pkempire/hermesAI',
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
