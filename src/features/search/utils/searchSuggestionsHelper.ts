/**
 * Search Engine Auto-Suggestions Service
 * Fetches real-time suggestions based on the currently selected search engine.
 * Supports Google, DuckDuckGo, Bing, Brave, Ecosia, and YouTube with dev proxy and extension compatibility.
 */

const suggestionsCache = new Map<string, string[]>()
const MAX_CACHE_SIZE = 150

const isChromeExtension =
  typeof window !== 'undefined' &&
  Boolean(
    (window as unknown as { chrome?: { runtime?: { id?: string } } }).chrome?.runtime?.id ||
      window.location.protocol === 'chrome-extension:'
  )

function getSuggestionEndpoint(engineId: string, encodedQuery: string): string {
  const engine = engineId.toLowerCase()
  if (isChromeExtension) {
    switch (engine) {
      case 'duckduckgo':
        return `https://duckduckgo.com/ac/?q=${encodedQuery}&type=list`
      case 'bing':
        return `https://api.bing.com/osjson.aspx?query=${encodedQuery}`
      case 'brave':
        return `https://search.brave.com/api/suggest?q=${encodedQuery}`
      case 'youtube':
        return `https://suggestqueries.google.com/complete/search?client=chrome&ds=yt&q=${encodedQuery}`
      case 'ecosia':
        return `https://ac.ecosia.org/autocomplete?q=${encodedQuery}&type=list`
      case 'google':
      default:
        return `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodedQuery}`
    }
  }

  // Web / Vite Dev server proxy
  switch (engine) {
    case 'duckduckgo':
      return `/api/suggest-duckduckgo/ac/?q=${encodedQuery}&type=list`
    case 'bing':
      return `/api/suggest-bing/osjson.aspx?query=${encodedQuery}`
    case 'brave':
      return `/api/suggest-brave/api/suggest?q=${encodedQuery}`
    case 'youtube':
      return `/api/suggest-google/complete/search?client=chrome&ds=yt&q=${encodedQuery}`
    case 'ecosia':
      return `/api/suggest-ecosia/autocomplete?q=${encodedQuery}&type=list`
    case 'google':
    default:
      return `/api/suggest-google/complete/search?client=chrome&q=${encodedQuery}`
  }
}

/**
 * Parses and extracts clean string suggestions from various search engine response formats
 */
function parseSuggestionPayload(data: unknown): string[] {
  if (!data) return []

  // Format 1: Standard OpenSearch ["query", ["s1", "s2", ...]]
  if (Array.isArray(data) && data.length >= 2 && Array.isArray(data[1])) {
    const list = data[1]
    return list
      .map((item) => {
        if (typeof item === 'string') return item
        if (Array.isArray(item) && typeof item[0] === 'string') return item[0]
        if (item && typeof item === 'object' && 'phrase' in item && typeof item.phrase === 'string') {
          return item.phrase
        }
        return ''
      })
      .filter((s) => Boolean(s && s.trim()))
  }

  // Format 2: DuckDuckGo array of objects [{ phrase: "s1" }, ...]
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'phrase' in item && typeof item.phrase === 'string') {
          return item.phrase
        }
        return ''
      })
      .filter((s) => Boolean(s && s.trim()))
  }

  return []
}

async function fetchFromEndpoint(url: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return []
    const data = await res.json()
    return parseSuggestionPayload(data).slice(0, 8)
  } catch {
    return []
  }
}

/**
 * Fetches real-time suggestions for a given query and active search engine
 */
export async function fetchSearchSuggestions(
  query: string,
  engineId: string,
  signal?: AbortSignal
): Promise<string[]> {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 1) return []

  const cacheKey = `${engineId.toLowerCase()}:${trimmed.toLowerCase()}`
  if (suggestionsCache.has(cacheKey)) {
    return suggestionsCache.get(cacheKey) || []
  }

  const encoded = encodeURIComponent(trimmed)
  const primaryUrl = getSuggestionEndpoint(engineId, encoded)

  let results = await fetchFromEndpoint(primaryUrl, signal)

  // If primary engine didn't return suggestions and wasn't Google, attempt fallback to Google
  if (results.length === 0 && engineId.toLowerCase() !== 'google') {
    const googleUrl = getSuggestionEndpoint('google', encoded)
    results = await fetchFromEndpoint(googleUrl, signal)
  }

  if (results.length > 0) {
    saveToCache(cacheKey, results)
  }

  return results
}

function saveToCache(key: string, results: string[]) {
  if (suggestionsCache.size >= MAX_CACHE_SIZE) {
    const firstKey = suggestionsCache.keys().next().value
    if (firstKey) suggestionsCache.delete(firstKey)
  }
  suggestionsCache.set(key, results)
}

