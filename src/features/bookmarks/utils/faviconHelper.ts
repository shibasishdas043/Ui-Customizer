/**
 * Multi-provider favicon & thumbnail utilities
 */

export function normalizeUrl(url: string): string {
  let formatted = url.trim()
  if (!formatted) return ''
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`
  }
  return formatted
}

export function extractHostname(url: string): string {
  try {
    const formatted = normalizeUrl(url)
    if (!formatted) return ''
    const parsed = new URL(formatted)
    return parsed.hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

export function getFaviconUrl(
  url: string,
  provider: 'google' | 'duckduckgo' | 'direct' = 'google'
): string {
  try {
    const hostname = extractHostname(url)
    if (!hostname) return ''

    switch (provider) {
      case 'duckduckgo':
        return `https://icons.duckduckgo.com/ip3/${hostname}.ico`
      case 'direct':
        return `https://${hostname}/favicon.ico`
      case 'google':
      default:
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
    }
  } catch {
    return ''
  }
}

/**
 * Returns a clean 1-2 character initial for fallback thumbnails
 */
export function getInitial(title: string, url: string): string {
  const cleanTitle = title.trim()
  if (cleanTitle) {
    return cleanTitle.charAt(0).toUpperCase()
  }
  const host = extractHostname(url)
  return host ? host.charAt(0).toUpperCase() : '?'
}

/**
 * Deterministically generates a subtle, premium gradient background based on a string
 */
const FALLBACK_GRADIENTS = [
  'from-blue-600/80 to-indigo-700/80',
  'from-purple-600/80 to-pink-700/80',
  'from-emerald-600/80 to-teal-700/80',
  'from-amber-600/80 to-orange-700/80',
  'from-rose-600/80 to-red-700/80',
  'from-cyan-600/80 to-blue-700/80',
  'from-violet-600/80 to-fuchsia-700/80',
  'from-slate-700/80 to-zinc-800/80',
]

export function getFallbackGradient(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % FALLBACK_GRADIENTS.length
  return FALLBACK_GRADIENTS[index]
}
