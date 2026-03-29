import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Page() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(236,201,75,0.16),transparent_28%),linear-gradient(180deg,#fffdf8_0%,#fffaf3_100%)]">
      <div className="mx-auto flex min-h-svh w-full max-w-5xl items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl">
          <Card className="border-black/5 bg-white/85 shadow-[0_30px_90px_rgba(62,45,18,0.08)] backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-serif text-3xl text-gray-950">Check your inbox</CardTitle>
              <CardDescription>Confirm your account to unlock Hermes.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-black/60">
                You&apos;ve successfully signed up. Open the confirmation email, finish verification, and then sign in to start building your first research and outreach workflow.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
