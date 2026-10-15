import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { QuotesConfig } from '../types'
import { DEFAULT_QUOTES } from '../config/quotesList'

interface QuotesWidgetProps {
  config: QuotesConfig
}

export const QuotesWidget: React.FC<QuotesWidgetProps> = ({ config }) => {
  const [index, setIndex] = useState(0)

  if (!config.showQuotes) return null

  const current = DEFAULT_QUOTES[index % DEFAULT_QUOTES.length]

  const nextQuote = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIndex((prev) => (prev + 1) % DEFAULT_QUOTES.length)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="group relative max-w-xl mx-auto text-center px-4 py-2 mt-4 select-none cursor-pointer transition-opacity hover:opacity-95 text-contrast drop-shadow-md"
      onClick={nextQuote}
      title="Click to see another quote"
    >
      <p className="text-xs sm:text-sm font-light text-white italic tracking-wide text-contrast">
        "{current.quote}"
      </p>
      <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[11px] font-medium text-white/80 text-contrast-subtle">
        <span>— {current.author}</span>
        <RefreshCw className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/80" />
      </div>
    </motion.div>
  )
}
