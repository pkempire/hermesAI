import { getSearchSchemaForModel } from '@/lib/schema/search'
import { tool } from 'ai'
import { z } from 'zod'

/**
 * Creates a video search tool with the appropriate schema for the model.
 */
export function createVideoSearchTool(fullModel: string) {
  const schema = getSearchSchemaForModel(fullModel) || z.object({})
  return tool({
    description: 'Search for videos from YouTube',
    inputSchema: schema,
    execute: async ({ query }) => {
      try {
        const response = await fetch('https://google.serper.dev/videos', {
          method: 'POST',
          headers: {
            'X-API-KEY': process.env.SERPER_API_KEY || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: query })
        })

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        return await response.json()
      } catch (error) {
        console.error('Video Search API error:', error)
        return null
      }
    }
  })
}

// Default export for backward compatibility, using a default model
export const videoSearchTool = createVideoSearchTool('openai:gpt-4o-mini')
