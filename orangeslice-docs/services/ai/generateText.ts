/** Credits: 1 (standard) */

/**
 * Generate text using AI, optionally with web search.
 * IMPORTANT: Always incorporate the user's guidelines (i.e. no fabrication, writing style, format) into your prompt. See index.md.
 */
type generateText = (params: {
   /** The prompt to generate the text from */
   prompt: string;
   /** Whether to enable web search */
   enableWebSearch?: boolean;
   /** Optional model override. All models currently route to gpt-5-mini */
   model?: "gpt-5-mini";
}) => Promise<{ text: string }>;
