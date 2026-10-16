import { useState, useRef } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Sparkles, Globe, Link2, Upload, Check, Loader2 } from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { SEARCH_ENGINE_PRESETS } from '../config/defaultEngines'
import { SearchEngineIcon } from './SearchEngineIcon'
import { resolveAndCacheSearchFavicon, getSearchEngineFaviconUrl } from '../utils/searchFaviconHelper'

interface SearchEngineEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (engine: SearchEngineItem) => void
  initialEngine?: SearchEngineItem | null
}

type IconMode = 'favicon' | 'custom' | 'upload'

interface SearchEngineDialogProps {
  onClose: () => void
  onSave: (engine: SearchEngineItem) => void
  initialEngine?: SearchEngineItem | null
}

const SearchEngineEditorDialog: React.FC<SearchEngineDialogProps> = ({
  onClose,
  onSave,
  initialEngine,
}) => {
  const [name, setName] = useState(initialEngine?.name || '')
  const [url, setUrl] = useState(initialEngine?.url || '')
  const [category, setCategory] = useState<'Standard' | 'AI' | 'Specialized'>(
    initialEngine?.category || 'Standard'
  )
  const [iconMode, setIconMode] = useState<IconMode>(
    initialEngine?.iconType === 'upload' ? 'upload' : initialEngine?.iconType === 'custom' ? 'custom' : 'favicon'
  )
  const [customIconUrl, setCustomIconUrl] = useState(
    initialEngine?.iconType === 'custom' ? (initialEngine.icon || '') : ''
  )
  const [uploadedIcon, setUploadedIcon] = useState(
    initialEngine?.iconType === 'upload' ? (initialEngine.icon || '') : ''
  )
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Real-time live favicon URL derived directly from current search URL
  const liveFaviconUrl = iconMode === 'favicon' && url.trim() ? getSearchEngineFaviconUrl(url) : ''

  // Compute effective icon string
  const getEffectiveIcon = (): string => {
    switch (iconMode) {
      case 'custom':
        return customIconUrl.trim()
      case 'upload':
        return uploadedIcon
      case 'favicon':
      default:
        return liveFaviconUrl || initialEngine?.icon || getSearchEngineFaviconUrl(url)
    }
  }

  const effectiveIcon = getEffectiveIcon()

  const livePreviewEngine: SearchEngineItem = {
    id: initialEngine?.id || 'preview',
    name: name || 'Search Engine',
    url: url || 'https://google.com/search?q=%s',
    icon: effectiveIcon,
    iconType: iconMode,
    category,
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Icon must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        setUploadedIcon(result)
        setIconMode('upload')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSelectTemplate = (preset: (typeof SEARCH_ENGINE_PRESETS)[0]) => {
    setName(preset.name)
    setUrl(preset.url)
    if (preset.category) setCategory(preset.category)
    setIconMode('favicon')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim() || isSaving) return

    setIsSaving(true)
    try {
      // Resolve and bake live icon into permanent Base64 Data URL
      const finalIcon = await resolveAndCacheSearchFavicon(url.trim(), effectiveIcon)
      const id = initialEngine?.id || `engine-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

      const finalEngine: SearchEngineItem = {
        id,
        name: name.trim(),
        url: url.trim(),
        icon: finalIcon,
        iconType: iconMode,
        category,
      }

      onSave(finalEngine)
      onClose()
    } catch (err) {
      console.error('Error saving search engine:', err)
      // Save with fallback URL
      const id = initialEngine?.id || `engine-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      onSave({
        id,
        name: name.trim(),
        url: url.trim(),
        icon: effectiveIcon,
        iconType: iconMode,
        category,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const isEditing = !!initialEngine

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg bg-[#181715]/98 text-[#ece6dc] backdrop-blur-2xl rounded-3xl p-6 shadow-[0_32px_100px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] overflow-hidden border-0 outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[var(--accent-color)]/15 text-[var(--accent-color)] flex items-center justify-center border-0 outline-none">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="settings-serif-title text-base sm:text-lg font-normal text-[#faf9f5] tracking-tight">
                  {isEditing ? 'Modify Search Engine' : 'Add Custom Search Engine'}
                </h3>
                <p className="text-[11px] text-[#b5b1a8]">
                  Live site favicons are dynamically fetched and baked permanently into storage
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer border-0 outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4">
            {/* Live Preview Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] flex items-center justify-between gap-4 border-0 outline-none">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#b5b1a8]">
                  Live Dropdown Preview
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Live favicon automatically fetched from website
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border-0 outline-none">
                <SearchEngineIcon engine={livePreviewEngine} size="md" />
                <span className="text-xs font-semibold text-slate-100">{name || 'Engine'}</span>
                {category === 'AI' && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400">
                    AI
                  </span>
                )}
              </div>
            </div>

            {/* Quick Templates */}
            {!isEditing && (
              <div className="p-3 rounded-2xl bg-white/[0.02] space-y-2 border-0 outline-none">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Popular Templates (1-click autofill with live logo):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
                  {SEARCH_ENGINE_PRESETS.slice(0, 10).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectTemplate(preset)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/30 hover:bg-white/[0.08] text-[11px] text-slate-300 transition-colors cursor-pointer border-0 outline-none"
                    >
                      <SearchEngineIcon engine={preset} size="sm" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name & URL Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Engine Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Perplexity AI, ChatGPT, Google, Kagi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-black/60 transition-colors border-0 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Search Query URL</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. https://www.perplexity.ai/search?q=%s"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-black/60 transition-colors border-0 outline-none"
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => setUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer border-0 outline-none"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Use <span className="font-mono text-amber-300">%s</span> where your query goes (e.g. <span className="font-mono text-slate-300">https://site.com/search?q=%s</span>), or leave at the end with <span className="font-mono text-slate-300">?q=</span>.
                </p>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Engine Category</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.03] rounded-2xl border-0 outline-none">
                  {(['Standard', 'AI', 'Specialized'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0 outline-none ${
                        category === cat
                          ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {cat === 'AI' && <Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Icon Source Selector */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] space-y-3 border-0 outline-none">
              <label className="block text-[11px] font-medium uppercase tracking-[1.5px] text-[#b5b1a8]">
                Icon / Thumbnail Source
              </label>

              {/* Segmented Mode Selector */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.04] rounded-2xl border-0 outline-none">
                {(
                  [
                    { id: 'favicon', label: 'Live Site Favicon', icon: <Globe className="w-3.5 h-3.5" /> },
                    { id: 'custom', label: 'Web URL', icon: <Link2 className="w-3.5 h-3.5" /> },
                    { id: 'upload', label: 'Local File', icon: <Upload className="w-3.5 h-3.5" /> },
                  ] as { id: IconMode; label: string; icon: React.ReactNode }[]
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setIconMode(mode.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-medium transition-all cursor-pointer border-0 outline-none ${
                      iconMode === mode.id
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {mode.icon}
                    <span className="truncate">{mode.label}</span>
                  </button>
                ))}
              </div>

              {/* Mode 1: Auto Live Favicon */}
              {iconMode === 'favicon' && (
                <div className="text-xs text-slate-400 space-y-1.5 bg-black/25 p-3 rounded-2xl border-0 outline-none">
                  <p className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    Automatic Live Website Logo
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Ui-Customizer automatically queries the live domain of your search engine and bakes the authentic high-resolution icon into permanent local cache.
                  </p>
                </div>
              )}

              {/* Mode 2: Custom Web URL */}
              {iconMode === 'custom' && (
                <div className="space-y-2">
                  <label className="block text-xs text-slate-300">Custom Image or SVG URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={customIconUrl}
                    onChange={(e) => setCustomIconUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-black/40 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-black/60 transition-colors border-0 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Image will be downloaded through canvas and converted into a permanent Base64 Data URL.
                  </p>
                </div>
              )}

              {/* Mode 3: File Upload */}
              {iconMode === 'upload' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold text-white flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Choose Local Icon
                    </button>
                    {uploadedIcon && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" /> Loaded
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Stored securely in your local browser storage. Supports SVG, PNG, WebP up to 2MB.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-2xl text-xs font-medium text-slate-300 hover:bg-white/10 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-2xl text-xs font-semibold bg-[var(--accent-color)] hover:opacity-90 text-[var(--accent-contrast,#ffffff)] cursor-pointer transition-all flex items-center gap-1.5 border-0 outline-none shadow-none"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSaving ? 'Baking Icon...' : isEditing ? 'Update Engine' : 'Save Engine'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export const SearchEngineEditorModal: React.FC<SearchEngineEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEngine,
}) => {
  if (!isOpen) return null

  return (
    <SearchEngineEditorDialog
      key={initialEngine?.id || 'new_engine'}
      initialEngine={initialEngine}
      onClose={onClose}
      onSave={onSave}
    />
  )
}
