import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'

import { CommandOrbit } from '@/components/command-orbit'
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

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif'
})

const title = 'HermesAI - AI Messenger for Outbound'
const description = 'Tell Hermes who you want to reach and what you are selling. Hermes researches the market, enriches the list, drafts the outreach, and moves the workflow forward from one clean surface.'

export const metadata: Metadata = {
  metadataBase: new URL('https://hermesai.com'),
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
          'min-h-screen flex flex-col font-sans antialiased bg-white text-gray-900',
          inter.variable,
          cormorant.variable
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
          <CommandOrbit user={user} />
          <div className="flex flex-col flex-1 min-h-0">
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
