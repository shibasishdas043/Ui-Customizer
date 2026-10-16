import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, X, Sliders } from 'lucide-react'
import { Navbar } from '../shared'
import { Clock, Greeting } from '../features/clock'
import { SearchBar } from '../features/search'
import { QuickLinks } from '../features/bookmarks'
import { WallpaperBackground } from '../features/wallpaper'
import { CustomizerDrawer, useSettingsStorage } from '../features/customizer'
import { WeatherWidget } from '../features/weather'
import { QuotesWidget } from '../features/quotes'
import { useBrowserBehavior } from '../features/browser-settings'
import type { AccentColor } from '../features/customizer'

const ACCENT_COLOR_MAP: Record<AccentColor, { hex: string; rgb: string; textDark?: boolean }> = {
  ocean: { hex: '#0081a7', rgb: '0, 129, 167', textDark: false },
  cyan: { hex: '#00afb9', rgb: '0, 175, 185', textDark: false },
  cream: { hex: '#fdfcdc', rgb: '253, 252, 220', textDark: true },
  peach: { hex: '#fed9b7', rgb: '254, 217, 183', textDark: true },
  coral: { hex: '#f07167', rgb: '240, 113, 103', textDark: false },
  // Backward compatibility mappings
  indigo: { hex: '#0081a7', rgb: '0, 129, 167', textDark: false },
  emerald: { hex: '#00afb9', rgb: '0, 175, 185', textDark: false },
  rose: { hex: '#f07167', rgb: '240, 113, 103', textDark: false },
  amber: { hex: '#fed9b7', rgb: '254, 217, 183', textDark: true },
  violet: { hex: '#0081a7', rgb: '0, 129, 167', textDark: false },
}

export default function App() {
  const { settings, updateSettings, resetSettings } = useSettingsStorage()
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)

  // Browser redirect & startup hook
  const { redirectingTo, countdown, cancelRedirect } = useBrowserBehavior({
    newTabMode: settings.newTabMode,
    newTabRedirectUrl: settings.newTabRedirectUrl,
    startupMode: settings.startupMode,
    startupUrl: settings.startupUrl,
    homepageUrl: settings.homepageUrl,
    redirectCountdown: settings.redirectCountdown,
  })

  // Synchronize HTML theme class (Dark / Light / System) with real-time OS listener
  useEffect(() => {
    const root = document.documentElement
    const applyTheme = (isDark: boolean) => {
      root.classList.toggle('dark', isDark)
      root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }

    if (settings.themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches)
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches)
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    } else {
      applyTheme(settings.themeMode === 'dark')
    }
  }, [settings.themeMode])

  // Synchronize Accent Color CSS custom properties & data-accent attribute
  useEffect(() => {
    const root = document.documentElement
    const config = ACCENT_COLOR_MAP[settings.accentColor] || ACCENT_COLOR_MAP.ocean
    root.style.setProperty('--accent-color', config.hex)
    root.style.setProperty('--accent-rgb', config.rgb)
    root.style.setProperty('--accent-glow', 'transparent')
    root.style.setProperty('--accent-contrast', config.textDark ? '#0f172a' : '#ffffff')
    root.setAttribute('data-accent', settings.accentColor)
  }, [settings.accentColor])

  // Synchronize Typography Style attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-font', settings.fontFamily)
  }, [settings.fontFamily])

  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-transparent">
      {/* Live Custom CSS Injection */}
      {settings.customCss && (
        <style dangerouslySetInnerHTML={{ __html: settings.customCss }} />
      )}

      {/* Dynamic Wallpaper Ambience Engine */}
      <WallpaperBackground
        config={{
          backgroundProvider: settings.backgroundProvider,
          defaultCategory: settings.defaultCategory,
          customCollectionId: settings.customCollectionId,
          customSearchQuery: settings.customSearchQuery,
          redditSubreddit: settings.redditSubreddit,
          customBackgroundUrl: settings.customBackgroundUrl,
          localImageDataUrl: settings.localImageDataUrl,
          solidColor: settings.solidColor,
          backgroundBlur: settings.backgroundBlur,
          backgroundBrightness: settings.backgroundBrightness,
          wallpaperFit: settings.wallpaperFit || 'cover',
          wallpaperPosition: settings.wallpaperPosition || 'center',
          wallpaperBase: settings.wallpaperBase || 'window',
          wallpaperZoom: settings.wallpaperZoom ?? 100,
          wallpaperOffsetY: settings.wallpaperOffsetY ?? 50,
          wallpaperOffsetX: settings.wallpaperOffsetX ?? 50,
          wallpaperTexture: settings.wallpaperTexture,
          wallpaperTextureOpacity: settings.wallpaperTextureOpacity,
          changeFrequency: settings.changeFrequency,
          currentPhoto: settings.currentPhoto,
          lastWallpaperChange: settings.lastWallpaperChange,
          onUpdatePhoto: (photo, timestamp) => {
            updateSettings({
              currentPhoto: photo,
              lastWallpaperChange: timestamp,
            })
          },
          backgroundType: settings.backgroundType,
          selectedPresetId: settings.selectedPresetId,
          unsplashCollectionId: settings.unsplashCollectionId,
          currentUnsplashPhoto: settings.currentUnsplashPhoto,
          onUpdateUnsplashPhoto: (photo, timestamp) => {
            updateSettings({
              currentUnsplashPhoto: photo,
              lastWallpaperChange: timestamp,
            })
          },
        }}
      />

      {/* Main Interface Layer (Instant presentation without blackout or backdrop-root isolation) */}
      <div
        id="interface"
        className={`relative z-10 min-h-screen w-full flex flex-col justify-between ${
          settings.fontFamily === 'mono'
            ? 'font-mono'
            : settings.fontFamily === 'display'
            ? 'font-display'
            : settings.fontFamily === 'caveat'
            ? 'font-caveat'
            : settings.fontFamily === 'playwrite'
            ? 'font-playwrite'
            : settings.fontFamily === 'stalemate'
            ? 'font-stalemate'
            : 'font-sans'
        }`}
      >
        {/* Dynamic Top Navigation Header */}
        <Navbar
          onOpenSettings={() => setIsCustomizerOpen(true)}
          isAnalogClock={settings.clockAnalog}
          weatherSlot={
            <WeatherWidget
              config={{
                showWeather: settings.showWeather,
                tempUnit: settings.tempUnit,
                city: settings.weatherCity,
                autoLocation: settings.weatherAutoLocation,
                geolocationMode: settings.weatherGeolocation || 'approximate',
                fontFamily: settings.fontFamily,
              }}
            />
          }
          clockSlot={
            !settings.clockAnalog ? (
              <Clock
                config={{
                  showClock: settings.showClock,
                  analog: false,
                  use24Hour: settings.use24Hour,
                  showSeconds: settings.showSeconds,
                  showDate: settings.showDate,
                  showGreeting: settings.showGreeting,
                  userName: settings.userName,
                  fontFamily: settings.fontFamily,
                }}
                layout="top-left"
              />
            ) : null
          }
        />

      {/* Redirect Countdown Notice Banner (if New Tab redirect is active) */}
      <AnimatePresence>
        {redirectingTo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl glass-panel flex items-center gap-3 shadow-2xl text-xs text-slate-200"
          >
            <ExternalLink className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Opening saved website in <strong className="text-white font-mono">{countdown}s</strong>: {redirectingTo}
            </span>
            <button
              onClick={cancelRedirect}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
              Stay on Aura
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Center Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 z-10">
        <div
          className={`w-full max-w-4xl flex flex-col items-center space-y-6 sm:space-y-8 transition-all duration-300 ${
            !settings.clockAnalog || !settings.showClock ? 'pt-16 sm:pt-24 md:pt-28' : ''
          }`}
        >
          {/* Clock & Greeting Feature (Only shown in center hero when Analog mode is active) */}
          {settings.clockAnalog && (
            <Clock
              config={{
                showClock: settings.showClock,
                analog: true,
                use24Hour: settings.use24Hour,
                showSeconds: settings.showSeconds,
                showDate: settings.showDate,
                showGreeting: settings.showGreeting,
                userName: settings.userName,
                fontFamily: settings.fontFamily,
              }}
              layout="center"
              weatherSlot={
                settings.showWeather ? (
                  <WeatherWidget
                    config={{
                      showWeather: settings.showWeather,
                      tempUnit: settings.tempUnit,
                      city: settings.weatherCity,
                      autoLocation: settings.weatherAutoLocation,
                      geolocationMode: settings.weatherGeolocation || 'approximate',
                      fontFamily: settings.fontFamily,
                    }}
                    inline={true}
                  />
                ) : null
              }
            />
          )}

          {/* Greeting Banner above Search Bar (when Digital clock is active) */}
          {!settings.clockAnalog && (
            <Greeting
              userName={settings.userName}
              showGreeting={settings.showGreeting}
              showDate={settings.showDate}
              use24Hour={settings.use24Hour}
              fontFamily={settings.fontFamily}
              align="center"
            />
          )}

          {/* Search Bar Feature */}
          <SearchBar
            visible={settings.showSearch}
            currentEngine={settings.searchEngine}
            searchInNewTab={settings.searchInNewTab}
            engines={settings.searchEngines}
            onEngineChange={(engine) => updateSettings({ searchEngine: engine })}
            onOpenSettings={() => setIsCustomizerOpen(true)}
            onUpdateEngines={(newEngines) => updateSettings({ searchEngines: newEngines })}
          />

          {/* Quick Links / Bookmarks Dock */}
          <QuickLinks
            visible={settings.showQuickLinks}
            links={settings.quickLinks}
            openInNewTab={settings.bookmarksInNewTab}
            cols={settings.quickLinksCols}
            size={settings.quickLinksSize}
            showTitles={settings.quickLinksShowTitle}
            styleMode={settings.quickLinksStyle ?? 'dock'}
            showBackground={settings.quickLinksBackground ?? true}
            onUpdateLinks={(newLinks) => updateSettings({ quickLinks: newLinks })}
          />

          {/* Daily Inspirational Quotes */}
          <QuotesWidget config={{ showQuotes: settings.showQuotes }} />
        </div>
      </div>

      {/* Floating Settings Action Button at bottom-right (Always present in all modes) */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-5 sm:bottom-6 right-5 sm:right-6 z-40 pointer-events-auto"
      >
        <button
          onClick={() => setIsCustomizerOpen(true)}
          title="Open UI Customizer"
          className="p-2 sm:p-2.5 rounded-full text-white/35 hover:text-white hover:bg-neutral-950/35 hover:scale-110 active:scale-95 transition-all duration-300 group cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
        >
          <Sliders className="w-4 h-4 transition-transform group-hover:rotate-45 duration-300" />
        </button>
      </motion.div>
      </div>

      {/* Slide-over UI Customizer Drawer */}
      <CustomizerDrawer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={settings}
        onUpdate={(updated) => updateSettings(updated)}
        onReset={resetSettings}
      />
    </main>
  )
}
