import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { QuotesConfig } from '../types'
import { useQuotes } from '../hooks/useQuotes'

interface QuotesWidgetProps {
  config: QuotesConfig
}

export const QuotesWidget: React.FC<QuotesWidgetProps> = ({ config }) => {
  const {
    showQuotes = true,
    alwaysShowAuthor = true,
  } = config

  const { currentQuote } = useQuotes(config)

  if (!showQuotes || !currentQuote || !currentQuote.quote) return null

  return (
    <div className="group relative max-w-2xl mx-auto text-center px-4 py-2 mt-2 select-none pointer-events-auto">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${currentQuote.quote}_${currentQuote.author}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1.5"
        >
          {/* Main Quote Text */}
          <p className="text-xs sm:text-sm font-light text-white italic tracking-wide text-contrast drop-shadow-md leading-relaxed px-6">
            &ldquo;{currentQuote.quote}&rdquo;
          </p>

          {/* Author Display (Always visible or hover reveal) */}
          <p
            className={`text-[11px] font-medium text-white/80 text-contrast-subtle transition-opacity duration-300 ${
              alwaysShowAuthor ? 'opacity-90' : 'opacity-0 group-hover:opacity-90'
            }`}
          >
            — {currentQuote.author || 'Anonymous'}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
