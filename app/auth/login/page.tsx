import { LoginForm } from '@/components/login-form'

export default function Page() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(236,201,75,0.16),transparent_28%),linear-gradient(180deg,#fffdf8_0%,#fffaf3_100%)]">
      <div className="mx-auto grid min-h-svh w-full max-w-7xl gap-10 px-6 py-8 md:grid-cols-[1.05fr_0.95fr] md:px-10">
        <div className="flex flex-col justify-center">
          <div className="max-w-xl">
            <div className="text-[11px] uppercase tracking-[0.32em] text-black/40">Hermes Messenger</div>
            <h1 className="mt-4 font-serif text-5xl leading-tight text-gray-950 md:text-6xl">
              One login for research, workflows, and Gmail-native outbound.
            </h1>
            <p className="mt-5 text-base leading-8 text-black/62">
              Hermes is built to feel like a GTM command desk, not another disconnected tool. Sign in and pick up exactly where your last campaign left off.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
