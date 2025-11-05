import { Model } from '@/lib/types/models'

export const DEFAULT_MODEL: Model = {
  id: process.env.DEFAULT_MODEL_ID || 'gpt-4o-mini',
  name: process.env.DEFAULT_MODEL_NAME || 'GPT-4o Mini',
  provider: 'OpenAI',
  providerId: 'openai',
  enabled: true,
  toolCallType: 'native'
}

export async function getModels(): Promise<Model[]> {
  try {
    // For server-side rendering, just return the default model
    // The client-side code can load models via static files if needed
    if (process.env.NODE_ENV !== 'production') {
      console.log('Loading default model for server-side rendering')
    }
    return [DEFAULT_MODEL]
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error loading models:', error)
    }
    return [DEFAULT_MODEL]
  }
}

export function getModel(modelId: string): Model {
  // For now, return a default model
  // In a real implementation, you'd look up the model from the models list
  return DEFAULT_MODEL
}

