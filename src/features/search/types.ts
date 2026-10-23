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
  searchAutoFocus?: boolean
  searchEngine: string
  searchInNewTab: boolean
  searchEngines: SearchEngineItem[]
}

export interface SearchHistoryItem {
  id: string
  query: string
  timestamp: number
  count: number
  engineId?: string
}

export type SuggestionType = 'current-query' | 'history' | 'web' | 'url'
export type SuggestionMatchType = 'prefix' | 'word' | 'substring' | 'fuzzy' | 'exact' | 'none'

export interface SuggestionItem {
  id: string
  type: SuggestionType
  query: string
  score: number
  engineId?: string
  timestamp?: number
  matchType?: SuggestionMatchType
  url?: string
}


