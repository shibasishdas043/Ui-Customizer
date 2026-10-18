import type { SearchEngineItem } from '../types'
import { extractHostnameFromSearch } from './searchUrlHelper'

/**
 * Converts a Blob to a permanent Base64 Data URL.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read blob as data URL'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Downloads a remote image through an off-screen HTML5 canvas and converts it into a Base64 PNG Data URL.
 */
export function convertImageUrlToDataUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (imageUrl.startsWith('data:')) {
      resolve(imageUrl)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = Math.min(Math.max(img.naturalWidth || 64, img.naturalHeight || 64, 64), 128)
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'))
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const dataUrl = canvas.toDataURL('image/png')
        resolve(dataUrl)
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image from ${imageUrl}`))
    }

    img.src = imageUrl
  })
}

/**
 * Normalizes a search query URL to a root domain hostname.
 */
export function extractEngineDomain(url: string): string {
  const host = extractHostnameFromSearch(url)
  if (host) return host

  // Fallback cleanup
  try {
    const clean = url.replace(/^[a-z]+:\/\//i, '').split('/')[0].split('?')[0].replace(/^www\./i, '')
    return clean || 'google.com'
  } catch {
    return 'google.com'
  }
}

/**
 * Constructs a fallback Google S2 / Favicon URL for a given search query URL.
 */
export function getSearchEngineFaviconUrl(url: string): string {
  const domain = extractEngineDomain(url)
  if (domain === 'google.com' || (domain.endsWith('.google.com') && !domain.includes('gemini'))) {
    return 'https://services.bonjourr.fr/favicon/blob/https://google.com'
  }
  if (domain === 'bing.com' || domain.endsWith('.bing.com')) {
    return 'https://www.bing.com/sa/simg/favicon-2x.ico'
  }
  if (domain === 'duckduckgo.com' || domain.endsWith('.duckduckgo.com')) {
    return 'https://icons.duckduckgo.com/ip3/duckduckgo.com.ico'
  }
  if (domain.includes('brave.com')) {
    return 'https://services.bonjourr.fr/favicon/blob/https://brave.com'
  }
  if (domain.includes('perplexity.ai')) {
    return 'https://www.perplexity.ai/favicon.ico'
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

/**
 * Fetches the genuine original live logo from remote search engine site endpoints
 * and converts it into a permanent Base64 Data URL.
 * Never uses hardcoded SVG or logo assets.
 */
export async function fetchLiveSearchFavicon(url: string): Promise<string | null> {
  const domain = extractEngineDomain(url)
  if (!domain) return null

  const isGoogle = domain === 'google.com' || (domain.endsWith('.google.com') && !domain.includes('gemini'))
  const isBing = domain === 'bing.com' || domain.endsWith('.bing.com')
  const isBrave = domain.includes('brave.com')
  const isDuckDuckGo = domain.includes('duckduckgo.com')
  const isPerplexity = domain.includes('perplexity.ai')

  const candidateUrls: string[] = isGoogle
    ? [
        `https://services.bonjourr.fr/favicon/blob/https://google.com`,
        `https://icons.duckduckgo.com/ip3/google.com.ico`,
        `https://www.google.com/favicon.ico`,
      ]
    : isBing
    ? [
        `https://www.bing.com/sa/simg/favicon-2x.ico`,
        `https://www.bing.com/favicon.ico`,
        `https://icons.duckduckgo.com/ip3/bing.com.ico`,
      ]
    : isBrave
    ? [
        `https://services.bonjourr.fr/favicon/blob/https://brave.com`,
        `https://icons.duckduckgo.com/ip3/search.brave.com.ico`,
        `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://brave.com&size=128`,
      ]
    : isDuckDuckGo
    ? [
        `https://icons.duckduckgo.com/ip3/duckduckgo.com.ico`,
        `https://duckduckgo.com/favicon.ico`,
      ]
    : isPerplexity
    ? [
        `https://www.perplexity.ai/favicon.ico`,
        `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://perplexity.ai&size=128`,
      ]
    : [
        `https://services.bonjourr.fr/favicon/blob/https://${domain}`,
        `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        `https://${domain}/favicon.ico`,
      ]

  for (const candidate of candidateUrls) {
    // 1. Try direct CORS fetch (best for SVGs & crisp lossless PNGs)
    try {
      const res = await fetch(candidate, { mode: 'cors' })
      if (res.ok) {
        const blob = await res.blob()
        if (blob && blob.size > 80) {
          const dataUrl = await blobToDataUrl(blob)
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            return dataUrl
          }
        }
      }
    } catch {
      // CORS or network error, fallback to Canvas approach
    }

    // 2. Try offscreen Image + Canvas (works when browser allows crossOrigin = "anonymous")
    try {
      const canvasDataUrl = await convertImageUrlToDataUrl(candidate)
      if (canvasDataUrl && canvasDataUrl.startsWith('data:image/')) {
        return canvasDataUrl
      }
    } catch {
      // Try next endpoint in cascade
    }
  }

  return null
}

/**
 * Resolves a search engine's URL to a genuine permanent Base64 Data URL.
 * Once saved into SearchEngineItem.icon, it is persisted in chrome.storage.local / localStorage
 * and never refetched unless the engine is modified.
 */
export async function resolveAndCacheSearchFavicon(
  engineUrl: string,
  preferredIcon?: string,
  forceRefresh: boolean = false
): Promise<string> {
  // If user provided a genuine Base64 image and forceRefresh is false
  if (!forceRefresh && preferredIcon && preferredIcon.startsWith('data:image/')) {
    return preferredIcon
  }

  // If user provided a custom HTTP URL, convert that remote image to Base64
  if (preferredIcon && preferredIcon.startsWith('http')) {
    try {
      const customFetch = await fetch(preferredIcon, { mode: 'cors' })
      if (customFetch.ok) {
        const blob = await customFetch.blob()
        const dataUrl = await blobToDataUrl(blob)
        if (dataUrl && dataUrl.startsWith('data:image/')) return dataUrl
      }
    } catch {
      try {
        const customCanvas = await convertImageUrlToDataUrl(preferredIcon)
        if (customCanvas) return customCanvas
      } catch {
        // Fallback to domain logo
      }
    }
  }

  // Dynamically fetch and bake the original live logo
  const fetched = await fetchLiveSearchFavicon(engineUrl)
  if (fetched) {
    return fetched
  }

  // Fallback: return direct authentic favicon URL (loads immediately while offline or caching)
  return getSearchEngineFaviconUrl(engineUrl)
}

/**
 * Background Migrator: Scans existing search engines.
 * If any engine has:
 * 1. An old legacy string ID instead of a genuine Data URL (e.g. 'google', 'bing', 'brave')
 * 2. An uncached remote HTTP URL
 * 3. An empty or missing icon
 * 4. A low-res legacy fallback icon (like Google S2 generic blue magnifying glass)
 * It fetches the genuine live icon from the site, converts it to a permanent Base64 Data URL,
 * and caches it permanently in storage.
 */
export async function migrateSearchEnginesToPermanentCache(
  engines: SearchEngineItem[]
): Promise<SearchEngineItem[] | null> {
  let hasChanges = false
  const updatedEngines: SearchEngineItem[] = []

  for (const engine of engines) {
    const isLegacyPresetId =
      !engine.icon ||
      !engine.icon.startsWith('data:image/') ||
      engine.icon === engine.id ||
      ['google', 'duckduckgo', 'bing', 'brave', 'perplexity', 'chatgpt', 'claude', 'gemini', 'phind', 'kagi', 'ecosia', 'yahoo', 'youtube', 'github'].includes(engine.icon.toLowerCase())

    const isUncachedHttp = engine.icon && engine.icon.startsWith('http')
    const isGoogle = engine.id === 'google' || (engine.url && engine.url.includes('google.com'))
    const isBing = engine.id === 'bing' || (engine.url && engine.url.includes('bing.com'))
    // Detect bad legacy cache (e.g. Google S2 blue magnifying glass which is < 1500 chars)
    const isBadLegacyIcon = Boolean(
      (isGoogle || isBing) &&
      engine.iconType !== 'upload' &&
      engine.icon &&
      engine.icon.startsWith('data:image/') &&
      engine.icon.length < 1500
    )

    if (isLegacyPresetId || isUncachedHttp || isBadLegacyIcon) {
      try {
        const cachedIcon = await resolveAndCacheSearchFavicon(
          engine.url,
          isBadLegacyIcon ? undefined : engine.icon,
          isBadLegacyIcon
        )
        if (cachedIcon && cachedIcon.startsWith('data:image/')) {
          updatedEngines.push({ ...engine, icon: cachedIcon, iconType: 'favicon' })
          hasChanges = true
          continue
        }
      } catch {
        // If fetch fails (e.g. device is offline on launch), keep existing configuration
      }
    }

    updatedEngines.push(engine)
  }

  return hasChanges ? updatedEngines : null
}
