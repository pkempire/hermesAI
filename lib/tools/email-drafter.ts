import { tool } from 'ai'
import { z } from 'zod'

const drafterSchema = z.object({
  prospects: z
    .array(
      z.object({
        id: z.string(),
        fullName: z.string().optional(),
        jobTitle: z.string().optional(),
        company: z.string().optional(),
        email: z.string().optional(),
        linkedinUrl: z.string().optional()
      })
    )
    .optional(),
  summary: z
    .object({
      query: z.string().optional(),
      entityType: z.string().optional(),
      totalFound: z.number().optional()
    })
    .optional()
})

export function createEmailDrafterTool() {
  return tool({
    description:
      'Open the interactive email drafter UI to create templates and personalize outreach.',
    inputSchema: drafterSchema,
    execute: async ({ prospects = [], summary } = {}) => {
      return {
        type: 'drafter_ui',
        component: 'InteractiveEmailDrafter',
        props: {
          prospects,
          searchSummary: summary ?? null,
          step: 3,
          totalSteps: 5
        },
        message:
          'Opening the email drafter with templates and personalization controls.'
      }
    }
  })
}

export const emailDrafterTool = createEmailDrafterTool()


