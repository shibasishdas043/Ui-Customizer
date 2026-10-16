import type React from 'react'
import { useState } from 'react'
import { Sparkles, Globe } from 'lucide-react'
import type { SearchEngineItem } from '../types'
import { getSearchEngineFaviconUrl } from '../utils/searchFaviconHelper'

interface SearchEngineIconProps {
  engine: SearchEngineItem
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Renders the search engine's live/cached thumbnail.
 * Completely free of hardcoded brand SVGs - fetches and displays authentic live site favicons.
 */
export const SearchEngineIcon: React.FC<SearchEngineIconProps> = ({
  engine,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false)

  const sizeClass = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size]

  // Prefer permanently cached Base64 icon; if missing or legacy preset string, query live favicon endpoint
  const isDirectImage =
    engine.icon &&
    (engine.icon.startsWith('data:image/') || engine.icon.startsWith('http'))

  const displaySrc = isDirectImage
    ? engine.icon!
    : engine.url
      ? getSearchEngineFaviconUrl(engine.url)
      : ''

  if (displaySrc && !imgError) {
    return (
      <img
        src={displaySrc}
        alt={engine.name || 'Search Engine'}
        className={`${sizeClass} object-contain rounded-full shrink-0 select-none ${className}`}
        onError={() => setImgError(true)}
      />
    )
  }

  // Graceful Fallback: Category or Letter Avatar
  if (engine.category === 'AI') {
    return <Sparkles className={`${sizeClass} text-cyan-400 shrink-0 ${className}`} />
  }

  const initial = engine.name ? engine.name.charAt(0).toUpperCase() : ''
  if (initial) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-[10px] shrink-0 select-none ${className}`}
      >
        {initial}
      </div>
    )
  }

  return <Globe className={`${sizeClass} text-slate-400 shrink-0 ${className}`} />
}
