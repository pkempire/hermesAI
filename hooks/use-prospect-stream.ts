'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect, useRef, useState } from 'react'

export type ProspectStreamStatus =
  | 'idle'
  | 'connecting'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timeout'

export type ProspectStreamEvent =
  | 'start'
  | 'progress'
  | 'complete'
  | 'error'

export interface ProspectStreamProspect {
  id: string
  [key: string]: any
}

export interface ProspectStreamState<TProspect extends ProspectStreamProspect = ProspectStreamProspect> {
  status: ProspectStreamStatus
  event: ProspectStreamEvent | null
  websetId: string | null
  prospects: TProspect[]
  found: number
  analyzed: number
  completion: number
  message: string
  error: string | null
}

export interface UseProspectStreamOptions {
  /** Webset id returned by /api/prospect-search/execute. Stream is opened when this is set. */
  websetId: string | null
  /** Optional target count — server cancels webset when reached. */
  target?: number
  /** Receive the full final prospects list once the stream completes. */
  onComplete?: (prospects: ProspectStreamProspect[]) => void
  /** Called once per progress tick with the upserted (changed) prospect ids. */
  onProgress?: (state: { found: number; analyzed: number; completion: number; total: number }) => void
  /** Called on stream-level error. */
  onError?: (message: string) => void
}

const initialState = (): ProspectStreamState => ({
  status: 'idle',
  event: null,
  websetId: null,
  prospects: [],
  found: 0,
  analyzed: 0,
  completion: 0,
  message: '',
  error: null
})

/**
 * Subscribe to /api/prospect-search/stream via Server-Sent Events.
 * Replaces the legacy 200ms polling loop. Yields a single state object
 * (re-renders coalesce naturally because we use functional setState).
 *
 * Doc references verified:
 *  - MDN EventSource (close on unmount, no auto-reconnect when we close()):
 *    https://developer.mozilla.org/docs/Web/API/EventSource
 *  - AI SDK v5 streaming guidance (SSE for one-way agent updates):
 *    docs/RESEARCH_2026.md §2
 */
export function useProspectStream<TProspect extends ProspectStreamProspect = ProspectStreamProspect>(
  options: UseProspectStreamOptions
) {
  const { websetId, target, onComplete, onProgress, onError } = options
  const [state, setState] = useState<ProspectStreamState<TProspect>>(() => initialState() as ProspectStreamState<TProspect>)
  const sourceRef = useRef<EventSource | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onProgressRef = useRef(onProgress)
  const onErrorRef = useRef(onError)

  // Keep latest callbacks without re-opening the EventSource.
  useEffect(() => {
    onCompleteRef.current = onComplete
    onProgressRef.current = onProgress
    onErrorRef.current = onError
  }, [onComplete, onProgress, onError])

  useEffect(() => {
    if (!websetId) return

    const params = new URLSearchParams({ websetId })
    if (target && Number.isFinite(target)) params.set('target', String(target))

    const url = `/api/prospect-search/stream?${params.toString()}`
    const es = new EventSource(url)
    sourceRef.current = es

    setState(prev => ({
      ...prev,
      status: 'connecting',
      websetId,
      event: null,
      error: null
    }))

    es.onmessage = (ev) => {
      let data: any
      try {
        data = JSON.parse(ev.data)
      } catch (err) {
        logger.warn('useProspectStream: failed to parse SSE payload', err)
        return
      }

      const event = (data.event || data.type || '').toString().replace(/^prospect_search_/, '') as ProspectStreamEvent

      if (event === 'error') {
        const msg = data.message || data.error || 'Search failed'
        setState(prev => ({
          ...prev,
          status: data.status === 'timeout' ? 'timeout' : 'failed',
          event: 'error',
          error: msg,
          message: msg
        }))
        onErrorRef.current?.(msg)
        es.close()
        sourceRef.current = null
        return
      }

      const incoming: TProspect[] = Array.isArray(data.prospects) ? data.prospects : []
      const found = typeof data.found === 'number' ? data.found : data.totalProspects || 0
      const analyzed = typeof data.analyzed === 'number' ? data.analyzed : 0
      const completion = typeof data.completion === 'number' ? data.completion : 0

      setState(prev => {
        // Upsert by id
        let prospects = prev.prospects
        if (incoming.length > 0) {
          const byId = new Map(prev.prospects.map(p => [p.id, p]))
          for (const p of incoming) byId.set(p.id, p)
          prospects = Array.from(byId.values())
        } else if (event === 'complete' && incoming.length === 0 && Array.isArray(data.prospects)) {
          prospects = data.prospects
        }

        return {
          ...prev,
          status: event === 'complete' ? 'completed' : 'running',
          event: (event || 'progress') as ProspectStreamEvent,
          websetId: data.websetId || prev.websetId,
          prospects,
          found: Math.max(found, prospects.length),
          analyzed,
          completion: event === 'complete' ? 100 : completion,
          message: data.message || prev.message,
          error: null
        }
      })

      onProgressRef.current?.({
        found,
        analyzed,
        completion,
        total: incoming.length
      })

      if (event === 'complete') {
        // Fire onComplete with the *latest* prospects after state commit.
        // We snapshot via a microtask using the most recent setState result.
        const finalList: TProspect[] = Array.isArray(data.prospects) && data.prospects.length > 0
          ? data.prospects
          : []
        // Use functional setState to read freshest list
        setState(prev => {
          onCompleteRef.current?.(finalList.length > 0 ? finalList : prev.prospects)
          return prev
        })
        es.close()
        sourceRef.current = null
      }
    }

    es.onerror = () => {
      // EventSource auto-reconnects unless we close it. The server stream is
      // single-shot per webset, so a transient error after some prospects is
      // treated as a graceful end-of-stream by callers.
      setState(prev => {
        if (prev.status === 'completed') return prev
        return {
          ...prev,
          status: prev.prospects.length > 0 ? 'completed' : 'failed',
          event: 'error',
          error: prev.prospects.length > 0 ? null : 'Stream connection lost',
          message: prev.prospects.length > 0
            ? prev.message || `Recovered ${prev.prospects.length} prospects before connection closed.`
            : 'Stream connection lost.'
        }
      })
      es.close()
      sourceRef.current = null
    }

    return () => {
      es.close()
      sourceRef.current = null
    }
  }, [websetId, target])

  return state
}
