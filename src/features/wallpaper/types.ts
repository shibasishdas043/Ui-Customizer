export interface WallpaperPreset {
  id: string
  name: string
  url: string
  author: string
}

export type BackgroundProvider =
  | 'default'
  | 'unsplash_collection'
  | 'unsplash_search'
  | 'custom_url'
  | 'local_file'
  | 'solid_color'

export type DefaultCollectionCategory = 'all' | 'nature' | 'mountains' | 'beaches'

export type WallpaperType = 'preset' | 'unsplash' | 'custom' | 'color'

export type WallpaperFrequency = 'tabs' | 'hour' | 'day' | 'period' | 'locked'

export interface UnsplashPhoto {
  id?: string
  url: string
  author: string
  username?: string
  pageUrl?: string
  color?: string
}

export type WallpaperFitMode = 'cover' | 'contain' | 'stretch' | 'center'
export type WallpaperPosition = 'center' | 'top' | 'bottom'
export type WallpaperBaseMode = 'screen' | 'window'

export interface WallpaperConfig {
  backgroundProvider: BackgroundProvider
  defaultCategory: DefaultCollectionCategory
  customCollectionId: string
  customSearchQuery: string
  customBackgroundUrl: string
  localImageDataUrl: string
  solidColor: string
  backgroundBlur: number // 0 - 20px
  backgroundBrightness: number // 30 - 100%
  wallpaperFit?: WallpaperFitMode
  wallpaperPosition?: WallpaperPosition
  wallpaperBase?: WallpaperBaseMode
  wallpaperZoom?: number // 50 to 150 %
  wallpaperOffsetY?: number // 0 to 100 %
  wallpaperOffsetX?: number // 0 to 100 %
  changeFrequency: WallpaperFrequency
  currentPhoto?: UnsplashPhoto | null
  lastWallpaperChange?: number
  onUpdatePhoto?: (photo: UnsplashPhoto, timestamp: number) => void
  onWallpaperReady?: (isReady: boolean) => void

  // Backward compatibility aliases
  backgroundType?: WallpaperType
  selectedPresetId?: string
  unsplashCollectionId?: string
  currentUnsplashPhoto?: UnsplashPhoto | null
  onUpdateUnsplashPhoto?: (photo: UnsplashPhoto, timestamp: number) => void
}
