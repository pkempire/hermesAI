import { anthropic } from '@ai-sdk/anthropic'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createProviderRegistry } from 'ai'

export const registry = createProviderRegistry({
  openai,
  anthropic,
  'openai-compatible': createOpenAI({
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
    baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL
  })
})

export function getModel(model: string) {
  return registry.languageModel(
    model as Parameters<typeof registry.languageModel>[0]
  )
}

export function isProviderEnabled(providerId: string): boolean {
  switch (providerId) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY
    case 'openai-compatible':
      return (
        !!process.env.OPENAI_COMPATIBLE_API_KEY &&
        !!process.env.OPENAI_COMPATIBLE_API_BASE_URL
      )
    default:
      return false
  }
}

export function getToolCallModel(model?: string) {
  const [provider, ...modelNameParts] = model?.split(':') ?? []
  switch (provider) {
    case 'anthropic':
      return getModel('anthropic:claude-3-haiku-20240307')
    default:
      // Prefer a fast OpenAI helper model; allow override
      return getModel(process.env.TOOLCALL_MODEL_ID ? `openai:${process.env.TOOLCALL_MODEL_ID}` : 'openai:gpt-5')
  }
}

export function isToolCallSupported(model?: string) {
  const [provider, ...modelNameParts] = model?.split(':') ?? []
  
  // Both OpenAI and Anthropic support tool calls
  return provider === 'openai' || provider === 'anthropic' || provider === 'openai-compatible'
}

export function isReasoningModel(model: string): boolean {
  if (typeof model !== 'string') {
    return false
  }
  // Only OpenAI o3-mini for now since we removed deepseek
  return model.includes('gpt-5-reasoning') || model.includes('o3-mini')
}
