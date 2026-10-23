import React, { useState, useCallback } from 'react'
import {
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Search,
  Flame,
  Globe,
  MessageSquare,
  Link2,
  Palette,
  Clock,
  Sun,
  Calendar,
  Lock,
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
import { GlassDropdown, type GlassDropdownOption } from '../../../../shared'

interface WallpaperTabProps {
  settings: CustomizerSettings
  onUpdate: (updater: Partial<CustomizerSettings>) => void
}

const PROVIDER_OPTIONS: GlassDropdownOption<BackgroundProvider>[] = [
  {
    value: 'default',
    label: 'Default Curated',
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    value: 'unsplash_collection',
    label: 'Unsplash Collection',
    icon: <Layers className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    value: 'unsplash_search',
    label: 'Unsplash Search',
    icon: <Search className="w-3.5 h-3.5 text-cyan-400" />,
  },
  {
    value: 'wallhaven',
    label: 'Wallhaven 4K',
    icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
  },
  {
    value: 'bing',
    label: 'Bing Daily Photo',
    icon: <Globe className="w-3.5 h-3.5 text-blue-400" />,
  },
  {
    value: 'reddit',
    label: 'Reddit Wallpapers',
    icon: <MessageSquare className="w-3.5 h-3.5 text-orange-400" />,
  },
  {
    value: 'custom_url',
    label: 'Custom Image URL',
    icon: <Link2 className="w-3.5 h-3.5 text-purple-400" />,
  },
  {
    value: 'local_file',
    label: 'Local Files (Device)',
    icon: <Upload className="w-3.5 h-3.5 text-indigo-400" />,
  },
  {
    value: 'solid_color',
    label: 'Solid Background Color',
    icon: <Palette className="w-3.5 h-3.5 text-teal-400" />,
  },
]

const FREQUENCY_OPTIONS: GlassDropdownOption<WallpaperFrequency>[] = [
  {
    value: 'tabs',
    label: 'Every New Tab',
    icon: <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />,
  },
  {
    value: 'hour',
    label: 'Every Hour',
    icon: <Clock className="w-3.5 h-3.5 text-blue-400" />,
  },
  {
    value: 'period',
    label: 'Daylight Period',
    icon: <Sun className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    value: 'day',
    label: 'Every Day (Midnight)',
    icon: <Calendar className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    value: 'locked',
    label: 'Locked (Freeze Wallpaper)',
    icon: <Lock className="w-3.5 h-3.5 text-slate-400" />,
  },
]

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
      {/* 1. PROVIDER DROPDOWN MENU */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
        <label htmlFor="wallpaper-provider-select" className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
          Background Provider
        </label>
        <GlassDropdown
          id="wallpaper-provider-select"
          headerTitle="Background Provider"
          value={provider}
          options={PROVIDER_OPTIONS}
          onChange={(nextProvider) => {
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
        />
      </div>

      {/* 2. DEFAULT HARDCODED COLLECTIONS SECTION (Nature, Mountains, Beaches) */}
      {provider === 'default' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
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
                className={`py-2 px-2.5 rounded-xl font-semibold text-[11px] transition-all cursor-pointer text-center capitalize border-0 outline-none ${
                  (settings.defaultCategory || 'all') === cat
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
            Automatically cycles high-resolution Nature, Mountain, and Beach photos with 24h local caching.
          </p>
        </div>
      )}

      {/* 3. CUSTOM SECTION: Unsplash Collection */}
      {provider === 'unsplash_collection' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Custom Collection ID or URL
            </label>
            <span className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-semibold">Press Enter to apply</span>
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
            className="h-10 w-full px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs font-mono text-[#141413] dark:text-[#ece6dc] placeholder:text-[#524f49] dark:placeholder:text-[#a8a49c] outline-none border-0 shadow-xs"
          />
          <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
            Paste any Unsplash collection ID or link. Multiple IDs can be comma-separated.
          </p>
        </div>
      )}

      {/* 4. CUSTOM SECTION: Unsplash Search */}
      {provider === 'unsplash_search' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Search Keywords
            </label>
            <span className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-semibold">Press Enter to apply</span>
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
            placeholder="e.g. nature, minimal, architecture"
            className="h-10 w-full px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs text-[#141413] dark:text-[#ece6dc] placeholder:text-[#524f49] dark:placeholder:text-[#a8a49c] outline-none border-0 shadow-xs"
          />
          <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
            Searches for high-resolution photography matching your custom keywords.
          </p>
        </div>
      )}

      {/* 4. WALLHAVEN SECTION (Open API, No key required) */}
      {provider === 'wallhaven' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Wallhaven Search Keywords
            </label>
            <span className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-semibold">Press Enter to apply</span>
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
            className="h-10 w-full px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs text-[#141413] dark:text-[#ece6dc] placeholder:text-[#524f49] dark:placeholder:text-[#a8a49c] outline-none border-0 shadow-xs"
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
                className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer capitalize border-0 outline-none ${
                  settings.customSearchQuery?.toLowerCase() === tag
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
            Searches Wallhaven for 1080p, 2K & 4K wallpapers. Leave empty for random top wallpapers. No API key required.
          </p>
        </div>
      )}

      {/* 5. BING DAILY WALLPAPER SECTION (No key required) */}
      {provider === 'bing' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Microsoft Bing Daily Wallpaper
            </label>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">● Live Feed</span>
          </div>
          <p className="text-[11px] text-[#383531] dark:text-[#cfc4b2] leading-relaxed font-medium">
            Automatically presents today's official 4K landscape photograph curated by Microsoft Bing. Rotates daily with zero configuration.
          </p>
          {settings.currentPhoto?.author && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.04] text-[10px] text-[#383531] dark:text-[#ece6dc] flex items-center gap-1.5 truncate border-0 outline-none shadow-xs">
              <span className="text-[#141413] dark:text-[#faf9f5] font-bold shrink-0">Today:</span>
              <span className="truncate">{settings.currentPhoto.author}</span>
            </div>
          )}
        </div>
      )}

      {/* 6. REDDIT WALLPAPERS SECTION (Open JSON, No key required) */}
      {provider === 'reddit' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Subreddit
            </label>
            <span className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-semibold">Press Enter to apply</span>
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
                className={`py-1.5 px-2 rounded-xl text-[10px] font-semibold transition-all cursor-pointer text-center truncate border-0 outline-none ${
                  (settings.redditSubreddit || 'wallpapers') === sub.id
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-1">
            <label className="block text-[11px] font-bold text-[#141413] dark:text-[#cfc4b2]">Custom Subreddit</label>
            <div className="flex items-center gap-1">
              <span className="text-[#383531] dark:text-[#cfc4b2] font-mono text-xs pl-1 font-semibold">r/</span>
              <input
                type="text"
                value={settings.redditSubreddit || ''}
                onChange={(e) => onUpdate({ redditSubreddit: e.target.value.replace(/^r\//i, '') })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNextBackground()
                }}
                onBlur={() => handleNextBackground()}
                placeholder="e.g. wallpapers, EarthPorn, ImaginaryLandscapes"
                className="h-10 w-full px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs font-mono text-[#141413] dark:text-[#ece6dc] placeholder:text-[#524f49] dark:placeholder:text-[#a8a49c] outline-none border-0 shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[#141413] dark:text-[#cfc4b2]">Keywords (Optional Search)</label>
            <input
              type="text"
              value={settings.customSearchQuery || ''}
              onChange={(e) => onUpdate({ customSearchQuery: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNextBackground()
              }}
              onBlur={() => handleNextBackground()}
              placeholder="e.g. sunset, dark, mountain"
              className="h-10 w-full px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs text-[#141413] dark:text-[#ece6dc] placeholder:text-[#524f49] dark:placeholder:text-[#a8a49c] outline-none border-0 shadow-xs"
            />
          </div>

          <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
            Fetches top direct high-resolution images from any photography subreddit using Reddit's open JSON feed.
          </p>
        </div>
      )}

      {/* 7. CUSTOM SECTION: Direct Image URL */}
      {provider === 'custom_url' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Custom Image URL
            </label>
            <span className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-semibold">Press Enter to apply</span>
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
            className="h-10 w-full px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs font-mono text-[#141413] dark:text-[#ece6dc] placeholder:text-[#524f49] dark:placeholder:text-[#a8a49c] outline-none border-0 shadow-xs"
          />
          <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
            Paste any direct image link (JPG/PNG/WebP) or Unsplash photo link.
          </p>
        </div>
      )}

      {/* 6. CUSTOM SECTION: Local File Upload */}
      {provider === 'local_file' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-2.5">
          <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
            Local Image File
          </label>
          <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] cursor-pointer transition-all shadow-xs border-0 outline-none">
            <Upload className="w-4 h-4 text-[var(--accent-color)]" />
            <span className="text-xs font-semibold text-[#141413] dark:text-[#ece6dc]">Choose image from your computer</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {settings.localImageDataUrl && (
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#383531] dark:text-[#cfc4b2] font-medium">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">Local image active</span>
            </div>
          )}
        </div>
      )}

      {/* 7. SOLID COLOR SECTION */}
      {provider === 'solid_color' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
          <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
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
                className={`p-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-all border-0 outline-none ${
                  settings.solidColor === color.hex
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-white/5 text-[#141413] dark:text-slate-300 hover:bg-[#f5f0e8] dark:hover:bg-white/10 shadow-xs'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border-0 outline-none"
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
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 outline-none"
            />
            <input
              type="text"
              value={settings.solidColor}
              onChange={(e) => onUpdate({ solidColor: e.target.value })}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs font-mono text-[#141413] dark:text-slate-100 border-0 outline-none shadow-xs"
            />
          </div>
        </div>
      )}

      {/* 8. CHANGE FREQUENCY & NEXT BACKGROUND (Bonjourr Architecture) */}
      {provider !== 'solid_color' && provider !== 'local_file' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3">
          <label htmlFor="frequency-select" className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
            Change Frequency
          </label>
          <GlassDropdown
            id="frequency-select"
            headerTitle="Rotation Frequency"
            value={settings.changeFrequency}
            options={FREQUENCY_OPTIONS}
            onChange={(nextFrequency) => onUpdate({ changeFrequency: nextFrequency })}
          />

          {/* Dedicated Option: Change on Browser Tab Reload */}
          <div className="pt-0.5">
            <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-black/5 dark:bg-white/[0.02] hover:bg-black/10 dark:hover:bg-white/[0.04] transition-colors">
              <div className="space-y-0.5 pr-3">
                <span className="text-xs font-semibold text-[#141413] dark:text-[#ece6dc] block">
                  Change on Tab Reload
                </span>
                <p className="text-[10px] text-[#383531] dark:text-[#9c9589] leading-tight">
                  Always load a new wallpaper when you refresh or reload the browser tab (F5 / ⟳), regardless of rotation frequency
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.changeOnReload ?? false}
                onChange={(e) => onUpdate({ changeOnReload: e.target.checked })}
                className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer flex-shrink-0"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleNextBackground}
            disabled={isCycling}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#faf9f5] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs cursor-pointer transition-all border-0 outline-none disabled:opacity-50 active:scale-[0.99]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent-color)] ${isCycling ? 'animate-spin' : ''}`} />
            <span>Load Next Background</span>
          </button>
        </div>
      )}

      {/* 9. WALLPAPER SIZING TARGET, DISPLAY MODE, ZOOM & POSITION */}
      {/* Sizing Target */}
      {provider !== 'solid_color' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Sizing Target
            </label>
            <span className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-semibold">
              {(settings.wallpaperBase || 'window') === 'screen'
                ? 'Whole Monitor'
                : 'Full Viewport (Recommended)'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdate({ wallpaperBase: 'window' as WallpaperBaseMode })}
              className={`py-2 px-3 rounded-xl text-center font-semibold text-[11px] transition-all cursor-pointer border-0 outline-none ${
                (settings.wallpaperBase || 'window') === 'window'
                  ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                  : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
              }`}
            >
              Full Viewport
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ wallpaperBase: 'screen' as WallpaperBaseMode })}
              className={`py-2 px-3 rounded-xl text-center font-semibold text-[11px] transition-all cursor-pointer border-0 outline-none ${
                settings.wallpaperBase === 'screen'
                  ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                  : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
              }`}
            >
              Whole Monitor
            </button>
          </div>
          <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
            {(settings.wallpaperBase || 'window') === 'window'
              ? 'Sizes and centers the wallpaper naturally within your browser window with zero unwanted zoom.'
              : 'Scales the wallpaper across the full display area.'}
          </p>
        </div>
      )}

      {/* Display Mode */}
      {provider !== 'solid_color' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Display Mode
            </label>
            <span className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-semibold capitalize">
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
                className={`py-2 px-1 rounded-xl text-center font-semibold text-[11px] transition-all cursor-pointer border-0 outline-none ${
                  (settings.wallpaperFit || 'cover') === mode.id
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
                }`}
                title={mode.desc}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zoom / Scale Control */}
      {provider !== 'solid_color' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Zoom / Scale
            </label>
            <span className="text-[11px] font-mono font-bold text-[#141413] dark:text-[#faf9f5]">
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
                className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border-0 outline-none ${
                  (settings.wallpaperZoom ?? 100) === z
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
                }`}
              >
                {z === 100 ? '100% Reset' : `${z}%`}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
            Zoom out (80–90%) to effortlessly fit tall portraits and keep heads in view.
          </p>
        </div>
      )}

      {/* Vertical Position (Pan Y) */}
      {provider !== 'solid_color' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Vertical Position (Pan Y)
            </label>
            <span className="text-[11px] font-mono font-bold text-[#141413] dark:text-[#faf9f5]">
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
                className={`py-1.5 px-2 rounded-xl text-center font-semibold text-[11px] transition-all cursor-pointer border-0 outline-none ${
                  (settings.wallpaperOffsetY !== undefined ? settings.wallpaperOffsetY : 50) === item.val
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
            Set to Top (0%) to pin the top of the photo to the top edge and prevent head cutoffs.
          </p>
        </div>
      )}

      {/* Horizontal Position (Pan X) */}
      {provider !== 'solid_color' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
              Horizontal Position (Pan X)
            </label>
            <span className="text-[11px] font-mono font-bold text-[#141413] dark:text-[#faf9f5]">
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
                className={`py-1.5 px-2 rounded-xl text-center font-semibold text-[11px] transition-all cursor-pointer border-0 outline-none ${
                  (settings.wallpaperOffsetX ?? 50) === item.val
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 10. BLUR & BRIGHTNESS CONTROLS */}
      {provider !== 'solid_color' && (
        <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#141413] dark:text-[#ece6dc] mb-1.5">
              <span className="text-[#141413] dark:text-[#ece6dc] font-semibold">Background Blur</span>
              <span className="text-[#141413] dark:text-[#faf9f5] font-mono font-bold text-[11px]">{settings.backgroundBlur}px</span>
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
            <div className="flex items-center justify-between text-xs font-semibold text-[#141413] dark:text-[#ece6dc] mb-1.5">
              <span className="text-[#141413] dark:text-[#ece6dc] font-semibold">Brightness</span>
              <span className="text-[#141413] dark:text-[#faf9f5] font-mono font-bold text-[11px]">{settings.backgroundBrightness}%</span>
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
          <label className="block text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2]">
            Texture & Pattern Overlay
          </label>
          <span className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-semibold capitalize">
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
              className={`py-2 px-2 rounded-xl text-center font-semibold text-[11px] transition-all cursor-pointer truncate border-0 outline-none ${
                (settings.wallpaperTexture || 'none') === tex.id
                  ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                  : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] dark:hover:text-[#faf9f5] shadow-xs'
              }`}
            >
              {tex.label}
            </button>
          ))}
        </div>

        {settings.wallpaperTexture && settings.wallpaperTexture !== 'none' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#141413] dark:text-[#ece6dc]">
              <span className="text-[11px] text-[#383531] dark:text-[#cfc4b2] font-medium">Texture Opacity</span>
              <span className="text-[#141413] dark:text-[#faf9f5] font-mono font-bold text-[11px]">{settings.wallpaperTextureOpacity ?? 15}%</span>
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

        <p className="text-[10px] text-[#383531] dark:text-[#cfc4b2] font-medium">
          Adds a subtle tactile film grain or vector pattern over the background for high-end aesthetic depth.
        </p>
      </div>
    </div>
  )
}
