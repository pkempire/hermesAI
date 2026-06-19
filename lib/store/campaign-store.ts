import { useEffect, useSyncExternalStore } from 'react'

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
const STORAGE_KEY = 'hermes-campaign-brief'
const STUDIO_PROSPECTS_KEY = 'hermes-studio-prospects'
let hydrated = false

function canUseStorage() {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(window.localStorage)
  } catch {
    return false
  }
}

function safeParse(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function hydrateState() {
  if (hydrated || !canUseStorage()) return
  hydrated = true

  const stored = safeParse(window.localStorage.getItem(STORAGE_KEY))
  const storedProspects = safeParse(window.localStorage.getItem(STUDIO_PROSPECTS_KEY))

  state = {
    ...state,
    ...(stored && typeof stored === 'object' ? stored : {}),
    savedProspects: Array.isArray(storedProspects)
      ? storedProspects
      : Array.isArray(stored?.savedProspects)
        ? stored.savedProspects
        : state.savedProspects
  }
}

function persistState() {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    window.localStorage.setItem(STUDIO_PROSPECTS_KEY, JSON.stringify(state.savedProspects || []))
  } catch {}
}

function notify() {
  listeners.forEach(listener => listener())
}

export const campaignStore = {
  getState: () => {
    hydrateState()
    return state
  },
  hydrate: () => {
    const before = state
    hydrateState()
    if (before !== state) notify()
  },
  setState: (newState: Partial<CampaignBriefState>) => {
    hydrateState()
    state = { ...state, ...newState }
    persistState()
    notify()
  },
  subscribe: (listener: Listener) => {
    hydrateState()
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
}

export function useCampaignBrief() {
  useEffect(() => {
    campaignStore.hydrate()
  }, [])

  return useSyncExternalStore(
    campaignStore.subscribe,
    campaignStore.getState,
    () => state
  )
}
