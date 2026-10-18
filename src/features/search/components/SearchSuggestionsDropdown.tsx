import type React from 'react'
import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowUpLeft } from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { SearchEngineIcon } from './SearchEngineIcon'
import { GlassSurface } from '../../../shared/components/GlassSurface'

export interface SearchSuggestionsDropdownProps {
  suggestions: string[]
  selectedIndex: number
  query: string
  activeEngine: SearchEngineItem
  onSelect: (suggestion: string) => void
}

export const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  suggestions,
  selectedIndex,
  query,
  activeEngine,
  onSelect,
}) => {
  const trimmed = query.trim()
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxHeightStyle, setMaxHeightStyle] = useState<string>('calc(100vh - 280px)')

  // Dynamically clamp dropdown height so it NEVER crosses the browser bottom or hides under the Windows taskbar
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        // Maintain a minimal clean gap of 24px above the bottom of the viewport / Windows taskbar
        const available = window.innerHeight - rect.top - 24
        setMaxHeightStyle(`${Math.max(160, Math.floor(available))}px`)
      }
    }

    updateBounds()
    window.addEventListener('resize', updateBounds)
    return () => window.removeEventListener('resize', updateBounds)
  }, [suggestions.length, trimmed])

  if (!trimmed) return null

  // Allow up to 7 additional live suggestions (8 items total) to fill available vertical space
  const MAX_ADDITIONAL_SUGGESTIONS = 7
  const items: Array<{ text: string; isPrimary: boolean }> = [
    { text: trimmed, isPrimary: true },
    ...suggestions
      .filter((s) => s.trim().toLowerCase() !== trimmed.toLowerCase())
      .slice(0, MAX_ADDITIONAL_SUGGESTIONS)
      .map((s) => ({ text: s, isPrimary: false })),
  ]

  const lowerQuery = trimmed.toLowerCase()

  return (
    <motion.div
      ref={containerRef}
      layout="position"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-0 right-0 top-full mt-2.5 z-50 pointer-events-auto select-none origin-top"
    >
      <motion.div
        layout
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full overflow-hidden rounded-[24px] shadow-2xl"
      >
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={24}
          borderWidth={0.07}
          blur={11}
          brightness={50}
          opacity={0.93}
          distortionScale={-180}
          displace={3}
          redOffset={0}
          greenOffset={10}
          blueOffset={20}
          backgroundOpacity={0.28}
          saturation={1}
          className="w-full overflow-hidden flex flex-col"
          contentClassName="p-2.5 flex flex-col !justify-start !items-stretch w-full h-full min-h-0 overflow-hidden"
          style={{ maxHeight: maxHeightStyle }}
        >
          <motion.div
            layout
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-1 overflow-y-auto scrollbar-none flex-1 min-h-0 w-full"
          >
            {items.map((item, idx) => {
              const isSelected = idx === selectedIndex
              const lowerItem = item.text.toLowerCase()
              const matchIndex = lowerItem.indexOf(lowerQuery)

              return (
                <motion.button
                  key={item.text}
                  layout="position"
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onSelect(item.text)
                  }}
                  className={`relative z-0 w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left cursor-pointer border-0 outline-none group transition-colors duration-150 ${
                    isSelected
                      ? 'text-black dark:text-white font-medium'
                      : 'text-neutral-950 dark:text-white/90 hover:bg-black/6 dark:hover:bg-white/10 hover:text-black dark:hover:text-white font-normal'
                  }`}
                >
                  {/* Gliding spring-animated highlight pill for keyboard navigation and active selection */}
                  {isSelected && (
                    <motion.div
                      layoutId="active-suggestion-highlight"
                      className="absolute inset-0 rounded-xl bg-black/15 dark:bg-white/20 shadow-xs pointer-events-none -z-10"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {item.isPrimary ? (
                      <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center shrink-0">
                        <SearchEngineIcon engine={activeEngine} size="sm" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 group-hover:bg-black/15 dark:group-hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors">
                        <Search
                          className={`w-3.5 h-3.5 transition-colors ${
                            isSelected
                              ? 'text-[var(--accent-color)] dark:text-white'
                              : 'text-neutral-800 dark:text-white/65 group-hover:text-black dark:group-hover:text-white'
                          }`}
                        />
                      </div>
                    )}

                    <span className="truncate text-sm sm:text-base leading-normal select-none">
                      {item.isPrimary ? (
                        <>
                          <span className="text-neutral-600 dark:text-white/70 font-medium">Search with {activeEngine.name} for </span>
                          <span className="font-bold text-black dark:text-white">"{item.text}"</span>
                        </>
                      ) : matchIndex >= 0 && lowerQuery ? (
                        <>
                          <span className="text-neutral-600 dark:text-white/65 font-medium">{item.text.slice(0, matchIndex)}</span>
                          <span className="font-bold text-black dark:text-white">
                            {item.text.slice(matchIndex, matchIndex + lowerQuery.length)}
                          </span>
                          <span className="font-medium text-neutral-800 dark:text-white/90">
                            {item.text.slice(matchIndex + lowerQuery.length)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-black dark:text-white">{item.text}</span>
                      )}
                    </span>
                  </div>

                  <div className="w-6 h-6 flex items-center justify-center shrink-0 ml-2.5">
                    {item.isPrimary ? (
                      <div
                        className={`w-6 h-6 rounded-full transition-colors flex items-center justify-center text-[11px] font-bold leading-none ${
                          isSelected
                            ? 'bg-black/20 dark:bg-white/25 text-black dark:text-white'
                            : 'bg-black/8 dark:bg-white/12 text-neutral-800 dark:text-white/70 group-hover:text-black dark:group-hover:text-white'
                        }`}
                      >
                        ↵
                      </div>
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-full transition-colors flex items-center justify-center ${
                          isSelected
                            ? 'bg-black/15 dark:bg-white/20'
                            : 'bg-black/6 dark:bg-white/8 group-hover:bg-black/10 dark:group-hover:bg-white/14'
                        }`}
                      >
                        <ArrowUpLeft
                          className={`w-3.5 h-3.5 transition-all ${
                            isSelected
                              ? 'text-[var(--accent-color)] dark:text-white opacity-100 scale-105'
                              : 'text-neutral-700 dark:text-white/50 group-hover:text-black dark:group-hover:text-white opacity-90 group-hover:opacity-100'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </motion.div>

        {/* Micro-hint footer spanning full width with edge-to-edge subtle divider */}
        <div className="w-full flex items-center justify-between px-4 sm:px-5 pt-3 pb-2.5 text-[11px] text-neutral-600 dark:text-white/60 border-t border-black/8 dark:border-white/8 mt-1 select-none shrink-0 font-medium">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 leading-none">
              <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[20px] h-[18px] rounded-[5px] bg-black/8 dark:bg-white/12 border border-black/8 dark:border-white/10 font-mono text-[9px] font-semibold text-neutral-800 dark:text-neutral-200 shadow-[0_1px_1px_rgba(0,0,0,0.08)] leading-none select-none">
                Tab
              </kbd>
              <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">switch engine</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-neutral-400/50 dark:bg-neutral-500/50 shrink-0" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5 leading-none">
              <kbd className="inline-flex items-center justify-center px-1 py-0.5 min-w-[18px] h-[18px] rounded-[5px] bg-black/8 dark:bg-white/12 border border-black/8 dark:border-white/10 font-mono text-[10px] font-semibold text-neutral-800 dark:text-neutral-200 shadow-[0_1px_1px_rgba(0,0,0,0.08)] leading-none select-none">
                ↑↓
              </kbd>
              <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">navigate</span>
            </span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 leading-none">
              <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-[5px] bg-black/8 dark:bg-white/12 border border-black/8 dark:border-white/10 font-mono text-[10px] font-semibold text-neutral-800 dark:text-neutral-200 shadow-[0_1px_1px_rgba(0,0,0,0.08)] leading-none select-none">
                ↵
              </kbd>
              <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">search</span>
            </span>
          </div>
        </div>
      </GlassSurface>
      </motion.div>
    </motion.div>
  )
}
