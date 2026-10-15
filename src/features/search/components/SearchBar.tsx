import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { DEFAULT_SEARCH_ENGINES } from '../config/defaultEngines'
import { EngineSelector } from './EngineSelector'
import { buildSearchUrl } from '../utils/searchUrlHelper'

interface SearchBarProps {
  currentEngine: string
  onEngineChange: (engine: string) => void
  visible: boolean
  searchInNewTab?: boolean
  engines?: SearchEngineItem[]
  onOpenSettings?: () => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  currentEngine,
  onEngineChange,
  visible,
  searchInNewTab = false,
  engines = DEFAULT_SEARCH_ENGINES,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    // Staggered ticks ensure our extension search bar reliably claims focus once DOM is active.
    const rafId = requestAnimationFrame(focusSearchInput)
    const t1 = setTimeout(focusSearchInput, 50)
    const t2 = setTimeout(focusSearchInput, 150)
    const t3 = setTimeout(focusSearchInput, 300)

    // 3. Focus when window or tab gains focus (e.g. clicking Home button or switching back to tab)
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
        // Any regular single character (a-z, 0-9, etc.) instantly focuses search bar
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!visible) return null

  const activeEnginesList = engines && engines.length > 0 ? engines : DEFAULT_SEARCH_ENGINES
  const activeEngine =
    activeEnginesList.find((e) => e.id === currentEngine) || activeEnginesList[0]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    const targetUrl = buildSearchUrl(activeEngine.url, trimmed)

    if (searchInNewTab) {
      window.open(targetUrl, '_blank')
    } else {
      window.location.href = targetUrl
    }
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-2xl mx-auto relative px-4 transition-all ${
        dropdownOpen ? 'z-50' : 'z-20'
      }`}
    >
      <form
        onSubmit={handleSearch}
        className={`rounded-full flex items-center px-4 py-2.5 transition-all duration-300 shadow-xl backdrop-blur-xl ${
          isFocused
            ? 'bg-black/55 shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_24px_var(--accent-glow)]'
            : 'bg-black/35 hover:bg-black/45'
        }`}
      >
        <EngineSelector
          currentEngineId={currentEngine}
          engines={activeEnginesList}
          isOpen={dropdownOpen}
          onToggle={() => setDropdownOpen(!dropdownOpen)}
          onSelect={(id) => {
            onEngineChange(id)
            setDropdownOpen(false)
            inputRef.current?.focus()
          }}
          onOpenSettings={onOpenSettings}
        />

        <input
          ref={inputRef}
          id="aura-search-input"
          autoFocus={visible}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Search with ${activeEngine.name} or type a URL...`}
          className="flex-1 bg-transparent px-3 py-1 text-sm sm:text-base text-white placeholder-white/50 focus:outline-none"
        />

        <div className="flex items-center pr-1">
          <button
            type="submit"
            className="p-2 rounded-full text-slate-300 hover:text-[var(--accent-color)] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  )
}
