'use client'

import * as React from 'react'

import { CommandPalette } from '@/components/command-palette'

export function CommandPaletteProvider() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle =
        (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)
      if (isToggle) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return <CommandPalette open={open} onOpenChange={setOpen} />
}
