import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { DEFAULT_SEARCH_ENGINES, SEARCH_ENGINE_PRESETS } from '../config/defaultEngines'
import { SearchEngineIcon } from './SearchEngineIcon'
import { SearchEngineEditorModal } from './SearchEngineEditorModal'

interface SearchEnginesManagerProps {
  engines: SearchEngineItem[]
  onUpdateEngines: (engines: SearchEngineItem[]) => void
  currentEngineId: string
  onSelectDefaultEngine: (engineId: string) => void
}

export const SearchEnginesManager: React.FC<SearchEnginesManagerProps> = ({
  engines,
  onUpdateEngines,
  currentEngineId,
  onSelectDefaultEngine,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingEngine, setEditingEngine] = useState<SearchEngineItem | null>(null)

  const handleOpenAdd = () => {
    setEditingEngine(null)
    setIsEditorOpen(true)
  }

  const handleOpenEdit = (engine: SearchEngineItem) => {
    setEditingEngine(engine)
    setIsEditorOpen(true)
  }

  const handleSaveEngine = (saved: SearchEngineItem) => {
    const exists = engines.some((e) => e.id === saved.id)
    if (exists) {
      onUpdateEngines(engines.map((e) => (e.id === saved.id ? saved : e)))
    } else {
      onUpdateEngines([...engines, saved])
    }
  }

  const handleDelete = (id: string) => {
    if (engines.length <= 1) {
      alert('You must keep at least one search engine.')
      return
    }

    const updated = engines.filter((e) => e.id !== id)
    onUpdateEngines(updated)

    // If deleting the currently active default engine, fall back to the first available engine
    if (currentEngineId === id) {
      onSelectDefaultEngine(updated[0].id)
    }
  }

  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    const updated = [...engines]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    onUpdateEngines(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index >= engines.length - 1) return
    const updated = [...engines]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    onUpdateEngines(updated)
  }

  const handleAddPreset = (preset: (typeof SEARCH_ENGINE_PRESETS)[0]) => {
    const alreadyExists = engines.some(
      (e) => e.id === preset.id || e.url.toLowerCase() === preset.url.toLowerCase(),
    )
    if (alreadyExists) return

    onUpdateEngines([...engines, preset])
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset search engines to default 5 major engines?')) {
      onUpdateEngines(DEFAULT_SEARCH_ENGINES)
      onSelectDefaultEngine('google')
    }
  }

  // Filter preset chips that are not yet added
  const availablePresets = SEARCH_ENGINE_PRESETS.filter(
    (preset) => !engines.some((e) => e.id === preset.id || e.name.toLowerCase() === preset.name.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      {/* 1. Popular & AI Presets (1-Click Add) */}
      {availablePresets.length > 0 && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-semibold text-white">Add Popular & AI Engines</h4>
            </div>
            <span className="text-[10px] text-slate-400">1-click add</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availablePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-white/[0.08] text-slate-300 text-xs transition-colors cursor-pointer"
              >
                <SearchEngineIcon engine={preset} size="sm" />
                <span>+{preset.name}</span>
                {preset.category === 'AI' && (
                  <span className="text-[9px] text-cyan-400 font-semibold uppercase">AI</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Configured Search Engines List */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--accent-color)]" />
              Configured Search Engines ({engines.length})
            </h4>
            <p className="text-[11px] text-slate-400">Set default, reorder, modify URLs, or delete</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Reset to 5 default major engines"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-[var(--accent-color)] hover:opacity-90 text-[var(--accent-contrast,#ffffff)] text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Engine</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {engines.map((engine, idx) => {
              const isDefault = engine.id === currentEngineId
              return (
                <motion.div
                  key={engine.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                    isDefault
                      ? 'bg-[var(--accent-color)]/15 shadow-sm'
                      : 'bg-black/35 hover:bg-black/50'
                  }`}
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center shrink-0">
                      <SearchEngineIcon engine={engine} size="md" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {engine.name}
                        </span>
                        {engine.category === 'AI' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-400 shrink-0">
                            AI
                          </span>
                        )}
                        {isDefault && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] shadow-sm shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-slate-400 truncate max-w-[170px] sm:max-w-[210px] font-mono mt-0.5">
                        {engine.url}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => onSelectDefaultEngine(engine.id)}
                        title="Set as Default Search Engine"
                        className="px-2.5 py-1 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      title="Move Up"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === engines.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      title="Move Down"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(engine)}
                      title="Modify Search Engine"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--accent-color)] hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={engines.length <= 1}
                      onClick={() => handleDelete(engine.id)}
                      title={engines.length <= 1 ? 'At least one engine is required' : 'Delete Search Engine'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Editor Modal */}
      <SearchEngineEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingEngine(null)
        }}
        onSave={handleSaveEngine}
        initialEngine={editingEngine}
      />
    </div>
  )
}
