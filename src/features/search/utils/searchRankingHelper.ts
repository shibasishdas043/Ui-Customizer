import type { SearchHistoryItem, SuggestionItem, SuggestionMatchType } from '../types'
import { calculateBaseFrecency } from './searchHistoryHelper'
import { isValidUrl } from './searchUrlHelper'

interface MatchResult {
  score: number
  matchType: SuggestionMatchType
}

/**
 * Fast Damerau-Levenshtein distance calculation supporting transpositions,
 * substitutions, insertions, and deletions for Google-grade typo tolerance.
 */
export function damerauLevenshteinDistance(source: string, target: string): number {
  if (source === target) return 0
  const sLen = source.length
  const tLen = target.length
  if (sLen === 0) return tLen
  if (tLen === 0) return sLen

  const d: number[][] = Array.from({ length: sLen + 1 }, () => new Array(tLen + 1).fill(0))

  for (let i = 0; i <= sLen; i++) d[i][0] = i
  for (let j = 0; j <= tLen; j++) d[0][j] = j

  for (let i = 1; i <= sLen; i++) {
    for (let j = 1; j <= tLen; j++) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      )
      // Transposition
      if (
        i > 1 &&
        j > 1 &&
        source[i - 1] === target[j - 2] &&
        source[i - 2] === target[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }

  return d[sLen][tLen]
}

/**
 * Extracts initials/acronym from multi-word strings (e.g. "GitHub Copilot" -> "gc", "Stack Overflow" -> "so")
 */
export function extractAcronym(text: string): string {
  const words = text.split(/[\s\-_./]+/).filter(Boolean)
  if (words.length < 2) return ''
  return words.map((w) => w[0]).join('').toLowerCase()
}

/**
 * Evaluates how well a query matches a candidate query string and returns a scored result.
 * Implements Google & Chromium Omnibox HQP scoring heuristics.
 */
export function scoreHistoryCandidate(query: string, candidate: SearchHistoryItem): MatchResult {
  const q = query.trim().toLowerCase()
  const text = candidate.query.trim().toLowerCase()

  if (!q) {
    // When query is empty (recent searches mode), rank purely by base frecency
    return {
      score: calculateBaseFrecency(candidate.timestamp, candidate.count),
      matchType: 'none',
    }
  }

  const baseFrecency = calculateBaseFrecency(candidate.timestamp, candidate.count)

  // 1. Exact match
  if (text === q) {
    return {
      score: baseFrecency * 3.5,
      matchType: 'exact',
    }
  }

  // 2. Exact Prefix match (Top priority for inline auto-completion)
  if (text.startsWith(q)) {
    const lengthRatio = q.length / text.length
    const prefixBonus = 2.8 + lengthRatio * 0.4
    return {
      score: Math.round(baseFrecency * prefixBonus),
      matchType: 'prefix',
    }
  }

  // 3. Acronym match (e.g. "gh" matches "github", "so" matches "stack overflow")
  const acronym = extractAcronym(text)
  if (acronym && (acronym === q || acronym.startsWith(q))) {
    return {
      score: Math.round(baseFrecency * 2.2),
      matchType: 'word',
    }
  }

  // 4. Word boundary match (e.g. typing "doc" matches "react docs")
  const words = text.split(/[\s\-_./]+/).filter(Boolean)
  const isWordBoundary = words.some((word) => word.startsWith(q))
  if (isWordBoundary) {
    return {
      score: Math.round(baseFrecency * 2.0),
      matchType: 'word',
    }
  }

  // 5. Multi-token out-of-order match (e.g. "docs react" matches "react official docs")
  const queryTokens = q.split(/\s+/).filter(Boolean)
  if (queryTokens.length > 1) {
    const allTokensMatch = queryTokens.every((token) =>
      words.some((word) => word.startsWith(token) || word.includes(token))
    )
    if (allTokensMatch) {
      return {
        score: Math.round(baseFrecency * 1.8),
        matchType: 'word',
      }
    }
  }

  // 6. Substring match
  if (text.includes(q)) {
    return {
      score: Math.round(baseFrecency * 1.3),
      matchType: 'substring',
    }
  }

  // 7. Typo-tolerant prefix match (Damerau-Levenshtein distance <= 1 for prefixes of equal length)
  if (q.length >= 3) {
    const prefixTarget = text.slice(0, q.length)
    const dist = damerauLevenshteinDistance(q, prefixTarget)
    if (dist === 1) {
      return {
        score: Math.round(baseFrecency * 1.1),
        matchType: 'fuzzy',
      }
    }
  }

  // 8. Fuzzy subsequence match (characters of q appear in order inside text)
  let qIdx = 0
  for (let i = 0; i < text.length && qIdx < q.length; i++) {
    if (text[i] === q[qIdx]) {
      qIdx++
    }
  }

  if (qIdx === q.length && q.length >= 2) {
    return {
      score: Math.round(baseFrecency * 0.8),
      matchType: 'fuzzy',
    }
  }

  return {
    score: 0,
    matchType: 'none',
  }
}

/**
 * Searches and ranks search history candidates based on frecency and matching precision
 */
export function getHistoryMatches(
  query: string,
  history: SearchHistoryItem[],
  limit = 4
): SuggestionItem[] {
  const trimmed = query.trim()

  if (!trimmed) {
    // Return top recent/frequent searches
    return [...history]
      .sort((a, b) => {
        const scoreA = calculateBaseFrecency(a.timestamp, a.count)
        const scoreB = calculateBaseFrecency(b.timestamp, b.count)
        return scoreB - scoreA
      })
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        type: 'history',
        query: item.query,
        score: calculateBaseFrecency(item.timestamp, item.count),
        engineId: item.engineId,
        timestamp: item.timestamp,
        matchType: 'none',
      }))
  }

  const scored: SuggestionItem[] = []

  for (const item of history) {
    const { score, matchType } = scoreHistoryCandidate(trimmed, item)
    if (score > 0) {
      scored.push({
        id: item.id,
        type: 'history',
        query: item.query,
        score,
        engineId: item.engineId,
        timestamp: item.timestamp,
        matchType,
      })
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Extracts the top candidate for inline ghost text auto-completion.
 * Prioritizes high-frecency search history, then falls back to top prefix-matching web suggestions.
 * Returns the full completed query preserving the user's typed casing.
 */
export function getTopGhostCompletion(
  query: string,
  historyMatches: SuggestionItem[],
  webSuggestions: string[]
): string | null {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 1) return null

  const lowerQuery = trimmed.toLowerCase()

  // 1. Check history matches for strict prefix
  for (const h of historyMatches) {
    const lowerCandidate = h.query.toLowerCase()
    if (lowerCandidate.startsWith(lowerQuery) && lowerCandidate.length > lowerQuery.length) {
      return trimmed + h.query.slice(trimmed.length)
    }
  }

  // 2. Check live web suggestions for strict prefix
  for (const web of webSuggestions) {
    const trimmedWeb = web.trim()
    const lowerWeb = trimmedWeb.toLowerCase()
    if (lowerWeb.startsWith(lowerQuery) && lowerWeb.length > lowerQuery.length) {
      return trimmed + trimmedWeb.slice(trimmed.length)
    }
  }

  return null
}

/**
 * Blends local history suggestions, direct URL actions, and remote engine suggestions
 * into a deduplicated, beautifully prioritized list.
 */
export function blendSuggestions(
  query: string,
  historyMatches: SuggestionItem[],
  webSuggestions: string[],
  maxTotal = 8
): SuggestionItem[] {
  const trimmed = query.trim()
  const lowerTrimmed = trimmed.toLowerCase()
  const seenQueries = new Set<string>()

  if (lowerTrimmed) {
    seenQueries.add(lowerTrimmed)
  }

  const blended: SuggestionItem[] = []

  // 1. Direct URL Navigation detection (Google/Omnibox style)
  if (trimmed && isValidUrl(trimmed)) {
    const directUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    blended.push({
      id: 'direct_url_action',
      type: 'url',
      query: trimmed,
      score: 2500,
      matchType: 'exact',
      url: directUrl,
    })
    seenQueries.add(lowerTrimmed)
  }

  // 2. Add top history matches
  for (const h of historyMatches) {
    const lower = h.query.trim().toLowerCase()
    if (!seenQueries.has(lower)) {
      seenQueries.add(lower)
      blended.push(h)
    }
  }

  // 3. Add web suggestions
  for (const web of webSuggestions) {
    const clean = web.trim()
    const lower = clean.toLowerCase()
    if (!seenQueries.has(lower)) {
      seenQueries.add(lower)
      blended.push({
        id: `web_${lower}`,
        type: 'web',
        query: clean,
        score: 50,
        matchType: lower.startsWith(lowerTrimmed) ? 'prefix' : 'substring',
      })
    }
    if (blended.length >= maxTotal) break
  }

  return blended.slice(0, maxTotal)
}
