'use client'

import { useState } from 'react'
import type { Prospect } from './prospect-grid'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

export function DraftEmail({
  prospects,
  campaignContext = ''
}: {
  prospects: Prospect[]
  campaignContext?: string
}) {
  const [template, setTemplate] = useState(
    'Hi {firstName},\n\nSaw your recent work at {company} — especially around {industry} / {jobTitle}. We built a tool that helps teams reduce API latency and improve reliability. Happy to share how teams like Stripe approached this.\n\nWould it be helpful to send a quick overview?\n\nBest,\n{senderName}'
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const selected = prospects[selectedIndex]

  async function generate() {
    if (!selected) return
    setLoading(true)
    setDraft('')
    try {
      const res = await fetch('/api/email/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect: selected, template, campaignContext })
      })
      const json = await res.json()
      setDraft(json.draft || '')
    } catch (e) {
      setDraft('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full rounded-2xl border bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Draft Personalized Email</div>
        <select
          value={selectedIndex}
          onChange={e => setSelectedIndex(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          {prospects.map((p, i) => (
            <option key={p.id} value={i}>
              {p.fullName} {p.company ? `• ${p.company}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Template</div>
          <Textarea value={template} onChange={e => setTemplate(e.target.value)} rows={10} />
          <Button onClick={generate} disabled={loading}>
            {loading ? 'Generating…' : 'Generate personalized email'}
          </Button>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Draft</div>
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} rows={10} />
          {selected?.email && (
            <a
              href={`mailto:${selected.email}?subject=${encodeURIComponent('Quick idea')}&body=${encodeURIComponent(draft)}`}
              className="text-sm underline text-blue-700"
            >
              Open in email client
            </a>
          )}
        </div>
      </div>
    </div>
  )
}


