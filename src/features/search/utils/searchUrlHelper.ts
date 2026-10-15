/**
 * Helper to build search queries with support for:
 * 1. %s placeholders (e.g. "https://perplexity.ai/search?q=%s")
 * 2. Standard query URL appending (e.g. "https://www.google.com/search?q=")
 * 3. Direct URL navigation (e.g. "github.com" or "https://...")
 */

export function isValidUrl(input: string): boolean {
  const trimmed = input.trim()
  if (!trimmed) return false

  // Direct scheme check
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed)
      return true
    } catch {
      return false
    }
  }

  // Domain with TLD check (e.g. "reddit.com", "sub.domain.org/path")
  const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i
  return domainPattern.test(trimmed)
}

export function buildSearchUrl(engineUrl: string, query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return engineUrl

  // Check if input is a direct URL
  if (isValidUrl(trimmed)) {
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  const encodedQuery = encodeURIComponent(trimmed)

  // 1. If engine URL contains %s placeholder
  if (engineUrl.includes('%s')) {
    return engineUrl.replace(/%s/g, encodedQuery)
  }

  // 2. If engine URL ends with = or ? or &
  if (/[=?&]$/.test(engineUrl)) {
    return `${engineUrl}${encodedQuery}`
  }

  // 3. If engine URL has query params already
  if (engineUrl.includes('?')) {
    return `${engineUrl}&q=${encodedQuery}`
  }

  // 4. Default: append ?q=
  return `${engineUrl}?q=${encodedQuery}`
}

export function extractHostnameFromSearch(url: string): string {
  try {
    let formatted = url.trim()
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `https://${formatted}`
    }
    const parsed = new URL(formatted)
    return parsed.hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}
