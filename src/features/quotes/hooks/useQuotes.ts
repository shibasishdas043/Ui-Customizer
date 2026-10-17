import { useState, useEffect, useCallback, useRef } from 'react'
import type { QuoteItem, QuotesConfig, QuoteType } from '../types'
import { getFallbackQuotes, DEFAULT_QUOTES } from '../config/quotesList'
import {
  parseCustomQuotes,
  needsQuoteChange,
  fetchQuotesFromApi,
} from '../utils/quoteParsers'

interface UseQuotesReturn {
  currentQuote: QuoteItem | null
  isLoading: boolean
  totalInPool: number
}

function getSafeStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setSafeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

export function useQuotes(config: QuotesConfig): UseQuotesReturn {
  const {
    showQuotes = true,
    quoteType = 'classic',
    quoteFrequency = 'tabs',
    quoteLanguage = 'en',
    customQuotesText = '',
    customQuotesUrl = '',
    onUpdateQuote,
  } = config

  const [currentQuote, setCurrentQuote] = useState<QuoteItem | null>(() => {
    // Initial sync read from storage for instant 0ms first render without layout shift
    const saved = getSafeStorage(`aura_active_quote_${quoteType}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.quote && parsed?.author) return parsed
      } catch {}
    }
    const initialPool = getFallbackQuotes(quoteType)
    return initialPool[0] || DEFAULT_QUOTES[0]
  })

  const [isLoading, setIsLoading] = useState(false)
  const [poolCount, setPoolCount] = useState(1)

  // Track quotes cache in memory
  const cacheRef = useRef<QuoteItem[]>([])
  const isFetchingRef = useRef(false)

  // Helper to persist current quote
  const saveCurrentQuote = useCallback((quote: QuoteItem, timestamp: number) => {
    setCurrentQuote(quote)
    setSafeStorage(`aura_active_quote_${quoteType}`, JSON.stringify(quote))
    setSafeStorage(`aura_quote_last_ts_${quoteType}`, timestamp.toString())
    onUpdateQuote?.(quote, timestamp)
  }, [quoteType, onUpdateQuote])

  // Refill queue if low
  const refillQueue = useCallback(async (type: QuoteType, lang: string, url: string) => {
    if (type === 'user') {
      const parsed = parseCustomQuotes(customQuotesText)
      const pool = parsed.length > 0 ? parsed : DEFAULT_QUOTES
      cacheRef.current = pool
      setPoolCount(pool.length)
      return pool
    }

    if (type === 'wisdom') {
      cacheRef.current = DEFAULT_QUOTES
      setPoolCount(DEFAULT_QUOTES.length)
      return DEFAULT_QUOTES
    }

    if (isFetchingRef.current) return cacheRef.current
    isFetchingRef.current = true
    setIsLoading(true)

    try {
      const fetched = await fetchQuotesFromApi(type, lang, url)
      const valid = fetched.length > 0 ? fetched : getFallbackQuotes(type)
      cacheRef.current = valid
      setPoolCount(valid.length)
      setSafeStorage(`aura_quote_cache_${type}`, JSON.stringify(valid))
      return valid
    } catch {
      const fallback = getFallbackQuotes(type)
      cacheRef.current = fallback
      setPoolCount(fallback.length)
      return fallback
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [customQuotesText])

  // Initial load and frequency-based rotation
  useEffect(() => {
    if (!showQuotes) return

    let isMounted = true

    async function initializeQuotes() {
      // 1. Load cached queue from storage or refill
      let activePool: QuoteItem[] = []
      if (quoteType === 'user') {
        const parsed = parseCustomQuotes(customQuotesText)
        activePool = parsed.length > 0 ? parsed : DEFAULT_QUOTES
      } else if (quoteType === 'wisdom') {
        activePool = DEFAULT_QUOTES
      } else {
        const cachedRaw = getSafeStorage(`aura_quote_cache_${quoteType}`)
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw)
            if (Array.isArray(parsed) && parsed.length > 0) {
              activePool = parsed
            }
          } catch {}
        }
        if (activePool.length === 0) {
          activePool = await refillQueue(quoteType, quoteLanguage, customQuotesUrl)
        }
      }

      if (!isMounted) return

      cacheRef.current = activePool
      setPoolCount(activePool.length)

      // 2. Determine if rotation is needed based on quoteFrequency
      const lastTs = parseInt(getSafeStorage(`aura_quote_last_ts_${quoteType}`) || '0', 10)
      const shouldChange = needsQuoteChange(quoteFrequency, lastTs)

      if (shouldChange) {
        const randomIndex = Math.floor(Math.random() * activePool.length)
        const chosen = activePool[randomIndex] || activePool[0] || DEFAULT_QUOTES[0]
        saveCurrentQuote(chosen, Date.now())
      } else {
        setCurrentQuote((prev) => {
          if (!prev) {
            const chosen = activePool[0] || DEFAULT_QUOTES[0]
            saveCurrentQuote(chosen, Date.now())
            return chosen
          }
          return prev
        })
      }
    }

    initializeQuotes()

    return () => {
      isMounted = false
    }
  }, [
    showQuotes,
    quoteType,
    quoteFrequency,
    quoteLanguage,
    customQuotesText,
    customQuotesUrl,
    refillQueue,
    saveCurrentQuote,
  ])

  return {
    currentQuote,
    isLoading,
    totalInPool: poolCount,
  }
}
