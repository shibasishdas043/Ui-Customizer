import type { SearchEngineItem } from '../types'

/**
 * Default major search engines (exactly 5 major engines as requested: Google, DuckDuckGo, Bing, Brave, Perplexity AI)
 */
export const DEFAULT_SEARCH_ENGINES: SearchEngineItem[] = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: 'google',
    iconType: 'preset',
    category: 'Standard',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: 'duckduckgo',
    iconType: 'preset',
    category: 'Standard',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: 'bing',
    iconType: 'preset',
    category: 'Standard',
  },
  {
    id: 'brave',
    name: 'Brave',
    url: 'https://search.brave.com/search?q=',
    icon: 'brave',
    iconType: 'preset',
    category: 'Standard',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    url: 'https://www.perplexity.ai/search?q=',
    icon: 'perplexity',
    iconType: 'preset',
    category: 'AI',
  },
]

/**
 * Curated presets for 1-click addition from Settings (AI engines, specialized, and classic engines)
 */
export const SEARCH_ENGINE_PRESETS: SearchEngineItem[] = [
  // --- AI Search Engines ---
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    url: 'https://www.perplexity.ai/search?q=',
    icon: 'perplexity',
    iconType: 'preset',
    category: 'AI',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/?q=',
    icon: 'chatgpt',
    iconType: 'preset',
    category: 'AI',
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/new?q=',
    icon: 'claude',
    iconType: 'preset',
    category: 'AI',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app?q=',
    icon: 'gemini',
    iconType: 'preset',
    category: 'AI',
  },
  {
    id: 'phind',
    name: 'Phind',
    url: 'https://www.phind.com/search?q=',
    icon: 'phind',
    iconType: 'preset',
    category: 'AI',
  },
  {
    id: 'kagi',
    name: 'Kagi',
    url: 'https://kagi.com/search?q=',
    icon: 'kagi',
    iconType: 'preset',
    category: 'AI',
  },

  // --- Major Standard Search Engines ---
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: 'google',
    iconType: 'preset',
    category: 'Standard',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: 'duckduckgo',
    iconType: 'preset',
    category: 'Standard',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: 'bing',
    iconType: 'preset',
    category: 'Standard',
  },
  {
    id: 'brave',
    name: 'Brave',
    url: 'https://search.brave.com/search?q=',
    icon: 'brave',
    iconType: 'preset',
    category: 'Standard',
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    url: 'https://www.ecosia.org/search?q=',
    icon: 'ecosia',
    iconType: 'preset',
    category: 'Standard',
  },
  {
    id: 'yahoo',
    name: 'Yahoo',
    url: 'https://search.yahoo.com/search?p=',
    icon: 'yahoo',
    iconType: 'preset',
    category: 'Standard',
  },

  // --- Specialized Search Engines ---
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/results?search_query=',
    icon: 'youtube',
    iconType: 'preset',
    category: 'Specialized',
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/search?q=',
    icon: 'github',
    iconType: 'preset',
    category: 'Specialized',
  },
]
