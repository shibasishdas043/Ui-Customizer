export interface BookmarkItem {
  id: string
  title: string
  url: string
  icon?: string
  iconType?: 'auto' | 'custom' | 'upload' | 'preset'
}

export interface BookmarksConfig {
  showQuickLinks: boolean
  quickLinks: BookmarkItem[]
  bookmarksInNewTab?: boolean
  quickLinksCols?: number | 'auto'
  quickLinksSize?: 'sm' | 'md' | 'lg'
  quickLinksShowTitle?: boolean
}
