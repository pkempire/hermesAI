'use client'

/**
 * Signed-out landing page — Mock 1 layout.
 *
 * Single conversion path: "Continue with Google" (also authorizes
 * gmail.compose + gmail.send scopes). No chat surface, no app chrome.
 *
 * Sequence: Hero → Capability menu → Process → Outcomes → Pricing →
 * Closing CTA → minimal Footer. Editorial navy-on-cream, periwinkle
 * illustration accent, borderless tiles, pill buttons.
 */

import {
  ArrowRight,
  Check,
  Loader2,
  Telescope,
  FileSearch,
  UserCheck,
  Send,
  Sparkles,
  Mail
} from 'lucide-react'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export function SignedOutLanding() {
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
    <div className="w-full bg-[hsl(var(--hermes-cream))] text-[hsl(var(--hermes-ink))]">
      <Header />
      <Hero
        loading={loading}
        error={error}
        onContinue={continueWithGoogle}
      />
      <CapabilitySection />
      <ProcessSection />
      <OutcomesSection />
      <PricingSection loading={loading} onContinue={continueWithGoogle} />
      <ClosingCTA loading={loading} onContinue={continueWithGoogle} />
      <Footer />

      {/* Mobile sticky Google CTA */}
      <div className="md:hidden sticky bottom-3 z-40 flex justify-center px-4">
        <button
          type="button"
          aria-label="Continue with Google"
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

/* ─── Header ─────────────────────────────────────────────────────────── */

function Header() {
  return (
    <header className="w-full">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-6 md:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-8 text-[14px] text-[hsl(var(--hermes-ink))] md:flex">
          <a
            href="#whats-inside"
            className="transition-opacity hover:opacity-70"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            className="transition-opacity hover:opacity-70"
          >
            Process
          </a>
          <a
            href="#pricing"
            className="transition-opacity hover:opacity-70"
          >
            Pricing
          </a>
        </nav>
      </div>
    </header>
  )
}

function Wordmark() {
  return (
    <a
      href="/"
      aria-label="Hermes home"
      className="inline-flex items-center gap-2"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="text-[hsl(var(--hermes-ink))]"
      >
        <path
          d="M3 12 L21 4 L14 12 L21 20 Z"
          fill="currentColor"
        />
      </svg>
      <span className="font-serif text-[22px] tracking-tight text-[hsl(var(--hermes-ink))]">
        Hermes
      </span>
    </a>
  )
}

/* ─── Hero ───────────────────────────────────────────────────────────── */

function Hero({
  loading,
  error,
  onContinue
}: {
  loading: boolean
  error: string | null
  onContinue: () => void
}) {
  return (
    <section className="relative w-full">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-6 pt-10 pb-24 md:grid-cols-[1.22fr_1fr] md:gap-16 md:px-8 md:pt-16 md:pb-32">
        {/* LEFT */}
        <div className="flex flex-col">
          <h1 className="font-serif text-[clamp(3rem,7vw,5.6rem)] leading-[0.96] tracking-[-0.02em] text-[hsl(var(--hermes-ink))]">
            Own your
            <br />
            <span className="italic">outbound engine.</span>
          </h1>

          <p className="mt-7 max-w-xl text-[17px] leading-[1.55] text-[hsl(var(--hermes-steel))]">
            Describe your ICP in one line. Hermes maps the market, resolves
            the decision-maker, drafts pitches grounded in real evidence,
            and sends through your Gmail. One operator instead of Apollo +
            Clay + Instantly + glue.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              aria-label="Continue with Google"
              onClick={onContinue}
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[hsl(var(--hermes-ink))] px-6 py-3.5 text-[14px] font-medium text-[hsl(var(--hermes-cream))] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--hermes-ink))] disabled:opacity-60"
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
              className="inline-flex items-center justify-center gap-2 px-2 py-3.5 text-[14px] font-medium text-[hsl(var(--hermes-ink))] transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--hermes-ink))]"
            >
              See how it works
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-3 text-[13px] text-red-600"
            >
              {error}
            </p>
          ) : null}

          {/* Trust pills */}
          <ul className="mt-10 flex flex-wrap items-center gap-2.5">
            {[
              'Built around your motion',
              'You own the data',
              'No black-box lock-in'
            ].map(t => (
              <li
                key={t}
                className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--hermes-mist))] px-3.5 py-1.5 text-[12.5px] text-[hsl(var(--hermes-steel))]"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--hermes-ink))]"
                />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT — periwinkle plate */}
        <div className="relative hidden md:block">
          <PlateIllustration />
        </div>
      </div>
    </section>
  )
}

/* ─── Capability menu ────────────────────────────────────────────────── */

const CAPABILITIES = [
  { icon: Telescope, label: 'Semantic discovery' },
  { icon: FileSearch, label: 'Account research' },
  { icon: UserCheck, label: 'Decision-maker resolution' },
  { icon: Send, label: 'Outbound systems' },
  { icon: Sparkles, label: 'Lead scoring' },
  { icon: Mail, label: 'Gmail-native sending' }
]

function CapabilitySection() {
  return (
    <section
      id="whats-inside"
      className="w-full border-t border-[hsl(var(--hermes-mist))]/70"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-8 md:py-32">
        <Eyebrow>What&rsquo;s inside</Eyebrow>
        <SectionTitle>
          Native across the <span className="italic">outbound stack.</span>
        </SectionTitle>

        <ul className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-4 border-t border-[hsl(var(--hermes-mist))]/70 pt-5"
            >
              <Icon
                className="h-5 w-5 text-[hsl(var(--hermes-ink))]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="text-[15px] font-medium text-[hsl(var(--hermes-ink))]">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ─── Process ────────────────────────────────────────────────────────── */

const PROCESS = [
  {
    n: '01',
    title: 'Brief',
    body: 'Describe target, offer, and constraints. One sentence is enough — Hermes asks for what it actually needs.',
    outcome: 'Outcome — shared understanding'
  },
  {
    n: '02',
    title: 'Discover',
    body: 'Hermes maps the market semantically, scores fit, and resolves the right decision-maker per account.',
    outcome: 'Outcome — qualified list'
  },
  {
    n: '03',
    title: 'Engage',
    body: 'Drafts evidence-grounded pitches per prospect. You review, then send through your real Gmail inbox.',
    outcome: 'Outcome — live pipeline'
  }
]

function ProcessSection() {
  return (
    <section
      id="how-it-works"
      className="w-full border-t border-[hsl(var(--hermes-mist))]/70"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-8 md:py-32">
        <Eyebrow>How it works</Eyebrow>
        <SectionTitle>
          From a single brief{' '}
          <span className="italic">to live pipeline.</span>
        </SectionTitle>

        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
          {PROCESS.map(step => (
            <article key={step.n} className="flex flex-col">
              <div className="flex items-center gap-4">
                <span className="font-serif text-[44px] leading-none text-[hsl(var(--hermes-ink))]">
                  {step.n}
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-[hsl(var(--hermes-mist))]"
                />
              </div>
              <h3 className="mt-6 font-serif text-[28px] leading-tight text-[hsl(var(--hermes-ink))]">
                {step.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.55] text-[hsl(var(--hermes-steel))]">
                {step.body}
              </p>
              <span className="mt-6 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]">
                {step.outcome}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Outcomes ───────────────────────────────────────────────────────── */

const OUTCOMES = [
  {
    metric: 'Semantic',
    caption: "Find ICPs Apollo's filters can't express."
  },
  {
    metric: 'Decision-maker',
    caption: 'Right person + verified email per account.'
  },
  {
    metric: 'Evidence-backed',
    caption: 'Every email cites a real fact about the prospect.'
  }
]

function OutcomesSection() {
  return (
    <section className="w-full border-t border-[hsl(var(--hermes-mist))]/70">
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-8 md:py-32">
        <Eyebrow>Built on real outcomes</Eyebrow>
        <SectionTitle>
          The parts of outbound that{' '}
          <span className="italic">actually move metrics.</span>
        </SectionTitle>

        <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
          {OUTCOMES.map(o => (
            <article
              key={o.metric}
              className="flex flex-col border-t border-[hsl(var(--hermes-mist))]/70 pt-8"
            >
              <span className="font-serif text-[clamp(2.4rem,4.5vw,3.6rem)] leading-[1.02] tracking-[-0.01em] text-[hsl(var(--hermes-ink))]">
                {o.metric}
              </span>
              <p className="mt-4 max-w-[320px] text-[15px] leading-[1.55] text-[hsl(var(--hermes-steel))]">
                {o.caption}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ────────────────────────────────────────────────────────── */

const PLAN_FEATURES = [
  'Unlimited campaigns',
  '1,500 prospects/mo',
  'Decision-maker enrichment',
  'Gmail-native sending',
  'Cmd+K command palette',
  'Cancel anytime'
]

function PricingSection({
  loading,
  onContinue
}: {
  loading: boolean
  onContinue: () => void
}) {
  return (
    <section
      id="pricing"
      className="w-full border-t border-[hsl(var(--hermes-mist))]/70"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-[560px] text-center">
          <Eyebrow center>Pricing</Eyebrow>
          <SectionTitle center>
            One plan. <span className="italic">All of Hermes.</span>
          </SectionTitle>
        </div>

        <div className="mt-12 flex justify-center">
          <article className="w-full max-w-[560px] rounded-[20px] border border-[hsl(var(--hermes-mist))] bg-white p-8 md:p-10">
            <div className="font-serif text-[24px] text-[hsl(var(--hermes-ink))]">
              Hermes
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-serif text-[64px] leading-none text-[hsl(var(--hermes-ink))]">
                $40
              </span>
              <span className="text-[14px] text-[hsl(var(--hermes-steel))]">
                /mo
              </span>
            </div>
            <p className="mt-3 text-[14px] text-[hsl(var(--hermes-steel))]">
              30-day free trial. No card up front.
            </p>

            <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PLAN_FEATURES.map(b => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-[14px] text-[hsl(var(--hermes-ink))]"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--hermes-ink))]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              aria-label="Start 30-day trial — continues with Google"
              onClick={onContinue}
              disabled={loading}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--hermes-ink))] px-6 py-3.5 text-[14px] font-medium text-[hsl(var(--hermes-cream))] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--hermes-ink))] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleGlyph />
              )}
              {loading ? 'Redirecting…' : 'Start 30-day trial'}
            </button>
          </article>
        </div>
      </div>
    </section>
  )
}

/* ─── Closing CTA ────────────────────────────────────────────────────── */

function ClosingCTA({
  loading,
  onContinue
}: {
  loading: boolean
  onContinue: () => void
}) {
  return (
    <section className="w-full border-t border-[hsl(var(--hermes-mist))]/70">
      <div className="mx-auto max-w-[860px] px-6 py-28 text-center md:px-8 md:py-36">
        <Eyebrow center>Stop renting generic outbound software.</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.04] tracking-[-0.02em] text-[hsl(var(--hermes-ink))]">
          Get a system{' '}
          <span className="italic">built for your exact motion.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-[1.55] text-[hsl(var(--hermes-steel))]">
          Free to start — 25 prospects on us. No credit card. Hermes uses
          Gmail to send so emails come from your real inbox.
        </p>
        <button
          type="button"
          aria-label="Continue with Google"
          onClick={onContinue}
          disabled={loading}
          className="mt-9 inline-flex items-center justify-center gap-3 rounded-full bg-[hsl(var(--hermes-ink))] px-6 py-3.5 text-[14px] font-medium text-[hsl(var(--hermes-cream))] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--hermes-ink))] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleGlyph />
          )}
          {loading ? 'Redirecting…' : 'Continue with Google'}
        </button>
      </div>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="w-full border-t border-[hsl(var(--hermes-mist))]/70">
      <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center md:px-8">
        <Wordmark />
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[hsl(var(--hermes-steel))]"
        >
          <a
            href="/privacy"
            className="transition-opacity hover:text-[hsl(var(--hermes-ink))]"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="transition-opacity hover:text-[hsl(var(--hermes-ink))]"
          >
            Terms
          </a>
          <a
            href="https://twitter.com/hermesapp"
            target="_blank"
            rel="noreferrer noopener"
            className="transition-opacity hover:text-[hsl(var(--hermes-ink))]"
          >
            Twitter
          </a>
          <a
            href="https://www.linkedin.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="transition-opacity hover:text-[hsl(var(--hermes-ink))]"
          >
            LinkedIn
          </a>
        </nav>
      </div>
    </footer>
  )
}

/* ─── Primitives ─────────────────────────────────────────────────────── */

function Eyebrow({
  children,
  center = false
}: {
  children: React.ReactNode
  center?: boolean
}) {
  return (
    <div
      className={
        'text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--hermes-steel))]' +
        (center ? ' text-center' : '')
      }
    >
      {children}
    </div>
  )
}

function SectionTitle({
  children,
  center = false
}: {
  children: React.ReactNode
  center?: boolean
}) {
  return (
    <h2
      className={
        'mt-5 font-serif text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.04] tracking-[-0.02em] text-[hsl(var(--hermes-ink))] ' +
        (center ? 'mx-auto max-w-[640px] text-center' : 'max-w-3xl')
      }
    >
      {children}
    </h2>
  )
}

/* ─── Google glyph ───────────────────────────────────────────────────── */

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

/* ─── Hero illustration plate ────────────────────────────────────────── */
/* Periwinkle architectural composition: arches, circles, ribbons in the
   #6A78A4 → #B1B9D4 → #BBC5E6 ramp on cream. Pure SVG, no images. */

function PlateIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[480px]">
      <svg
        viewBox="0 0 480 480"
        className="h-full w-full"
        aria-hidden="true"
        role="img"
      >
        <defs>
          <linearGradient id="p-arch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BBC5E6" />
            <stop offset="100%" stopColor="#6A78A4" />
          </linearGradient>
          <linearGradient id="p-arch-2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B1B9D4" />
            <stop offset="100%" stopColor="#8590B5" />
          </linearGradient>
          <linearGradient id="p-ribbon" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#BBC5E6" />
            <stop offset="50%" stopColor="#B1B9D4" />
            <stop offset="100%" stopColor="#6A78A4" />
          </linearGradient>
          <radialGradient id="p-orb" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#BBC5E6" />
            <stop offset="60%" stopColor="#B1B9D4" />
            <stop offset="100%" stopColor="#6A78A4" />
          </radialGradient>
        </defs>

        {/* Outer concentric guides */}
        <circle
          cx="240"
          cy="240"
          r="220"
          fill="none"
          stroke="#BBC5E6"
          strokeWidth="0.8"
          opacity="0.55"
        />
        <circle
          cx="240"
          cy="240"
          r="178"
          fill="none"
          stroke="#B1B9D4"
          strokeWidth="0.8"
          opacity="0.5"
        />

        {/* Big arch (back plate) */}
        <path
          d="M 90 380 L 90 240 A 150 150 0 0 1 390 240 L 390 380 Z"
          fill="url(#p-arch)"
          opacity="0.85"
        />
        {/* Inner arch cutout (cream) */}
        <path
          d="M 140 380 L 140 250 A 100 100 0 0 1 340 250 L 340 380 Z"
          fill="#FAF9F8"
        />
        {/* Inner arch fill */}
        <path
          d="M 160 380 L 160 256 A 80 80 0 0 1 320 256 L 320 380 Z"
          fill="url(#p-arch-2)"
          opacity="0.75"
        />

        {/* Orb / sun */}
        <circle
          cx="240"
          cy="218"
          r="46"
          fill="url(#p-orb)"
        />
        <circle
          cx="240"
          cy="218"
          r="46"
          fill="none"
          stroke="#6A78A4"
          strokeWidth="0.8"
          opacity="0.55"
        />

        {/* Ribbons */}
        <path
          d="M 60 150 Q 240 80 420 150"
          fill="none"
          stroke="url(#p-ribbon)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M 60 178 Q 240 110 420 178"
          fill="none"
          stroke="#B1B9D4"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Floor base */}
        <rect
          x="80"
          y="378"
          width="320"
          height="3"
          fill="#6A78A4"
          opacity="0.7"
        />

        {/* Side gear circles */}
        <circle
          cx="118"
          cy="320"
          r="22"
          fill="none"
          stroke="#6A78A4"
          strokeWidth="1.4"
          opacity="0.7"
        />
        <circle
          cx="118"
          cy="320"
          r="6"
          fill="#6A78A4"
          opacity="0.8"
        />
        <circle
          cx="362"
          cy="320"
          r="14"
          fill="#B1B9D4"
          opacity="0.85"
        />

        {/* Vertical monoline label */}
        <g transform="translate(58 268) rotate(-90)">
          <text
            x="0"
            y="0"
            fontFamily="var(--font-sans), Inter, system-ui, sans-serif"
            fontSize="9"
            letterSpacing="4"
            fill="#6A78A4"
            opacity="0.85"
          >
            HERMES · OUTBOUND ENGINE
          </text>
        </g>

        {/* Tiny accent dots */}
        <circle cx="240" cy="120" r="2.5" fill="#6A78A4" />
        <circle cx="160" cy="200" r="1.8" fill="#6A78A4" opacity="0.7" />
        <circle cx="320" cy="200" r="1.8" fill="#6A78A4" opacity="0.7" />
      </svg>
    </div>
  )
}
