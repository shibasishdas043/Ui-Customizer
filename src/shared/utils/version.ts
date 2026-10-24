declare const __APP_VERSION__: string | undefined
declare const chrome: any

/**
 * Returns the current application or extension version.
 * Automatically resolves from:
 * 1. Native Chrome Extension runtime (chrome.runtime.getManifest().version)
 * 2. Vite compile-time injected define (__APP_VERSION__ from package.json)
 * 3. Fallback default
 */
export function getAppVersion(): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      const version = chrome.runtime.getManifest()?.version
      if (version) return version
    }
  } catch {}

  if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) {
    return __APP_VERSION__
  }

  return '1.1.5'
}

/**
 * Returns whether the application is running inside an active Chrome extension environment.
 */
export function isExtensionRuntime(): boolean {
  try {
    return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id)
  } catch {
    return false
  }
}
