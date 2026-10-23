import { useState, useRef, useEffect, useMemo } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import type { SearchEngineItem, SearchHistoryItem, SuggestionItem } from '../types'
import { DEFAULT_SEARCH_ENGINES } from '../config/defaultEngines'
import { EngineSelector, EngineSelectorDropdown } from './EngineSelector'
import { SearchEngineIcon } from './SearchEngineIcon'
import { SearchSuggestionsDropdown } from './SearchSuggestionsDropdown'
import { buildSearchUrl, isValidUrl } from '../utils/searchUrlHelper'
import { migrateSearchEnginesToPermanentCache } from '../utils/searchFaviconHelper'
import { fetchSearchSuggestions } from '../utils/searchSuggestionsHelper'
import {
  loadSearchHistory,
  addSearchHistory,
  removeSearchHistoryItem,
  clearAllSearchHistory,
} from '../utils/searchHistoryHelper'
import {
  getHistoryMatches,
  getTopGhostCompletion,
  blendSuggestions,
} from '../utils/searchRankingHelper'
import { GlassSurface } from '../../../shared/components/GlassSurface'


interface SearchBarProps {
  currentEngine: string
  onEngineChange: (engine: string) => void
  visible: boolean
  autoFocus?: boolean
  searchInNewTab?: boolean
  engines?: SearchEngineItem[]
  onOpenSettings?: () => void
  onUpdateEngines?: (engines: SearchEngineItem[]) => void
  className?: string
  isCollapsed?: boolean
  onTypingChange?: (isTyping: boolean) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  currentEngine,
  onEngineChange,
  visible,
  autoFocus = true,
  searchInNewTab = false,
  engines = DEFAULT_SEARCH_ENGINES,
  onOpenSettings,
  onUpdateEngines,
  className,
  isCollapsed = false,
  onTypingChange,
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rawTypedQueryRef = useRef<string>('')
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isTyping = query.trim().length > 0

  // Cleanup pending blur timers on unmount
  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current)
      }
    }
  }, [])

  // Load search history from local/extension storage on mount
  useEffect(() => {
    loadSearchHistory().then(setHistory)
  }, [])


  // Real-time synchronization of typing state with parent hero row coordinator
  useEffect(() => {
    onTypingChange?.(isTyping)
  }, [isTyping, onTypingChange])

  // Background permanent search engine icon migrator:
  // Converts any uncached search engine icons into permanent Base64 Data URLs on mount.
  useEffect(() => {
    if (!engines || engines.length === 0 || !onUpdateEngines) return
    let isMounted = true

    migrateSearchEnginesToPermanentCache(engines).then((migrated) => {
      if (isMounted && migrated) {
        onUpdateEngines(migrated)
      }
    })

    return () => {
      isMounted = false
    }
  }, [engines, onUpdateEngines])

  // Automatic search bar focus & text selection on browser launch, new tab open, window focus, and after hitting Home button
  useEffect(() => {
    if (!visible || !autoFocus) return

    const focusSearchInput = () => {
      if (!inputRef.current) return

      // Don't hijack focus if a modal or the customizer drawer is open
      const isModalOrDrawerOpen = !!(
        document.querySelector('[data-modal-backdrop]') ||
        document.querySelector('[role="dialog"]') ||
        document.querySelector('.settings-modal')
      )
      const activeEl = document.activeElement
      const isOtherInputActive =
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT') &&
        activeEl !== inputRef.current

      if (isModalOrDrawerOpen || isOtherInputActive) return

      inputRef.current.focus({ preventScroll: true })
      try {
        inputRef.current.select()
      } catch {
        // Safe fallback in non-standard environments
      }

      // Clean up the ?focus=1 query param from the address bar so the URL remains clean
      if (typeof window !== 'undefined' && window.location.search.includes('focus')) {
        try {
          const cleanSearch = window.location.search.replace(/[?&]focus=[^&]*/g, '').replace(/^&/, '?')
          const cleanUrl = window.location.pathname + (cleanSearch.length > 1 ? cleanSearch : '')
          window.history.replaceState(null, '', cleanUrl)
        } catch {}
      }
    }

    // 1. Initial focus routine on mount (New Tab open and Browser Launch)
    // In Chromium/Firefox new tabs, browser omnibox holds focus initially; staggered attempts capture focus seamlessly.
    focusSearchInput()
    const rafId = requestAnimationFrame(focusSearchInput)
    const t1 = setTimeout(focusSearchInput, 50)
    const t2 = setTimeout(focusSearchInput, 150)
    const t3 = setTimeout(focusSearchInput, 300)
    const t4 = setTimeout(focusSearchInput, 500)

    // 2. Window focus listener (when switching from other desktop apps or windows)
    const handleWindowFocus = () => {
      focusSearchInput()
      setTimeout(focusSearchInput, 50)
    }

    // 3. Tab visibility listener (when restoring background tabs or switching between tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        focusSearchInput()
        setTimeout(focusSearchInput, 50)
      }
    }

    // 4. Page show listener (fired after hitting Home button, back/forward navigation, or BFCache restore)
    const handlePageShow = () => {
      focusSearchInput()
      setTimeout(focusSearchInput, 50)
      setTimeout(focusSearchInput, 150)
    }

    // 5. Popstate listener (history navigation / home button)
    const handlePopState = () => {
      focusSearchInput()
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('popstate', handlePopState)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [visible, autoFocus])

  // When auto-focus is disabled, guarantee that any residual ?focus=1 query param is immediately cleaned from the URL
  useEffect(() => {
    if (!autoFocus && typeof window !== 'undefined' && window.location.search.includes('focus')) {
      try {
        const cleanSearch = window.location.search.replace(/[?&]focus=[^&]*/g, '').replace(/^&/, '?')
        const cleanUrl = window.location.pathname + (cleanSearch.length > 1 ? cleanSearch : '')
        window.history.replaceState(null, '', cleanUrl)
      } catch {}
    }
  }, [autoFocus])

  // Global keydown shortcuts: 'Alt+L' or '/' to focus & select, any typing when idle routes to search, and Escape to blur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setDropdownOpen(false)
        setShowSuggestions(false)
        return
      }

      // Alt + L shortcut: focus and select search bar from anywhere on the page
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === 'KeyL' || e.key === 'l' || e.key === 'L')) {
        // Don't intercept if a modal or customizer drawer is open
        if (
          document.querySelector('[data-modal-backdrop]') ||
          document.querySelector('[role="dialog"]') ||
          document.querySelector('.settings-modal')
        ) {
          return
        }

        e.preventDefault()
        inputRef.current?.focus({ preventScroll: true })
        inputRef.current?.select()
        return
      }

      // If active element is already an input or textarea, let it type normally
      const activeEl = document.activeElement
      const isInputActive =
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')

      if (isInputActive) return

      // Don't intercept if modifier keys like Ctrl, Cmd, Alt are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // Don't intercept if a modal or customizer drawer is open
      if (
        document.querySelector('[data-modal-backdrop]') ||
        document.querySelector('[role="dialog"]') ||
        document.querySelector('.settings-modal')
      ) {
        return
      }

      if (e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus({ preventScroll: true })
        inputRef.current?.select()
      } else if (e.key.length === 1 && !e.repeat && document.activeElement !== inputRef.current) {
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Real-time suggestions fetching based on query and active search engine
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || !isFocused) {
      const resetTimer = setTimeout(() => {
        setSuggestions((prev) => (prev.length > 0 ? [] : prev))
        setSelectedIndex((prev) => (prev !== -1 ? -1 : prev))
      }, 0)
      return () => clearTimeout(resetTimer)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetchSearchSuggestions(trimmed, currentEngine, controller.signal)
        .then((results) => {
          setSuggestions(results)
        })
        .catch(() => {
          // Ignored on abort or network error
        })
    }, 120)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, currentEngine, isFocused])

  const activeEnginesList = engines && engines.length > 0 ? engines : DEFAULT_SEARCH_ENGINES
  const activeEngine =
    activeEnginesList.find((e) => e.id === currentEngine) || activeEnginesList[0]


  const trimmedQuery = query.trim()

  // Compute matching history items based on frecency and query match
  const historyMatches = useMemo(() => {
    return getHistoryMatches(trimmedQuery, history, 4)
  }, [trimmedQuery, history])

  // Calculate top candidate for inline ghost auto-completion
  const ghostCandidate = useMemo(() => {
    return getTopGhostCompletion(query, historyMatches, suggestions)
  }, [query, historyMatches, suggestions])

  // Remainder to show as ghost text overlay
  const ghostRemainder =
    ghostCandidate &&
    ghostCandidate.toLowerCase().startsWith(query.toLowerCase()) &&
    ghostCandidate.length > query.length
      ? ghostCandidate.slice(query.length)
      : ''

  // Unified items for the suggestions dropdown (strictly active only when typing)
  const dropdownItems: SuggestionItem[] = useMemo(() => {
    if (!isTyping || !trimmedQuery) {
      return []
    }
    return [
      {
        id: 'current_query',
        type: 'current-query',
        query: trimmedQuery,
        score: 1000,
      },
      ...blendSuggestions(trimmedQuery, historyMatches, suggestions, 7),
    ]
  }, [isTyping, trimmedQuery, historyMatches, suggestions])


  const executeDirectUrlNavigation = (url: string) => {
    setShowSuggestions(false)
    setDropdownOpen(false)
    if (searchInNewTab) {
      window.open(url, '_blank')
    } else {
      window.location.assign(url)
    }
  }

  const executeSearchWithEngine = (engineId: string, customQuery?: string) => {
    const selectedItem = selectedIndex >= 0 ? dropdownItems[selectedIndex] : null

    // 1. If user selected a direct URL recommendation
    if (selectedItem?.type === 'url' && selectedItem.url) {
      addSearchHistory(selectedItem.query, currentEngine).then(setHistory)
      executeDirectUrlNavigation(selectedItem.url)
      return
    }

    const rawTarget =
      customQuery !== undefined
        ? customQuery
        : selectedItem
        ? selectedItem.query
        : query

    const trimmed = rawTarget.trim()
    if (!trimmed) return

    // 2. Direct URL navigation check (e.g. user typed "github.com" or "localhost:3000")
    if (isValidUrl(trimmed)) {
      addSearchHistory(trimmed, engineId).then(setHistory)
      const directUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      executeDirectUrlNavigation(directUrl)
      return
    }

    // 3. Asynchronously record into smart search history
    addSearchHistory(trimmed, engineId).then(setHistory)

    const engineToUse = activeEnginesList.find((e) => e.id === engineId) || activeEngine

    // Update active engine for future searches
    if (engineId !== currentEngine) {
      onEngineChange(engineId)
    }

    setShowSuggestions(false)
    setDropdownOpen(false)

    const targetUrl = buildSearchUrl(engineToUse.url, trimmed)
    if (searchInNewTab) {
      window.open(targetUrl, '_blank')
    } else {
      window.location.assign(targetUrl)
    }
  }

  const handleRemoveHistoryItem = (targetQuery: string) => {
    removeSearchHistoryItem(targetQuery).then(setHistory)
  }

  const handleClearAllHistory = () => {
    clearAllSearchHistory().then(() => setHistory([]))
  }

  const handleInsertSuggestion = (suggestionText: string) => {
    setQuery(suggestionText)
    rawTypedQueryRef.current = suggestionText
    setSelectedIndex(-1)
    setShowSuggestions(true)
    if (inputRef.current) {
      inputRef.current.focus()
      const len = suggestionText.length
      inputRef.current.setSelectionRange(len, len)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedItem = selectedIndex >= 0 ? dropdownItems[selectedIndex] : null
    const targetQuery =
      selectedItem
        ? selectedItem.query
        : query
    executeSearchWithEngine(currentEngine, targetQuery)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Shift + Delete: Chrome Omnibox instant removal of highlighted history suggestion
    if (e.shiftKey && e.key === 'Delete') {
      if (selectedIndex >= 0 && dropdownItems[selectedIndex]?.type === 'history') {
        e.preventDefault()
        const target = dropdownItems[selectedIndex].query
        handleRemoveHistoryItem(target)
        setSelectedIndex(-1)
        setQuery(rawTypedQueryRef.current)
        return
      }
    }

    // 2. Ctrl + Enter or Cmd + Enter: Browser Omnibox append "www. ... .com"
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      const clean = (selectedIndex >= 0 && dropdownItems[selectedIndex] ? dropdownItems[selectedIndex].query : query).trim()
      if (clean) {
        const url = /^https?:\/\//i.test(clean)
          ? clean
          : `https://www.${clean.replace(/^(https?:\/\/)?(www\.)?/, '')}.com`
        addSearchHistory(clean, currentEngine).then(setHistory)
        executeDirectUrlNavigation(url)
        return
      }
    }

    // 3. Tab key: First priority completes inline ghost text!
    if (e.key === 'Tab') {
      if (ghostRemainder && selectedIndex === -1) {
        e.preventDefault()
        const completed = query + ghostRemainder
        setQuery(completed)
        rawTypedQueryRef.current = completed
        return
      }

      // Second priority: cycles through right-side search engines when typing
      if (isTyping && activeEnginesList.length > 1) {
        e.preventDefault()
        const currentIndex = activeEnginesList.findIndex((eng) => eng.id === currentEngine)
        const validIndex = currentIndex >= 0 ? currentIndex : 0

        const targetIndex = e.shiftKey
          ? (validIndex - 1 + activeEnginesList.length) % activeEnginesList.length
          : (validIndex + 1) % activeEnginesList.length

        const nextEngine = activeEnginesList[targetIndex]
        if (nextEngine) {
          onEngineChange(nextEngine.id)
        }
        return
      }
    }

    // 4. ArrowRight or End key: accepts ghost completion when caret is at the end of input
    if ((e.key === 'ArrowRight' || e.key === 'End') && ghostRemainder && selectedIndex === -1) {
      const input = inputRef.current
      if (input && input.selectionStart === query.length && input.selectionEnd === query.length) {
        e.preventDefault()
        const completed = query + ghostRemainder
        setQuery(completed)
        rawTypedQueryRef.current = completed
        return
      }
    }

    // 5. ArrowDown: navigates dropdown suggestions with live input reflection (Google style)
    if (e.key === 'ArrowDown') {
      if (dropdownItems.length > 0) {
        e.preventDefault()
        const nextIndex = selectedIndex + 1 >= dropdownItems.length ? -1 : selectedIndex + 1
        setSelectedIndex(nextIndex)
        setShowSuggestions(true)
        if (nextIndex >= 0 && dropdownItems[nextIndex]) {
          setQuery(dropdownItems[nextIndex].query)
        } else {
          setQuery(rawTypedQueryRef.current)
        }
      }
    } else if (e.key === 'ArrowUp') {
      if (dropdownItems.length > 0) {
        e.preventDefault()
        const nextIndex = selectedIndex <= -1 ? dropdownItems.length - 1 : selectedIndex - 1
        setSelectedIndex(nextIndex)
        setShowSuggestions(true)
        if (nextIndex >= 0 && dropdownItems[nextIndex]) {
          setQuery(dropdownItems[nextIndex].query)
        } else {
          setQuery(rawTypedQueryRef.current)
        }
      }
    } else if (e.key === 'Escape') {
      if (showSuggestions || ghostRemainder || selectedIndex >= 0) {
        e.preventDefault()
        setShowSuggestions(false)
        setSelectedIndex(-1)
        setQuery(rawTypedQueryRef.current)
      } else {
        inputRef.current?.blur()
      }
    }
  }

  if (!visible) return null

  return (
    <div
      ref={containerRef}
      className={`w-full mx-auto relative ${
        dropdownOpen || (isTyping && showSuggestions && dropdownItems.length > 0) ? 'z-50' : 'z-20'
      } ${className !== undefined ? className : 'px-4'}`}
    >
      <div className="relative w-full">
        <GlassSurface
          width="100%"
          height={50}
          borderRadius={25}
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
          className={`w-full transition-shadow duration-300 ${
            isFocused ? 'ring-2 ring-[var(--accent-color)]/45 shadow-[0_16px_48px_rgba(0,0,0,0.5)]' : 'shadow-lg'
          }`}
          contentClassName={`!p-0 w-full h-full flex items-center ${
            isCollapsed && !isTyping ? 'justify-center' : 'justify-start'
          }`}
        >
        <form
          onSubmit={handleFormSubmit}
          onScroll={(e) => {
            e.currentTarget.scrollLeft = 0
          }}
          className={`w-full h-full flex items-center bg-transparent min-w-0 ${
            isCollapsed && !isTyping ? 'justify-center p-0' : 'px-3.5 sm:px-4'
          }`}
        >
          {/* Left Side: Search Engine Selector */}
          <div className={`flex items-center justify-center ${isCollapsed && !isTyping ? 'w-full h-full' : 'shrink-0'}`}>
            <EngineSelector
              currentEngineId={currentEngine}
              engines={activeEnginesList}
              isOpen={dropdownOpen}
              compact={isCollapsed && !isTyping}
              onToggle={() => {
                if (isCollapsed && !isTyping) {
                  inputRef.current?.focus()
                  return
                }
                setDropdownOpen(!dropdownOpen)
                setShowSuggestions(false)
              }}
            />
          </div>

          {/* Search Input Field with Inline Ghost Completion Overlay */}
          <div
            className={
              isCollapsed && !isTyping
                ? 'absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden'
                : 'relative flex-1 min-w-0 flex items-center h-full'
            }
          >
            {/* Ghost Auto-Completion Layer (Strictly Aligned) */}
            {ghostRemainder && selectedIndex === -1 && !isCollapsed && isFocused && (
              <div
                className="absolute inset-0 flex items-center pointer-events-none select-none px-2.5 text-sm sm:text-base font-medium truncate leading-normal"
                aria-hidden="true"
              >
                <span className="opacity-0 whitespace-pre">{query}</span>
                <span className="text-neutral-500 dark:text-neutral-400 font-normal whitespace-pre opacity-70">
                  {ghostRemainder}
                </span>
              </div>
            )}

            <input
              ref={inputRef}
              id="aura-search-input"
              autoFocus={visible && autoFocus}
              type="text"
              value={query}
              onChange={(e) => {
                const val = e.target.value

                // Fast Omnibox Bang shortcut check (e.g. "!yt ", "!w ", "!g ", "!d ")
                const bangMatch = val.match(/^!([a-zA-Z0-9]+)\s+(.*)$/)
                if (bangMatch) {
                  const shortcutKey = bangMatch[1].toLowerCase()
                  const remainderQuery = bangMatch[2]
                  const matchedEngine = activeEnginesList.find(
                    (eng) =>
                      eng.shortcut?.toLowerCase() === `!${shortcutKey}` ||
                      eng.shortcut?.toLowerCase() === shortcutKey ||
                      eng.id.toLowerCase() === shortcutKey
                  )
                  if (matchedEngine) {
                    onEngineChange(matchedEngine.id)
                    setQuery(remainderQuery)
                    rawTypedQueryRef.current = remainderQuery
                    setSelectedIndex(-1)
                    setShowSuggestions(true)
                    return
                  }
                }

                setQuery(val)
                rawTypedQueryRef.current = val
                if (dropdownOpen) setDropdownOpen(false)
                if (val.trim().length > 0) {
                  setShowSuggestions(true)
                } else {
                  setShowSuggestions(false)
                  setSelectedIndex(-1)
                }
              }}
              onKeyDown={handleInputKeyDown}
              onFocus={() => {
                if (blurTimerRef.current) {
                  clearTimeout(blurTimerRef.current)
                  blurTimerRef.current = null
                }
                setIsFocused(true)
                if (query.trim().length > 0) {
                  setShowSuggestions(true)
                } else {
                  setShowSuggestions(false)
                  setSelectedIndex(-1)
                }
              }}
              onBlur={() => {
                // Keep focused true slightly for click events
                if (blurTimerRef.current) {
                  clearTimeout(blurTimerRef.current)
                }
                blurTimerRef.current = setTimeout(() => {
                  setIsFocused(false)
                  setShowSuggestions(false)
                }, 250)
              }}

              placeholder={
                isCollapsed
                  ? 'Search...'
                  : `Search with ${activeEngine.name} or type a URL...`
              }
              title={`Search with ${activeEngine.name} (Alt+L or / to focus)`}
              className={`w-full bg-transparent py-1 text-sm sm:text-base text-black dark:text-white placeholder-neutral-600 dark:placeholder-white/45 font-medium focus:outline-none transition-opacity duration-200 ${
                isCollapsed && !isTyping ? 'sr-only' : 'px-2.5 opacity-100'
              }`}
            />
          </div>

          {/* Right Side: Normal submit button (when empty) OR row of round engine icons (when typing) */}
          {(!isCollapsed || isTyping) && (
            <AnimatePresence mode="wait" initial={false}>
              {!isTyping ? (
                <motion.div
                  key="submit-button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center shrink-0"
                >
                  <button
                    type="submit"
                    className="p-2 rounded-full text-neutral-800 dark:text-slate-300 hover:text-[var(--accent-color)] hover:bg-black/8 dark:hover:bg-white/10 transition-colors cursor-pointer border-0 outline-none"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="engine-thumbnails"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full flex items-center gap-1.5 shrink-0 pl-1.5 pr-1 select-none overflow-x-auto scrollbar-none max-w-[280px] sm:max-w-[340px]"
                >
                  {/* Subtle glass separator between input and engine thumbnails */}
                  <div className="w-px h-5 bg-neutral-900/10 dark:bg-white/15 mr-0.5 shrink-0" aria-hidden="true" />

                  {activeEnginesList.map((engine) => {
                    const isActive = engine.id === currentEngine
                    return (
                      <button
                        key={engine.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          executeSearchWithEngine(engine.id)
                        }}
                        title={`Search "${query.trim()}" on ${engine.name} (Press Tab to cycle)`}
                        className={`relative w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-0 outline-none select-none ${
                          isActive
                            ? 'bg-neutral-900/15 dark:bg-white/25 ring-2 ring-[var(--accent-color)] shadow-[0_0_10px_var(--accent-color)]/30 scale-105 z-10'
                            : 'bg-black/6 dark:bg-white/10 ring-1 ring-black/10 dark:ring-white/15 hover:bg-black/12 dark:hover:bg-white/20 hover:scale-105 active:scale-95 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <SearchEngineIcon engine={engine} size="sm" />
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </form>
      </GlassSurface>

      {/* Frosted Glass Dropdown rendered outside form to sample direct page backdrop */}
      <AnimatePresence>
        {!isTyping && dropdownOpen && (
          <EngineSelectorDropdown
            currentEngineId={currentEngine}
            engines={activeEnginesList}
            onSelect={(id) => {
              onEngineChange(id)
              setDropdownOpen(false)
              inputRef.current?.focus()
            }}
            onToggle={() => setDropdownOpen(!dropdownOpen)}
            onOpenSettings={onOpenSettings}
          />
        )}
      </AnimatePresence>

      {/* Realtime Autocomplete & History Suggestions Dropdown */}
      <AnimatePresence>
        {isTyping && showSuggestions && dropdownItems.length > 0 && (
          <SearchSuggestionsDropdown
            items={dropdownItems}
            selectedIndex={selectedIndex}
            query={query}
            activeEngine={activeEngine}
            onSelect={(selectedSuggestion) => {
              setQuery(selectedSuggestion)
              executeSearchWithEngine(currentEngine, selectedSuggestion)
            }}
            onInsert={handleInsertSuggestion}
            onRemoveHistoryItem={handleRemoveHistoryItem}
            onClearAllHistory={handleClearAllHistory}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}



