import type React from 'react'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sliders, Check } from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { DEFAULT_SEARCH_ENGINES } from '../config/defaultEngines'
import { SearchEngineIcon } from './SearchEngineIcon'
import { GlassSurface } from '../../../shared/components/GlassSurface'

export interface EngineSelectorProps {
  currentEngineId: string
  engines?: SearchEngineItem[]
  isOpen: boolean
  onToggle: () => void
  onSelect?: (id: string) => void
  onOpenSettings?: () => void
  compact?: boolean
}

export const EngineSelector: React.FC<EngineSelectorProps> = ({
  currentEngineId,
  engines = DEFAULT_SEARCH_ENGINES,
  isOpen,
  onToggle,
  compact = false,
}) => {
  const activeEnginesList = engines && engines.length > 0 ? engines : DEFAULT_SEARCH_ENGINES
  const fallbackEngine: SearchEngineItem = DEFAULT_SEARCH_ENGINES[0]
  const activeEngine =
    activeEnginesList.find((e) => e.id === currentEngineId) || activeEnginesList[0] || fallbackEngine

  const hasMultiple = activeEnginesList.length > 1

  return (
    <div className="relative select-none flex items-center justify-center shrink-0 h-full">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={hasMultiple ? `Search Engine: ${activeEngine.name}` : `Active Engine: ${activeEngine.name}`}
        className="h-[50px] flex items-center rounded-full shrink-0 hover:bg-black/8 dark:hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] transition-colors text-xs font-semibold text-neutral-950 dark:text-white/90 hover:text-black dark:hover:text-white cursor-pointer border-0 outline-none"
        title={hasMultiple ? `Search Engine: ${activeEngine.name}` : `Active Engine: ${activeEngine.name}`}
      >
        <div className="w-[50px] h-[50px] shrink-0 flex items-center justify-center">
          <SearchEngineIcon engine={activeEngine} size="md" />
        </div>
        <AnimatePresence initial={false}>
          {!compact && (
            <motion.div
              initial={{ opacity: 0, width: 0, filter: 'blur(3px)' }}
              animate={{ opacity: 1, width: 'auto', filter: 'blur(0px)' }}
              exit={{ opacity: 0, width: 0, filter: 'blur(3px)' }}
              transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-center gap-1.5 pr-3 overflow-hidden whitespace-nowrap will-change-[width,opacity,filter]"
            >
              <span className="hidden sm:inline font-semibold truncate max-w-[120px]">{activeEngine.name}</span>
              {hasMultiple && (
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 text-neutral-800 dark:text-white/70 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? 'rotate-180 text-[var(--accent-color)] opacity-100' : 'opacity-70'
                  }`}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}

export interface EngineSelectorDropdownProps {
  currentEngineId: string
  engines?: SearchEngineItem[]
  onSelect: (id: string) => void
  onToggle: () => void
  onOpenSettings?: () => void
}

export const EngineSelectorDropdown: React.FC<EngineSelectorDropdownProps> = ({
  currentEngineId,
  engines = DEFAULT_SEARCH_ENGINES,
  onSelect,
  onToggle,
  onOpenSettings,
}) => {
  const activeEnginesList = engines && engines.length > 0 ? engines : DEFAULT_SEARCH_ENGINES
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLButtonElement>(null)

  const [maxHeightStyle, setMaxHeightStyle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const initialAvailable = window.innerHeight - 300
      return `${Math.min(340, Math.max(160, Math.floor(initialAvailable)))}px`
    }
    return '320px'
  })

  // Dynamically clamp dropdown height so it NEVER crosses the browser bottom or hides under the Windows taskbar
  useEffect(() => {
    const updateBounds = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect()
        // Provide safe clearance (20px) from the viewport bottom / Windows taskbar
        const top = rect.top > 0 ? rect.top : 280
        const available = window.innerHeight - top - 20
        // Cap at a clean aesthetic ceiling (340px) so on tall screens it doesn't stretch excessively,
        // and clamp strictly to available space with a minimum of 160px.
        const calculatedMax = Math.min(340, Math.max(160, Math.floor(available)))
        const next = `${calculatedMax}px`
        setMaxHeightStyle((prev) => (prev !== next ? next : prev))
      }
    }

    updateBounds()
    const rafId = requestAnimationFrame(updateBounds)
    // Extra update after motion transition settles (220ms duration)
    const animTimer = setTimeout(updateBounds, 250)
    window.addEventListener('resize', updateBounds)
    window.addEventListener('scroll', updateBounds, true)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(animTimer)
      window.removeEventListener('resize', updateBounds)
      window.removeEventListener('scroll', updateBounds, true)
    }
  }, [activeEnginesList.length])

  // Scroll active engine into view strictly inside the container without scrolling the window
  useEffect(() => {
    const timer = setTimeout(() => {
      if (listRef.current && selectedItemRef.current) {
        const container = listRef.current
        const item = selectedItemRef.current
        const containerRect = container.getBoundingClientRect()
        const itemRect = item.getBoundingClientRect()

        if (itemRect.top < containerRect.top) {
          container.scrollTop -= (containerRect.top - itemRect.top)
        } else if (itemRect.bottom > containerRect.bottom) {
          container.scrollTop += (itemRect.bottom - containerRect.bottom)
        }
      }
    }, 60)
    return () => clearTimeout(timer)
  }, [currentEngineId])

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-3.5 sm:left-4 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] z-50 pointer-events-auto select-none origin-top-left"
    >
      <GlassSurface
        width={256}
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
        className="w-64 max-w-full overflow-hidden flex flex-col shadow-2xl"
        contentClassName="p-2.5 flex flex-col !justify-start !items-stretch w-full h-full min-h-0 overflow-hidden"
        style={{ maxHeight: maxHeightStyle }}
      >
        {/* Dropdown Header */}
        <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-800 dark:text-white/60 select-none shrink-0">
          Search Engine
        </div>

        {/* Scrollable Engines List */}
        <div
          ref={listRef}
          role="menu"
          aria-label="Search engines"
          className="py-1 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-glass flex-1 min-h-0 pr-0.5 overscroll-contain"
        >
          {activeEnginesList.map((engine) => {
            const isSelected = engine.id === currentEngineId
            return (
              <button
                key={engine.id}
                ref={isSelected ? selectedItemRef : undefined}
                type="button"
                role="menuitem"
                aria-label={engine.name}
                title={engine.name}
                onClick={() => onSelect(engine.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-all duration-150 cursor-pointer rounded-xl border-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
                  isSelected
                    ? 'bg-black/15 dark:bg-white/18 text-black dark:text-white font-bold shadow-xs'
                    : 'text-neutral-900 dark:text-white/85 font-medium hover:bg-black/8 dark:hover:bg-white/10 hover:text-black dark:hover:text-white focus-visible:bg-black/8 dark:focus-visible:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <SearchEngineIcon engine={engine} size="md" />
                  </div>
                  <span className="truncate">{engine.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {engine.category === 'AI' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 shrink-0">
                      AI
                    </span>
                  )}
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[var(--accent-color)] stroke-[2.5]" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Dropdown Settings Footer */}
        {onOpenSettings && (
          <div className="pt-2 mt-1.5 border-t border-black/10 dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => {
                onToggle()
                onOpenSettings()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-800 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/8 dark:hover:bg-white/10 focus-visible:bg-black/8 dark:focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] transition-colors cursor-pointer border-0 outline-none group"
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Sliders className="w-3.5 h-3.5 text-neutral-700 dark:text-white/60 group-hover:text-black dark:group-hover:text-white transition-colors" />
              </div>
              <span className="truncate">Manage Search Engines...</span>
            </button>
          </div>
        )}
      </GlassSurface>
    </motion.div>
  )
}
