import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { DEFAULT_SEARCH_ENGINES } from '../config/defaultEngines'
import { EngineSelector, EngineSelectorDropdown } from './EngineSelector'
import { SearchEngineIcon } from './SearchEngineIcon'
import { SearchSuggestionsDropdown } from './SearchSuggestionsDropdown'
import { buildSearchUrl } from '../utils/searchUrlHelper'
import { migrateSearchEnginesToPermanentCache } from '../utils/searchFaviconHelper'
import { fetchSearchSuggestions } from '../utils/searchSuggestionsHelper'

interface SearchBarProps {
  currentEngine: string
  onEngineChange: (engine: string) => void
  visible: boolean
  searchInNewTab?: boolean
  engines?: SearchEngineItem[]
  onOpenSettings?: () => void
  onUpdateEngines?: (engines: SearchEngineItem[]) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  currentEngine,
  onEngineChange,
  visible,
  searchInNewTab = false,
  engines = DEFAULT_SEARCH_ENGINES,
  onOpenSettings,
  onUpdateEngines,
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isTyping = query.trim().length > 0

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

  // Automatic search bar focus & text selection on browser launch, new tab open, and window focus
  useEffect(() => {
    if (!visible) return

    const focusSearchInput = () => {
      // Don't hijack focus if a modal or the customizer drawer is open
      const isModalOrDrawerOpen = !!document.querySelector('.fixed.inset-0.z-50')
      const activeEl = document.activeElement
      const isOtherInputActive =
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT') &&
        activeEl !== inputRef.current

      if (isModalOrDrawerOpen || isOtherInputActive) return

      inputRef.current?.focus({ preventScroll: true })
      inputRef.current?.select()
    }

    // 1. Initial focus on mount
    focusSearchInput()

    // 2. In browser new tabs (Chromium/Firefox), the browser omnibox initially holds focus.
    const rafId = requestAnimationFrame(focusSearchInput)
    const t1 = setTimeout(focusSearchInput, 50)
    const t2 = setTimeout(focusSearchInput, 150)
    const t3 = setTimeout(focusSearchInput, 300)

    const handleWindowFocus = () => {
      focusSearchInput()
    }

    window.addEventListener('focus', handleWindowFocus)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [visible])

  // Global keydown shortcuts: '/' to focus, any typing when idle routes to search, and Escape to blur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setDropdownOpen(false)
        setShowSuggestions(false)
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
      if (document.querySelector('.fixed.inset-0.z-50')) return

      if (e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
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
        setSuggestions([])
        setSelectedIndex(-1)
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

  if (!visible) return null

  const activeEnginesList = engines && engines.length > 0 ? engines : DEFAULT_SEARCH_ENGINES
  const activeEngine =
    activeEnginesList.find((e) => e.id === currentEngine) || activeEnginesList[0]

  const allDropdownItems = isTyping
    ? [
        query.trim(),
        ...suggestions
          .filter((s) => s.trim().toLowerCase() !== query.trim().toLowerCase())
          .slice(0, 7),
      ]
    : []

  const executeSearchWithEngine = (engineId: string, customQuery?: string) => {
    const rawTarget =
      customQuery !== undefined
        ? customQuery
        : selectedIndex >= 0 && allDropdownItems[selectedIndex]
        ? allDropdownItems[selectedIndex]
        : query
    const trimmed = rawTarget.trim()
    if (!trimmed) return

    const engineToUse = activeEnginesList.find((e) => e.id === engineId) || activeEngine

    // Per user choice A1: Update active engine for future searches as well!
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetQuery =
      selectedIndex >= 0 && allDropdownItems[selectedIndex]
        ? allDropdownItems[selectedIndex]
        : query
    executeSearchWithEngine(currentEngine, targetQuery)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab / Shift+Tab cycles through the right-side search engines when typing
    if (e.key === 'Tab' && isTyping && activeEnginesList.length > 1) {
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

    if (e.key === 'ArrowDown') {
      if (allDropdownItems.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1 >= allDropdownItems.length ? 0 : prev + 1))
        setShowSuggestions(true)
      }
    } else if (e.key === 'ArrowUp') {
      if (allDropdownItems.length > 0) {
        e.preventDefault()
        setSelectedIndex((prev) => (prev <= 0 ? allDropdownItems.length - 1 : prev - 1))
        setShowSuggestions(true)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  // Smoothly auto-expand the search bar width if there are many search engines to contain
  const containerMaxWidthClass = isTyping
    ? activeEnginesList.length >= 8
      ? 'max-w-4xl'
      : activeEnginesList.length >= 6
      ? 'max-w-3xl'
      : activeEnginesList.length >= 5
      ? 'max-w-[720px]'
      : 'max-w-2xl'
    : 'max-w-2xl'

  return (
    <div
      ref={containerRef}
      className={`w-full ${containerMaxWidthClass} mx-auto relative px-4 transition-[max-width] duration-300 ease-out ${
        dropdownOpen || (isTyping && showSuggestions) ? 'z-50' : 'z-20'
      }`}
    >
      <form
        onSubmit={handleFormSubmit}
        className={`rounded-full min-h-[50px] flex items-center px-4.5 py-2 transition-[background-color,box-shadow] duration-200 shadow-xl backdrop-blur-xl backdrop-saturate-150 ${
          isFocused
            ? 'bg-black/55 shadow-[0_16px_40px_rgba(0,0,0,0.5)]'
            : 'bg-black/35 hover:bg-black/45'
        }`}
        style={{
          WebkitBackdropFilter: 'blur(24px) saturate(150%)',
          backdropFilter: 'blur(24px) saturate(150%)',
        }}
      >
        {/* Left Side: Search Engine Selector (Hidden when typing) OR Subtle Magnifying Glass (When typing) */}
        {!isTyping ? (
          <EngineSelector
            currentEngineId={currentEngine}
            engines={activeEnginesList}
            isOpen={dropdownOpen}
            onToggle={() => {
              setDropdownOpen(!dropdownOpen)
              setShowSuggestions(false)
            }}
          />
        ) : (
          <Search className="w-4.5 h-4.5 text-white/60 shrink-0 ml-0.5 mr-2 select-none pointer-events-none" />
        )}

        {/* Search Input Field */}
        <input
          ref={inputRef}
          id="aura-search-input"
          autoFocus={visible}
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
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
            setIsFocused(true)
            if (query.trim().length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => {
            // Keep focused true slightly for click events
            setTimeout(() => {
              setIsFocused(false)
              setShowSuggestions(false)
            }, 250)
          }}
          placeholder={`Search with ${activeEngine.name} or type a URL...`}
          className="flex-1 bg-transparent px-2.5 py-1 text-sm sm:text-base text-white placeholder-white/45 focus:outline-none"
        />

        {/* Right Side: Normal submit button (when empty) OR row of round engine icons (when typing) */}
        {!isTyping ? (
          <div className="flex items-center pr-1">
            <button
              type="submit"
              className="p-2 rounded-full text-slate-300 hover:text-[var(--accent-color)] hover:bg-white/10 transition-colors cursor-pointer border-0 outline-none"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0 py-1 pl-2 pr-0.5 select-none overflow-x-auto scrollbar-none max-w-[55vw]">
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center p-1.5 cursor-pointer transition-all duration-200 border-0 outline-none ${
                    isActive
                      ? 'bg-white/30 ring-2 ring-white shadow-[0_2px_10px_rgba(0,0,0,0.35)]'
                      : 'bg-white/10 hover:bg-white/20 opacity-75 hover:opacity-100'
                  }`}
                >
                  <SearchEngineIcon engine={engine} size="sm" />
                </button>
              )
            })}
          </div>
        )}
      </form>

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

      {/* Realtime Autocomplete Suggestions Dropdown */}
      <AnimatePresence>
        {isTyping && showSuggestions && (
          <SearchSuggestionsDropdown
            suggestions={suggestions}
            selectedIndex={selectedIndex}
            query={query}
            activeEngine={activeEngine}
            onSelect={(selectedSuggestion) => {
              setQuery(selectedSuggestion)
              executeSearchWithEngine(currentEngine, selectedSuggestion)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
