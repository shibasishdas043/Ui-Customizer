import type React from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Sliders, Check } from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { DEFAULT_SEARCH_ENGINES } from '../config/defaultEngines'
import { SearchEngineIcon } from './SearchEngineIcon'

export interface EngineSelectorProps {
  currentEngineId: string
  engines?: SearchEngineItem[]
  isOpen: boolean
  onToggle: () => void
  onSelect?: (id: string) => void
  onOpenSettings?: () => void
}

export const EngineSelector: React.FC<EngineSelectorProps> = ({
  currentEngineId,
  engines = DEFAULT_SEARCH_ENGINES,
  isOpen,
  onToggle,
}) => {
  const activeEnginesList = engines && engines.length > 0 ? engines : DEFAULT_SEARCH_ENGINES
  const activeEngine =
    activeEnginesList.find((e) => e.id === currentEngineId) || activeEnginesList[0]

  const hasMultiple = activeEnginesList.length > 1

  return (
    <div className="relative select-none">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/15 transition-colors text-xs font-medium text-white/90 hover:text-white cursor-pointer border-0 outline-none"
        title={hasMultiple ? `Search Engine: ${activeEngine.name}` : `Active Engine: ${activeEngine.name}`}
      >
        <SearchEngineIcon engine={activeEngine} size="md" />
        <span className="hidden sm:inline font-medium">{activeEngine.name}</span>
        {hasMultiple && (
          <ChevronDown
            className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--accent-color)] opacity-100' : ''
            }`}
          />
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
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className="absolute left-8 top-full mt-2 w-64 z-50 pointer-events-auto select-none"
    >
      <div
        className="w-full rounded-2xl py-2 max-h-[380px] overflow-y-auto overflow-x-hidden scrollbar-none border-0 outline-none"
        style={{
          backgroundColor: 'rgba(18, 18, 18, 0.68)',
          WebkitBackdropFilter: 'blur(36px) saturate(180%)',
          backdropFilter: 'blur(36px) saturate(180%)',
          boxShadow: '0 24px 60px -8px rgba(0, 0, 0, 0.6), 0 8px 24px -4px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-[1.5px] text-white/50 select-none">
          Search Engine
        </div>

        <div className="py-1 px-1.5 space-y-0.5">
          {activeEnginesList.map((engine) => {
            const isSelected = engine.id === currentEngineId
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => onSelect(engine.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-all duration-150 cursor-pointer rounded-xl border-0 outline-none ${
                  isSelected
                    ? 'bg-white/18 text-white font-semibold shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SearchEngineIcon engine={engine} size="md" />
                  <span className="truncate">{engine.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {engine.category === 'AI' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/25 text-cyan-300 shrink-0">
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
          <div className="pt-1.5 mt-1 px-1.5">
            <button
              type="button"
              onClick={() => {
                onToggle()
                onOpenSettings()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-0 outline-none"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Manage Search Engines...</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
