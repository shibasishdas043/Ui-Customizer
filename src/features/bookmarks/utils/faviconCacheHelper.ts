import { getFaviconUrl, normalizeUrl, extractHostname } from './faviconHelper'
import type { BookmarkItem } from '../types'

/**
 * Converts a Blob to a Base64 Data URL.
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
 * Downloads any remote image through an HTML5 canvas and converts it into a permanent Base64 PNG Data URL.
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
          reject(new Error('Canvas context unavailable'))
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
 * Checks if a string is a legacy hardcoded inline SVG data URI from previous presets.
 */
export function isHardcodedLegacySvg(icon?: string): boolean {
  if (!icon) return false
  return (
    icon.startsWith('data:image/svg+xml;utf8,<svg') ||
    icon.includes('xmlns="http://www.w3.org/2000/svg"')
  )
}

/**
 * Fetches the genuine original icon from remote services and converts it to a permanent Base64 Data URL.
 * NEVER uses hardcoded icons.
 */
export async function fetchOriginalFaviconAsDataUrl(targetUrl: string): Promise<string | null> {
  const cleanUrl = normalizeUrl(targetUrl)
  if (!cleanUrl) return null
  const hostname = extractHostname(cleanUrl)
  if (!hostname) return null

  // Candidate endpoints in priority order:
  // 1. Bonjourr official high-res icon service (CORS-enabled, returns authentic SVG/PNG)
  // 2. Google FaviconV2 128px high-res service
  // 3. Google S2 128px service
  // 4. DuckDuckGo favicon service
  // 5. Direct /favicon.ico
  const candidateUrls: string[] = [
    `https://services.bonjourr.fr/favicon/blob/${cleanUrl}`,
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`,
    `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
    `https://${hostname}/favicon.ico`,
  ]

  for (const candidate of candidateUrls) {
    // 1. Try direct fetch (ideal for SVG, WebP, high-res PNG without quality loss)
    try {
      const res = await fetch(candidate, { mode: 'cors' })
      if (res.ok) {
        const blob = await res.blob()
        if (blob && blob.size > 100) {
          const dataUrl = await blobToDataUrl(blob)
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            return dataUrl
          }
        }
      }
    } catch {
      // CORS or network error, fallback to Image/Canvas approach
    }

    // 2. Try offscreen Image + Canvas (works when browser allows crossOrigin = "anonymous")
    try {
      const canvasDataUrl = await convertImageUrlToDataUrl(candidate)
      if (canvasDataUrl && canvasDataUrl.startsWith('data:image/')) {
        return canvasDataUrl
      }
    } catch {
      // Try next candidate
    }
  }

  return null
}

/**
 * Resolves a URL to a genuine permanent Base64 Data URL.
 * Once saved into BookmarkItem.icon, it is stored in chrome.storage.local / localStorage
 * and never refetched unless the bookmark is edited or deleted.
 */
export async function resolveAndCacheFavicon(
  targetUrl: string,
  preferredIcon?: string
): Promise<string> {
  // If user provided a genuine custom/uploaded Base64 image and it's not an old hardcoded preset SVG
  if (preferredIcon && preferredIcon.startsWith('data:image/') && !isHardcodedLegacySvg(preferredIcon)) {
    return preferredIcon
  }

  // If user provided a custom HTTP URL, try to fetch and convert that first
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
        // Fallback to auto-fetching from website
      }
    }
  }

  // Dynamically fetch and bake the original icon
  const fetched = await fetchOriginalFaviconAsDataUrl(targetUrl)
  if (fetched) {
    return fetched
  }

  // Fallback: return direct Google favicon URL (will display immediately while offline/loading)
  return getFaviconUrl(targetUrl, 'google')
}

/**
 * Background migrator: Scans existing bookmarks.
 * If any bookmark has:
 * 1. An old hardcoded SVG from previous code
 * 2. An uncached remote HTTP URL
 * 3. An empty icon
 * It fetches the genuine original icon, converts to Base64 Data URL, and caches it permanently in storage.
 */
export async function migrateBookmarksToPermanentCache(
  links: BookmarkItem[]
): Promise<BookmarkItem[] | null> {
  let hasChanges = false
  const updatedLinks: BookmarkItem[] = []

  for (const link of links) {
    const isHardcoded = isHardcodedLegacySvg(link.icon)
    const isUncachedHttp = link.icon && link.icon.startsWith('http')
    const isEmpty = !link.icon

    if (isHardcoded || isUncachedHttp || isEmpty) {
      try {
        const originalCachedIcon = await resolveAndCacheFavicon(link.url)
        if (originalCachedIcon && originalCachedIcon.startsWith('data:image/')) {
          updatedLinks.push({ ...link, icon: originalCachedIcon })
          hasChanges = true
          continue
        }
      } catch {
        // If fetch fails (e.g. user currently offline), keep link as-is
      }
    }

    updatedLinks.push(link)
  }

  return hasChanges ? updatedLinks : null
}
