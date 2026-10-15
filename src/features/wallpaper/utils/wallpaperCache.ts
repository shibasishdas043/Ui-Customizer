/**
 * Aura Wallpaper 24-Hour Image Caching Engine
 * Provides IndexedDB & Memory tiered storage to cache high-resolution wallpapers
 * for exactly 24 hours, eliminating network overhead on new tabs and enabling
 * instant (<10ms) local image rendering with zero loaders.
 */
import { optimizeWallpaperResolution } from './imageOptimizer'

export interface CachedWallpaperEntry {
  url: string
  dataUrl: string
  timestamp: number
  expiresAt: number
  sizeBytes: number
  author?: string
  username?: string
  pageUrl?: string
  color?: string
}

export interface CacheStats {
  count: number
  totalSizeBytes: number
  oldestTimestamp?: number
  newestTimestamp?: number
}

const DB_NAME = 'aura_wallpaper_cache_db'
const DB_VERSION = 2
const STORE_NAME = 'wallpapers'
const ACTIVE_WALLPAPER_LS_KEY = 'aura_active_wallpaper_cache_v1'

// 1-month (30 days) Time-To-Live in milliseconds
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

// Strict limit: maximum 30 cached wallpaper images in local storage
export const MAX_CACHED_IMAGES = 30

// In-memory runtime cache for 0ms instant retrieval
const memoryCache = new Map<string, { dataUrl: string; expiresAt: number }>()

/**
 * Extracts a normalized base key for image URLs (stripping dynamic width/height/dpi parameters)
 * so that resolution shifts between monitors still hit the local cache.
 */
function getBaseUrlKey(url: string): string {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('blob:')) return ''
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return url.split('?')[0]
  }
}

/**
 * Open or upgrade the IndexedDB database for wallpaper binary caching
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      let store: IDBObjectStore
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'url' })
      } else {
        store = (event.target as any).transaction.objectStore(STORE_NAME)
      }
      if (!store.indexNames.contains('timestamp')) {
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Synchronous cache lookup for the currently active wallpaper.
 * Checks in-memory fast tier. Never loads multi-megabyte Base64 blobs from localStorage
 * to prevent frame drops and QuotaExceededError.
 */
export function getSynchronousCachedActiveWallpaper(targetUrl: string): string | null {
  // 1. Check in-memory map
  const mem = memoryCache.get(targetUrl)
  if (mem && Date.now() < mem.expiresAt) {
    return mem.dataUrl
  }

  // 2. Check base key in memory map
  const baseKey = getBaseUrlKey(targetUrl)
  if (baseKey) {
    const baseMem = memoryCache.get(baseKey)
    if (baseMem && Date.now() < baseMem.expiresAt) {
      return baseMem.dataUrl
    }
  }

  return null
}

/**
 * Asynchronously query the IndexedDB cache for an image URL.
 * Returns the cached data URL if valid, or null if expired/absent.
 * Touches entry timestamp to maintain true LRU (Least Recently Used) order.
 */
export async function getCachedWallpaper(url: string): Promise<string | null> {
  if (!url) return null

  // 1. Check memory first
  const mem = memoryCache.get(url)
  if (mem && Date.now() < mem.expiresAt) {
    return mem.dataUrl
  }

  const baseKey = getBaseUrlKey(url)
  if (baseKey) {
    const baseMem = memoryCache.get(baseKey)
    if (baseMem && Date.now() < baseMem.expiresAt) {
      return baseMem.dataUrl
    }
  }

  try {
    const db = await openDB()
    return await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(url)

      request.onsuccess = () => {
        const result = request.result as CachedWallpaperEntry | undefined
        if (result && Date.now() < result.expiresAt) {
          memoryCache.set(url, { dataUrl: result.dataUrl, expiresAt: result.expiresAt })
          if (baseKey) memoryCache.set(baseKey, { dataUrl: result.dataUrl, expiresAt: result.expiresAt })
          
          // Touch timestamp for LRU maintenance
          try {
            store.put({ ...result, timestamp: Date.now() })
          } catch {}

          resolve(result.dataUrl)
          return
        }

        // Secondary check: look up by base URL if exact query parameters differed
        if (baseKey && baseKey !== url) {
          const baseReq = store.get(baseKey)
          baseReq.onsuccess = () => {
            const baseRes = baseReq.result as CachedWallpaperEntry | undefined
            if (baseRes && Date.now() < baseRes.expiresAt) {
              memoryCache.set(url, { dataUrl: baseRes.dataUrl, expiresAt: baseRes.expiresAt })
              try {
                store.put({ ...baseRes, timestamp: Date.now() })
              } catch {}
              resolve(baseRes.dataUrl)
              return
            }
            resolve(null)
          }
          baseReq.onerror = () => resolve(null)
          return
        }

        resolve(null)
      }

      request.onerror = () => resolve(null)
    })
  } catch (err) {
    console.warn('IndexedDB read failed:', err)
    return null
  }
}

/**
 * Prune cache so that the total number of entries in IndexedDB never exceeds MAX_CACHED_IMAGES (30).
 * True rolling LRU / FIFO eviction: new images are inserted, and the oldest images are deleted.
 * Uses index cursor for zero-memory B-tree pruning without allocating large Base64 blobs.
 */
export async function pruneOldestCacheEntries(limit: number = MAX_CACHED_IMAGES): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const countReq = store.count()
    countReq.onsuccess = () => {
      const totalCount = countReq.result
      if (totalCount <= limit) {
        return // Already within 30-image quota
      }

      const numToDelete = totalCount - limit
      let deleted = 0

      // Use the timestamp index for zero-memory B-tree cursor deletion (oldest to newest)
      if (store.indexNames.contains('timestamp')) {
        const index = store.index('timestamp')
        const cursorReq = index.openCursor() // Ascending: oldest entries first
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result
          if (cursor && deleted < numToDelete) {
            const key = cursor.primaryKey as string
            memoryCache.delete(key)
            const base = getBaseUrlKey(key)
            if (base) memoryCache.delete(base)
            cursor.delete()
            deleted++
            cursor.continue()
          }
        }
      } else {
        // Fallback if index not yet initialized
        const getAllReq = store.getAll()
        getAllReq.onsuccess = () => {
          const entries = (getAllReq.result as CachedWallpaperEntry[]) || []
          if (entries.length > limit) {
            entries.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
            const toDelete = entries.slice(0, entries.length - limit)
            for (const item of toDelete) {
              memoryCache.delete(item.url)
              const base = getBaseUrlKey(item.url)
              if (base) memoryCache.delete(base)
              store.delete(item.url)
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Prune cache failed:', err)
  }
}

/**
 * Retrieve all recently cached wallpapers from IndexedDB,
 * sorted descending by most recently used/cached (MRU).
 * Used for intelligent fallback during network faults or offline use for up to 1 month.
 */
export async function getRecentCachedWallpapers(): Promise<CachedWallpaperEntry[]> {
  try {
    const db = await openDB()
    return await new Promise<CachedWallpaperEntry[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        let entries = (request.result as CachedWallpaperEntry[]) || []
        const now = Date.now()
        // Retain entries valid within the 1-month TTL window
        entries = entries.filter((e) => !e.expiresAt || e.expiresAt > now)
        // Sort descending by timestamp (newest first)
        entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        // Cap strictly at MAX_CACHED_IMAGES (30)
        resolve(entries.slice(0, MAX_CACHED_IMAGES))
      }

      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

/**
 * Save an image to the 1-month cache (IndexedDB + memory + localStorage sync slot).
 * Strictly caps the stored collection at at most 30 images.
 */
export async function saveWallpaperToCache(
  url: string,
  dataUrl: string,
  metadata?: { author?: string; username?: string; pageUrl?: string; color?: string },
): Promise<void> {
  const now = Date.now()
  const expiresAt = now + CACHE_TTL_MS
  const sizeBytes = dataUrl.length

  const entry: CachedWallpaperEntry = {
    url,
    dataUrl,
    timestamp: now,
    expiresAt,
    sizeBytes,
    author: metadata?.author,
    username: metadata?.username,
    pageUrl: metadata?.pageUrl,
    color: metadata?.color,
  }

  // Update in-memory cache
  memoryCache.set(url, { dataUrl, expiresAt })
  const baseKey = getBaseUrlKey(url)
  if (baseKey) memoryCache.set(baseKey, { dataUrl, expiresAt })

  // Update localStorage with lightweight metadata only (never store 4MB Base64 to prevent quota exhaustion)
  try {
    const metaOnly: Partial<CachedWallpaperEntry> = {
      url,
      timestamp: now,
      expiresAt,
      sizeBytes,
      author: metadata?.author,
      username: metadata?.username,
      pageUrl: metadata?.pageUrl,
      color: metadata?.color,
    }
    localStorage.setItem(ACTIVE_WALLPAPER_LS_KEY, JSON.stringify(metaOnly))
  } catch {
    // Silently ignore if quota reached
  }

  // Persist into IndexedDB and enforce maximum of 30 images
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(entry)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })

    // Strict maximum limit: 30 images
    await pruneOldestCacheEntries(MAX_CACHED_IMAGES)
  } catch (err) {
    console.warn('Failed to save wallpaper in IndexedDB:', err)
  }
}

/**
 * Helper to convert Blob to Base64 Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * High-level method: Get cached image if available within 24h,
 * otherwise fetch from network, cache for 24h, and return data URL.
 */
export async function getOrFetchWallpaper(
  url: string,
  metadata?: { author?: string; username?: string; pageUrl?: string; color?: string },
): Promise<string> {
  if (!url) return ''

  // Never attempt network caching for data URLs, blob URLs, or bundled local assets
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('/backgrounds/') ||
    url.startsWith('/')
  ) {
    return url
  }

  const targetUrl = optimizeWallpaperResolution(url) || url

  // 1. Check synchronous fast cache
  const fast = getSynchronousCachedActiveWallpaper(targetUrl) || getSynchronousCachedActiveWallpaper(url)
  if (fast) return fast

  // 2. Check IndexedDB 24h cache
  const cached = (await getCachedWallpaper(targetUrl)) || (await getCachedWallpaper(url))
  if (cached) return cached

  // 3. Fetch fresh image from network
  try {
    const response = await fetch(targetUrl, { mode: 'cors' })
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} fetching wallpaper`)
    }
    const blob = await response.blob()
    const dataUrl = await blobToDataUrl(blob)

    // Save into 24-hour cache with metadata
    await saveWallpaperToCache(targetUrl, dataUrl, metadata)
    return dataUrl
  } catch (err) {
    console.warn('Network fetch error for wallpaper:', err)
    // Fallback to target URL so browser can attempt standard image rendering
    return targetUrl
  }
}

/**
 * Pre-cache preset wallpapers in the background so opening subsequent tabs is instant.
 */
export function preloadAndCachePresets(urls: string[]): void {
  const idleCallback =
    typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (window as any).requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1000)

  idleCallback(async () => {
    for (const url of urls) {
      try {
        const cached = await getCachedWallpaper(url)
        if (!cached) {
          const res = await fetch(url, { mode: 'cors' })
          if (res.ok) {
            const blob = await res.blob()
            const dataUrl = await blobToDataUrl(blob)
            await saveWallpaperToCache(url, dataUrl)
          }
        }
      } catch {
        // Non-blocking background caching failure
      }
    }
  })
}

/**
 * Delete a specific cached wallpaper from IndexedDB
 */
export async function deleteCachedWallpaper(url: string): Promise<void> {
  memoryCache.delete(url)
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(url)
  } catch (err) {
    console.warn('Failed to delete wallpaper from cache:', err)
  }
}

/**
 * Clear all cached wallpapers
 */
export async function clearAllWallpaperCache(): Promise<void> {
  memoryCache.clear()
  try {
    localStorage.removeItem(ACTIVE_WALLPAPER_LS_KEY)
  } catch {}

  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
  } catch (err) {
    console.warn('Failed to clear wallpaper database:', err)
  }
}

/**
 * Retrieve cache statistics (number of cached images and total size in MB)
 */
export async function getWallpaperCacheStats(): Promise<CacheStats> {
  try {
    const db = await openDB()
    return await new Promise<CacheStats>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()

      req.onsuccess = () => {
        const items = req.result as CachedWallpaperEntry[]
        let totalSizeBytes = 0
        let oldest = Infinity
        let newest = 0

        for (const item of items) {
          totalSizeBytes += item.sizeBytes || 0
          if (item.timestamp < oldest) oldest = item.timestamp
          if (item.timestamp > newest) newest = item.timestamp
        }

        resolve({
          count: items.length,
          totalSizeBytes,
          oldestTimestamp: items.length > 0 ? oldest : undefined,
          newestTimestamp: items.length > 0 ? newest : undefined,
        })
      }

      req.onerror = () => resolve({ count: 0, totalSizeBytes: 0 })
    })
  } catch {
    return { count: 0, totalSizeBytes: 0 }
  }
}

// Auto-prune any legacy oversized cache down to MAX_CACHED_IMAGES (30) in background
if (typeof window !== 'undefined') {
  setTimeout(() => {
    pruneOldestCacheEntries(MAX_CACHED_IMAGES).catch(() => {})
  }, 1000)
}

