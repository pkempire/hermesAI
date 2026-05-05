import { LoginForm } from '@/components/login-form'

export default function Page() {
  return (
    <div className="min-h-svh bg-[hsl(var(--paper))]">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-[hsl(var(--ink))]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--ink))] text-[10px] font-bold text-[hsl(var(--paper))]">
              O
            </span>
            Outfield
          </div>
          <h1 className="mt-6 t-title text-[hsl(var(--ink))]">
            Welcome back
          </h1>
          <p className="mt-2 text-[14px] text-[hsl(var(--steel))]">
            Continue with Google to pick up where you left off.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
