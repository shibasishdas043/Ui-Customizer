import type { SearchHistoryItem } from '../types'

declare const chrome: any

const STORAGE_KEY = 'aura_search_history'

const MAX_HISTORY_ITEMS = 300

// In-memory cache for 0ms synchronous read access on keystrokes
let memoryCache: SearchHistoryItem[] | null = null
let isInitialized = false

const isExtensionContext = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { chrome?: { storage?: { local?: unknown } } }).chrome?.storage?.local
    )
  )
}

/**
 * Calculates Mozilla/Chromium Omnibox-inspired Frecency (Frequency + Recency) score
 */
export function calculateBaseFrecency(timestamp: number, count: number): number {
  const ageMs = Math.max(0, Date.now() - timestamp)
  const oneHour = 1000 * 60 * 60
  const oneDay = oneHour * 24
  const oneWeek = oneDay * 7
  const oneMonth = oneDay * 30

  let recencyWeight = 20
  if (ageMs < oneHour) {
    recencyWeight = 100
  } else if (ageMs < oneDay) {
    recencyWeight = 80
  } else if (ageMs < oneWeek) {
    recencyWeight = 60
  } else if (ageMs < oneMonth) {
    recencyWeight = 40
  }

  // Damped frequency logarithmic curve
  const frequencyFactor = 1 + 0.5 * Math.log(1 + Math.max(1, count))
  return Math.round(recencyWeight * frequencyFactor)
}

/**
 * Loads search history from dual storage (chrome.storage.local with localStorage fallback)
 */
export async function loadSearchHistory(): Promise<SearchHistoryItem[]> {
  if (memoryCache !== null && isInitialized) {
    return memoryCache
  }

  try {
    if (isExtensionContext()) {
      const items = await new Promise<SearchHistoryItem[]>((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (res: Record<string, unknown> | undefined) => {
          if (chrome.runtime?.lastError || !res || !res[STORAGE_KEY]) {
            resolve([])
          } else {
            resolve(res[STORAGE_KEY] as SearchHistoryItem[])
          }
        })
      })
      memoryCache = Array.isArray(items) ? items : []
      isInitialized = true
      return memoryCache
    }

    const localData = localStorage.getItem(STORAGE_KEY)
    if (localData) {
      const parsed = JSON.parse(localData)
      memoryCache = Array.isArray(parsed) ? parsed : []
    } else {
      memoryCache = []
    }
  } catch {
    memoryCache = []
  }

  isInitialized = true
  return memoryCache
}

/**
 * Synchronous getter returning the active in-memory cache instantly (0ms)
 */
export function getCachedSearchHistory(): SearchHistoryItem[] {
  return memoryCache ?? []
}

/**
 * Saves search history to dual storage with automated frecency pruning
 */
async function persistSearchHistory(items: SearchHistoryItem[]): Promise<void> {
  // Prune items if exceeding storage cap
  let pruned = items
  if (pruned.length > MAX_HISTORY_ITEMS) {
    pruned = [...items]
      .sort((a, b) => {
        const scoreA = calculateBaseFrecency(a.timestamp, a.count)
        const scoreB = calculateBaseFrecency(b.timestamp, b.count)
        return scoreB - scoreA
      })
      .slice(0, MAX_HISTORY_ITEMS)
  }

  memoryCache = pruned

  try {
    if (isExtensionContext()) {
      chrome.storage.local.set({ [STORAGE_KEY]: pruned })
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned))
  } catch (err) {
    console.warn('[Aura Search] Failed to persist search history:', err)
  }
}

/**
 * Adds or updates a search query in the search history
 */
export async function addSearchHistory(
  query: string,
  engineId?: string
): Promise<SearchHistoryItem[]> {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return memoryCache ?? []

  const current = await loadSearchHistory()
  const lowerTrimmed = trimmed.toLowerCase()
  const existingIndex = current.findIndex((item) => item.query.toLowerCase() === lowerTrimmed)

  let updated: SearchHistoryItem[]
  const now = Date.now()

  if (existingIndex >= 0) {
    const existing = current[existingIndex]
    const updatedItem: SearchHistoryItem = {
      ...existing,
      query: trimmed, // Preserve latest casing
      count: existing.count + 1,
      timestamp: now,
      engineId: engineId || existing.engineId,
    }
    updated = [updatedItem, ...current.filter((_, idx) => idx !== existingIndex)]
  } else {
    const newItem: SearchHistoryItem = {
      id: `hist_${now}_${Math.random().toString(36).slice(2, 7)}`,
      query: trimmed,
      timestamp: now,
      count: 1,
      engineId,
    }
    updated = [newItem, ...current]
  }

  await persistSearchHistory(updated)
  return updated
}

/**
 * Removes a specific search item from history
 */
export async function removeSearchHistoryItem(queryOrId: string): Promise<SearchHistoryItem[]> {
  const current = await loadSearchHistory()
  const target = queryOrId.toLowerCase().trim()

  const filtered = current.filter(
    (item) => item.id !== queryOrId && item.query.toLowerCase().trim() !== target
  )

  await persistSearchHistory(filtered)
  return filtered
}

/**
 * Clears all search history
 */
export async function clearAllSearchHistory(): Promise<void> {
  memoryCache = []
  try {
    if (isExtensionContext()) {
      chrome.storage.local.remove([STORAGE_KEY])
      return
    }
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('[Aura Search] Failed to clear search history:', err)
  }
}

/**
 * Formats a timestamp into a clean relative time string (e.g. "12m ago", "2h ago", "Yesterday")
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return ''
  const now = Date.now()
  const diffMs = Math.max(0, now - timestamp)
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  const date = new Date(timestamp)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
