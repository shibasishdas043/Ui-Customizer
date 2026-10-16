import type React from 'react'
import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowUpLeft } from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { SearchEngineIcon } from './SearchEngineIcon'

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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [maxHeightStyle, setMaxHeightStyle] = useState<string>('calc(100vh - 300px)')

  // Dynamically clamp dropdown height so it NEVER crosses the browser bottom or hides under the Windows taskbar
  useEffect(() => {
    const updateBounds = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect()
        // Maintain a minimal clean gap of 20px above the bottom of the viewport / Windows taskbar
        const available = window.innerHeight - rect.top - 20
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
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="absolute left-4 right-4 top-full mt-2 z-50 pointer-events-auto select-none"
    >
      <div
        ref={dropdownRef}
        className="w-full rounded-[24px] p-1.5 overflow-hidden border-0 outline-none transition-[background-color,box-shadow] duration-200 flex flex-col"
        style={{
          maxHeight: maxHeightStyle,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          backdropFilter: 'blur(24px) saturate(150%)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.55)',
        }}
      >
        <div className="flex flex-col gap-0.5 overflow-y-auto scrollbar-none flex-1 pr-0.5">
          {items.map((item, idx) => {
            const isSelected = idx === selectedIndex
            const lowerItem = item.text.toLowerCase()
            const matchIndex = lowerItem.indexOf(lowerQuery)

            return (
              <button
                key={`${item.text}-${idx}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSelect(item.text)
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-left transition-all duration-150 cursor-pointer border-0 outline-none group ${
                  isSelected
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-white/85 hover:bg-white/12 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.isPrimary ? (
                    <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                      <SearchEngineIcon engine={activeEngine} size="sm" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/8 group-hover:bg-white/15 flex items-center justify-center shrink-0 transition-colors">
                      <Search
                        className={`w-3.5 h-3.5 transition-colors ${
                          isSelected
                            ? 'text-[var(--accent-color)]'
                            : 'text-white/50 group-hover:text-white/80'
                        }`}
                      />
                    </div>
                  )}

                  <span className="truncate text-sm sm:text-base leading-normal">
                    {item.isPrimary ? (
                      <>
                        <span className="text-white/60">Search with {activeEngine.name} for </span>
                        <span className="font-semibold text-white">"{item.text}"</span>
                      </>
                    ) : matchIndex >= 0 && lowerQuery ? (
                      <>
                        <span className="opacity-60">{item.text.slice(0, matchIndex)}</span>
                        <span className="font-semibold text-white">
                          {item.text.slice(matchIndex, matchIndex + lowerQuery.length)}
                        </span>
                        <span className="font-normal opacity-85">
                          {item.text.slice(matchIndex + lowerQuery.length)}
                        </span>
                      </>
                    ) : (
                      item.text
                    )}
                  </span>
                </div>

                <div className="shrink-0 pl-2 flex items-center">
                  {item.isPrimary ? (
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full transition-colors ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-white/12 text-white/60 group-hover:text-white/85'
                      }`}
                    >
                      ↵
                    </span>
                  ) : (
                    <ArrowUpLeft
                      className={`w-4 h-4 transition-all ${
                        isSelected
                          ? 'text-[var(--accent-color)] opacity-100 scale-110'
                          : 'text-white/30 group-hover:text-white/70 opacity-60'
                      }`}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Micro-hint footer */}
        <div className="flex items-center justify-between px-3.5 pt-1.5 pb-0.5 text-[10px] text-white/35 border-t border-white/5 mt-1 select-none shrink-0">
          <div className="flex items-center gap-2">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px] text-white/60">
                Tab
              </kbd>{' '}
              switch engine
            </span>
            <span>·</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px] text-white/60">
                ↑↓
              </kbd>{' '}
              navigate
            </span>
          </div>
          <div>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px] text-white/60">
                ↵
              </kbd>{' '}
              search
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
