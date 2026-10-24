import type {
  UnsplashPhoto,
  WallpaperFrequency,
  DefaultCollectionCategory,
  BackgroundProvider,
} from '../types'
import { getRecentCachedWallpapers } from './wallpaperCache'
import {
  optimizeWallpaperResolution,
  getOptimizedScreenDimensions,
} from './imageOptimizer'

export { optimizeWallpaperResolution, getOptimizedScreenDimensions }

/**
 * 3 Default Hardcoded Collections for Nature, Mountains, and Beaches
 * Provides instant bundled local WebP wallpapers (<3MB package) and dynamic Unsplash collection IDs
 */
export const DEFAULT_COLLECTIONS = {
  nature: {
    id: '1065976',
    name: 'Nature',
    fallbackPhotos: [
      {
        id: 'nature_1',
        url: '/backgrounds/nature-1.webp',
        author: 'Lise Savard',
        username: 'rampallion',
        pageUrl: 'https://unsplash.com/photos/green-leafed-trees-near-mountain-tzbCLKHMj08',
        color: '#a6c0d9',
      },
      {
        id: 'nature_2',
        url: '/backgrounds/nature-2.webp',
        author: 'Anastasiya Romanova',
        username: 'nanichkar',
        pageUrl: 'https://unsplash.com/photos/trees-near-body-of-waer-aX7shhAOvp4',
        color: '#26260c',
      },
      {
        id: 'nature_remote',
        url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&crop=entropy&w=3840&h=2160&q=85',
        author: 'Luca Bravo',
        username: 'lucabravo',
        pageUrl: 'https://unsplash.com/photos/ESkw2ayO2As',
        color: '#1a242f',
      },
    ],
  },
  mountains: {
    id: '3330448',
    name: 'Mountains',
    fallbackPhotos: [
      {
        id: 'mountains_1',
        url: '/backgrounds/mountains-1.webp',
        author: 'Patrick Hendry',
        username: 'worldsbetweenlines',
        pageUrl: 'https://unsplash.com/photos/green-trees-and-mountains-during-daytime-X51lLnMIUmg',
        color: '#a6d9d9',
      },
      {
        id: 'mountains_2',
        url: '/backgrounds/mountains-2.webp',
        author: 'Etienne Bösiger',
        username: 'etienneboesiger',
        pageUrl: 'https://unsplash.com/photos/snow-coated-mountain-WTkUYzNCu-A',
        color: '#262626',
      },
      {
        id: 'mountains_remote',
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&crop=entropy&w=3840&h=2160&q=85',
        author: 'Kalen Emsley',
        username: 'kalenemsley',
        pageUrl: 'https://unsplash.com/photos/Bkci_8qcdvQ',
        color: '#26260c',
      },
    ],
  },
  beaches: {
    id: '175083',
    name: 'Beaches',
    fallbackPhotos: [
      {
        id: 'beaches_1',
        url: '/backgrounds/beaches-1.webp',
        author: 'Andrew Coelho',
        username: 'andrewcoelho',
        pageUrl: 'https://unsplash.com/photos/seashore-scenery-m6tAqZvy4RM',
        color: '#a6a6a6',
      },
      {
        id: 'beaches_2',
        url: '/backgrounds/beaches-2.webp',
        author: 'Ragnar Vorel',
        username: 'sonuba',
        pageUrl: 'https://unsplash.com/photos/yatch-dock-during-daytime-dTORmw497sM',
        color: '#c0c0c0',
      },
      {
        id: 'beaches_remote',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&crop=entropy&w=3840&h=2160&q=85',
        author: 'Sean Oulashin',
        username: 'oulashin',
        pageUrl: 'https://unsplash.com/photos/KMn4VEeEPR8',
        color: '#0c5973',
      },
    ],
  },
}

// Backward-compatibility alias
export const POPULAR_UNSPLASH_COLLECTIONS = [
  { id: DEFAULT_COLLECTIONS.nature.id, name: 'Nature', description: 'Serene forests, lakes & natural landscapes' },
  { id: DEFAULT_COLLECTIONS.mountains.id, name: 'Mountains', description: 'Towering peaks, ridges & alpine panoramas' },
  { id: DEFAULT_COLLECTIONS.beaches.id, name: 'Beaches', description: 'Tropical coastlines, turquoise lagoons & shores' },
]

/**
 * Sanitizes and extracts raw Unsplash collection ID(s)
 * Handles URLs like: https://unsplash.com/collections/1065976/nature-landscapes -> "1065976"
 * or https://unsplash.com/collections/9968899 -> "9968899"
 */
export function cleanCollectionId(input: string): string {
  if (!input) return ''
  const trimmed = input.trim()

  // Extract from full Unsplash collection URL
  if (trimmed.includes('unsplash.com/collections/')) {
    const match = trimmed.match(/collections\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return match[1]
    }
  }

  // Handle comma-separated list of IDs or plain ID
  return trimmed.replace(/[^a-zA-Z0-9,_ -]/g, '').trim()
}

/**
 * Extracts the Unsplash Photo ID from a full photo URL, slug, or ID string.
 * Example inputs:
 * - "https://unsplash.com/photos/woman-in-bikini-on-balcony-overlooking-coastal-town-1FmHtmCKPA8" -> "1FmHtmCKPA8"
 * - "https://unsplash.com/photos/1FmHtmCKPA8" -> "1FmHtmCKPA8"
 * - "woman-in-bikini-on-balcony-overlooking-coastal-town-1FmHtmCKPA8" -> "1FmHtmCKPA8"
 * - "1FmHtmCKPA8" -> "1FmHtmCKPA8"
 */
export function extractUnsplashPhotoId(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()

  // 1. Direct photo ID (e.g. "Wz6Qg8", "ESkw2ayO2As", "1FmHtmCKPA8")
  if (/^[a-zA-Z0-9_-]{5,32}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed
  }

  // 2. Extract from full URL or path (e.g. .../photos/title-slug-ID or .../photos/slug/ID)
  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const segments = urlObj.pathname.split('/').filter(Boolean)
    const photosIndex = segments.indexOf('photos')
    if (photosIndex !== -1 && segments.length > photosIndex + 1) {
      const lastSegment = segments[segments.length - 1]
      if (lastSegment.includes('-')) {
        const parts = lastSegment.split('-')
        const candidate = parts[parts.length - 1]
        if (candidate && /^[a-zA-Z0-9_]{5,32}$/.test(candidate)) {
          return candidate
        }
      }
      if (/^[a-zA-Z0-9_-]{5,32}$/.test(lastSegment)) {
        return lastSegment
      }
    }
  } catch {}

  const match = trimmed.match(/unsplash\.com\/photos\/(?:[^/?#]+\/)?([a-zA-Z0-9_-]{5,32})/i)
  if (match && match[1]) {
    return match[1]
  }

  return null
}

/**
 * Normalizes user-entered image URLs:
 * 1. Trims whitespace and strips surrounding quotes.
 * 2. If the user pasted an Unsplash photo page URL:
 *    extracts the photo ID and returns the direct high-res download URL
 * 3. Otherwise, returns the URL as-is.
 */
export function normalizeCustomImageUrl(rawUrl: string): string {
  if (!rawUrl) return ''
  let trimmed = rawUrl.trim()

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim()
  }

  if (trimmed.includes('unsplash.com/photos/')) {
    const photoId = extractUnsplashPhotoId(trimmed)
    if (photoId) {
      const { width, height } = getOptimizedScreenDimensions()
      return `https://unsplash.com/photos/${photoId}/download?w=${width}&h=${height}`
    }
  }

  return trimmed
}

/**
 * Resolves an Unsplash photo webpage URL directly to the high-res download URL.
 */
export async function resolveUnsplashPageToImageUrl(urlOrSlug: string): Promise<string | null> {
  try {
    const photoId = extractUnsplashPhotoId(urlOrSlug)
    if (photoId) {
      const { width, height } = getOptimizedScreenDimensions()
      return `https://unsplash.com/photos/${photoId}/download?w=${width}&h=${height}`
    }
  } catch {}
  return null
}

/**
 * Returns a stable storage key for the collection rotation queue
 */
export function getQueueStorageKey(
  provider: BackgroundProvider,
  config: {
    defaultCategory?: DefaultCollectionCategory
    customCollectionId?: string
    unsplashCollectionId?: string
    customSearchQuery?: string
    redditSubreddit?: string
  }
): string {
  if (provider === 'unsplash_collection') {
    const id = cleanCollectionId(config.customCollectionId || config.unsplashCollectionId || '') || DEFAULT_COLLECTIONS.nature.id
    return `aura_coll_queue_${id}`
  }
  if (provider === 'unsplash_search') {
    const q = (config.customSearchQuery || 'nature').trim().toLowerCase()
    return `aura_search_queue_${encodeURIComponent(q)}`
  }
  if (provider === 'wallhaven') {
    const q = (config.customSearchQuery || 'random').trim().toLowerCase()
    return `aura_wh_queue_${encodeURIComponent(q)}`
  }
  if (provider === 'bing') {
    return 'aura_bing_queue_v1'
  }
  if (provider === 'reddit') {
    const sub = (config.redditSubreddit || 'wallpapers').trim().toLowerCase()
    const q = (config.customSearchQuery || '').trim().toLowerCase()
    return `aura_reddit_queue_${sub}_${encodeURIComponent(q)}`
  }
  return `aura_default_queue_${config.defaultCategory || 'all'}`
}

/**
 * Pops the next photo from the persistent queue for "Every new tab" rotation
 */
export function popNextPhotoFromQueue(queueKey: string): UnsplashPhoto | null {
  try {
    const raw = localStorage.getItem(queueKey)
    if (!raw) return null
    const list: UnsplashPhoto[] = JSON.parse(raw)
    if (Array.isArray(list) && list.length > 0) {
      const next = list[0]
      const remaining = list.slice(1)
      localStorage.setItem(queueKey, JSON.stringify(remaining))
      return next
    }
  } catch {}
  return null
}

/**
 * Sets or appends photos to the persistent rotation queue
 */
export function enqueuePhotos(queueKey: string, photos: UnsplashPhoto[]): void {
  try {
    const raw = localStorage.getItem(queueKey)
    let list: UnsplashPhoto[] = []
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) list = parsed
      } catch {}
    }
    // Append unique photos
    const existingUrls = new Set(list.map((p) => p.url))
    for (const p of photos) {
      if (!existingUrls.has(p.url)) {
        list.push(p)
        existingUrls.add(p.url)
      }
    }
    localStorage.setItem(queueKey, JSON.stringify(list))
  } catch {}
}

/**
 * Clears the queue when user changes collection or query
 */
export function clearCollectionQueue(queueKey: string): void {
  try {
    localStorage.removeItem(queueKey)
  } catch {}
}

/**
 * Determines solar/daylight period like Bonjourr
 */
function getDaylightPeriod(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/**
 * Verifies if the wallpaper should change according to the user's selected frequency
 */
export function needsWallpaperChange(frequency: WallpaperFrequency, lastChangeTimestamp?: number): boolean {
  if (frequency === 'locked') {
    return !lastChangeTimestamp
  }

  if (frequency === 'tabs') {
    return true
  }

  if (!lastChangeTimestamp) {
    return true
  }

  const now = Date.now()
  const elapsed = now - lastChangeTimestamp

  switch (frequency) {
    case 'hour':
      // At least 1 full hour (60 minutes / 3,600,000 ms) must have elapsed
      return elapsed >= 60 * 60 * 1000
    case 'day':
      // At least 24 hours must have elapsed or calendar date changed after significant elapsed time
      return elapsed >= 24 * 60 * 60 * 1000 || (elapsed >= 12 * 60 * 60 * 1000 && new Date().toDateString() !== new Date(lastChangeTimestamp).toDateString())
    case 'period':
      return elapsed >= 4 * 60 * 60 * 1000 || getDaylightPeriod(new Date()) !== getDaylightPeriod(new Date(lastChangeTimestamp))
    default:
      return false
  }
}



const SEEN_PHOTOS_STORAGE_KEY = 'aura_seen_photos_ring_v1'
const MAX_SEEN_RING_SIZE = 150

/**
 * Returns a Set of canonical IDs / clean URLs for photos already displayed to the user
 */
export function getSeenPhotoKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_PHOTOS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return new Set(parsed)
    }
  } catch {}
  return new Set()
}

/**
 * Marks a photo as seen so the anti-looping engine avoids re-showing it until the ring buffer wraps
 */
export function markPhotoAsSeen(photo: UnsplashPhoto | { id?: string; url: string }): void {
  if (!photo) return
  const key = photo.id && !photo.id.startsWith('http') ? photo.id : photo.url.split('?')[0]
  if (!key) return

  try {
    const raw = localStorage.getItem(SEEN_PHOTOS_STORAGE_KEY)
    let list: string[] = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) list = []
    list = list.filter((item) => item !== key)
    list.push(key)
    if (list.length > MAX_SEEN_RING_SIZE) {
      list = list.slice(list.length - MAX_SEEN_RING_SIZE)
    }
    localStorage.setItem(SEEN_PHOTOS_STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

/**
 * Gets and advances the pagination page cursor for a search query or collection
 */
export function getNextPageCursor(prefix: string, identifier: string, maxPages: number = 15): number {
  const key = `aura_page_cursor_${prefix}_${identifier}`
  try {
    const current = parseInt(localStorage.getItem(key) || '1', 10)
    const validCurrent = isNaN(current) || current < 1 ? 1 : current
    const next = (validCurrent % maxPages) + 1
    localStorage.setItem(key, next.toString())
    return validCurrent
  } catch {
    return 1
  }
}

interface UnsplashApiProxyItem {
  id?: string
  page?: string
  download?: string
  name?: string
  username?: string
  color?: string
  urls?: {
    full?: string
    regular?: string
    medium?: string
    small?: string
    thumb?: string
  }
}

/**
 * Fetches dynamic photos from an Unsplash collection across pages
 */
export async function fetchUnsplashCollectionPhotos(
  rawCollectionId: string,
  page?: number,
): Promise<UnsplashPhoto[]> {
  const cleanId = cleanCollectionId(rawCollectionId) || DEFAULT_COLLECTIONS.nature.id
  const targetPage = page !== undefined ? page : getNextPageCursor('coll', cleanId, 10)

  try {
    const { width, height } = getOptimizedScreenDimensions()
    const url = `https://services.bonjourr.fr/backgrounds/unsplash/images/collections?query=${encodeURIComponent(cleanId)}&page=${targetPage}&w=${width}&h=${height}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)

    const data = await res.json()
    const rawList = data['unsplash-images-collections'] || []

    if (Array.isArray(rawList) && rawList.length > 0) {
      const photos: UnsplashPhoto[] = rawList.map((item: UnsplashApiProxyItem) => {
        const rawPhotoUrl =
          item.urls?.full ||
          item.urls?.regular ||
          item.urls?.medium ||
          item.download ||
          ''
        return {
          id: item.page || item.download || Math.random().toString(),
          url: optimizeWallpaperResolution(rawPhotoUrl, width, height),
          author: item.name || item.username || 'Unsplash Contributor',
          username: item.username,
          pageUrl: item.page,
          color: item.color || '#090a0f',
        }
      })

      return photos
    }
  } catch (err) {
    console.warn(`Failed to fetch Unsplash collection photos for page ${targetPage}:`, err)
    throw err
  }

  throw new Error(`No photos found for collection ${cleanId} on page ${targetPage}`)
}

/**
 * Fetches dynamic photos via Unsplash keyword search across pages (e.g. "bikini", "nature")
 */
export async function fetchUnsplashSearchPhotos(
  query: string,
  page?: number,
): Promise<UnsplashPhoto[]> {
  const cleanQuery = query.trim() || 'nature'
  const targetPage = page !== undefined ? page : getNextPageCursor('search', cleanQuery, 15)

  try {
    const { width, height } = getOptimizedScreenDimensions()
    const url = `https://services.bonjourr.fr/backgrounds/unsplash/images/search?query=${encodeURIComponent(cleanQuery)}&page=${targetPage}&w=${width}&h=${height}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)

    const data = await res.json()
    const rawList = data['unsplash-images-search'] || []

    if (Array.isArray(rawList) && rawList.length > 0) {
      const photos: UnsplashPhoto[] = rawList.map((item: UnsplashApiProxyItem) => {
        const rawPhotoUrl =
          item.urls?.full ||
          item.urls?.regular ||
          item.urls?.medium ||
          item.download ||
          ''
        return {
          id: item.page,
          url: optimizeWallpaperResolution(rawPhotoUrl, width, height),
          author: item.name || item.username || 'Unsplash Contributor',
          username: item.username,
          pageUrl: item.page,
          color: item.color || '#090a0f',
        }
      })

      return photos
    }
  } catch (err) {
    console.warn(`Failed to fetch Unsplash search photos for page ${targetPage}:`, err)
  }

  return DEFAULT_COLLECTIONS.mountains.fallbackPhotos
}

interface WallhavenApiItem {
  id: string
  url: string
  short_url?: string
  path: string
  colors?: string[]
  uploader?: {
    username?: string
  }
}

/**
 * Fetches dynamic high-resolution wallpapers from Wallhaven (Open API, no key required)
 */
export async function fetchWallhavenPhotos(
  query: string = '',
  page?: number,
): Promise<UnsplashPhoto[]> {
  const cleanQuery = query.trim()
  const targetPage = page !== undefined ? page : getNextPageCursor('wh', cleanQuery || 'random', 15)

  try {
    const qParam = cleanQuery ? `&q=${encodeURIComponent(cleanQuery)}` : ''
    // SFW only (purity=100), categories 110 (General + Anime), desktop resolutions
    const url = `https://wallhaven.cc/api/v1/search?sorting=random&categories=110&purity=100&resolutions=1920x1080,2560x1440,3840x2160${qParam}&page=${targetPage}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Wallhaven HTTP error ${res.status}`)

    const data = await res.json()
    const rawList: WallhavenApiItem[] = data.data || []

    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((item) => ({
        id: `wh_${item.id}`,
        url: item.path,
        author: item.uploader?.username ? `Uploaded by ${item.uploader.username}` : 'Wallhaven',
        username: item.uploader?.username || 'wallhaven',
        pageUrl: item.url || item.short_url || 'https://wallhaven.cc',
        color: item.colors?.[0] || '#0f172a',
      }))
    }
  } catch (err) {
    console.warn(`Failed to fetch Wallhaven wallpapers for page ${targetPage}:`, err)
    throw err
  }

  throw new Error(`No wallpapers found on Wallhaven for page ${targetPage}`)
}

interface BingApiArchiveItem {
  url: string
  urlbase?: string
  copyright?: string
  copyrightlink?: string
  title?: string
}

/**
 * Fetches the official Microsoft Bing Daily Wallpapers (No API key required)
 */
export async function fetchBingDailyPhotos(): Promise<UnsplashPhoto[]> {
  try {
    const url = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=en-US'
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      const list: BingApiArchiveItem[] = data.images || []
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item, idx) => {
          const rawUrl = item.url.startsWith('http') ? item.url : `https://www.bing.com${item.url}`
          const highResUrl = rawUrl.replace('1920x1080', 'UHD')
          return {
            id: `bing_${item.urlbase || idx}`,
            url: highResUrl,
            author: item.copyright || item.title || 'Microsoft Bing',
            username: 'bing',
            pageUrl: item.copyrightlink || 'https://www.bing.com',
            color: '#1e293b',
          }
        })
      }
    }
  } catch (err) {
    console.warn('Bing direct fetch error, trying open mirror:', err)
  }

  // Fallback to open CORS mirror
  try {
    const mirrorRes = await fetch('https://bing.biturl.top/?resolution=3840&format=json&index=0&mkt=en-US')
    if (mirrorRes.ok) {
      const mirrorData = await mirrorRes.json()
      if (mirrorData.url) {
        return [{
          id: 'bing_mirror_today',
          url: mirrorData.url,
          author: mirrorData.copyright || 'Microsoft Bing',
          username: 'bing',
          pageUrl: mirrorData.copyright_link || 'https://www.bing.com',
          color: '#1e293b',
        }]
      }
    }
  } catch (err) {
    console.warn('Bing mirror fetch error:', err)
  }

  throw new Error('Failed to fetch Bing daily photos from both direct and mirror sources')
}

interface RedditPostItem {
  id: string
  title: string
  author: string
  permalink: string
  url: string
  url_overridden_by_dest?: string
  is_video?: boolean
  over_18?: boolean
}

/**
 * Fetches high-resolution community wallpapers from Reddit (Open JSON, no API key required)
 */
export async function fetchRedditPhotos(
  subreddit: string = 'wallpapers',
  query?: string,
): Promise<UnsplashPhoto[]> {
  const cleanSub = subreddit.trim().replace(/^r\//i, '').replace(/[^a-zA-Z0-9_]/g, '') || 'wallpapers'
  const cleanQ = (query || '').trim()

  try {
    let url: string
    if (cleanQ) {
      url = `https://www.reddit.com/r/${cleanSub}/search.json?q=${encodeURIComponent(cleanQ)}&restrict_sr=1&sort=top&t=all&limit=25`
    } else {
      url = `https://www.reddit.com/r/${cleanSub}/hot.json?limit=25`
    }

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Reddit HTTP error ${res.status}`)

    const data = await res.json()
    const children: { data: RedditPostItem }[] = data?.data?.children || []
    const validPhotos: UnsplashPhoto[] = []

    for (const child of children) {
      const p = child?.data
      if (!p || p.is_video || p.over_18) continue

      const rawUrl = (p.url_overridden_by_dest || p.url || '').replace(/&amp;/g, '&')
      const isDirectImage = /\.(jpe?g|png|webp)($|\?)/i.test(rawUrl) || rawUrl.includes('i.redd.it')

      if (isDirectImage) {
        validPhotos.push({
          id: `reddit_${p.id}`,
          url: rawUrl,
          author: `${p.title} (u/${p.author})`,
          username: p.author,
          pageUrl: `https://www.reddit.com${p.permalink}`,
          color: '#0f172a',
        })
      }
    }

    if (validPhotos.length > 0) {
      return validPhotos
    }
  } catch (err) {
    console.warn(`Failed to fetch Reddit wallpapers from r/${cleanSub}:`, err)
    throw err
  }

  throw new Error(`No direct wallpaper images found in r/${cleanSub}`)
}


/**
 * Resolves the next photo for the selected provider with persistent queue support
 */
export async function getNextPhotoForProvider(params: {
  provider: BackgroundProvider
  defaultCategory?: DefaultCollectionCategory
  customCollectionId?: string
  customSearchQuery?: string
  redditSubreddit?: string
  customBackgroundUrl?: string
  localImageDataUrl?: string
  currentPhotoUrl?: string
  forceRefresh?: boolean
}): Promise<UnsplashPhoto> {
  const {
    provider,
    defaultCategory = 'all',
    customCollectionId = '',
    customSearchQuery = '',
    redditSubreddit = 'wallpapers',
    customBackgroundUrl,
    localImageDataUrl,
    currentPhotoUrl,
    forceRefresh,
  } = params

  if (provider === 'custom_url') {
    const raw = (customBackgroundUrl || '').trim()
    const targetUrl = raw ? optimizeWallpaperResolution(normalizeCustomImageUrl(raw)) : DEFAULT_COLLECTIONS.nature.fallbackPhotos[0].url
    return {
      id: 'custom_url',
      url: targetUrl,
      author: 'Custom Image',
      username: '',
      pageUrl: '',
      color: '#0f172a',
    }
  }

  if (provider === 'local_file') {
    const targetUrl = localImageDataUrl || DEFAULT_COLLECTIONS.nature.fallbackPhotos[0].url
    return {
      id: 'local_file',
      url: targetUrl,
      author: 'Local Device',
      username: '',
      pageUrl: '',
      color: '#0f172a',
    }
  }

  const queueKey = getQueueStorageKey(provider, { defaultCategory, customCollectionId, customSearchQuery, redditSubreddit })

  // 1. If not forcing a refresh, pop the next photo from the queue for instant rotation
  if (!forceRefresh) {
    const queued = popNextPhotoFromQueue(queueKey)
    if (queued && queued.url && queued.url !== currentPhotoUrl) {
      return queued
    }
  }

  let pool: UnsplashPhoto[] = []

  if (provider === 'default') {
    // Pick from hardcoded default collections: Nature, Mountains, Beaches
    let selectedCat = defaultCategory
    if (selectedCat === 'all') {
      const keys: ('nature' | 'mountains' | 'beaches')[] = ['nature', 'mountains', 'beaches']
      selectedCat = keys[Math.floor(Math.random() * keys.length)]
    }

    const col = DEFAULT_COLLECTIONS[selectedCat as 'nature' | 'mountains' | 'beaches'] || DEFAULT_COLLECTIONS.nature
    try {
      pool = await fetchUnsplashCollectionPhotos(col.id)
    } catch {
      // 1. Intelligent network fault recovery: check most recent cached wallpapers
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
        // 2. Multi-day offline fallback: bundled local WebP images
        pool = col.fallbackPhotos
      }
    }
  } else if (provider === 'unsplash_collection') {
    const targetCollectionId = cleanCollectionId(customCollectionId) || DEFAULT_COLLECTIONS.nature.id
    try {
      pool = await fetchUnsplashCollectionPhotos(targetCollectionId)
    } catch {
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
  } else if (provider === 'unsplash_search') {
    try {
      pool = await fetchUnsplashSearchPhotos(customSearchQuery || 'nature, mountains')
    } catch {
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
        pool = DEFAULT_COLLECTIONS.mountains.fallbackPhotos
      }
    }
  } else if (provider === 'wallhaven') {
    try {
      pool = await fetchWallhavenPhotos(customSearchQuery || '')
    } catch {
      const recentCache = await getRecentCachedWallpapers()
      if (recentCache.length > 0) {
        pool = recentCache.map((entry, idx) => ({
          id: `cached_${idx}`,
          url: entry.url,
          author: entry.author || 'Recent Cache',
          username: entry.username || '',
          pageUrl: entry.pageUrl || 'https://wallhaven.cc',
          color: entry.color || '#1e293b',
        }))
      } else {
        pool = DEFAULT_COLLECTIONS.nature.fallbackPhotos
      }
    }
  } else if (provider === 'bing') {
    try {
      pool = await fetchBingDailyPhotos()
    } catch {
      const recentCache = await getRecentCachedWallpapers()
      if (recentCache.length > 0) {
        pool = recentCache.map((entry, idx) => ({
          id: `cached_${idx}`,
          url: entry.url,
          author: entry.author || 'Recent Cache',
          username: entry.username || '',
          pageUrl: entry.pageUrl || 'https://www.bing.com',
          color: entry.color || '#1e293b',
        }))
      } else {
        pool = DEFAULT_COLLECTIONS.nature.fallbackPhotos
      }
    }
  } else if (provider === 'reddit') {
    try {
      pool = await fetchRedditPhotos(redditSubreddit || 'wallpapers', customSearchQuery)
    } catch {
      const recentCache = await getRecentCachedWallpapers()
      if (recentCache.length > 0) {
        pool = recentCache.map((entry, idx) => ({
          id: `cached_${idx}`,
          url: entry.url,
          author: entry.author || 'Recent Cache',
          username: entry.username || '',
          pageUrl: entry.pageUrl || 'https://reddit.com',
          color: entry.color || '#1e293b',
        }))
      } else {
        pool = DEFAULT_COLLECTIONS.mountains.fallbackPhotos
      }
    }
  }

  if (!pool.length) {
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

  const seenKeys = getSeenPhotoKeys()
  const currentKey = currentPhotoUrl ? currentPhotoUrl.split('?')[0] : ''
  const unseenPool = pool.filter((p) => {
    const k = p.id && !p.id.startsWith('http') ? p.id : p.url.split('?')[0]
    return p.url !== currentPhotoUrl && k !== currentKey && !seenKeys.has(k)
  })

  const candidates = unseenPool.length > 0 ? unseenPool : pool.filter((p) => {
    const k = p.id && !p.id.startsWith('http') ? p.id : p.url.split('?')[0]
    return p.url !== currentPhotoUrl && k !== currentKey
  })
  const finalPool = candidates.length > 0 ? candidates : pool
  const randomIndex = Math.floor(Math.random() * finalPool.length)
  const chosen = finalPool[randomIndex]

  // Mark photo as seen in the global ring buffer
  markPhotoAsSeen(chosen)

  // Enqueue remaining photos into the rotation queue so subsequent new tabs get instant rotation
  const remaining = pool.filter((p) => p.url !== chosen.url)
  if (remaining.length > 0) {
    enqueuePhotos(queueKey, remaining)
  }

  return chosen
}

// Backward-compatibility helper
export async function getNextUnsplashPhoto(
  rawCollectionId: string,
  currentPhotoUrl?: string,
): Promise<UnsplashPhoto> {
  return getNextPhotoForProvider({
    provider: 'unsplash_collection',
    defaultCategory: 'all',
    customCollectionId: rawCollectionId,
    customSearchQuery: '',
    currentPhotoUrl,
  })
}
