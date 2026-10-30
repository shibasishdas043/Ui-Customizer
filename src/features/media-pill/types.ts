export type MediaPlatform =
  | 'youtube'
  | 'spotify'
  | 'soundcloud'
  | 'netflix'
  | 'apple_music'
  | 'twitch'
  | 'deezer'
  | 'tidal'
  | 'bandcamp'
  | 'amazon_music'
  | 'vimeo'
  | 'generic'

export interface NowPlayingMedia {
  tabId: number
  title: string
  cleanTitle: string
  url: string
  favIconUrl?: string
  thumbnailUrl?: string
  artist?: string
  isPlaying: boolean
  isMuted: boolean
  platform: MediaPlatform
}

export interface MediaPillConfig {
  enabled: boolean
  hoverExpand: boolean
  showControls: boolean
  hasSearchAdjacent: boolean
}
