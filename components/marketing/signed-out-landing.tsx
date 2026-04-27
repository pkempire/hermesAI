'use client'

/**
 * Signed-out landing page.
 *
 * Cleanly marketing-only — no chat input, no internal product surface. The
 * single conversion path is "Continue with Google", which double-purposes as
 * sign-in AND Gmail-send authorization (gmail.compose + gmail.send scopes).
 *
 * Layout follows the design mocks in /docs/design: navy ink + cream palette,
 * editorial serif headline, capability menu, process trio, proof tiles,
 * what-you-get grid, ink-on-cream final CTA. The marketing sections come
 * from <BelowFold /> so we don't fork copy maintenance.
 */

import { ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { BelowFold } from '@/components/marketing/below-fold'
import { createClient } from '@/lib/supabase/client'

const QUICK_PROOFS = [
  'Account research',
  'Decision-maker resolution',
  'Outbound systems',
  'Lead scoring',
  'Gmail-native sending'
]

export function SignedOutLanding() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function continueWithGoogle() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const origin =
        typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/oauth?next=/`,
          scopes:
            'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send',
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account consent'
          }
        }
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-[hsl(var(--hermes-cream))]">
      {/* HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-20 pb-16 md:grid-cols-[1.15fr_1fr] md:gap-16 md:px-10 md:pt-28">
          {/* LEFT */}
          <div className="flex flex-col">
            <span className="mb-6 inline-flex w-fit items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
              <span className="h-px w-8 bg-[hsl(var(--hermes-mist))]" />
              AI Outbound Operator
            </span>

            <h1 className="font-serif text-[clamp(3rem,7vw,5.6rem)] leading-[0.94] tracking-[-0.02em] text-[hsl(var(--hermes-ink))]">
              Own your{' '}
              <span className="italic">outbound engine.</span>
            </h1>

            <p className="mt-7 max-w-xl text-[17px] leading-[1.55] text-[hsl(var(--hermes-steel))]">
              Describe your ICP in one line. Hermes maps the market, resolves
              the decision-maker, drafts pitches grounded in real evidence,
              and sends through your Gmail. One operator instead of Apollo
              + Clay + Instantly + glue.
            </p>

            {/* Single-CTA continue-with-Google */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[hsl(var(--hermes-ink))] px-6 py-3.5 text-[14px] font-medium text-[hsl(var(--hermes-cream))] shadow-[0_18px_40px_-20px_rgba(10,24,53,0.55)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleGlyph />
                )}
                {loading ? 'Redirecting…' : 'Continue with Google'}
              </button>
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById('how-it-works')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[hsl(var(--hermes-mist))] bg-transparent px-6 py-3.5 text-[14px] font-medium text-[hsl(var(--hermes-ink))] transition-colors hover:border-[hsl(var(--hermes-ink))]"
              >
                See how it works
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-[12px] text-[hsl(var(--hermes-steel))]">
              Free to start — 25 prospects on us. No credit card. Hermes uses
              Gmail to send so emails come from your real inbox.
            </p>

            {error ? (
              <p className="mt-3 text-[13px] text-red-600">{error}</p>
            ) : null}

            {/* Capability pills */}
            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[hsl(var(--hermes-ink-soft))]">
              {QUICK_PROOFS.map(c => (
                <span
                  key={c}
                  className="inline-flex items-center gap-2 before:block before:h-1 before:w-1 before:rounded-full before:bg-[hsl(var(--hermes-ink))]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — quiet illustration plate */}
          <div className="relative hidden md:block">
            <PlateIllustration />
          </div>
        </div>
      </section>

      {/* MARKETING SECTIONS ───────────────────────────────────────────── */}
      <BelowFold
        // Signed-out users can't actually run a campaign yet — the BelowFold
        // "try a brief" CTA hands off to Google sign-in instead.
        onSelectPrompt={() => {
          // Fire and forget; on return from OAuth we land on /
          continueWithGoogle()
        }}
      />

      {/* Sticky bottom Google CTA bar (mobile reassurance) */}
      <div className="md:hidden sticky bottom-3 z-40 flex justify-center px-4">
        <button
          type="button"
          onClick={continueWithGoogle}
          disabled={loading}
          className="w-full max-w-md inline-flex items-center justify-center gap-3 rounded-full bg-[hsl(var(--hermes-ink))] px-6 py-3.5 text-[14px] font-medium text-[hsl(var(--hermes-cream))] shadow-2xl"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleGlyph />
          )}
          Continue with Google
        </button>
      </div>
    </div>
  )
}

/* ─── Google glyph (no third-party icon dep) ──────────────────────────── */

function GoogleGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 18 18"
      aria-hidden="true"
      role="img"
    >
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.61z"
        fill="#fff"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 0 0 9 18z"
        fill="#fff"
        opacity=".95"
      />
      <path
        d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.28-1.71V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3-2.34z"
        fill="#fff"
        opacity=".75"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3 2.34C4.66 5.16 6.65 3.58 9 3.58z"
        fill="#fff"
        opacity=".55"
      />
    </svg>
  )
}

/* ─── Hero illustration plate (SVG, themable, no JPG bloat) ───────────── */

function PlateIllustration() {
  return (
    <div className="relative aspect-square w-full max-w-[480px] mx-auto">
      <svg
        viewBox="0 0 480 480"
        className="h-full w-full"
        aria-hidden="true"
        role="img"
      >
        <defs>
          <radialGradient id="plate-out" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="hsl(35 35% 96%)" />
            <stop offset="60%" stopColor="hsl(35 35% 88%)" />
            <stop offset="100%" stopColor="hsl(35 35% 80%)" />
          </radialGradient>
          <linearGradient id="plate-ink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(222 71% 18%)" />
            <stop offset="100%" stopColor="hsl(222 71% 8%)" />
          </linearGradient>
        </defs>
        <circle cx="240" cy="240" r="220" fill="url(#plate-out)" />
        <circle
          cx="240"
          cy="240"
          r="180"
          fill="none"
          stroke="hsl(222 22% 76%)"
          strokeWidth="0.8"
          opacity="0.55"
        />
        <circle
          cx="240"
          cy="240"
          r="140"
          fill="none"
          stroke="hsl(222 22% 70%)"
          strokeWidth="0.8"
          opacity="0.45"
        />
        <circle cx="240" cy="240" r="92" fill="url(#plate-ink)" />
        <circle
          cx="240"
          cy="240"
          r="92"
          fill="none"
          stroke="hsl(36 50% 48%)"
          strokeWidth="1.2"
          opacity="0.5"
        />
        <text
          x="240"
          y="262"
          textAnchor="middle"
          fontFamily="var(--font-serif), Cormorant Garamond, serif"
          fontSize="112"
          fontStyle="italic"
          fontWeight="500"
          fill="hsl(35 35% 92%)"
        >
          H
        </text>
        <path
          d="M 90 360 Q 240 120 410 360"
          fill="none"
          stroke="hsl(222 71% 12%)"
          strokeWidth="1"
          strokeDasharray="4 6"
          opacity="0.4"
        />
        <circle cx="90" cy="360" r="3" fill="hsl(222 71% 12%)" />
        <circle cx="410" cy="360" r="3" fill="hsl(36 50% 48%)" />
      </svg>
    </div>
  )
}
