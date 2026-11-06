import type React from 'react'
import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowUpLeft, Clock, X, Globe, ExternalLink } from 'lucide-react'

import type { SearchEngineItem, SuggestionItem } from '../types'
import { SearchEngineIcon } from './SearchEngineIcon'
import { GlassSurface } from '../../../shared/components/GlassSurface'
import { formatRelativeTime } from '../utils/searchHistoryHelper'

export interface SearchSuggestionsDropdownProps {
  items: SuggestionItem[]
  selectedIndex: number
  query: string
  activeEngine: SearchEngineItem
  onSelect: (suggestion: string) => void
  onInsert?: (suggestion: string) => void
  onRemoveHistoryItem?: (query: string) => void
  onClearAllHistory?: () => void
}

export const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  items,
  selectedIndex,
  query,
  activeEngine,
  onSelect,
  onInsert,
  onRemoveHistoryItem,
}) => {
  const trimmed = query.trim()
  const containerRef = useRef<HTMLDivElement>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [activeRect, setActiveRect] = useState<{ top: number; height: number } | null>(null)
  const [maxHeightStyle, setMaxHeightStyle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return `${Math.max(160, Math.floor(window.innerHeight - 280))}px`
    }
    return 'calc(100vh - 280px)'
  })

  // Synchronously measure highlighted element's layout geometry before paint for 0-latency tracking
  useLayoutEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length && itemRefs.current[selectedIndex]) {
      const el = itemRefs.current[selectedIndex]
      if (el) {
        setActiveRect({
          top: el.offsetTop,
          height: el.offsetHeight,
        })
        return
      }
    }
    setActiveRect(null)
  }, [selectedIndex, items])

  // Confined container-only scrolling that never touches the browser window or parent layouts
  useEffect(() => {
    if (
      selectedIndex >= 0 &&
      selectedIndex < items.length &&
      itemRefs.current[selectedIndex] &&
      listContainerRef.current
    ) {
      const container = listContainerRef.current
      const el = itemRefs.current[selectedIndex]
      if (el) {
        const elTop = el.offsetTop
        const elBottom = elTop + el.offsetHeight
        const scrollTop = container.scrollTop
        const clientHeight = container.clientHeight

        if (elTop < scrollTop) {
          container.scrollTop = elTop
        } else if (elBottom > scrollTop + clientHeight) {
          container.scrollTop = elBottom - clientHeight
        }
      }
    }
  }, [selectedIndex, items.length])

  // Dynamically clamp dropdown height so it NEVER crosses the browser bottom or hides under the Windows taskbar
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const available = window.innerHeight - rect.top - 24
        const next = `${Math.max(160, Math.floor(available))}px`
        setMaxHeightStyle((prev) => (prev !== next ? next : prev))
      }
      if (selectedIndex >= 0 && selectedIndex < items.length && itemRefs.current[selectedIndex]) {
        const el = itemRefs.current[selectedIndex]
        if (el) {
          setActiveRect({
            top: el.offsetTop,
            height: el.offsetHeight,
          })
        }
      }
    }

    updateBounds()
    window.addEventListener('resize', updateBounds)
    return () => window.removeEventListener('resize', updateBounds)
  }, [items.length, selectedIndex, trimmed])

  if (!trimmed || items.length === 0) return null

  const lowerQuery = trimmed.toLowerCase()
  const hasHistoryInList = items.some((it) => it.type === 'history')


  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-0 right-0 top-full mt-2.5 z-50 pointer-events-auto select-none origin-top"
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
        className="w-full overflow-hidden flex flex-col shadow-2xl"
        contentClassName="p-2.5 flex flex-col !justify-start !items-stretch w-full h-full min-h-0 overflow-hidden"
        style={{ maxHeight: maxHeightStyle }}
      >
        <div
          ref={listContainerRef}
          className="relative flex flex-col gap-1 overflow-y-auto scrollbar-none flex-1 min-h-0 w-full"
        >
          {/* Hardware-accelerated sliding selection pill */}
          <motion.div
            initial={false}
            animate={
              activeRect && selectedIndex >= 0
                ? {
                    y: activeRect.top,
                    height: activeRect.height,
                    opacity: 1,
                  }
                : {
                    opacity: 0,
                  }
            }
            transition={{
              y: {
                type: 'spring',
                stiffness: 280,
                damping: 26,
                mass: 0.7,
              },
              height: {
                type: 'spring',
                stiffness: 280,
                damping: 26,
                mass: 0.7,
              },
              opacity: { duration: 0.15 },
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              pointerEvents: 'none',
              zIndex: 0,
            }}
            className="rounded-xl bg-black/8 dark:bg-white/14 border border-black/6 dark:border-white/10 shadow-xs"
          />

          {items.map((item, idx) => {
            const isSelected = idx === selectedIndex
            const lowerItem = item.query.toLowerCase()
            const matchIndex = lowerQuery ? lowerItem.indexOf(lowerQuery) : -1
            const isHistory = item.type === 'history'
            const isPrimary = item.type === 'current-query'
            const isUrl = item.type === 'url'

            return (
              <button
                key={item.id || item.query}
                ref={(el) => {
                  itemRefs.current[idx] = el
                }}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSelect(item.query)
                }}
                className={`relative z-10 w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left cursor-pointer border-0 outline-none group font-medium bg-transparent transition-colors duration-150 ${
                  isSelected
                    ? 'text-black dark:text-white'
                    : 'text-neutral-800 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/8 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Icon */}
                  {isUrl ? (
                    <div className="w-6 h-6 rounded-full bg-blue-500/15 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                  ) : isPrimary ? (
                    <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center shrink-0">
                      <SearchEngineIcon engine={activeEngine} size="sm" />
                    </div>
                  ) : isHistory ? (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-color)]/15 dark:bg-[var(--accent-color)]/25 flex items-center justify-center shrink-0 transition-colors">
                      <Clock
                        className={`w-3.5 h-3.5 transition-colors ${
                          isSelected
                            ? 'text-[var(--accent-color)] dark:text-white'
                            : 'text-[var(--accent-color)] dark:text-neutral-300'
                        }`}
                      />
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

                  {/* Text Representation */}
                  <span className="truncate text-sm sm:text-base leading-normal select-none">
                    {isUrl ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Go to {item.url}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                          (Direct Navigation)
                        </span>
                      </div>
                    ) : isPrimary ? (
                      <>
                        <span className="text-neutral-600 dark:text-white/70 font-medium">
                          Search with {activeEngine.name} for{' '}
                        </span>
                        <span className="font-bold text-black dark:text-white">
                          "{item.query}"
                        </span>
                      </>
                    ) : matchIndex >= 0 && lowerQuery ? (
                      <>
                        <span className="text-neutral-600 dark:text-white/65 font-medium">
                          {item.query.slice(0, matchIndex)}
                        </span>
                        <span className="font-bold text-black dark:text-white">
                          {item.query.slice(matchIndex, matchIndex + lowerQuery.length)}
                        </span>
                        <span className="font-medium text-neutral-800 dark:text-white/90">
                          {item.query.slice(matchIndex + lowerQuery.length)}
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-black dark:text-white">
                        {item.query}
                      </span>
                    )}
                  </span>

                  {/* Relative time indicator for History */}
                  {isHistory && item.timestamp && (
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal shrink-0 ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  )}
                </div>

                {/* Right side action buttons */}
                <div className="flex items-center gap-1 shrink-0 ml-2.5">
                  {/* Delete button for history items */}
                  {isHistory && onRemoveHistoryItem && (
                    <button
                      type="button"
                      title="Remove from history (Shift+Delete)"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onRemoveHistoryItem(item.query)
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition-all cursor-pointer border-0 outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Insert into search bar button (Google style ↖) */}
                  {!isPrimary && !isUrl && onInsert && (
                    <button
                      type="button"
                      title="Insert into search"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onInsert(item.query)
                      }}
                      className="w-6 h-6 rounded-full transition-colors flex items-center justify-center bg-black/6 dark:bg-white/8 hover:bg-black/12 dark:hover:bg-white/18 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white cursor-pointer border-0 outline-none"
                    >
                      <ArrowUpLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Action indicator: External link for URLs, or return key ↵ badge for selected item */}
                  {isUrl ? (
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 dark:bg-blue-400/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center text-[11px] font-bold leading-none ${
                        isSelected
                          ? 'bg-black/15 dark:bg-white/20 text-black dark:text-white opacity-100 scale-100'
                          : isPrimary
                          ? 'bg-black/6 dark:bg-white/10 text-neutral-600 dark:text-white/60 opacity-80'
                          : 'opacity-0 scale-75 pointer-events-none'
                      }`}
                    >
                      ↵
                    </div>
                  )}
                </div>
              </button>
            )
          })}
          </div>

          {/* Micro-hint footer matching Google Omnibox convenience */}
          <div className="w-full flex items-center justify-between px-3.5 sm:px-4 pt-2.5 pb-2 text-[11px] text-neutral-600 dark:text-white/60 border-t border-black/8 dark:border-white/8 mt-1 select-none shrink-0 font-medium">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 leading-none">
                <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[20px] h-[18px] rounded-[5px] bg-black/8 dark:bg-white/12 border border-black/8 dark:border-white/10 font-mono text-[9px] font-semibold text-neutral-800 dark:text-neutral-200 shadow-[0_1px_1px_rgba(0,0,0,0.08)] leading-none select-none">
                  Tab
                </kbd>
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  {trimmed ? 'complete' : 'switch engine'}
                </span>
              </span>
              <span
                className="w-1 h-1 rounded-full bg-neutral-400/50 dark:bg-neutral-500/50 shrink-0"
                aria-hidden="true"
              />
              <span className="inline-flex items-center gap-1.5 leading-none">
                <kbd className="inline-flex items-center justify-center px-1 py-0.5 min-w-[18px] h-[18px] rounded-[5px] bg-black/8 dark:bg-white/12 border border-black/8 dark:border-white/10 font-mono text-[10px] font-semibold text-neutral-800 dark:text-neutral-200 shadow-[0_1px_1px_rgba(0,0,0,0.08)] leading-none select-none">
                  ↑↓
                </kbd>
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  navigate
                </span>
              </span>
              {hasHistoryInList && (
                <>
                  <span
                    className="w-1 h-1 rounded-full bg-neutral-400/50 dark:bg-neutral-500/50 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="inline-flex items-center gap-1.5 leading-none">
                    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[20px] h-[18px] rounded-[5px] bg-black/8 dark:bg-white/12 border border-black/8 dark:border-white/10 font-mono text-[9px] font-semibold text-neutral-800 dark:text-neutral-200 shadow-[0_1px_1px_rgba(0,0,0,0.08)] leading-none select-none">
                      Shift+Del
                    </kbd>
                    <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      delete
                    </span>
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 leading-none">
                <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-[5px] bg-black/8 dark:bg-white/12 border border-black/8 dark:border-white/10 font-mono text-[10px] font-semibold text-neutral-800 dark:text-neutral-200 shadow-[0_1px_1px_rgba(0,0,0,0.08)] leading-none select-none">
                  ↵
                </kbd>
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  search
                </span>
              </span>
            </div>
          </div>
        </GlassSurface>
    </motion.div>
  )
}
