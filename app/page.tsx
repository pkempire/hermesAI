import Link from 'next/link'

export default async function Page() {
  return (
    <main className="min-h-[100dvh] flex flex-col">
      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl w-full text-center space-y-6">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900">
            Evidence‑ready prospecting, without the knobs
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Describe the accounts you want. Hermes finds companies, enriches them from the web, and drafts the email. Preview 1 result free.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/search"
              className="px-5 py-3 rounded-md bg-black text-white hover:bg-gray-800 transition-colors"
            >
              New Campaign
            </Link>
            <Link
              href="/share/sample"
              className="px-5 py-3 rounded-md border hover:bg-gray-50 transition-colors"
            >
              See sample
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
