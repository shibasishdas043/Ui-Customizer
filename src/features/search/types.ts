export interface SearchEngineItem {
  id: string
  name: string
  url: string
  icon?: string
  iconType?: 'preset' | 'favicon' | 'custom' | 'upload'
  category?: 'Standard' | 'AI' | 'Specialized'
  shortcut?: string
}

export type SearchEngineId = string

export interface SearchConfig {
  showSearch: boolean
  searchEngine: string
  searchInNewTab: boolean
  searchEngines: SearchEngineItem[]
}
