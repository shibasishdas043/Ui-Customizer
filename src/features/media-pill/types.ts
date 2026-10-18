export type MediaPlatform = 'youtube' | 'spotify' | 'soundcloud' | 'netflix' | 'apple_music' | 'generic'

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
