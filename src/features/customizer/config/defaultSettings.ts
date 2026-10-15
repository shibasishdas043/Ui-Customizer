import type { CustomizerSettings } from '../types'
import { DEFAULT_BOOKMARKS } from '../../bookmarks'
import { DEFAULT_SEARCH_ENGINES } from '../../search'
import { DEFAULT_COLLECTIONS } from '../../wallpaper'

export const DEFAULT_SETTINGS: CustomizerSettings = {
  userName: 'Creator',
  accentColor: 'ocean',
  fontFamily: 'sans',
  themeMode: 'dark',

  // Wallpaper Provider & Engine
  backgroundProvider: 'default',
  defaultCategory: 'all',
  customCollectionId: '1065976',
  customSearchQuery: 'nature, mountains',
  customBackgroundUrl: '',
  localImageDataUrl: '',
  solidColor: '#0f172a',
  backgroundBlur: 0,
  backgroundBrightness: 80,
  wallpaperFit: 'cover',
  wallpaperPosition: 'center',
  wallpaperBase: 'window',
  wallpaperZoom: 100,
  wallpaperOffsetY: 50,
  wallpaperOffsetX: 50,
  changeFrequency: 'hour',
  currentPhoto: DEFAULT_COLLECTIONS.nature.fallbackPhotos[0],
  lastWallpaperChange: 0,

  // Backward compatibility fields
  backgroundType: 'preset',
  selectedPresetId: 'nordic-lake',
  unsplashCollectionId: '1065976',
  currentUnsplashPhoto: DEFAULT_COLLECTIONS.nature.fallbackPhotos[0],

  showClock: true,
  clockAnalog: false,
  use24Hour: false,
  showSeconds: false,
  showDate: true,
  showGreeting: true,

  showSearch: true,
  searchEngine: 'google',
  searchInNewTab: false,
  searchEngines: DEFAULT_SEARCH_ENGINES,

  showQuickLinks: true,
  bookmarksInNewTab: false,
  quickLinks: DEFAULT_BOOKMARKS,

  // Weather Widget (Bonjourr Pattern: default to approximate IP location so NO browser permission popup is shown)
  showWeather: true,
  tempUnit: 'celsius',
  weatherCity: '',
  weatherAutoLocation: true,
  weatherGeolocation: 'approximate',

  // Notes Scratchpad Widget
  showNotes: false,
  notesContent: '',

  // Pomodoro Focus Timer
  showPomodoro: false,
  pomodoroWorkDuration: 25,
  pomodoroBreakDuration: 5,
  pomodoroSound: true,

  // Quotes
  showQuotes: true,

  // Browser Control & URL Redirections
  newTabMode: 'aura',
  newTabRedirectUrl: 'https://google.com',
  startupMode: 'aura',
  startupUrl: '',
  homepageUrl: '',
  redirectCountdown: 2,

  customCss: `/* Custom CSS Overrides */
/* Example:
.clock-text {
  letter-spacing: -0.04em;
}
*/`,
}
