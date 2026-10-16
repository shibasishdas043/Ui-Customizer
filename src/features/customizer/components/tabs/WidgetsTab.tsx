import { useState, useEffect, useRef } from 'react'
import {
  Cloud,
  Quote,
  Clock as ClockIcon,
  Search,
  Bookmark,
  ExternalLink,
  MapPin,
  RotateCw,
  Loader2,
  Check,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import type { CustomizerSettings } from '../../types'
import { SearchEnginesManager } from '../../../../features/search'
import {
  searchCities,
  clearLocationCache,
  resolveLocation,
  getApproximateLocation,
  saveManualLocation,
} from '../../../../features/weather'
import type { CitySearchResult } from '../../../../features/weather'

interface WidgetsTabProps {
  settings: CustomizerSettings
  onUpdate: (updater: Partial<CustomizerSettings>) => void
  onNavigateToLinks?: () => void
}

/**
 * Converts a 2-letter ISO country code into a native flag emoji.
 */
function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '📍'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

/**
 * Highlights matching characters within the suggested city name.
 */
function highlightMatch(text: string, query: string) {
  if (!query) return text
  const trimmed = query.trim()
  const idx = text.toLowerCase().indexOf(trimmed.toLowerCase())
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + trimmed.length)
  const after = text.slice(idx + trimmed.length)
  return (
    <>
      {before}
      <span className="font-bold text-[var(--accent-color)] underline decoration-[var(--accent-color)]/40 underline-offset-2">
        {match}
      </span>
      {after}
    </>
  )
}

export const WidgetsTab: React.FC<WidgetsTabProps> = ({ settings, onUpdate, onNavigateToLinks }) => {
  const [citySearchQuery, setCitySearchQuery] = useState(settings.weatherCity || '')
  const [prevWeatherCity, setPrevWeatherCity] = useState(settings.weatherCity)
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectFeedback, setDetectFeedback] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Adjust state during render when prop changes (React recommended pattern)
  if (settings.weatherCity !== prevWeatherCity) {
    setPrevWeatherCity(settings.weatherCity)
    setCitySearchQuery(settings.weatherCity || '')
  }

  // Click outside listener to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced live city search using Open-Meteo Geocoding
  useEffect(() => {
    if (settings.weatherGeolocation !== 'off') return
    const query = citySearchQuery.trim()
    if (query.length < 2) return

    const abortCtrl = new AbortController()
    const timeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchCities(query, abortCtrl.signal)
        setSearchResults(results)
        setShowDropdown(results.length > 0)
        setHighlightedIndex(results.length > 0 ? 0 : -1)
      } catch {
        setSearchResults([])
        setHighlightedIndex(-1)
      } finally {
        setIsSearching(false)
      }
    }, 240)

    return () => {
      clearTimeout(timeout)
      abortCtrl.abort()
    }
  }, [citySearchQuery, settings.weatherGeolocation])

  const handleCityInputChange = (value: string) => {
    setCitySearchQuery(value)
    onUpdate({ weatherCity: value })
    if (value.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      setIsSearching(false)
      setHighlightedIndex(-1)
    }
  }

  const handleSelectCity = (city: CitySearchResult) => {
    const formattedCity = city.name
    // Save exact coordinates to cache for instant 0ms weather loading
    saveManualLocation({
      city: city.name,
      lat: city.latitude,
      lon: city.longitude,
      state: city.admin1,
      country: city.country,
      source: 'manual',
    })
    setCitySearchQuery(formattedCity)
    setShowDropdown(false)
    setSearchResults([])
    setHighlightedIndex(-1)
    onUpdate({ weatherCity: formattedCity })
    clearLocationCache()
    saveManualLocation({
      city: city.name,
      lat: city.latitude,
      lon: city.longitude,
      state: city.admin1,
      country: city.country,
      source: 'manual',
    })
    window.dispatchEvent(new CustomEvent('aura:weather-refresh'))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
        handleSelectCity(searchResults[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleRefreshLocation = async () => {
    setIsDetecting(true)
    setDetectFeedback(null)
    try {
      clearLocationCache()
      const loc = await resolveLocation(settings.weatherGeolocation ?? 'approximate', undefined, true)
      window.dispatchEvent(new CustomEvent('aura:weather-refresh'))
      setDetectFeedback(`Detected: ${loc.city}${loc.country ? ', ' + loc.country : ''}`)
      setTimeout(() => setDetectFeedback(null), 4000)
    } catch {
      setDetectFeedback('Detection failed. Please check network.')
      setTimeout(() => setDetectFeedback(null), 4000)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleAutoFillCity = async () => {
    setIsDetecting(true)
    try {
      const loc = await getApproximateLocation(true)
      if (loc && loc.city) {
        setCitySearchQuery(loc.city)
        onUpdate({ weatherCity: loc.city })
        clearLocationCache()
        window.dispatchEvent(new CustomEvent('aura:weather-refresh'))
        setDetectFeedback(`Auto-detected: ${loc.city}`)
        setTimeout(() => setDetectFeedback(null), 3500)
      }
    } catch {
      setDetectFeedback('Could not auto-detect city.')
      setTimeout(() => setDetectFeedback(null), 3500)
    } finally {
      setIsDetecting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Clock & Date Controls */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center gap-2">
          <ClockIcon className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          Clock & Greetings
        </h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Show Clock</span>
            <input
              type="checkbox"
              checked={settings.showClock}
              onChange={(e) => onUpdate({ showClock: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Clock Style</span>
            <div className="flex p-0.5 rounded-xl bg-black/5 dark:bg-white/[0.04] text-xs font-medium gap-0.5">
              <button
                type="button"
                onClick={() => onUpdate({ clockAnalog: false })}
                className={`px-3 py-1 rounded-lg transition-all border-0 outline-none ${
                  !settings.clockAnalog
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                    : 'bg-white dark:bg-transparent text-[#141413] dark:text-slate-400 hover:bg-[#f5f0e8] dark:hover:text-white shadow-xs font-semibold'
                }`}
              >
                Digital
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ clockAnalog: true })}
                className={`px-3 py-1 rounded-lg transition-all border-0 outline-none ${
                  settings.clockAnalog
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                    : 'bg-white dark:bg-transparent text-[#141413] dark:text-slate-400 hover:bg-[#f5f0e8] dark:hover:text-white shadow-xs font-semibold'
                }`}
              >
                Analog
              </button>
            </div>
          </label>

          {!settings.clockAnalog && (
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-[#141413] dark:text-slate-200">24-Hour Format</span>
                <span className="text-[10px] text-[#383531] dark:text-slate-400 font-medium">
                  {settings.use24Hour ? 'Active: 24-Hour (e.g. 14:00)' : 'Active: 12-Hour (e.g. 2:00 PM)'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.use24Hour}
                onChange={(e) => onUpdate({ use24Hour: e.target.checked })}
                className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
              />
            </label>
          )}

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Show Seconds</span>
            <input
              type="checkbox"
              checked={settings.showSeconds}
              onChange={(e) => onUpdate({ showSeconds: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Show Date</span>
            <input
              type="checkbox"
              checked={settings.showDate}
              onChange={(e) => onUpdate({ showDate: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Show Greeting</span>
            <input
              type="checkbox"
              checked={settings.showGreeting}
              onChange={(e) => onUpdate({ showGreeting: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 2. Weather Widget Controls */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center gap-2">
          <Cloud className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          Live Weather
        </h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Show Weather</span>
            <input
              type="checkbox"
              checked={settings.showWeather}
              onChange={(e) => onUpdate({ showWeather: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
            />
          </label>

          {settings.showWeather && (
            <div className="pt-2 space-y-3.5">
              {/* Geolocation Mode (Approximate, Manual, Precise) */}
              <div>
                <label className="block text-[11px] font-bold text-[#141413] dark:text-slate-300 mb-1.5">
                  Location Detection Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/[0.04]">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({
                        weatherGeolocation: 'approximate',
                        weatherAutoLocation: true,
                      })
                    }
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all border-0 outline-none ${
                      (settings.weatherGeolocation ?? 'approximate') === 'approximate'
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                        : 'bg-white dark:bg-transparent text-[#141413] dark:text-slate-400 hover:bg-[#f5f0e8] dark:hover:text-white shadow-xs font-semibold'
                    }`}
                  >
                    Approximate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({
                        weatherGeolocation: 'off',
                        weatherAutoLocation: false,
                      })
                    }
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all border-0 outline-none ${
                      settings.weatherGeolocation === 'off'
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                        : 'bg-white dark:bg-transparent text-[#141413] dark:text-slate-400 hover:bg-[#f5f0e8] dark:hover:text-white shadow-xs font-semibold'
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({
                        weatherGeolocation: 'precise',
                        weatherAutoLocation: true,
                      })
                    }
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all border-0 outline-none ${
                      settings.weatherGeolocation === 'precise'
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                        : 'bg-white dark:bg-transparent text-[#141413] dark:text-slate-400 hover:bg-[#f5f0e8] dark:hover:text-white shadow-xs font-semibold'
                    }`}
                  >
                    Precise
                  </button>
                </div>

                <div className="mt-2 text-[11px] leading-relaxed">
                  {(settings.weatherGeolocation ?? 'approximate') === 'approximate' && (
                    <div className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="shrink-0 mt-0.5">✓</span>
                      <span>
                        Automatic IP cascade (BigDataCloud + ipwho.is + freeipapi + geojs.io) — 100% free, zero browser popups.
                      </span>
                    </div>
                  )}
                  {settings.weatherGeolocation === 'off' && (
                    <div className="flex items-start gap-1.5 text-[#383531] dark:text-slate-400 font-medium">
                      <Search className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--accent-color)]" />
                      <span>Search any global city with real-time Open-Meteo autocomplete.</span>
                    </div>
                  )}
                  {settings.weatherGeolocation === 'precise' && (
                    <div className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                      <span className="shrink-0 mt-0.5">⚠️</span>
                      <span>
                        High-accuracy GPS coordinates with BigDataCloud reverse geocoding (browser will prompt for permission).
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Refresh / Re-detect Action for Auto Modes */}
              {settings.weatherGeolocation !== 'off' && (
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-[#383531] dark:text-slate-300 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    <span>Location Status</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshLocation}
                    disabled={isDetecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/[0.1] text-xs font-medium text-[#141413] dark:text-slate-200 transition-all border-0 outline-none cursor-pointer disabled:opacity-50"
                  >
                    {isDetecting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-color)]" />
                    ) : (
                      <RotateCw className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                    )}
                    <span>{isDetecting ? 'Detecting...' : 'Refresh Location'}</span>
                  </button>
                </div>
              )}

              {/* Detection / Refresh Feedback Toast */}
              {detectFeedback && (
                <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{detectFeedback}</span>
                </div>
              )}

              {/* Manual City Search Autocomplete Input */}
              {settings.weatherGeolocation === 'off' && (
                <div className="space-y-1.5" ref={dropdownRef}>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#141413] dark:text-slate-300">
                      Search City
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoFillCity}
                      disabled={isDetecting}
                      className="text-[11px] text-[var(--accent-color)] hover:underline font-medium flex items-center gap-1 border-0 bg-transparent cursor-pointer p-0"
                    >
                      {isDetecting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>Auto-detect current</span>
                    </button>
                  </div>

                  <div className="relative">
                    <div className="relative flex items-center rounded-xl bg-white dark:bg-white/[0.04] shadow-xs border border-black/5 dark:border-white/5 focus-within:ring-2 focus-within:ring-[var(--accent-color)]/30 focus-within:border-[var(--accent-color)]/40 transition-all">
                      <Search className="w-3.5 h-3.5 absolute left-3 text-[#524f49] dark:text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={citySearchQuery}
                        onChange={(e) => handleCityInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                          if (searchResults.length > 0) setShowDropdown(true)
                        }}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        placeholder="Type city name (e.g. London, Tokyo, New York)..."
                        className="h-10 w-full pl-9 pr-8 bg-transparent text-xs text-[#141413] dark:text-slate-100 placeholder:text-[#524f49] dark:placeholder:text-slate-500 outline-none border-0"
                      />
                      {isSearching ? (
                        <Loader2 className="w-3.5 h-3.5 absolute right-3 text-[var(--accent-color)] animate-spin" />
                      ) : citySearchQuery ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCitySearchQuery('')
                            setSearchResults([])
                            setShowDropdown(false)
                            setHighlightedIndex(-1)
                            onUpdate({ weatherCity: '' })
                          }}
                          className="absolute right-2.5 p-1 rounded-md text-[#524f49] dark:text-slate-400 hover:text-[#141413] dark:hover:text-white border-0 bg-transparent cursor-pointer transition-colors"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>

                    {/* Autocomplete Results Dropdown */}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-2xl bg-white/95 dark:bg-[#181715]/95 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl p-1.5 space-y-1 transition-all">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#736e65] dark:text-slate-400 flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-1 mb-1">
                          <span>Suggestions ({searchResults.length})</span>
                          <span className="text-[9px] font-normal lowercase tracking-normal flex items-center gap-1.5 text-[#8c867a] dark:text-slate-400">
                            <span>↑↓ navigate</span>
                            <span>•</span>
                            <span>↵ select</span>
                          </span>
                        </div>

                        {searchResults.map((city, index) => {
                          const isSelected = highlightedIndex === index
                          const regionParts = [city.admin2, city.admin1].filter(Boolean)
                          const regionText = regionParts.length > 0 ? regionParts.join(', ') : city.country || ''
                          const flag = getCountryFlag(city.countryCode)

                          return (
                            <button
                              key={`${city.id}-${index}`}
                              type="button"
                              onMouseEnter={() => setHighlightedIndex(index)}
                              onClick={() => handleSelectCity(city)}
                              className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center gap-2.5 border-0 cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--accent-color)]/12 dark:bg-[var(--accent-color)]/20 text-[#141413] dark:text-white shadow-xs ring-1 ring-[var(--accent-color)]/30'
                                  : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#141413] dark:text-slate-200'
                              }`}
                            >
                              {/* Location Pin Icon */}
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#736e65] dark:text-slate-400'
                                }`}
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </div>

                              {/* City & Region Details */}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-xs font-semibold truncate leading-tight">
                                  {highlightMatch(city.name, citySearchQuery)}
                                </span>
                                {regionText && (
                                  <span className="text-[11px] text-[#736e65] dark:text-slate-400 truncate leading-tight mt-0.5">
                                    {regionText}
                                  </span>
                                )}
                              </div>

                              {/* Country Pill with Flag Emoji & Name */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {city.country && (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] text-[#383531] dark:text-slate-300 border border-black/5 dark:border-white/5 flex items-center gap-1">
                                    <span>{flag}</span>
                                    <span className="truncate max-w-[85px]">{city.country}</span>
                                  </span>
                                )}
                                {isSelected && (
                                  <ChevronRight className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0 animate-in fade-in" />
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Temperature Unit</span>
                <div className="flex p-0.5 rounded-xl bg-black/5 dark:bg-white/[0.04] text-xs font-medium gap-0.5">
                  <button
                    type="button"
                    onClick={() => onUpdate({ tempUnit: 'celsius' })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border-0 outline-none ${
                      settings.tempUnit === 'celsius'
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                        : 'bg-white dark:bg-transparent text-[#141413] dark:text-slate-400 hover:bg-[#f5f0e8] dark:hover:text-white shadow-xs'
                    }`}
                  >
                    °C
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ tempUnit: 'fahrenheit' })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border-0 outline-none ${
                      settings.tempUnit === 'fahrenheit'
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                        : 'bg-white dark:bg-transparent text-[#141413] dark:text-slate-400 hover:bg-[#f5f0e8] dark:hover:text-white shadow-xs'
                    }`}
                  >
                    °F
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Productivity Tools (Daily Inspiring Quotes) */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center gap-2">
          <Quote className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          Productivity Tools
        </h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-semibold text-[#141413] dark:text-slate-200 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Daily Inspiring Quotes
            </span>
            <input
              type="checkbox"
              checked={settings.showQuotes}
              onChange={(e) => onUpdate({ showQuotes: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 4. Search Bar Options & Manager */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-4">
        <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          Search Bar Options
        </h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Show Search Bar</span>
            <input
              type="checkbox"
              checked={settings.showSearch}
              onChange={(e) => onUpdate({ showSearch: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Open Search in New Tab</span>
            <input
              type="checkbox"
              checked={settings.searchInNewTab}
              onChange={(e) => onUpdate({ searchInNewTab: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
            />
          </label>
        </div>

        {/* Embedded Search Engines Manager */}
        <div className="pt-2">
          <SearchEnginesManager
            engines={settings.searchEngines || []}
            onUpdateEngines={(newEngines) => onUpdate({ searchEngines: newEngines })}
            currentEngineId={settings.searchEngine}
            onSelectDefaultEngine={(engineId) => onUpdate({ searchEngine: engineId })}
          />
        </div>
      </div>

      {/* 5. Quick Links Dock Quick Settings */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Quick Links Dock
          </h4>
          <span className="text-[11px] text-[#383531] dark:text-slate-400 font-semibold">
            {settings.quickLinks?.length || 0} links
          </span>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Show Quick Links Dock</span>
            <input
              type="checkbox"
              checked={settings.showQuickLinks}
              onChange={(e) => onUpdate({ showQuickLinks: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent-color)] cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-[#141413] dark:text-slate-200">Open Links In</span>
            <div className="p-1 bg-black/5 dark:bg-white/[0.04] rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdate({ bookmarksInNewTab: false })}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors border-0 outline-none ${
                  !settings.bookmarksInNewTab
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-transparent text-[#141413] dark:text-slate-400 hover:bg-[#f5f0e8] dark:hover:text-white shadow-xs'
                }`}
              >
                Same Tab
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ bookmarksInNewTab: true })}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors border-0 outline-none ${
                  settings.bookmarksInNewTab
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                    : 'bg-white dark:bg-transparent text-[#141413] dark:text-slate-400 hover:bg-[#f5f0e8] dark:hover:text-white shadow-xs'
                }`}
              >
                New Tab
              </button>
            </div>
          </div>

          {onNavigateToLinks && (
            <button
              type="button"
              onClick={onNavigateToLinks}
              className="w-full mt-2 py-2.5 rounded-xl bg-white dark:bg-white/[0.05] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] text-xs font-bold text-[var(--accent-color)] flex items-center justify-center gap-2 cursor-pointer transition-colors border-0 outline-none shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Manage & Customize Links ({settings.quickLinks?.length || 0})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
