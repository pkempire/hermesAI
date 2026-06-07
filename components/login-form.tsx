'use client'

import { Button } from '@/components/ui/button'
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
  const [showEmail, setShowEmail] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${currentOrigin}/auth/oauth?next=/`,
          scopes: 'openid email profile',
          queryParams: { prompt: 'select_account' }
        }
      })
      if (error) throw error
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An OAuth error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <Button
        type="button"
        onClick={handleSocialLogin}
        disabled={isLoading}
        className="h-11 w-full bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[hsl(var(--ink)/0.92)] text-[14px] font-medium"
      >
        Continue with Google
      </Button>

      {!showEmail ? (
        <button
          type="button"
          onClick={() => setShowEmail(true)}
          className="text-center text-[12.5px] text-[hsl(var(--steel))] hover:text-[hsl(var(--ink))]"
        >
          Or use email and password →
        </button>
      ) : (
        <>
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[hsl(var(--mist))]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-[0.16em]">
              <span className="bg-[hsl(var(--paper))] px-2 text-[hsl(var(--steel))]">Email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-[12px] text-[hsl(var(--steel))]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-10 border-[hsl(var(--mist))] focus-visible:ring-[hsl(var(--ink)/0.15)]"
              />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[12px] text-[hsl(var(--steel))]">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[12px] text-[hsl(var(--steel))] hover:text-[hsl(var(--ink))]"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-10 border-[hsl(var(--mist))]"
              />
            </div>
            {error && <p className="text-[12.5px] text-red-700">{error}</p>}
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 w-full bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[hsl(var(--ink)/0.92)] text-[13.5px]"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </>
      )}

      <div className="text-center text-[12.5px] text-[hsl(var(--steel))]">
        New here?{' '}
        <Link href="/auth/sign-up" className="text-[hsl(var(--ink))] hover:underline">
          Start a 7-day trial
        </Link>
      </div>
    </div>
  )
}
