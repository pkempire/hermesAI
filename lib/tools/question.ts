import { getQuestionSchemaForModel } from '@/lib/schema/question'
import { tool } from 'ai'

/**
 * Creates a question tool with the appropriate schema for the specified model.
 */
export function createQuestionTool(fullModel: string) {
  return tool({
    description:
      'Ask a clarifying question with multiple options when more information is needed',
    inputSchema: getQuestionSchemaForModel(fullModel)
    // No execute: we expect the model to emit a tool-call with the question payload;
    // the next user message is captured and sent back via addToolResult inline.
  })
}

// Default export for backward compatibility, using a default model
export const askQuestionTool = createQuestionTool('openai:gpt-5')
