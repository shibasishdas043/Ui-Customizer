import React, { useState, useCallback } from 'react'
import {
  RefreshCw,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import type { CustomizerSettings } from '../../types'
import {
  getNextPhotoForProvider,
  cleanCollectionId,
  DEFAULT_COLLECTIONS,
} from '../../../wallpaper'
import type {
  BackgroundProvider,
  DefaultCollectionCategory,
  WallpaperFrequency,
  WallpaperFitMode,
  WallpaperPosition,
  WallpaperBaseMode,
  WallpaperTexture,
} from '../../../wallpaper'

interface WallpaperTabProps {
  settings: CustomizerSettings
  onUpdate: (updater: Partial<CustomizerSettings>) => void
}

const SOLID_PRESETS = [
  { name: 'Obsidian Slate', hex: '#0f172a' },
  { name: 'Deep Midnight', hex: '#020617' },
  { name: 'Warm Charcoal', hex: '#1c1917' },
  { name: 'Emerald Forest', hex: '#064e3b' },
  { name: 'Royal Indigo', hex: '#1e1b4b' },
  { name: 'Nordic Teal', hex: '#134e4a' },
]

export const WallpaperTab: React.FC<WallpaperTabProps> = ({ settings, onUpdate }) => {
  const [isCycling, setIsCycling] = useState(false)

  const provider: BackgroundProvider =
    settings.backgroundProvider ||
    (settings.backgroundType === 'color'
      ? 'solid_color'
      : settings.backgroundType === 'custom'
      ? 'custom_url'
      : 'default')

  const handleNextBackground = useCallback(async () => {
    setIsCycling(true)
    try {
      const activeUrl = settings.currentPhoto?.url || settings.currentUnsplashPhoto?.url
      const next = await getNextPhotoForProvider({
        provider,
        defaultCategory: settings.defaultCategory || 'all',
        customCollectionId: settings.customCollectionId || settings.unsplashCollectionId || DEFAULT_COLLECTIONS.nature.id,
        customSearchQuery:
          provider === 'wallhaven' || provider === 'reddit'
            ? (settings.customSearchQuery || '')
            : (settings.customSearchQuery || 'nature, mountains'),
        redditSubreddit: settings.redditSubreddit || 'wallpapers',
        customBackgroundUrl: settings.customBackgroundUrl,
        localImageDataUrl: settings.localImageDataUrl,
        currentPhotoUrl: activeUrl,
      })

      const now = Date.now()
      try {
        sessionStorage.setItem('aura_tab_session_photo_v1', JSON.stringify(next))
        sessionStorage.setItem('aura_manual_cycle_request', now.toString())
      } catch {}

      onUpdate({
        currentPhoto: next,
        currentUnsplashPhoto: next,
        lastWallpaperChange: now,
      })
    } catch (err) {
      console.warn('Failed to cycle wallpaper:', err)
    } finally {
      setIsCycling(false)
    }
  }, [provider, settings, onUpdate])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        onUpdate({
          backgroundProvider: 'local_file',
          localImageDataUrl: dataUrl,
          lastWallpaperChange: Date.now(),
        })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4 text-xs">
      {/* 1. PROVIDER DROPDOWN MENU (Matching Bonjourr) */}
      <div className="space-y-1.5">
        <label htmlFor="wallpaper-provider-select" className="block text-xs font-medium text-slate-300">
          Background Provider
        </label>
        <select
          id="wallpaper-provider-select"
          value={provider}
          onChange={(e) => {
            const nextProvider = e.target.value as BackgroundProvider
            onUpdate({
              backgroundProvider: nextProvider,
              backgroundType:
                nextProvider === 'solid_color'
                  ? 'color'
                  : nextProvider === 'custom_url'
                  ? 'custom'
                  : 'preset',
              lastWallpaperChange: Date.now(),
            })
          }}
          className="w-full px-3 py-2 rounded-xl glass-input text-xs cursor-pointer bg-[#0f1422] text-slate-200"
        >
          <option value="default" className="bg-[#0f172a] text-slate-100 py-1">Default (Nature, Mountains & Beaches)</option>
          <option value="unsplash_collection" className="bg-[#0f172a] text-slate-100 py-1">Unsplash Collection (Custom ID / URL)</option>
          <option value="unsplash_search" className="bg-[#0f172a] text-slate-100 py-1">Unsplash Search (Keywords)</option>
          <option value="wallhaven" className="bg-[#0f172a] text-slate-100 py-1">Wallhaven (Keywords & 4K Wallpaper)</option>
          <option value="bing" className="bg-[#0f172a] text-slate-100 py-1">Bing Daily (Image of the Day)</option>
          <option value="reddit" className="bg-[#0f172a] text-slate-100 py-1">Reddit Wallpapers (r/wallpapers, r/EarthPorn)</option>
          <option value="custom_url" className="bg-[#0f172a] text-slate-100 py-1">Custom Image URL</option>
          <option value="local_file" className="bg-[#0f172a] text-slate-100 py-1">Local Files (Upload from Device)</option>
          <option value="solid_color" className="bg-[#0f172a] text-slate-100 py-1">Solid Background Color</option>
        </select>
      </div>

      {/* 2. DEFAULT HARDCODED COLLECTIONS SECTION (Nature, Mountains, Beaches) */}
      {provider === 'default' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Curated Categories
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['all', 'nature', 'mountains', 'beaches'] as DefaultCollectionCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onUpdate({ defaultCategory: cat })
                  handleNextBackground()
                }}
                className={`py-2 px-2.5 rounded-xl font-medium text-[11px] transition-all cursor-pointer text-center capitalize ${
                  (settings.defaultCategory || 'all') === cat
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">
            Automatically cycles high-resolution Nature, Mountain, and Beach photos with 24h local caching.
          </p>
        </div>
      )}

      {/* 3. CUSTOM SECTION: Unsplash Collection */}
      {provider === 'unsplash_collection' && (
        <div className="p-3 rounded-xl bg-white/[0.03] space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Custom Collection ID or URL
            </label>
            <span className="text-[10px] text-indigo-400">Press Enter to apply</span>
          </div>
          <input
            type="text"
            value={settings.customCollectionId ?? settings.unsplashCollectionId ?? ''}
            onChange={(e) => {
              const val = e.target.value
              const cleaned = cleanCollectionId(val)
              onUpdate({
                customCollectionId: val,
                unsplashCollectionId: cleaned || val,
              })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNextBackground()
              }
            }}
            onBlur={() => {
              handleNextBackground()
            }}
            placeholder="e.g. 9968899 or https://unsplash.com/collections/..."
            className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
          />
          <p className="text-[10px] text-slate-400">
            Paste any Unsplash collection ID or link. Multiple IDs can be comma-separated.
          </p>
        </div>
      )}

      {/* 4. CUSTOM SECTION: Unsplash Search */}
      {provider === 'unsplash_search' && (
        <div className="p-3 rounded-xl bg-white/[0.03] space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Search Keywords
            </label>
            <span className="text-[10px] text-indigo-400">Press Enter to apply</span>
          </div>
          <input
            type="text"
            value={settings.customSearchQuery || ''}
            onChange={(e) => onUpdate({ customSearchQuery: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNextBackground()
              }
            }}
            onBlur={() => {
              handleNextBackground()
            }}
            placeholder="e.g. bikini, beach, minimal"
            className="w-full px-3 py-2 rounded-xl glass-input text-xs"
          />
          <p className="text-[10px] text-slate-400">
            Searches for high-resolution photography matching your custom keywords.
          </p>
        </div>
      )}

      {/* 4. WALLHAVEN SECTION (Open API, No key required) */}
      {provider === 'wallhaven' && (
        <div className="p-3 rounded-xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Wallhaven Search Keywords
            </label>
            <span className="text-[10px] text-indigo-400">Press Enter to apply</span>
          </div>
          <input
            type="text"
            value={settings.customSearchQuery || ''}
            onChange={(e) => onUpdate({ customSearchQuery: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNextBackground()
              }
            }}
            onBlur={() => {
              handleNextBackground()
            }}
            placeholder="e.g. cyberpunk, nature, minimal, anime, space"
            className="w-full px-3 py-2 rounded-xl glass-input text-xs"
          />
          {/* Quick category tag pills */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {['nature', 'cyberpunk', 'minimal', 'anime', 'space', 'japan', 'fantasy'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  onUpdate({ customSearchQuery: tag })
                  handleNextBackground()
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer capitalize ${
                  settings.customSearchQuery?.toLowerCase() === tag
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">
            Searches Wallhaven for 1080p, 2K & 4K wallpapers. Leave empty for random top wallpapers. No API key required.
          </p>
        </div>
      )}

      {/* 5. BING DAILY WALLPAPER SECTION (No key required) */}
      {provider === 'bing' && (
        <div className="p-3 rounded-xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Microsoft Bing Daily Wallpaper
            </label>
            <span className="text-[10px] text-emerald-400 font-medium">● Live Feed</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Automatically presents today's official 4K landscape photograph curated by Microsoft Bing. Rotates daily with zero configuration.
          </p>
          {settings.currentPhoto?.author && (
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
              <span className="text-slate-200 font-medium shrink-0">Today:</span>
              <span className="truncate">{settings.currentPhoto.author}</span>
            </div>
          )}
        </div>
      )}

      {/* 6. REDDIT WALLPAPERS SECTION (Open JSON, No key required) */}
      {provider === 'reddit' && (
        <div className="p-3 rounded-xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Subreddit
            </label>
            <span className="text-[10px] text-indigo-400">Press Enter to apply</span>
          </div>
          {/* Subreddit Preset Chips */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'wallpapers', name: 'r/wallpapers' },
              { id: 'EarthPorn', name: 'r/EarthPorn' },
              { id: 'spaceporn', name: 'r/spaceporn' },
              { id: 'MinimalWallpaper', name: 'r/Minimal' },
              { id: 'CozyPlaces', name: 'r/CozyPlaces' },
              { id: 'CityPorn', name: 'r/CityPorn' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  onUpdate({ redditSubreddit: sub.id })
                  handleNextBackground()
                }}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer text-center truncate ${
                  (settings.redditSubreddit || 'wallpapers') === sub.id
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-1">
            <label className="block text-[11px] text-slate-400">Custom Subreddit</label>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-mono text-xs pl-1">r/</span>
              <input
                type="text"
                value={settings.redditSubreddit || ''}
                onChange={(e) => onUpdate({ redditSubreddit: e.target.value.replace(/^r\//i, '') })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNextBackground()
                }}
                onBlur={() => handleNextBackground()}
                placeholder="e.g. wallpapers, EarthPorn, ImaginaryLandscapes"
                className="w-full px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] text-slate-400">Keywords (Optional Search)</label>
            <input
              type="text"
              value={settings.customSearchQuery || ''}
              onChange={(e) => onUpdate({ customSearchQuery: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNextBackground()
              }}
              onBlur={() => handleNextBackground()}
              placeholder="e.g. sunset, dark, mountain"
              className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
            />
          </div>

          <p className="text-[10px] text-slate-400">
            Fetches top direct high-resolution images from any photography subreddit using Reddit's open JSON feed.
          </p>
        </div>
      )}

      {/* 7. CUSTOM SECTION: Direct Image URL */}
      {provider === 'custom_url' && (
        <div className="p-3 rounded-xl bg-white/[0.03] space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Custom Image URL
            </label>
            <span className="text-[10px] text-indigo-400">Press Enter to apply</span>
          </div>
          <input
            type="text"
            value={settings.customBackgroundUrl || ''}
            onChange={(e) =>
              onUpdate({
                customBackgroundUrl: e.target.value,
                backgroundProvider: 'custom_url',
                backgroundType: 'custom',
              })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = (e.target as HTMLInputElement).value.trim()
                onUpdate({
                  customBackgroundUrl: target,
                  backgroundProvider: 'custom_url',
                  backgroundType: 'custom',
                  lastWallpaperChange: Date.now(),
                })
              }
            }}
            onBlur={(e) => {
              const target = e.target.value.trim()
              onUpdate({
                customBackgroundUrl: target,
                backgroundProvider: 'custom_url',
                backgroundType: 'custom',
                lastWallpaperChange: Date.now(),
              })
            }}
            placeholder="e.g. https://images.unsplash.com/... or https://example.com/photo.jpg"
            className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
          />
          <p className="text-[10px] text-slate-400">
            Paste any direct image link (JPG/PNG/WebP) or Unsplash photo link.
          </p>
          {settings.customBackgroundUrl?.includes('unsplash.com/photos/') && (
            <div className="p-2.5 rounded-xl bg-indigo-950/40 text-[11px] text-indigo-300 space-y-1">
              <p>✨ <strong>Auto-resolving Unsplash link:</strong> Fetching matching high-resolution photo from Unsplash CDN.</p>
              <p className="text-slate-400 text-[10px]">Tip: For an exact photo, you can also right-click the image on Unsplash and choose &ldquo;Copy image address&rdquo;.</p>
            </div>
          )}
        </div>
      )}

      {/* 6. CUSTOM SECTION: Local File Upload */}
      {provider === 'local_file' && (
        <div className="p-3 rounded-xl bg-white/[0.03] space-y-2.5">
          <label className="block text-xs font-medium text-slate-300">
            Local Image File
          </label>
          <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-300">Choose image from your computer</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {settings.localImageDataUrl && (
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">Local image active</span>
            </div>
          )}
        </div>
      )}

      {/* 7. SOLID COLOR SECTION */}
      {provider === 'solid_color' && (
        <div className="p-3 rounded-xl bg-white/[0.03] space-y-2.5">
          <label className="block text-xs font-medium text-slate-300">
            Solid Color
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SOLID_PRESETS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() =>
                  onUpdate({
                    solidColor: color.hex,
                    backgroundProvider: 'solid_color',
                    backgroundType: 'color',
                  })
                }
                className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-2 cursor-pointer transition-all ${
                  settings.solidColor === color.hex
                    ? 'bg-white/20 text-white font-semibold shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="truncate">{color.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="color"
              value={settings.solidColor}
              onChange={(e) => onUpdate({ solidColor: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <input
              type="text"
              value={settings.solidColor}
              onChange={(e) => onUpdate({ solidColor: e.target.value })}
              className="flex-1 px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
            />
          </div>
        </div>
      )}

      {/* 8. CHANGE FREQUENCY & NEXT BACKGROUND (Bonjourr Architecture) */}
      {provider !== 'solid_color' && provider !== 'local_file' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="frequency-select" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Change Frequency
            </label>
            <button
              type="button"
              onClick={handleNextBackground}
              disabled={isCycling}
              title="Next background"
              className="flex items-center gap-1.5 text-xs text-[var(--accent-color)] hover:opacity-85 font-semibold cursor-pointer disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCycling ? 'animate-spin' : ''}`} />
              Next background
            </button>
          </div>
          <select
            id="frequency-select"
            value={settings.changeFrequency}
            onChange={(e) => onUpdate({ changeFrequency: e.target.value as WallpaperFrequency })}
            className="h-10 w-full px-3.5 rounded-xl text-xs cursor-pointer bg-white/[0.04] text-slate-200 outline-none border-0"
          >
            <option value="tabs" className="bg-[#0c1017] text-slate-100 py-1">Every tab (Changes on each new tab)</option>
            <option value="hour" className="bg-[#0c1017] text-slate-100 py-1">Every hour (Rotates every hour)</option>
            <option value="period" className="bg-[#0c1017] text-slate-100 py-1">Daylight period (Morning, Afternoon, Evening, Night)</option>
            <option value="day" className="bg-[#0c1017] text-slate-100 py-1">Every day (Midnight)</option>
            <option value="locked" className="bg-[#0c1017] text-slate-100 py-1">Locked (Freeze current wallpaper)</option>
          </select>
        </div>
      )}

      {/* 9. WALLPAPER SIZING TARGET, DISPLAY MODE, ZOOM & POSITION */}
      {provider !== 'solid_color' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-4">
          {/* Sizing Target: Whole Monitor vs Browser Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Sizing Target
              </label>
              <span className="text-[10px] text-slate-400">
                {(settings.wallpaperBase || 'window') === 'screen'
                  ? 'Whole Monitor'
                  : 'Full Viewport (Recommended)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdate({ wallpaperBase: 'window' as WallpaperBaseMode })}
                className={`py-2 px-3 rounded-xl text-center font-medium text-[11px] transition-all cursor-pointer ${
                  (settings.wallpaperBase || 'window') === 'window'
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                }`}
              >
                🪟 Full Viewport
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ wallpaperBase: 'screen' as WallpaperBaseMode })}
                className={`py-2 px-3 rounded-xl text-center font-medium text-[11px] transition-all cursor-pointer ${
                  settings.wallpaperBase === 'screen'
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                }`}
              >
                🖥️ Whole Monitor
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              {(settings.wallpaperBase || 'window') === 'window'
                ? 'Sizes and centers the wallpaper naturally within your browser window, showing the entire composition with zero unwanted zoom.'
                : 'Scales the wallpaper across the full display area.'}
            </p>
          </div>

          {/* Display Mode */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Display Mode
              </label>
              <span className="text-[10px] text-slate-400 capitalize">
                {settings.wallpaperFit === 'contain'
                  ? 'Fit (Full Image)'
                  : settings.wallpaperFit === 'stretch'
                  ? 'Stretch'
                  : settings.wallpaperFit === 'center'
                  ? 'Center'
                  : 'Fill Screen'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cover', label: 'Fill', desc: 'Fills the screen (default)' },
                { id: 'contain', label: 'Fit', desc: 'Shows full uncropped image' },
                { id: 'stretch', label: 'Stretch', desc: 'Stretches to fit screen' },
                { id: 'center', label: 'Center', desc: 'Displays original scale centered' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onUpdate({ wallpaperFit: mode.id as WallpaperFitMode })}
                  className={`py-2 px-1 rounded-xl text-center font-medium text-[11px] transition-all cursor-pointer ${
                    (settings.wallpaperFit || 'cover') === mode.id
                      ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                      : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                  }`}
                  title={mode.desc}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom / Scale Control */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Zoom / Scale
              </label>
              <span className="text-[11px] font-mono text-slate-300">
                {settings.wallpaperZoom ?? 100}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              step="1"
              value={settings.wallpaperZoom ?? 100}
              onChange={(e) => onUpdate({ wallpaperZoom: Number(e.target.value) })}
              className="w-full accent-[var(--accent-color)] cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 pt-0.5">
              {[75, 85, 100, 115, 130].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => onUpdate({ wallpaperZoom: z })}
                  className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                    (settings.wallpaperZoom ?? 100) === z
                      ? 'bg-white/20 text-white font-semibold'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {z === 100 ? '100% Reset' : `${z}%`}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              Zoom out (80–90%) to effortlessly fit tall portraits and keep heads in view.
            </p>
          </div>

          {/* Vertical Position (Pan Y) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Vertical Position (Pan Y)
              </label>
              <span className="text-[11px] font-mono text-slate-300">
                {settings.wallpaperOffsetY !== undefined
                  ? `${settings.wallpaperOffsetY}%`
                  : settings.wallpaperPosition === 'top'
                  ? '0% (Top)'
                  : settings.wallpaperPosition === 'bottom'
                  ? '100% (Bottom)'
                  : '50% (Center)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={
                settings.wallpaperOffsetY !== undefined
                  ? settings.wallpaperOffsetY
                  : settings.wallpaperPosition === 'top'
                  ? 0
                  : settings.wallpaperPosition === 'bottom'
                  ? 100
                  : 50
              }
              onChange={(e) => {
                const val = Number(e.target.value)
                onUpdate({
                  wallpaperOffsetY: val,
                  wallpaperPosition: val <= 20 ? 'top' : val >= 80 ? 'bottom' : 'center',
                })
              }}
              className="w-full accent-[var(--accent-color)] cursor-pointer"
            />
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Top (0%)', val: 0, pos: 'top' as WallpaperPosition },
                { label: 'Center (50%)', val: 50, pos: 'center' as WallpaperPosition },
                { label: 'Bottom (100%)', val: 100, pos: 'bottom' as WallpaperPosition },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() =>
                    onUpdate({
                      wallpaperOffsetY: item.val,
                      wallpaperPosition: item.pos,
                    })
                  }
                  className={`py-1.5 px-2 rounded-xl text-center font-medium text-[11px] transition-all cursor-pointer ${
                    (settings.wallpaperOffsetY !== undefined ? settings.wallpaperOffsetY : 50) === item.val
                      ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                      : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              Set to Top (0%) to pin the top of the photo to the top edge and prevent head cutoffs.
            </p>
          </div>

          {/* Horizontal Position (Pan X) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Horizontal Position (Pan X)
              </label>
              <span className="text-[11px] font-mono text-slate-300">
                {settings.wallpaperOffsetX ?? 50}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.wallpaperOffsetX ?? 50}
              onChange={(e) => onUpdate({ wallpaperOffsetX: Number(e.target.value) })}
              className="w-full accent-[var(--accent-color)] cursor-pointer"
            />
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Left (0%)', val: 0 },
                { label: 'Center (50%)', val: 50 },
                { label: 'Right (100%)', val: 100 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => onUpdate({ wallpaperOffsetX: item.val })}
                  className={`py-1.5 px-2 rounded-xl text-center font-medium text-[11px] transition-all cursor-pointer ${
                    (settings.wallpaperOffsetX ?? 50) === item.val
                      ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                      : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 10. BLUR & BRIGHTNESS CONTROLS */}
      {provider !== 'solid_color' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
              <span>Background Blur</span>
              <span className="text-slate-400 font-mono text-[11px]">{settings.backgroundBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={settings.backgroundBlur}
              onChange={(e) => onUpdate({ backgroundBlur: Number(e.target.value) })}
              className="w-full accent-[var(--accent-color)] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
              <span>Brightness</span>
              <span className="text-slate-400 font-mono text-[11px]">{settings.backgroundBrightness}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={settings.backgroundBrightness}
              onChange={(e) => onUpdate({ backgroundBrightness: Number(e.target.value) })}
              className="w-full accent-[var(--accent-color)] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 11. AMBIENT TEXTURE OVERLAY */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Texture & Pattern Overlay
          </label>
          <span className="text-[10px] text-slate-400 capitalize">
            {settings.wallpaperTexture && settings.wallpaperTexture !== 'none'
              ? settings.wallpaperTexture
              : 'None'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'none', label: 'None' },
            { id: 'grain', label: 'Film Grain' },
            { id: 'waves', label: 'Waves' },
            { id: 'topographic', label: 'Topographic' },
            { id: 'circuitBoard', label: 'Circuit' },
            { id: 'honeycomb', label: 'Honeycomb' },
          ].map((tex) => (
            <button
              key={tex.id}
              type="button"
              onClick={() => onUpdate({ wallpaperTexture: tex.id as WallpaperTexture })}
              className={`py-2 px-2 rounded-xl text-center font-medium text-[11px] transition-all cursor-pointer truncate ${
                (settings.wallpaperTexture || 'none') === tex.id
                  ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                  : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
              }`}
            >
              {tex.label}
            </button>
          ))}
        </div>

        {settings.wallpaperTexture && settings.wallpaperTexture !== 'none' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="text-[11px] text-slate-400">Texture Opacity</span>
              <span className="text-slate-400 font-mono text-[11px]">{settings.wallpaperTextureOpacity ?? 15}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={settings.wallpaperTextureOpacity ?? 15}
              onChange={(e) => onUpdate({ wallpaperTextureOpacity: Number(e.target.value) })}
              className="w-full accent-[var(--accent-color)] cursor-pointer"
            />
          </div>
        )}

        <p className="text-[10px] text-slate-400">
          Adds a subtle tactile film grain or vector pattern over the background for high-end aesthetic depth.
        </p>
      </div>
    </div>
  )
}
