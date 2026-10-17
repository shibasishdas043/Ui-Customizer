import type { QuoteItem, QuoteType, QuoteFrequency } from '../types'
import { getFallbackQuotes, DEFAULT_QUOTES } from '../config/quotesList'

/**
 * Parses user-provided custom quotes text with support for:
 * - CSV: "Author, Quote text"
 * - Hyphen / Dash: "Quote text - Author" or "Quote text — Author"
 * - Colon: "Author: Quote text"
 * - JSON: '[{"quote":"...","author":"..."}]' or '[{"content":"...","author":"..."}]'
 * - Single lines: "Quote text" (assigned author 'Anonymous')
 */
export function parseCustomQuotes(input: string): QuoteItem[] {
  if (!input || !input.trim()) return []

  const trimmed = input.trim()

  // Try JSON parsing if input looks like an array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        const items: QuoteItem[] = []
        for (const item of parsed) {
          if (!item) continue
          const quote = (item.quote || item.content || item.text || '').toString().trim()
          const author = (item.author || item.by || 'Anonymous').toString().trim()
          if (quote) {
            items.push({ quote, author })
          }
        }
        if (items.length > 0) return items
      }
    } catch {
      // Fall through to line-by-line parsing
    }
  }

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  const results: QuoteItem[] = []

  for (const line of lines) {
    // 1. Colon format: "Author: Quote"
    if (line.includes(':')) {
      const firstColon = line.indexOf(':')
      const author = line.slice(0, firstColon).trim()
      const quote = cleanQuoteText(line.slice(firstColon + 1).trim())
      if (quote.length > 0) {
        results.push({ quote, author: author || 'Anonymous' })
        continue
      }
    }

    // 2. Dash format: "Quote - Author" or "Quote — Author" or "Quote ~ Author"
    const dashMatch = line.match(/^(.*?)\s+[—–~-]\s+([^—–~-]+)$/)
    if (dashMatch) {
      const firstPart = cleanQuoteText(dashMatch[1].trim())
      const secondPart = cleanQuoteText(dashMatch[2].trim())

      if (firstPart && secondPart) {
        // If first part is enclosed in quotation marks or longer than second, it's quote - author
        results.push({ quote: firstPart, author: secondPart })
        continue
      }
    }

    // 3. CSV format: "Author, Quote" or "Author,Quote"
    if (line.includes(',')) {
      const firstComma = line.indexOf(',')
      const author = line.slice(0, firstComma).trim()
      const quote = cleanQuoteText(line.slice(firstComma + 1).trim())
      if (quote.length > 0) {
        results.push({ quote, author: author || 'Anonymous' })
        continue
      }
    }

    // 4. Fallback: Entire line is the quote
    const cleanLine = cleanQuoteText(line)
    if (cleanLine.length > 0) {
      results.push({ quote: cleanLine, author: 'Anonymous' })
    }
  }

  return results
}

/**
 * Strips accidental wrapping quotation marks and extra whitespace
 */
function cleanQuoteText(text: string): string {
  let cleaned = text.trim()
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith('“') && cleaned.endsWith('”')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim()
  }
  return cleaned
}

/**
 * Determines if a new quote should be rotated based on frequency and previous timestamp
 */
export function needsQuoteChange(frequency: QuoteFrequency = 'tabs', lastTimestamp: number = 0): boolean {
  if (frequency === 'locked') return false
  if (frequency === 'tabs') return true
  if (!lastTimestamp) return true

  const now = new Date()
  const last = new Date(lastTimestamp)

  if (frequency === 'hour') {
    const isDifferentHour = now.getHours() !== last.getHours()
    const isDifferentDay = now.toDateString() !== last.toDateString()
    return isDifferentHour || isDifferentDay
  }

  if (frequency === 'day') {
    return now.toDateString() !== last.toDateString()
  }

  return true
}

/**
 * Fetches quotes from Bonjourr Services API or custom URL with fallback support
 */
export async function fetchQuotesFromApi(
  type: QuoteType = 'classic',
  lang: string = 'en',
  customUrl: string = '',
  signal?: AbortSignal,
): Promise<QuoteItem[]> {
  if (type === 'wisdom') {
    return DEFAULT_QUOTES
  }

  // Handle Custom URL
  if (type === 'url') {
    if (!customUrl || !/^https?:\/\//i.test(customUrl)) {
      return getFallbackQuotes('classic')
    }
    try {
      const res = await fetch(customUrl, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json') || customUrl.endsWith('.json')) {
        const json = await res.json()
        const parsed = parseCustomQuotes(JSON.stringify(json))
        return parsed.length > 0 ? parsed : getFallbackQuotes('classic')
      } else {
        const text = await res.text()
        const parsed = parseCustomQuotes(text)
        return parsed.length > 0 ? parsed : getFallbackQuotes('classic')
      }
    } catch (err) {
      console.warn('Failed to fetch quotes from custom URL:', err)
      return getFallbackQuotes('classic')
    }
  }

  // Bonjourr Quotes API Endpoint
  try {
    const endpoint = type === 'classic' ? `classic/${lang || 'en'}` : type
    const res = await fetch(`https://services.bonjourr.fr/quotes/${endpoint}`, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`Services API error: ${res.status}`)
    }

    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const items: QuoteItem[] = data.map((item: { content?: string; quote?: string; author?: string }) => ({
        quote: cleanQuoteText(item.content || item.quote || ''),
        author: (item.author || 'Anonymous').trim(),
      })).filter((item) => item.quote.length > 0)

      if (items.length > 0) return items
    }
  } catch (err) {
    console.warn(`Quotes fetch failed for type "${type}", using offline fallback:`, err)
  }

  return getFallbackQuotes(type)
}
