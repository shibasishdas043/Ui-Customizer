import type { SearchEngineItem } from '../types'

/**
 * Default major search engines (Google, DuckDuckGo, Bing, Brave, Perplexity AI)
 * Real favicons are dynamically fetched from the live sites and baked permanently into storage.
 */
export const DEFAULT_SEARCH_ENGINES: SearchEngineItem[] = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },
  {
    id: 'brave',
    name: 'Brave',
    url: 'https://search.brave.com/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    url: 'https://www.perplexity.ai/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'AI',
  },
]

/**
 * Curated engine templates for 1-click addition from Settings (AI engines, specialized, and classic engines)
 */
export const SEARCH_ENGINE_PRESETS: SearchEngineItem[] = [
  // --- AI Search Engines ---
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    url: 'https://www.perplexity.ai/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'AI',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/?q=',
    icon: '',
    iconType: 'favicon',
    category: 'AI',
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/new?q=',
    icon: '',
    iconType: 'favicon',
    category: 'AI',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app?q=',
    icon: '',
    iconType: 'favicon',
    category: 'AI',
  },
  {
    id: 'phind',
    name: 'Phind',
    url: 'https://www.phind.com/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'AI',
  },
  {
    id: 'kagi',
    name: 'Kagi',
    url: 'https://kagi.com/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'AI',
  },

  // --- Major Standard Search Engines ---
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },
  {
    id: 'brave',
    name: 'Brave',
    url: 'https://search.brave.com/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    url: 'https://www.ecosia.org/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    url: 'https://search.yahoo.com/search?p=',
    icon: '',
    iconType: 'favicon',
    category: 'Standard',
  },

  // --- Specialized Search Engines ---
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/results?search_query=',
    icon: '',
    iconType: 'favicon',
    category: 'Specialized',
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/search?q=',
    icon: '',
    iconType: 'favicon',
    category: 'Specialized',
  },
]
