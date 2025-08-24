import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import AppSidebar from '@/components/app-sidebar'
import ArtifactRoot from '@/components/artifact/artifact-root'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans'
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

const title = 'HermesAI - AI-Powered Cold Email Prospecting'
const description = 'Stop juggling 7 tools for cold email. Just talk to Hermes. Find prospects, research backgrounds, write personalized emails, and track results - all in one AI-powered platform.'

export const metadata: Metadata = {
  metadataBase: new URL('https://hermesai.com'),
  title,
  description,
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

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient()
    const {
      data: { user: supabaseUser }
    } = await supabase.auth.getUser()
    user = supabaseUser
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen flex flex-col font-sans antialiased',
          geistSans.variable,
          geistMono.variable
        )}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <Header user={user} />
              <main className="flex flex-1 min-h-0">
                <ArtifactRoot>{children}</ArtifactRoot>
              </main>
            </div>
          </SidebarProvider>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
