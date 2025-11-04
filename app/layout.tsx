import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'
import { Manrope, Playfair_Display } from 'next/font/google'

import AppSidebar from '@/components/app-sidebar'
import ArtifactRoot from '@/components/artifact/artifact-root'
import { Header } from '@/components/header'
import { OnboardingModal } from '@/components/onboarding-modal'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans'
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif'
})

const title = 'HermesAI - AI-Powered Cold Email Prospecting'
const description = 'Stop juggling 7 tools for cold email. Just talk to Hermes. Find prospects, research backgrounds, write personalized emails, and track results - all in one AI-powered platform.'

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
        alt: 'HermesAI - AI-Powered Cold Email Prospecting'
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
          'min-h-screen flex flex-col font-sans antialiased',
          manrope.variable,
          playfair.variable
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
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <Header user={user} />
              <main className="flex flex-1 min-h-0 overflow-hidden">
                <ArtifactRoot>{children}</ArtifactRoot>
              </main>
            </div>
          </SidebarProvider>
          <OnboardingModal />
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
