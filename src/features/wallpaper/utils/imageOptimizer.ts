/**
 * Aura Wallpaper Image Resolution & Composition Optimizer
 *
 * Modeled after Bonjourr's high-fidelity wallpaper architecture:
 * - Dynamically detects screen resolution & devicePixelRatio for crisp 2K/4K Retina fidelity.
 * - Uses Unsplash's intelligent `fit=crop&crop=entropy` to center framing around the visual subject
 *   (e.g., beaches, pools, architecture) matching the screen aspect ratio, preventing excessive zoom.
 * - Retains 85% lossless quality without pixelation or compression banding.
 */

export const STANDARD_WALLPAPER_QUALITY = 85

/**
 * Calculates high-DPI target dimensions tailored to the user's monitor.
 * Matches Bonjourr's exact algorithm: Math.max(2, devicePixelRatio) * screen dimensions.
 */
export function getOptimizedScreenDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 3840, height: 2160 }
  }
  const screenW = window.screen?.width || window.innerWidth || 1920
  const screenH = window.screen?.height || window.innerHeight || 1080
  const density = Math.max(2, window.devicePixelRatio || 1)

  let width = Math.round(screenW * density)
  let height = Math.round(screenH * density)
  const ratio = screenW / screenH

  if (ratio >= 2) {
    width = height * 2
  } else if (ratio <= 0.5) {
    height = width * 2
  }

  // Ensure minimum 1920x1080 and clamp to max 5120 (5K)
  width = Math.min(5120, Math.max(1920, width))
  height = Math.min(2880, Math.max(1080, height))

  return { width, height }
}

/**
 * Optimizes an image URL for high-resolution desktop wallpaper display.
 * Transforms Unsplash URLs to deliver crisp 4K/Retina fidelity while using
 * smart entropy cropping to preserve the natural subject composition.
 *
 * @param url The raw image URL
 * @param customWidth Optional explicit width
 * @param customHeight Optional explicit height
 * @param quality Target compression quality (default: 85)
 */
export function optimizeWallpaperResolution(
  url: string,
  customWidth?: number,
  customHeight?: number,
  quality: number = STANDARD_WALLPAPER_QUALITY,
): string {
  if (!url || typeof url !== 'string') return ''

  const trimmed = url.trim()
  if (!trimmed) return ''

  // Never alter data URLs, blob URLs, or bundled local assets
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/backgrounds/') ||
    trimmed.startsWith('/')
  ) {
    return trimmed
  }

  const { width: defaultW, height: defaultH } = getOptimizedScreenDimensions()
  const targetW = customWidth || defaultW
  const targetH = customHeight || defaultH

  // 1. Unsplash CDN Images (images.unsplash.com)
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)

      parsed.searchParams.set('auto', 'format')
      parsed.searchParams.set('w', targetW.toString())
      parsed.searchParams.set('h', targetH.toString())
      parsed.searchParams.set('q', quality.toString())

      // Use smart entropy crop so the image is compositionally framed to the screen aspect ratio
      // This prevents the massive vertical zoom that cut off lower-half subjects like pools and chairs
      if (!parsed.searchParams.has('crop') || parsed.searchParams.get('crop') === 'entropy') {
        parsed.searchParams.set('fit', 'crop')
        parsed.searchParams.set('crop', 'entropy')
      }

      parsed.searchParams.delete('dpi')

      return parsed.toString()
    } catch {
      return trimmed
    }
  }

  // 2. Unsplash download endpoint (https://unsplash.com/photos/.../download)
  if (trimmed.includes('unsplash.com/photos/') && trimmed.includes('/download')) {
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
      parsed.searchParams.set('w', targetW.toString())
      parsed.searchParams.set('h', targetH.toString())
      return parsed.toString()
    } catch {
      return trimmed
    }
  }

  // 3. Pexels CDN Images (images.pexels.com)
  if (trimmed.includes('images.pexels.com')) {
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
      parsed.searchParams.set('auto', 'compress')
      parsed.searchParams.set('cs', 'tinysrgb')
      parsed.searchParams.set('w', targetW.toString())
      parsed.searchParams.set('h', targetH.toString())
      parsed.searchParams.set('fit', 'crop')
      parsed.searchParams.set('crop', 'entropy')
      return parsed.toString()
    } catch {
      return trimmed
    }
  }

  return trimmed
}

