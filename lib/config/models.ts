import { Model } from '@/lib/types/models'

export const DEFAULT_MODEL: Model = {
  id: 'gpt-4o',
  name: 'GPT-4o',
  provider: 'OpenAI', 
  providerId: 'openai',
  enabled: true,
  toolCallType: 'native'
}

export async function getModels(): Promise<Model[]> {
  try {
    // Use absolute URL for server-side fetching
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/config/models.json`)
    
    if (!response.ok) {
      console.warn('Failed to fetch models.json, using default model')
      return [DEFAULT_MODEL]
    }
    
    const data = await response.json()
    return data.models || [DEFAULT_MODEL]
  } catch (error) {
    console.error('Error loading models:', error)
    return [DEFAULT_MODEL]
  }
}

export function getModel(modelId: string): Model {
  // For now, return a default model
  // In a real implementation, you'd look up the model from the models list
  return DEFAULT_MODEL
}

