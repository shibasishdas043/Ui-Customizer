import type { BookmarkItem, QuickLinksStyle } from '../bookmarks/types'
export type { QuickLinksStyle }
import type { SearchEngineItem } from '../search/types'
import type {
  WallpaperType,
  WallpaperFrequency,
  WallpaperFitMode,
  WallpaperPosition,
  WallpaperBaseMode,
  UnsplashPhoto,
  BackgroundProvider,
  DefaultCollectionCategory,
  WallpaperTexture,
} from '../wallpaper/types'
import type { NewTabMode, StartupMode } from '../browser-settings/types'
import type { QuoteType, QuoteFrequency } from '../quotes/types'

export type AccentColor =
  | 'ocean'
  | 'cyan'
  | 'cream'
  | 'peach'
  | 'coral'
  | 'indigo'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'violet'
export type FontFamily = 'sans' | 'display' | 'mono' | 'caveat' | 'playwrite' | 'stalemate'
export type ThemeMode = 'system' | 'dark' | 'light'
export type WeatherGeolocationMode = 'approximate' | 'precise' | 'off'

export interface CustomizerSettings {
  // Theme & Appearance
  userName: string
  accentColor: AccentColor
  fontFamily: FontFamily
  themeMode: ThemeMode

  // Wallpaper Ambience Engine (Bonjourr Pattern)
  backgroundProvider: BackgroundProvider
  defaultCategory: DefaultCollectionCategory
  customCollectionId: string
  customSearchQuery: string
  redditSubreddit?: string
  customBackgroundUrl: string
  localImageDataUrl: string
  solidColor: string
  backgroundBlur: number // 0 to 20 px
  backgroundBrightness: number // 30 to 100 %
  wallpaperFit: WallpaperFitMode
  wallpaperPosition: WallpaperPosition
  wallpaperBase: WallpaperBaseMode // 'screen' = Whole Monitor, 'window' = Browser Section
  wallpaperZoom: number // 50 to 150 %
  wallpaperOffsetY: number // 0 to 100 %
  wallpaperOffsetX: number // 0 to 100 %
  wallpaperTexture?: WallpaperTexture
  wallpaperTextureOpacity?: number // 0 to 50 %
  changeFrequency: WallpaperFrequency // 'tabs' | 'hour' | 'day' | 'period' | 'locked'
  currentPhoto?: UnsplashPhoto | null
  lastWallpaperChange?: number

  // Backward compatibility fields
  backgroundType: WallpaperType
  selectedPresetId: string
  unsplashCollectionId: string
  currentUnsplashPhoto?: UnsplashPhoto | null

  // Clock Widget
  showClock: boolean
  clockAnalog: boolean
  use24Hour: boolean
  showSeconds: boolean
  showDate: boolean
  showGreeting: boolean

  // Search Bar
  showSearch: boolean
  searchEngine: string
  searchInNewTab: boolean
  searchEngines: SearchEngineItem[]

  // Quick Links (Bonjourr / Apple Dock Pattern)
  showQuickLinks: boolean
  bookmarksInNewTab: boolean
  quickLinks: BookmarkItem[]
  quickLinksCols: number | 'auto'
  quickLinksSize: 'sm' | 'md' | 'lg'
  quickLinksShowTitle: boolean
  quickLinksStyle?: QuickLinksStyle
  quickLinksBackground?: boolean

  // Weather Widget (Bonjourr Pattern)
  showWeather: boolean
  tempUnit: 'celsius' | 'fahrenheit'
  weatherCity: string
  weatherAutoLocation: boolean
  weatherGeolocation: WeatherGeolocationMode

  // Notes Scratchpad Widget
  showNotes: boolean
  notesContent: string

  // Pomodoro Focus Timer
  showPomodoro: boolean
  pomodoroWorkDuration: number
  pomodoroBreakDuration: number
  pomodoroSound: boolean

  // Daily Quotes
  showQuotes: boolean
  quoteType: QuoteType
  quoteFrequency: QuoteFrequency
  alwaysShowAuthor: boolean
  quoteLanguage: string
  customQuotesText: string
  customQuotesUrl: string

  // Browser Control & URL Redirections
  newTabMode: NewTabMode
  newTabRedirectUrl: string
  startupMode: StartupMode
  startupUrl: string
  homepageUrl: string
  redirectCountdown: number

  // Live CSS Injection
  customCss: string
}
