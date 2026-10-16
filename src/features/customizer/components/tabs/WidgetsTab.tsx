import { Cloud, Quote, Clock as ClockIcon, Search, Bookmark, ExternalLink } from 'lucide-react'
import type { CustomizerSettings } from '../../types'
import { SearchEnginesManager } from '../../../../features/search'

interface WidgetsTabProps {
  settings: CustomizerSettings
  onUpdate: (updater: Partial<CustomizerSettings>) => void
  onNavigateToLinks?: () => void
}

export const WidgetsTab: React.FC<WidgetsTabProps> = ({ settings, onUpdate, onNavigateToLinks }) => {
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
            <div className="pt-2 space-y-3">
              {/* Geolocation Mode (Bonjourr Pattern: Approximate, Manual, Precise) */}
              <div>
                <label className="block text-[11px] font-bold text-[#141413] dark:text-slate-300 mb-1.5">
                  Location Mode
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
                <div className="mt-1.5 text-[11px]">
                  {(settings.weatherGeolocation ?? 'approximate') === 'approximate' && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <span>✓</span> Auto-detected by IP (Zero browser permission popups)
                    </span>
                  )}
                  {settings.weatherGeolocation === 'off' && (
                    <span className="text-[#383531] dark:text-slate-400 font-medium">
                      Specify custom city name below (no location detection)
                    </span>
                  )}
                  {settings.weatherGeolocation === 'precise' && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ High-accuracy GPS (Browser will ask for location permission)
                    </span>
                  )}
                </div>
              </div>

              {settings.weatherGeolocation === 'off' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#141413] dark:text-slate-300 mb-1">
                    City Location
                  </label>
                  <input
                    type="text"
                    value={settings.weatherCity}
                    onChange={(e) => onUpdate({ weatherCity: e.target.value })}
                    placeholder="e.g. London, Tokyo, New York, Paris"
                    className="h-10 w-full px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs text-[#141413] dark:text-slate-100 placeholder:text-[#524f49] dark:placeholder:text-slate-500 outline-none border-0 shadow-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
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
