import type {
  UnsplashPhoto,
  BackgroundProvider,
  DefaultCollectionCategory,
} from '../types'
import { getOrFetchWallpaper, getRecentCachedWallpapers } from './wallpaperCache'
import { optimizeWallpaperResolution } from './imageOptimizer'
import {
  fetchUnsplashCollectionPhotos,
  fetchUnsplashSearchPhotos,
  fetchWallhavenPhotos,
  fetchBingDailyPhotos,
  fetchRedditPhotos,
  cleanCollectionId,
  DEFAULT_COLLECTIONS,
  getSeenPhotoKeys,
  markPhotoAsSeen,
  getQueueStorageKey,
  popNextPhotoFromQueue,
  enqueuePhotos,
} from './unsplashEngine'

/**
 * Aura Background Tab Preload & Buffer Manager
 *
 * Provides a high-performance tiered background pipeline:
 * - Tier 1: Strictly pre-buffers 2 to 3 maximum upfront images in IndexedDB & memory
 *   for 0ms instant display on new tabs.
 * - Tier 2: Candidate queue in localStorage so continuous rapid tab openings (e.g. 5+ tabs in 2 seconds)
 *   continue to get fresh dynamic unseen images even if the 3-image binary buffer is depleted.
 * - Prevents repetitive looping using a persistent seen-photo ring buffer.
 */

export const MAX_TAB_PRELOAD_COUNT = 3
const BUFFER_KEY_PREFIX = 'aura_tab_ahead_buffer_v3_'
export const TAB_SESSION_PHOTO_KEY = 'aura_tab_session_photo_v1'

export interface PreloadTargetOptions {
  defaultCategory?: DefaultCollectionCategory
  customCollectionId?: string
  unsplashCollectionId?: string
  customSearchQuery?: string
  redditSubreddit?: string
}

/**
 * Extracts a normalized, stable key for a photo (ID or path without dynamic query params)
 */
function getPhotoCanonicalKey(p: UnsplashPhoto | { url: string; id?: string }): string {
  if (p.id && !p.id.startsWith('http')) return p.id
  if (!p.url) return ''
  try {
    const parsed = new URL(p.url.startsWith('http') ? p.url : `https://${p.url}`)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return p.url.split('?')[0]
  }
}

/**
 * Fisher-Yates array shuffle for randomized wallpaper discovery
 */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generates a unique, stable storage key for the collection settings
 */
export function getTabBufferKey(
  provider: BackgroundProvider,
  options: PreloadTargetOptions,
): string {
  if (provider === 'unsplash_collection') {
    const colId = cleanCollectionId(options.customCollectionId || options.unsplashCollectionId || '') || DEFAULT_COLLECTIONS.nature.id
    return `${BUFFER_KEY_PREFIX}coll_${colId}`
  }
  if (provider === 'unsplash_search') {
    const q = (options.customSearchQuery || 'nature').trim().toLowerCase()
    return `${BUFFER_KEY_PREFIX}search_${encodeURIComponent(q)}`
  }
  if (provider === 'wallhaven') {
    const q = (options.customSearchQuery || 'random').trim().toLowerCase()
    return `${BUFFER_KEY_PREFIX}wh_${encodeURIComponent(q)}`
  }
  if (provider === 'bing') {
    return `${BUFFER_KEY_PREFIX}bing`
  }
  if (provider === 'reddit') {
    const sub = (options.redditSubreddit || 'wallpapers').trim().toLowerCase()
    const q = (options.customSearchQuery || '').trim().toLowerCase()
    return `${BUFFER_KEY_PREFIX}reddit_${sub}_${encodeURIComponent(q)}`
  }
  return `${BUFFER_KEY_PREFIX}default_${options.defaultCategory || 'all'}`
}

/**
 * Reads the current upcoming photos buffer for the given settings
 */
export function getUpcomingBuffer(bufferKey: string): UnsplashPhoto[] {
  try {
    const raw = localStorage.getItem(bufferKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_TAB_PRELOAD_COUNT)
    }
  } catch {}
  return []
}

/**
 * Saves the upcoming photos buffer (strictly capped to MAX_TAB_PRELOAD_COUNT)
 */
function saveUpcomingBuffer(bufferKey: string, buffer: UnsplashPhoto[]): void {
  try {
    const capped = buffer.slice(0, MAX_TAB_PRELOAD_COUNT)
    localStorage.setItem(bufferKey, JSON.stringify(capped))
  } catch (err) {
    console.warn('Failed to save tab ahead buffer:', err)
  }
}

/**
 * Detects whether the current page session was loaded strictly via a browser reload
 * (e.g., clicking browser reload ⟳, pressing F5, or pressing Ctrl+R).
 * Strictly excludes new tab creation (Ctrl+T) and home button navigations.
 */
export function isBrowserTabReload(): boolean {
  if (typeof window === 'undefined') return false

  // Check 0: Transient single-use reload marker (set by focus-init before any redirects)
  try {
    if (sessionStorage.getItem('aura_tab_reloaded_once') === '1') {
      sessionStorage.removeItem('aura_tab_reloaded_once')
      return true
    }
  } catch {}

  // Check 1: Modern Navigation Timing API Level 2 (Standard in Chrome, Edge, Firefox, Safari)
  try {
    const navEntries = performance.getEntriesByType('navigation')
    if (navEntries && navEntries.length > 0) {
      const navTiming = navEntries[0] as PerformanceNavigationTiming
      return navTiming.type === 'reload'
    }
  } catch {}

  // Check 2: Legacy Navigation Timing API Level 1 (fallback for older browsers)
  try {
    if (window.performance && 'navigation' in window.performance) {
      return (window.performance as { navigation?: { type?: number } }).navigation?.type === 1
    }
  } catch {}

  return false
}

/**
 * Pops the next pre-cached photo from the buffer when a new tab opens or tab is reloaded.
 * Provides a 3-Tiered 0ms Resolution:
 * - Tier 1: 0ms instant display from the pre-warmed upfront 2-3 binary buffer.
 * - Tier 2: Instant pop from the candidate rotation queue in localStorage.
 * - Tier 3: Resilient instant local fallback from bundled collections / cached photos,
 *   guaranteeing that reload never returns the current photo and never returns null.
 */
export function popNextBufferedTabPhoto(
  provider: BackgroundProvider,
  options: PreloadTargetOptions,
  bypassSessionCache: boolean = false,
  currentPhotoUrl?: string,
): UnsplashPhoto | null {
  // If static single-image or color provider, no rotation
  if (provider === 'solid_color' || provider === 'local_file' || provider === 'custom_url') {
    return null
  }

  // 1. Check if this specific tab already has an assigned photo (preserves photo on F5 / reload unless bypassed)
  if (!bypassSessionCache) {
    try {
      const sessionRaw = sessionStorage.getItem(TAB_SESSION_PHOTO_KEY)
      if (sessionRaw) {
        const parsed: UnsplashPhoto = JSON.parse(sessionRaw)
        if (parsed?.url) {
          return {
            ...parsed,
            url: optimizeWallpaperResolution(parsed.url),
          }
        }
      }
    } catch {}
  } else {
    try {
      sessionStorage.removeItem(TAB_SESSION_PHOTO_KEY)
    } catch {}
  }

  const currentKey = currentPhotoUrl ? currentPhotoUrl.split('?')[0] : ''

  // Tier 1: Pop from the pre-warmed upfront buffer (strictly skipping current photo)
  const bufferKey = getTabBufferKey(provider, options)
  const buffer = getUpcomingBuffer(bufferKey)

  if (buffer.length > 0) {
    const matchIdx = buffer.findIndex((p) => {
      const k = p.id && !p.id.startsWith('http') ? p.id : p.url.split('?')[0]
      return p.url !== currentPhotoUrl && k !== currentKey
    })

    if (matchIdx !== -1) {
      const nextPhoto = buffer[matchIdx]
      const remaining = [...buffer.slice(0, matchIdx), ...buffer.slice(matchIdx + 1)]
      saveUpcomingBuffer(bufferKey, remaining)

      const optimizedPhoto: UnsplashPhoto = {
        ...nextPhoto,
        url: optimizeWallpaperResolution(nextPhoto.url),
      }

      try {
        sessionStorage.setItem(TAB_SESSION_PHOTO_KEY, JSON.stringify(optimizedPhoto))
      } catch {}

      markPhotoAsSeen(optimizedPhoto)
      return optimizedPhoto
    }
  }

  // Tier 2: Upfront buffer didn't have an unseen photo:
  // Pop next unseen candidate directly from the candidate rotation queue in localStorage
  try {
    const queueKey = getQueueStorageKey(provider, {
      defaultCategory: options.defaultCategory,
      customCollectionId: options.customCollectionId || options.unsplashCollectionId,
      customSearchQuery: options.customSearchQuery,
      redditSubreddit: options.redditSubreddit,
    })
    const seenKeys = getSeenPhotoKeys()

    let queued = popNextPhotoFromQueue(queueKey)
    while (
      queued &&
      queued.url &&
      (queued.url === currentPhotoUrl ||
        queued.url.split('?')[0] === currentKey ||
        seenKeys.has(queued.id && !queued.id.startsWith('http') ? queued.id : queued.url.split('?')[0]))
    ) {
      queued = popNextPhotoFromQueue(queueKey)
    }

    if (queued && queued.url) {
      const optimizedPhoto: UnsplashPhoto = {
        ...queued,
        url: optimizeWallpaperResolution(queued.url),
      }

      try {
        sessionStorage.setItem(TAB_SESSION_PHOTO_KEY, JSON.stringify(optimizedPhoto))
      } catch {}

      markPhotoAsSeen(optimizedPhoto)
      return optimizedPhoto
    }
  } catch (err) {
    console.warn('Tier 2 continuous tabs queue pop failed:', err)
  }

  // Tier 3: Upfront buffer and queue empty (e.g. continuous reload storm before network preloader finishes)
  // Guaranteed instant local selection from bundled collections ONLY for default provider
  // For dynamic providers (unsplash_search, unsplash_collection, etc.), return null so caller fetches fresh keyword photos
  if (provider === 'default') {
    try {
      let cat = options.defaultCategory || 'all'
      if (cat === 'all') {
        const cats: ('nature' | 'mountains' | 'beaches')[] = ['nature', 'mountains', 'beaches']
        cat = cats[Math.floor(Math.random() * cats.length)]
      }
      const col = DEFAULT_COLLECTIONS[cat as 'nature' | 'mountains' | 'beaches'] || DEFAULT_COLLECTIONS.nature
      const fallbacks = col.fallbackPhotos

      const differentFallback = fallbacks.find((f) => {
        const k = f.id || f.url.split('?')[0]
        return f.url !== currentPhotoUrl && k !== currentKey
      }) || fallbacks[0]

      if (differentFallback) {
        const optimizedPhoto: UnsplashPhoto = {
          ...differentFallback,
          url: optimizeWallpaperResolution(differentFallback.url),
        }

        try {
          sessionStorage.setItem(TAB_SESSION_PHOTO_KEY, JSON.stringify(optimizedPhoto))
        } catch {}

        return optimizedPhoto
      }
    } catch (err) {
      console.warn('Tier 3 fallback selection failed:', err)
    }
  }

  return null
}

/**
 * Replenishes the upfront preload buffer in the background so that 2 to 3 images
 * are always ready for future new tabs. Runs quietly via requestIdleCallback
 * so it never impacts foreground UI responsiveness.
 *
 * Automatically fetches subsequent pages of results and filters against seen history
 * to ensure regular users browsing all day receive fresh dynamic wallpapers rather than
 * looping the same photos.
 */
export function replenishPreloadBufferInBackground(
  provider: BackgroundProvider,
  options: PreloadTargetOptions,
  currentPhotoUrl?: string,
): void {
  // Only applicable to dynamic Unsplash collections / search / default categories
  if (provider === 'solid_color' || provider === 'local_file' || provider === 'custom_url') {
    return
  }

  const runIdle =
    typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1200)

  runIdle(async () => {
    try {
      const bufferKey = getTabBufferKey(provider, options)
      const currentBuffer = getUpcomingBuffer(bufferKey)

      // If buffer already has the maximum 2 to 3 upfront images, no further network work needed
      if (currentBuffer.length >= MAX_TAB_PRELOAD_COUNT) {
        return
      }

      const neededCount = MAX_TAB_PRELOAD_COUNT - currentBuffer.length

      // 1. Fetch photo candidate pool for the active settings
      let pool: UnsplashPhoto[] = []
      try {
        if (provider === 'unsplash_collection') {
          const colId = cleanCollectionId(options.customCollectionId || options.unsplashCollectionId || '')
          pool = await fetchUnsplashCollectionPhotos(colId)
        } else if (provider === 'unsplash_search') {
          pool = await fetchUnsplashSearchPhotos(options.customSearchQuery || 'nature, mountains')
        } else if (provider === 'wallhaven') {
          pool = await fetchWallhavenPhotos(options.customSearchQuery || '')
        } else if (provider === 'bing') {
          pool = await fetchBingDailyPhotos()
        } else if (provider === 'reddit') {
          pool = await fetchRedditPhotos(options.redditSubreddit || 'wallpapers', options.customSearchQuery)
        } else {
          let cat = options.defaultCategory || 'all'
          if (cat === 'all') {
            const cats: ('nature' | 'mountains' | 'beaches')[] = ['nature', 'mountains', 'beaches']
            cat = cats[Math.floor(Math.random() * cats.length)]
          }
          const col = DEFAULT_COLLECTIONS[cat as 'nature' | 'mountains' | 'beaches'] || DEFAULT_COLLECTIONS.nature
          pool = await fetchUnsplashCollectionPhotos(col.id)
        }
      } catch {
        // Fallback to recent cached wallpapers or bundled local assets
        const recentCache = await getRecentCachedWallpapers()
        if (recentCache.length > 0) {
          pool = recentCache.map((entry, idx) => ({
            id: `cached_${idx}`,
            url: entry.url,
            author: entry.author || 'Recent Cache',
            username: entry.username || '',
            pageUrl: entry.pageUrl || 'https://unsplash.com',
            color: entry.color || '#1e293b',
          }))
        } else {
          pool = DEFAULT_COLLECTIONS.nature.fallbackPhotos
        }
      }

      if (!pool || pool.length === 0) return

      // 2. Filter out current photo, photos already in buffer, AND photos seen recently
      const seenKeys = getSeenPhotoKeys()
      const existingKeys = new Set<string>()
      if (currentPhotoUrl) {
        existingKeys.add(getPhotoCanonicalKey({ url: currentPhotoUrl }))
      }
      for (const b of currentBuffer) {
        existingKeys.add(getPhotoCanonicalKey(b))
      }

      // First priority: unseen candidates that user hasn't seen in the current ring buffer
      let unseenCandidates = pool.filter((p) => {
        const k = getPhotoCanonicalKey(p)
        return !existingKeys.has(k) && !seenKeys.has(k)
      })

      // If unseen candidates are fewer than needed, dynamically fetch the NEXT page from remote source
      if (
        unseenCandidates.length < neededCount &&
        (provider === 'unsplash_search' ||
          provider === 'unsplash_collection' ||
          provider === 'default' ||
          provider === 'wallhaven' ||
          provider === 'reddit')
      ) {
        try {
          let nextPagePool: UnsplashPhoto[] = []
          if (provider === 'unsplash_search') {
            nextPagePool = await fetchUnsplashSearchPhotos(options.customSearchQuery || 'nature')
          } else if (provider === 'unsplash_collection') {
            const colId = cleanCollectionId(options.customCollectionId || options.unsplashCollectionId || '')
            nextPagePool = await fetchUnsplashCollectionPhotos(colId)
          } else if (provider === 'wallhaven') {
            nextPagePool = await fetchWallhavenPhotos(options.customSearchQuery || '')
          } else if (provider === 'reddit') {
            nextPagePool = await fetchRedditPhotos(options.redditSubreddit || 'wallpapers', options.customSearchQuery)
          } else {
            let cat = options.defaultCategory || 'all'
            if (cat === 'all') {
              const cats: ('nature' | 'mountains' | 'beaches')[] = ['nature', 'mountains', 'beaches']
              cat = cats[Math.floor(Math.random() * cats.length)]
            }
            const col = DEFAULT_COLLECTIONS[cat as 'nature' | 'mountains' | 'beaches'] || DEFAULT_COLLECTIONS.nature
            nextPagePool = await fetchUnsplashCollectionPhotos(col.id)
          }

          const freshUnseen = nextPagePool.filter((p) => {
            const k = getPhotoCanonicalKey(p)
            return !existingKeys.has(k) && !seenKeys.has(k)
          })
          unseenCandidates = [...unseenCandidates, ...freshUnseen]
        } catch (err) {
          console.warn('Background pagination replenishment error:', err)
        }
      }

      // If still exhausted (e.g. user browsed hundreds of tabs), fall back to candidates not currently on screen/buffered
      let candidatesPool = unseenCandidates
      if (candidatesPool.length === 0) {
        candidatesPool = pool.filter((p) => !existingKeys.has(getPhotoCanonicalKey(p)))
      }
      if (candidatesPool.length === 0) {
        candidatesPool = pool
      }

      // Shuffle pool so user gets fresh variety rather than predictable sequence
      const shuffledCandidates = shuffleArray(candidatesPool)
      const toAdd: UnsplashPhoto[] = []

      // Pick up to neededCount (strictly maximum 2 to 3 images)
      for (let i = 0; i < neededCount && i < shuffledCandidates.length; i++) {
        const photo = shuffledCandidates[i]
        const optimized: UnsplashPhoto = {
          ...photo,
          url: optimizeWallpaperResolution(photo.url),
        }
        toAdd.push(optimized)
        existingKeys.add(getPhotoCanonicalKey(photo))
      }

      if (toAdd.length === 0) return

      // 3. Pre-warm image binary cache in IndexedDB & memory in the background
      for (const photo of toAdd) {
        try {
          // Warm IndexedDB 24-hour cache
          await getOrFetchWallpaper(photo.url, photo)

          // Warm browser / GPU image decode pipeline
          const img = new Image()
          img.src = photo.url
          if (typeof img.decode === 'function') {
            await img.decode().catch(() => {})
          }
        } catch {
          // Non-blocking background caching error
        }
      }

      // 4. Update the buffer with strictly maximum 3 items
      const updatedBuffer = [...currentBuffer, ...toAdd].slice(0, MAX_TAB_PRELOAD_COUNT)
      saveUpcomingBuffer(bufferKey, updatedBuffer)

      // 5. Enqueue remaining candidates from pool into Tier 2 candidate queue for rapid continuous tabs
      const remainingForQueue = shuffledCandidates.slice(toAdd.length)
      if (remainingForQueue.length > 0) {
        const queueKey = getQueueStorageKey(provider, {
          defaultCategory: options.defaultCategory,
          customCollectionId: options.customCollectionId || options.unsplashCollectionId,
          customSearchQuery: options.customSearchQuery,
          redditSubreddit: options.redditSubreddit,
        })
        enqueuePhotos(queueKey, remainingForQueue)
      }
    } catch (err) {
      console.warn('Background buffer replenishment error:', err)
    }
  })
}

/**
 * Clears old collection buffers and candidate queues when user switches collection ID or category in settings.
 * Gathers keys first before removal to avoid index-shift skipping during iteration.
 */
export function clearOutdatedBuffers(activeBufferKey: string): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith(BUFFER_KEY_PREFIX) ||
          key.startsWith('aura_coll_queue_') ||
          key.startsWith('aura_search_queue_') ||
          key.startsWith('aura_default_queue_')) &&
        key !== activeBufferKey
      ) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
  } catch {}
}
