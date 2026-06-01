import { Model } from '@/lib/types/models'

export const DEFAULT_MODEL: Model = {
  id: process.env.DEFAULT_MODEL_ID || 'gpt-5-mini',
  name: process.env.DEFAULT_MODEL_NAME || 'GPT-5 Mini',
  provider: 'OpenAI', 
  providerId: 'openai',
  enabled: true,
  toolCallType: 'native'
}

export async function getModels(): Promise<Model[]> {
  try {
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
