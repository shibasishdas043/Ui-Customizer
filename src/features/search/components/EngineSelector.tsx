import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sliders } from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { DEFAULT_SEARCH_ENGINES } from '../config/defaultEngines'
import { SearchEngineIcon } from './SearchEngineIcon'

interface EngineSelectorProps {
  currentEngineId: string
  engines?: SearchEngineItem[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (id: string) => void
  onOpenSettings?: () => void
}

export const EngineSelector: React.FC<EngineSelectorProps> = ({
  currentEngineId,
  engines = DEFAULT_SEARCH_ENGINES,
  isOpen,
  onToggle,
  onSelect,
  onOpenSettings,
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors text-xs font-medium text-slate-300 cursor-pointer"
        title={hasMultiple ? `Search Engine: ${activeEngine.name}` : `Active Engine: ${activeEngine.name}`}
      >
        <SearchEngineIcon engine={activeEngine} size="md" />
        <span className="hidden sm:inline font-medium">{activeEngine.name}</span>
        {hasMultiple && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 mt-2.5 w-56 bg-[#0c121e]/95 backdrop-blur-2xl rounded-2xl py-2 z-50 shadow-[0_24px_60px_rgba(0,0,0,0.85)] max-h-[380px] overflow-y-auto overflow-x-hidden scrollbar-none"
          >
            <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Search Engine
            </div>

            <div className="py-1">
              {activeEnginesList.map((engine) => {
                const isSelected = engine.id === currentEngineId
                return (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => onSelect(engine.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white/15 text-white font-semibold'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SearchEngineIcon engine={engine} size="md" />
                      <span className="truncate">{engine.name}</span>
                    </div>
                    {engine.category === 'AI' && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-400 shrink-0">
                        AI
                      </span>
                    )}
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
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-[var(--accent-color)] hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Manage Search Engines...</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
