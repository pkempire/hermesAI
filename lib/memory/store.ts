/**
 * Hermes long-term memory — server-side helpers.
 *
 * Memory is durable per-user state that survives sessions: the user's offer
 * summary, their canonical ICPs, past campaign briefs and outcomes, voice
 * preferences. Each row optionally carries a 1536-dim text embedding for
 * cosine-similarity recall.
 *
 * Schema lives in supabase/migrations/20260426050000_hermes_memory.sql.
 *
 * All writes use the Supabase service-role client; the row's `user_id` is the
 * source of truth and RLS still enforces ownership for client-side reads.
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIM = 1536

export type MemoryKind =
  | 'offer'
  | 'icp'
  | 'campaign'
  | 'prospect'
  | 'voice'
  | 'note'

export interface MemoryRecord {
  id: string
  user_id: string
  kind: MemoryKind
  title: string | null
  content: string
  metadata: Record<string, unknown>
  source: string | null
  importance: number
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface MemoryRecallHit
  extends Pick<
    MemoryRecord,
    'id' | 'kind' | 'title' | 'content' | 'metadata' | 'importance' | 'created_at'
  > {
  similarity: number
}

interface WriteOpts {
  kind: MemoryKind
  content: string
  title?: string
  metadata?: Record<string, unknown>
  source?: string
  importance?: number
  /** Skip embedding generation. Useful for high-volume, low-signal notes. */
  noEmbed?: boolean
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service-role credentials missing')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

/**
 * Generate a 1536-dim OpenAI embedding for `text`. Returns null if no key,
 * the call errors, or the input is empty — callers must tolerate null.
 */
async function embed(text: string): Promise<number[] | null> {
  const trimmed = text?.trim()
  if (!trimmed) return null
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    logger.warn('memory.embed: OPENAI_API_KEY missing; skipping embedding')
    return null
  }
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: trimmed.slice(0, 8000) // small embedding model, 8k tokens is plenty
      })
    })
    if (!res.ok) {
      logger.warn('memory.embed: openai status', res.status)
      return null
    }
    const data = (await res.json()) as {
      data?: Array<{ embedding: number[] }>
    }
    const vec = data.data?.[0]?.embedding
    if (!vec || vec.length !== EMBEDDING_DIM) {
      logger.warn('memory.embed: bad embedding shape')
      return null
    }
    return vec
  } catch (err) {
    logger.warn('memory.embed: error', err)
    return null
  }
}

/** Insert one memory row for `userId`. Returns the row id, or null on failure. */
export async function rememberFact(
  userId: string,
  opts: WriteOpts
): Promise<string | null> {
  if (!userId || !opts.content?.trim()) return null
  const supa = adminClient()
  const embedding = opts.noEmbed
    ? null
    : await embed(`${opts.title ?? ''}\n${opts.content}`.trim())
  const { data, error } = await supa
    .from('hermes_memory')
    .insert({
      user_id: userId,
      kind: opts.kind,
      title: opts.title ?? null,
      content: opts.content.trim(),
      metadata: opts.metadata ?? {},
      source: opts.source ?? null,
      importance: opts.importance ?? 3,
      embedding
    })
    .select('id')
    .single()
  if (error) {
    logger.warn('memory.rememberFact: insert error', error.message)
    return null
  }
  return data?.id ?? null
}

/** List the most recent memory rows of a given kind, ignoring vector search. */
export async function listRecentMemory(
  userId: string,
  kind?: MemoryKind,
  limit = 10
): Promise<MemoryRecord[]> {
  const supa = adminClient()
  let q = supa
    .from('hermes_memory')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 50))
  if (kind) q = q.eq('kind', kind)
  const { data, error } = await q
  if (error) {
    logger.warn('memory.listRecentMemory: error', error.message)
    return []
  }
  return (data ?? []) as MemoryRecord[]
}

/** Vector-similarity recall against `query`. */
export async function recallMemory(
  userId: string,
  query: string,
  opts: { kinds?: MemoryKind[]; matchCount?: number; minImportance?: number } = {}
): Promise<MemoryRecallHit[]> {
  if (!userId || !query?.trim()) return []
  const embedding = await embed(query)
  if (!embedding) return []
  const supa = adminClient()
  const { data, error } = await supa.rpc('hermes_memory_recall', {
    target_user_id: userId,
    query_embedding: embedding as any,
    kinds: opts.kinds ?? null,
    match_count: Math.min(opts.matchCount ?? 8, 20),
    min_importance: opts.minImportance ?? 1
  })
  if (error) {
    logger.warn('memory.recallMemory: rpc error', error.message)
    return []
  }
  return (data ?? []) as MemoryRecallHit[]
}

/** Soft-delete a row (archive). Use this from the user's settings UI. */
export async function archiveMemory(
  userId: string,
  id: string
): Promise<boolean> {
  const supa = adminClient()
  const { error } = await supa
    .from('hermes_memory')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) {
    logger.warn('memory.archiveMemory: error', error.message)
    return false
  }
  return true
}
