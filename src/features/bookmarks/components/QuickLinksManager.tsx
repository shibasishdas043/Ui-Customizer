import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react'
import type { BookmarkItem } from '../types'
import { BOOKMARK_PRESETS, presetToBookmark } from '../config/presets'
import { DEFAULT_BOOKMARKS } from '../config/defaultBookmarks'
import { BookmarkThumbnail } from './BookmarkThumbnail'
import { BookmarkEditorModal } from './BookmarkEditorModal'

interface QuickLinksManagerProps {
  links: BookmarkItem[]
  onUpdateLinks: (links: BookmarkItem[]) => void
  showQuickLinks: boolean
  onToggleShow: (show: boolean) => void
  openInNewTab: boolean
  onToggleNewTab: (inNewTab: boolean) => void
}

export const QuickLinksManager: React.FC<QuickLinksManagerProps> = ({
  links,
  onUpdateLinks,
  showQuickLinks,
  onToggleShow,
  openInNewTab,
  onToggleNewTab,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null)

  const handleOpenAdd = () => {
    setEditingBookmark(null)
    setIsEditorOpen(true)
  }

  const handleOpenEdit = (item: BookmarkItem) => {
    setEditingBookmark(item)
    setIsEditorOpen(true)
  }

  const handleSaveItem = (savedItem: BookmarkItem) => {
    const exists = links.some((l) => l.id === savedItem.id)
    if (exists) {
      onUpdateLinks(links.map((l) => (l.id === savedItem.id ? savedItem : l)))
    } else {
      onUpdateLinks([...links, savedItem])
    }
  }

  const handleDelete = (id: string) => {
    onUpdateLinks(links.filter((l) => l.id !== id))
  }

  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    const updated = [...links]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    onUpdateLinks(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index >= links.length - 1) return
    const updated = [...links]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    onUpdateLinks(updated)
  }

  const handleAddPreset = (preset: (typeof BOOKMARK_PRESETS)[0]) => {
    const newBookmark = presetToBookmark(preset)
    onUpdateLinks([...links, newBookmark])
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset quick links to default presets?')) {
      onUpdateLinks(DEFAULT_BOOKMARKS)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Global Dock Display & Navigation Preferences */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-color)]/15 text-[var(--accent-color)] flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Quick Links Dock</h4>
              <p className="text-[11px] text-slate-400">Display icon tiles on your startpage</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showQuickLinks}
              onChange={(e) => onToggleShow(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
          </label>
        </div>

        {/* Tab Target: Same Tab vs New Tab */}
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Open Links In</span>
            <div className="p-1 bg-white/[0.04] rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleNewTab(false)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  !openInNewTab
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Same Tab
              </button>
              <button
                type="button"
                onClick={() => onToggleNewTab(true)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  openInNewTab
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                New Tab
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {openInNewTab
              ? 'Clicking a link opens a new browser tab without leaving this startpage.'
              : 'Clicking a link navigates directly inside the current tab.'}
          </p>
        </div>
      </div>

      {/* 2. Quick Add Bar & Presets */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold text-white">Popular Presets</h4>
          </div>
          <span className="text-[10px] text-slate-400">1-click add</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {BOOKMARK_PRESETS.slice(0, 8).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-white/[0.08] text-slate-300 text-xs transition-colors cursor-pointer"
            >
              <img
                src={preset.icon}
                alt={preset.name}
                className={`w-3.5 h-3.5 object-contain ${
                  preset.name.toLowerCase().includes('github') ? 'invert' : ''
                }`}
              />
              <span>+{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Configured Quick Links List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Configured Quick Links ({links.length})
            </h4>
            <p className="text-[11px] text-slate-400">Reorder, edit details, or replace thumbnails</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Reset to defaults"
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
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {links.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] text-center space-y-2">
            <Bookmark className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-xs text-slate-300 font-medium">No quick links configured</p>
            <p className="text-[11px] text-slate-500">
              Add your favorite links or click presets above to populate your dock.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-2 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold text-white cursor-pointer"
            >
              Add First Link
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {links.map((link, idx) => (
                <motion.div
                  key={link.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors group"
                >
                  {/* Left: Thumbnail & Link Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <BookmarkThumbnail
                      title={link.title}
                      url={link.url}
                      icon={link.icon}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-100 truncate">
                        {link.title}
                      </span>
                      <span className="block text-[11px] text-slate-400 truncate max-w-[240px] sm:max-w-[360px] md:max-w-[500px]">
                        {link.url}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions (Move Up, Move Down, Edit, Delete) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      title="Move Up"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === links.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      title="Move Down"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(link)}
                      title="Modify Link & Thumbnail"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--accent-color)] hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(link.id)}
                      title="Delete Link"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 4. Edit / Add Modal */}
      <BookmarkEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingBookmark(null)
        }}
        onSave={handleSaveItem}
        initialBookmark={editingBookmark}
      />
    </div>
  )
}
