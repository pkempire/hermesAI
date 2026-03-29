'use client'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { IconLogo } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/index'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      // Redirect to root and refresh to ensure server components get updated session
      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Always use current deployment's origin (critical for preview branches)
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${currentOrigin}/auth/oauth?next=/`,
          scopes: 'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send',
          queryParams: {
            // Force account selection to prevent wrong account issue
            prompt: 'select_account'
          }
        }
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : 'An OAuth error occurred'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn('flex flex-col items-center gap-6', className)}
      {...props}
    >
      <Card className="w-full max-w-md border-black/5 bg-white/85 shadow-[0_30px_90px_rgba(62,45,18,0.08)] backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm">
            <IconLogo className="size-7" />
          </div>
          <CardTitle className="mt-4 font-serif text-3xl text-gray-950">
            Welcome back to Hermes
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-black/60">
            Sign in to resume your research workflows, prospect lists, and outbound drafts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              type="button"
              className="h-11 w-full border-black/10 bg-white text-gray-900 hover:bg-stone-50"
              onClick={handleSocialLogin}
              disabled={isLoading}
            >
              Continue with Google
            </Button>

            <p className="text-center text-xs leading-5 text-black/45">
              Google sign-in is the fastest path if you want Hermes to draft and send through Gmail later.
            </p>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-muted px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="h-11 w-full bg-black text-white hover:bg-black/90" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Sign In'}
              </Button>
            </form>
          </div>
          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="underline underline-offset-4">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
      <div className="text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  )
}
