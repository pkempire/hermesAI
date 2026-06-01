/**
 * Memory tools for the Hermes agent.
 *
 * The agent uses these to (a) durably persist what it learns about the user
 * across sessions and (b) recall past context before answering. Both tools
 * are user-scoped — the userId is bound at tool-creation time and is never
 * forwarded from the model.
 */

import { tool } from 'ai'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'
import {
  type MemoryKind,
  recallMemory,
  rememberFact
} from '@/lib/memory/store'

const KIND_VALUES = [
  'offer',
  'icp',
  'campaign',
  'prospect',
  'voice',
  'note'
] as const

const rememberSchema = z.object({
  kind: z
    .enum(KIND_VALUES)
    .describe(
      "What this fact is about: 'offer' = the user's product/service, " +
        "'icp' = an ICP description, 'campaign' = a past campaign brief and " +
        "outcome, 'prospect' = a notable prospect or contact, 'voice' = " +
        "voice/tone preferences, 'note' = catch-all."
    ),
  title: z
    .string()
    .min(2)
    .max(120)
    .describe('A short label, 2-120 characters.'),
  content: z
    .string()
    .min(8)
    .max(2400)
    .describe(
      'The fact in plain language. Concise and self-contained — no pronouns ' +
        'referring to past chat turns, no markdown.'
    ),
  importance: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe(
      '1 = throwaway, 3 = default, 5 = critical (always retrieve). Only set ' +
        '5 for things the user explicitly told you to remember.'
    )
})

const recallSchema = z.object({
  query: z
    .string()
    .min(3)
    .max(300)
    .describe('Natural-language question or topic to recall context about.'),
  kinds: z
    .array(z.enum(KIND_VALUES))
    .optional()
    .describe(
      'Optional filter — limit recall to specific shelves. Default = all.'
    ),
  match_count: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe('How many hits to return. Default 6.')
})

/**
 * Create the `remember_fact` tool bound to a userId.
 */
export function createRememberFactTool(userId: string) {
  return tool({
    description:
      'Persist a durable fact about the user (their offer, ICP, voice, ' +
      'past campaign, etc.) so future Hermes sessions remember it. Use ' +
      'this when the user states something stable — not for one-off task ' +
      'state.',
    inputSchema: rememberSchema,
    execute: async ({ kind, title, content, importance }) => {
      logger.tool('remember_fact', kind, title)
      const id = await rememberFact(userId, {
        kind: kind as MemoryKind,
        title,
        content,
        importance
      })
      return id
        ? { success: true, id, kind, title }
        : { success: false, error: 'Failed to persist memory.' }
    }
  })
}

/**
 * Create the `recall_memory` tool bound to a userId.
 */
export function createRecallMemoryTool(userId: string) {
  return tool({
    description:
      'Retrieve past durable facts that may be relevant to the current ' +
      'conversation — offer, ICPs, voice preferences, prior campaigns. ' +
      'Call this BEFORE answering anything that benefits from the user\'s ' +
      'historical context.',
    inputSchema: recallSchema,
    execute: async ({ query, kinds, match_count }) => {
      logger.tool('recall_memory', query)
      const hits = await recallMemory(userId, query, {
        kinds: kinds as MemoryKind[] | undefined,
        matchCount: match_count
      })
      return {
        query,
        hits: hits.map(h => ({
          id: h.id,
          kind: h.kind,
          title: h.title,
          content: h.content,
          importance: h.importance,
          created_at: h.created_at,
          similarity: Number(h.similarity?.toFixed(3) ?? 0)
        }))
      }
    }
  })
}
