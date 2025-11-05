import { getQuestionSchemaForModel } from '@/lib/schema/question'
import { tool } from 'ai'

/**
 * Creates a question tool that asks questions inline in chat.
 * This tool is DEPRECATED - prefer asking questions naturally in text.
 * When used, it formats the question as plain text that flows naturally in conversation.
 */
export function createQuestionTool(fullModel: string) {
  return tool({
    description:
      'DEPRECATED: Prefer asking questions naturally in your text response. Only use this tool if you absolutely need structured options. When used, formats the question as natural conversation text.',
    inputSchema: getQuestionSchemaForModel(fullModel),
    execute: async ({ question, options, allowsInput, inputLabel, inputPlaceholder }) => {
      // Format as plain text that will appear naturally in chat
      let formattedQuestion = question
      
      if (options && options.length > 0) {
        const optionsText = options.map((opt: any) => `- ${opt.label}`).join('\n')
        formattedQuestion = `${question}\n\n${optionsText}`
      }
      
      if (allowsInput) {
        formattedQuestion += `\n\n${inputLabel || 'Or provide your own answer:'}`
      }
      
      // Return as plain text - this will be displayed naturally in the chat
      return formattedQuestion
    }
  })
}

// Default export for backward compatibility, using a default model
export const askQuestionTool = createQuestionTool('openai:gpt-5-mini')
