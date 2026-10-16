import { useState } from 'react'
import type React from 'react'
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
import { resolveAndCacheSearchFavicon } from '../utils/searchFaviconHelper'

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

  const handleSaveEngine = async (saved: SearchEngineItem) => {
    let engineToSave = saved
    if (!saved.icon || !saved.icon.startsWith('data:image/')) {
      try {
        const cachedIcon = await resolveAndCacheSearchFavicon(saved.url, saved.icon)
        if (cachedIcon) {
          engineToSave = { ...saved, icon: cachedIcon }
        }
      } catch {}
    }

    const exists = engines.some((e) => e.id === engineToSave.id)
    if (exists) {
      onUpdateEngines(engines.map((e) => (e.id === engineToSave.id ? engineToSave : e)))
    } else {
      onUpdateEngines([...engines, engineToSave])
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

  const handleAddPreset = async (preset: (typeof SEARCH_ENGINE_PRESETS)[0]) => {
    const alreadyExists = engines.some(
      (e) => e.id === preset.id || e.url.toLowerCase() === preset.url.toLowerCase(),
    )
    if (alreadyExists) return

    // Immediately resolve and bake the live site favicon into permanent Base64 Data URL
    const cachedIcon = await resolveAndCacheSearchFavicon(preset.url, preset.icon)
    const engineWithLiveIcon: SearchEngineItem = {
      ...preset,
      icon: cachedIcon || '',
      iconType: 'favicon',
    }

    onUpdateEngines([...engines, engineWithLiveIcon])
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
              <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">Add Popular & AI Engines</h4>
            </div>
            <span className="text-[10px] text-[#383531] dark:text-slate-400 font-medium">1-click add</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availablePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-black/30 hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] text-[#141413] dark:text-slate-300 text-xs font-semibold shadow-xs transition-colors cursor-pointer border-0 outline-none"
              >
                <SearchEngineIcon engine={preset} size="sm" />
                <span>+{preset.name}</span>
                {preset.category === 'AI' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-cyan-500/20 dark:text-cyan-400 font-bold uppercase">AI</span>
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
            <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--accent-color)]" />
              Configured Search Engines ({engines.length})
            </h4>
            <p className="text-[11px] text-[#383531] dark:text-slate-400 font-medium">Set default, reorder, modify URLs, or delete</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Reset to 5 default major engines"
              className="p-1.5 rounded-xl text-[#141413] dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-0 outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-[var(--accent-color)] hover:opacity-90 text-[var(--accent-contrast,#ffffff)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border-0 outline-none shadow-none"
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
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all border-0 outline-none shadow-xs ${
                    isDefault
                      ? 'bg-rose-50/90 dark:bg-[var(--accent-color)]/15'
                      : 'bg-white dark:bg-black/35 hover:bg-[#fcfbf9] dark:hover:bg-black/50'
                  }`}
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#efe9de] dark:bg-black/40 flex items-center justify-center shrink-0">
                      <SearchEngineIcon engine={engine} size="md" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#141413] dark:text-slate-100 truncate">
                          {engine.name}
                        </span>
                        {engine.category === 'AI' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-cyan-500/15 dark:text-cyan-400 shrink-0">
                            AI
                          </span>
                        )}
                        {isDefault && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-[#383531] dark:text-slate-400 truncate max-w-[170px] sm:max-w-[210px] font-mono font-medium mt-0.5">
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
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold text-[#141413] dark:text-slate-300 bg-[#efe9de] dark:bg-white/[0.06] hover:bg-[#dfd7c9] dark:hover:bg-white/[0.12] transition-colors cursor-pointer border-0 outline-none"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      title="Move Up"
                      className="p-1.5 rounded-lg text-[#141413] dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer border-0 outline-none"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === engines.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      title="Move Down"
                      className="p-1.5 rounded-lg text-[#141413] dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer border-0 outline-none"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(engine)}
                      title="Modify Search Engine"
                      className="p-1.5 rounded-lg text-[#141413] dark:text-slate-400 hover:text-[var(--accent-color)] hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-0 outline-none"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={engines.length <= 1}
                      onClick={() => handleDelete(engine.id)}
                      title={engines.length <= 1 ? 'At least one engine is required' : 'Delete Search Engine'}
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer border-0 outline-none"
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
