import type React from 'react'
import { motion } from 'framer-motion'
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
  const activeEngine =
    activeEnginesList.find((e) => e.id === currentEngineId) || activeEnginesList[0]

  const hasMultiple = activeEnginesList.length > 1

  return (
    <div className={`relative select-none flex items-center justify-center ${compact ? 'w-full h-full' : 'shrink-0'}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center rounded-full shrink-0 hover:bg-black/8 dark:hover:bg-white/15 transition-colors text-xs font-semibold text-neutral-950 dark:text-white/90 hover:text-black dark:hover:text-white cursor-pointer border-0 outline-none ${
          compact ? 'w-full h-full p-0 justify-center' : 'gap-2 px-2.5 sm:px-3 py-1.5'
        }`}
        title={hasMultiple ? `Search Engine: ${activeEngine.name}` : `Active Engine: ${activeEngine.name}`}
      >
        <div className="shrink-0 flex items-center justify-center">
          <SearchEngineIcon engine={activeEngine} size="md" />
        </div>
        {!compact && (
          <>
            <span className="hidden sm:inline font-semibold truncate max-w-[120px]">{activeEngine.name}</span>
            {hasMultiple && (
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 text-neutral-800 dark:text-white/70 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? 'rotate-180 text-[var(--accent-color)] opacity-100' : 'opacity-70'
                }`}
              />
            )}
          </>
        )}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-3.5 sm:left-4 top-full mt-2 w-64 z-50 pointer-events-auto select-none origin-top-left"
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
        className="w-64 overflow-hidden"
        contentClassName="p-2.5 flex flex-col !justify-start w-full overflow-hidden"
      >
        <div className="w-full max-h-[380px] overflow-y-auto overflow-x-hidden scrollbar-glass">
          <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-neutral-800 dark:text-white/60 select-none">
            Search Engine
          </div>

          <div className="py-1 space-y-0.5">
            {activeEnginesList.map((engine) => {
              const isSelected = engine.id === currentEngineId
              return (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => onSelect(engine.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-all duration-150 cursor-pointer rounded-xl border-0 outline-none ${
                    isSelected
                      ? 'bg-black/15 dark:bg-white/18 text-black dark:text-white font-bold shadow-xs'
                      : 'text-neutral-900 dark:text-white/85 font-medium hover:bg-black/8 dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
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

          {onOpenSettings && (
            <div className="pt-2 mt-1.5 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  onToggle()
                  onOpenSettings()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-800 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/8 dark:hover:bg-white/10 transition-colors cursor-pointer border-0 outline-none group"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Sliders className="w-3.5 h-3.5 text-neutral-700 dark:text-white/60 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </div>
                <span className="truncate">Manage Search Engines...</span>
              </button>
            </div>
          )}
        </div>
      </GlassSurface>
    </motion.div>
  )
}
