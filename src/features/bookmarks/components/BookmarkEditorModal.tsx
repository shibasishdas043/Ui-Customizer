import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Globe, Sparkles, Link2, Upload, Check } from 'lucide-react'
import type { BookmarkItem } from '../types'
import { getFaviconUrl, normalizeUrl } from '../utils/faviconHelper'
import { resolveAndCacheFavicon } from '../utils/faviconCacheHelper'
import { BOOKMARK_PRESETS } from '../config/presets'
import { BookmarkThumbnail } from './BookmarkThumbnail'

interface BookmarkEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: BookmarkItem) => void
  initialBookmark?: BookmarkItem | null
}

type ThumbnailMode = 'auto' | 'preset' | 'custom' | 'upload'

interface BookmarkEditorDialogProps {
  onClose: () => void
  onSave: (item: BookmarkItem) => void
  initialBookmark?: BookmarkItem | null
}

const BookmarkEditorDialog: React.FC<BookmarkEditorDialogProps> = ({
  onClose,
  onSave,
  initialBookmark,
}) => {
  const [title, setTitle] = useState(initialBookmark?.title || '')
  const [url, setUrl] = useState(initialBookmark?.url || '')
  const [thumbnailMode, setThumbnailMode] = useState<ThumbnailMode>(initialBookmark?.iconType || 'auto')
  const [customIconUrl, setCustomIconUrl] = useState(
    initialBookmark?.iconType === 'custom' ? (initialBookmark.icon || '') : ''
  )
  const [uploadedIcon, setUploadedIcon] = useState(
    initialBookmark?.iconType === 'upload' ? (initialBookmark.icon || '') : ''
  )
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => {
    if (initialBookmark?.iconType === 'preset') {
      const found = BOOKMARK_PRESETS.find((p) => p.icon === initialBookmark.icon)
      return found ? found.id : null
    }
    return null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compute live effective icon
  const getEffectiveIcon = (): string => {
    switch (thumbnailMode) {
      case 'custom':
        return customIconUrl.trim()
      case 'upload':
        return uploadedIcon
      case 'preset': {
        const preset = BOOKMARK_PRESETS.find((p) => p.id === selectedPresetId)
        return preset ? preset.icon : ''
      }
      case 'auto':
      default:
        return url.trim() ? getFaviconUrl(url) : ''
    }
  }

  const effectiveIcon = getEffectiveIcon()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Icon image must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        setUploadedIcon(result)
        setThumbnailMode('upload')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSelectPreset = (preset: (typeof BOOKMARK_PRESETS)[0]) => {
    setSelectedPresetId(preset.id)
    setThumbnailMode('preset')
    if (!title) setTitle(preset.name)
    if (!url) setUrl(preset.url)
  }

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim() || isSaving) return

    setIsSaving(true)
    const formattedUrl = normalizeUrl(url)

    // Resolve and permanently cache the icon as a Base64 Data URL or vector
    let finalIcon = effectiveIcon
    try {
      finalIcon = await resolveAndCacheFavicon(formattedUrl, effectiveIcon)
    } catch {
      finalIcon = effectiveIcon || getFaviconUrl(formattedUrl)
    }

    const bookmark: BookmarkItem = {
      id: initialBookmark?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      url: formattedUrl,
      icon: finalIcon,
      iconType: thumbnailMode,
    }

    onSave(bookmark)
    setIsSaving(false)
    onClose()
  }

  const isEditing = !!initialBookmark

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
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[var(--accent-color)]/15 text-[var(--accent-color)] flex items-center justify-center">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <h3 className="settings-serif-title text-base sm:text-lg font-normal text-[#faf9f5] tracking-tight">
                  {isEditing ? 'Modify Quick Link' : 'Add New Quick Link'}
                </h3>
                <p className="text-[11px] text-[#b5b1a8]">Configure URL, title, and dynamic thumbnail</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#b5b1a8] hover:text-[#faf9f5] hover:bg-white/[0.08] transition-colors cursor-pointer border-0 outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5">
            {/* Live Preview Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#b5b1a8]">
                  Live Startpage Preview
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  How this tile will appear on your dashboard
                </p>
              </div>
              <div className="flex flex-col items-center justify-center w-20 py-1 px-2 rounded-2xl bg-black/40">
                <BookmarkThumbnail
                  title={title || 'Example'}
                  url={url || 'https://example.com'}
                  icon={effectiveIcon}
                  size="md"
                />
                <span className="text-[11px] font-medium text-white/95 truncate max-w-[64px] text-center mt-1.5">
                  {title || 'Title'}
                </span>
              </div>
            </div>

            {/* Title & URL Inputs */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Link Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. YouTube, Reddit, Docs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors border-0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Web Address (URL)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. reddit.com or https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors border-0"
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => setUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail / Icon Source Selector */}
            <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
              <label className="block text-[11px] font-medium uppercase tracking-[1.5px] text-[#b5b1a8]">
                Thumbnail / Icon Source
              </label>

              {/* Segmented Mode Selector */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-white/[0.04] rounded-2xl">
                {(
                  [
                    { id: 'auto', label: 'Auto Favicon', icon: <Globe className="w-3.5 h-3.5" /> },
                    { id: 'preset', label: 'Preset', icon: <Sparkles className="w-3.5 h-3.5" /> },
                    { id: 'custom', label: 'Web URL', icon: <Link2 className="w-3.5 h-3.5" /> },
                    { id: 'upload', label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
                  ] as { id: ThumbnailMode; label: string; icon: React.ReactNode }[]
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setThumbnailMode(mode.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-medium transition-all cursor-pointer border-0 outline-none ${
                      thumbnailMode === mode.id
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {mode.icon}
                    <span className="truncate">{mode.label}</span>
                  </button>
                ))}
              </div>

              {/* Mode 1: Auto Domain Favicon */}
              {thumbnailMode === 'auto' && (
                <div className="text-xs text-slate-400 space-y-1 bg-black/25 p-3 rounded-2xl">
                  <p className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    Automatic High-Resolution Favicon
                  </p>
                  <p>
                    Ui-Customizer automatically detects the domain favicon with high-res multi-engine
                    fallback. If a site lacks an icon, a sleek initials badge will be rendered.
                  </p>
                </div>
              )}

              {/* Mode 2: Presets */}
              {thumbnailMode === 'preset' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400">Choose from curated brand icons:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                    {BOOKMARK_PRESETS.map((preset) => {
                      const isSelected = selectedPresetId === preset.id
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer border-0 outline-none ${
                            isSelected
                              ? 'bg-[var(--accent-color)]/20'
                              : 'bg-black/30 hover:bg-white/[0.06]'
                          }`}
                        >
                          <img
                            src={preset.icon}
                            alt={preset.name}
                            className={`w-6 h-6 object-contain rounded-sm ${
                              preset.name.toLowerCase().includes('github') || preset.name === 'X (Twitter)'
                                ? 'invert brightness-200'
                                : ''
                            }`}
                          />
                          <span className="text-[10px] text-slate-300 truncate max-w-full mt-1">
                            {preset.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Mode 3: Custom URL */}
              {thumbnailMode === 'custom' && (
                <div className="space-y-2">
                  <label className="block text-xs text-slate-300">Custom Image or SVG URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={customIconUrl}
                    onChange={(e) => setCustomIconUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-black/40 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors border-0"
                  />
                  <p className="text-[11px] text-slate-400">
                    Paste any direct image link (.png, .svg, .webp, .jpg).
                  </p>
                </div>
              )}

              {/* Mode 4: File Upload */}
              {thumbnailMode === 'upload' && (
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
                      Choose Local Image
                    </button>
                    {uploadedIcon && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" /> Loaded
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Image is stored locally in your browser storage. Supports SVG, PNG, WebP, JPG up to 2MB.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl text-xs font-medium text-slate-300 hover:bg-white/10 cursor-pointer transition-colors border-0 outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-2xl text-xs font-semibold bg-[var(--accent-color)] hover:opacity-90 text-[var(--accent-contrast,#ffffff)] cursor-pointer transition-all border-0 outline-none shadow-none"
              >
                {isEditing ? 'Update Quick Link' : 'Save Quick Link'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export const BookmarkEditorModal: React.FC<BookmarkEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBookmark,
}) => {
  if (!isOpen) return null

  return (
    <BookmarkEditorDialog
      key={initialBookmark?.id || 'new_bookmark'}
      initialBookmark={initialBookmark}
      onClose={onClose}
      onSave={onSave}
    />
  )
}
