import { useSyncExternalStore } from 'react'

export interface CampaignBriefState {
  businessName: string
  offer: string
  motionIcp: string
  prospectsTarget: number
  summary: string
  savedProspects: any[]
}

let state: CampaignBriefState = {
  businessName: '',
  offer: '',
  motionIcp: '',
  prospectsTarget: 0,
  summary: '',
  savedProspects: []
}

type Listener = () => void
const listeners = new Set<Listener>()

export const campaignStore = {
  getState: () => state,
  setState: (newState: Partial<CampaignBriefState>) => {
    state = { ...state, ...newState }
    listeners.forEach(l => l())
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
}

export function useCampaignBrief() {
  return useSyncExternalStore(campaignStore.subscribe, campaignStore.getState, campaignStore.getState)
}
