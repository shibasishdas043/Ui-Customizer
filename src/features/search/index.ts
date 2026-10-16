export { SearchBar } from './components/SearchBar'
export { EngineSelector, EngineSelectorDropdown } from './components/EngineSelector'
export { SearchSuggestionsDropdown } from './components/SearchSuggestionsDropdown'
export { SearchEngineIcon } from './components/SearchEngineIcon'
export { SearchEnginesManager } from './components/SearchEnginesManager'
export { SearchEngineEditorModal } from './components/SearchEngineEditorModal'
export { DEFAULT_SEARCH_ENGINES, SEARCH_ENGINE_PRESETS } from './config/defaultEngines'
export { buildSearchUrl, isValidUrl } from './utils/searchUrlHelper'
export { fetchSearchSuggestions } from './utils/searchSuggestionsHelper'
export {
  resolveAndCacheSearchFavicon,
  fetchLiveSearchFavicon,
  getSearchEngineFaviconUrl,
  migrateSearchEnginesToPermanentCache,
  extractEngineDomain,
} from './utils/searchFaviconHelper'
export type { SearchEngineItem, SearchEngineId, SearchConfig } from './types'
