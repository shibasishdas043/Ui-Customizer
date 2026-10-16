import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { QuotesConfig } from '../types'
import { DEFAULT_QUOTES } from '../config/quotesList'

interface QuotesWidgetProps {
  config: QuotesConfig
}

export const QuotesWidget: React.FC<QuotesWidgetProps> = ({ config }) => {
  const {
    showQuotes,
    quoteFrequency = 'day',
    alwaysShowAuthor = true,
    quoteCategory = 'all',
    onUpdateQuote,
  } = config

  // Storage helpers that prevent uncaught security/quota errors in restricted contexts
  const getSafeStorage = (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  const setSafeStorage = (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value)
    } catch {}
  }

  // Filter quotes by selected mood/category
  const activePool = useMemo(() => {
    if (!quoteCategory || quoteCategory === 'all') return DEFAULT_QUOTES
    const filtered = DEFAULT_QUOTES.filter((q) => q.category === quoteCategory)
    return filtered.length > 0 ? filtered : DEFAULT_QUOTES
  }, [quoteCategory])

  // Determine initial quote index based on rotation frequency
  const [index, setIndex] = useState<number>(() => {
    if (config.currentQuoteIndex !== undefined && !isNaN(config.currentQuoteIndex)) {
      return Math.max(0, config.currentQuoteIndex) % activePool.length
    }

    const saved = getSafeStorage('aura_quote_last_index')
    const lastTimestamp = parseInt(getSafeStorage('aura_quote_last_ts') || '0', 10)
    const now = Date.now()
    const parsedSaved = saved !== null ? parseInt(saved, 10) : 0
    const safeSaved = isNaN(parsedSaved) || parsedSaved < 0 ? 0 : parsedSaved

    if (quoteFrequency === 'tabs') {
      const nextIdx = (safeSaved + 1) % activePool.length
      setSafeStorage('aura_quote_last_index', nextIdx.toString())
      setSafeStorage('aura_quote_last_ts', now.toString())
      return nextIdx
    }

    if (quoteFrequency === 'hour') {
      const hoursElapsed = Math.floor(now / 3600000) !== Math.floor(lastTimestamp / 3600000)
      if (hoursElapsed) {
        const nextIdx = (safeSaved + 1) % activePool.length
        setSafeStorage('aura_quote_last_index', nextIdx.toString())
        setSafeStorage('aura_quote_last_ts', now.toString())
        return nextIdx
      }
      return safeSaved % activePool.length
    }

    if (quoteFrequency === 'day') {
      const daysElapsed = new Date(now).toDateString() !== new Date(lastTimestamp).toDateString()
      if (daysElapsed) {
        const daySeed = Math.floor(now / 86400000) % activePool.length
        setSafeStorage('aura_quote_last_index', daySeed.toString())
        setSafeStorage('aura_quote_last_ts', now.toString())
        return daySeed
      }
      return safeSaved % activePool.length
    }

    return safeSaved % activePool.length
  })

  // Keep index within bounds when pool changes
  useEffect(() => {
    if (index >= activePool.length || index < 0) {
      const timer = setTimeout(() => setIndex(0), 0)
      return () => clearTimeout(timer)
    }
  }, [activePool.length, index])

  const safeIndex = Math.abs(index) % activePool.length
  const current = activePool[safeIndex] || activePool[0]

  if (!showQuotes || !current || activePool.length === 0) return null

  const nextQuote = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextIdx = (safeIndex + 1) % activePool.length
    setIndex(nextIdx)
    setSafeStorage('aura_quote_last_index', nextIdx.toString())
    setSafeStorage('aura_quote_last_ts', Date.now().toString())
    onUpdateQuote?.(nextIdx, Date.now())
  }

  return (
    <div
      className="group relative max-w-xl mx-auto text-center px-4 py-2 mt-3 select-none cursor-pointer transition-transform active:scale-[0.99]"
      onClick={nextQuote}
      title="Click to discover another quote"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${current.quote}_${index}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.4, ease: [0.215, 0.61, 0.355, 1] }}
          className="space-y-1.5"
        >
          <p className="text-xs sm:text-sm font-light text-white italic tracking-wide text-contrast drop-shadow-md leading-relaxed">
            &ldquo;{current.quote}&rdquo;
          </p>

          <div
            className={`flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/80 text-contrast-subtle transition-opacity duration-300 ${
              alwaysShowAuthor ? 'opacity-90' : 'opacity-0 group-hover:opacity-90'
            }`}
          >
            <span>— {current.author}</span>
            <RefreshCw className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/70" />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

