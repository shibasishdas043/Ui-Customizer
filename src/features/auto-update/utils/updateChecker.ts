import { isExtensionRuntime } from '../../../shared/utils/version'

declare const chrome: any

const STORAGE_KEY_LAST_CHECK = 'aura_auto_update_last_check'
const ONE_DAY_MS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Returns the Unix timestamp of the last update check.
 */
export function getLastCheckTime(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY_LAST_CHECK)
    return val ? Number.parseInt(val, 10) : 0
  } catch {
    return 0
  }
}

/**
 * Persists the timestamp of the last update check to both localStorage and chrome.storage.local.
 */
export function setLastCheckTime(time: number = Date.now()): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_CHECK, time.toString())
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [STORAGE_KEY_LAST_CHECK]: time })
    }
  } catch {}
}

/**
 * Determines whether a daily check is due.
 */
export function shouldCheckForUpdate(force = false): boolean {
  if (force) return true
  const lastCheck = getLastCheckTime()
  return Date.now() - lastCheck >= ONE_DAY_MS
}

export interface CheckUpdateResult {
  status: 'update_available' | 'no_update' | 'throttled' | 'error'
  version?: string
  error?: string
}

/**
 * Triggers Chrome's native update check for extensions installed via Chrome Web Store.
 * Requires 0 new permissions (uses standard chrome.runtime).
 */
export async function requestChromeUpdateCheck(): Promise<CheckUpdateResult> {
  if (!isExtensionRuntime() || typeof chrome === 'undefined' || !chrome.runtime?.requestUpdateCheck) {
    return { status: 'no_update' }
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.requestUpdateCheck((status: string, details?: { version?: string }) => {
        if (status === 'update_available') {
          resolve({ status: 'update_available', version: details?.version })
        } else if (status === 'throttled') {
          resolve({ status: 'throttled' })
        } else {
          resolve({ status: 'no_update' })
        }
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update check failed'
      resolve({ status: 'error', error: message })
    }
  })
}

/**
 * Applies a downloaded update by reloading the extension runtime.
 */
export function applyUpdate(): void {
  if (typeof chrome !== 'undefined' && chrome.runtime?.reload) {
    chrome.runtime.reload()
  } else {
    window.location.reload()
  }
}
