import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import { CommandPaletteProvider } from '@/components/command-palette-provider'
import ArtifactRoot from '@/components/artifact/artifact-root'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
})

const title = 'Outfield — AI Outbound Operator'
const description = 'Describe who you want to reach. Outfield maps the market, finds the decision-maker, drafts pitches grounded in real evidence, and sends from your Gmail.'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  title,
  description,
  icons: {
    icon: '/images/hermes-icon.png',
    shortcut: '/images/hermes-icon.png',
    apple: '/images/hermes-icon.png'
  },
  openGraph: {
    title,
    description,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'HermesAI - AI Messenger for Outbound'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/opengraph-image.png']
  }
}

export const viewport: Viewport = {
  maximumScale: 1
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  let user = null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Only initialize Supabase if both URL and key are available and valid
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co')) {
    try {
      const supabase = await createClient()
      const {
        data: { user: supabaseUser }
      } = await supabase.auth.getUser()
      user = supabaseUser
    } catch (error) {
      console.warn('Supabase connection failed, continuing without auth:', error)
      user = null
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen flex flex-col font-sans antialiased bg-[hsl(var(--paper))] text-[hsl(var(--ink))]',
          inter.variable
        )}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CommandPaletteProvider />
          <div className="flex flex-col flex-1 min-h-0 min-h-screen">
            <Header user={user} />
            <main className={cn('relative flex flex-1 min-h-0 pt-0', user ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto')}>
              <ArtifactRoot>{children}</ArtifactRoot>
            </main>
          </div>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
