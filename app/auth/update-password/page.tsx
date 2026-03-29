import { UpdatePasswordForm } from '@/components/update-password-form'

export default function Page() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(236,201,75,0.16),transparent_28%),linear-gradient(180deg,#fffdf8_0%,#fffaf3_100%)]">
      <div className="mx-auto flex min-h-svh w-full max-w-5xl items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
        <UpdatePasswordForm />
        </div>
      </div>
    </div>
  )
}
