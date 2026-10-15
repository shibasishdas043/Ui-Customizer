import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { SearchEngineItem } from '../types'

interface SearchEngineIconProps {
  engine: SearchEngineItem
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

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

  const iconKey = (engine.icon || engine.id || '').toLowerCase()

  // 1. Preset SVGs
  if (iconKey === 'google' || engine.id === 'google') {
    return (
      <svg className={`${sizeClass} shrink-0 ${className}`} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.33 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
      </svg>
    )
  }

  if (iconKey === 'duckduckgo' || engine.id === 'duckduckgo') {
    return (
      <svg className={`${sizeClass} shrink-0 ${className}`} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#DE5833"/>
        <path d="M12 6c-2.4 0-4.3 1.7-4.3 3.8 0 1.1.5 2.1 1.4 2.8-.4.7-1 1.3-1.8 1.6.9.3 1.9.2 2.8-.3.6.4 1.2.6 1.9.6 2.4 0 4.3-1.7 4.3-3.8S14.4 6 12 6z" fill="#FFF"/>
        <circle cx="13.8" cy="9.2" r="0.9" fill="#222"/>
        <path d="M15.5 10.6c.9.2 1.8.7 2.2 1.3-.6.4-1.5.4-2.2-.1z" fill="#F8B133"/>
      </svg>
    )
  }

  if (iconKey === 'bing' || engine.id === 'bing') {
    return (
      <svg className={`${sizeClass} text-[#008394] fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path d="M4.5 2v17.5l5.8 3.5 7.7-4.4v-5.5l-5.5-3.2v-4.1l-5.4-3.8H4.5zm3.1 3.9l2.3 1.6v4.7l5.5 3.2-4.3 2.5-3.5-2V5.9z"/>
      </svg>
    )
  }

  if (iconKey === 'brave' || engine.id === 'brave') {
    return (
      <svg className={`${sizeClass} text-[#FB542B] fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path d="M12 2L4 5.5v5.8c0 5.4 3.4 10.4 8 11.7 4.6-1.3 8-6.3 8-11.7V5.5L12 2zm0 3.3l5.5 2.3v4.2c0 3.9-2.3 7.5-5.5 8.7-3.2-1.2-5.5-4.8-5.5-8.7V7.6L12 5.3z"/>
      </svg>
    )
  }

  if (iconKey === 'perplexity' || engine.id === 'perplexity') {
    return (
      <svg className={`${sizeClass} text-cyan-400 fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z"/>
      </svg>
    )
  }

  if (iconKey === 'chatgpt' || engine.id === 'chatgpt') {
    return (
      <svg className={`${sizeClass} text-emerald-400 fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path d="M22.28 11.37a5.55 5.55 0 0 0-.47-4.52 5.7 5.7 0 0 0-4.06-2.88 5.7 5.7 0 0 0-4.88 1.13 5.6 5.6 0 0 0-4.22-.16 5.68 5.68 0 0 0-3.37 3.32 5.7 5.7 0 0 0-.82 4.95 5.57 5.57 0 0 0 .47 4.52 5.7 5.7 0 0 0 4.06 2.88 5.7 5.7 0 0 0 4.88-1.13 5.6 5.6 0 0 0 4.22.16 5.68 5.68 0 0 0 3.37-3.32 5.7 5.7 0 0 0 .82-4.95zM12 14.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
      </svg>
    )
  }

  if (iconKey === 'claude' || engine.id === 'claude') {
    return (
      <svg className={`${sizeClass} text-[#D97757] fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V15a1 1 0 0 1 2 0v1.93a8 8 0 0 1-2 0zM12 5a3 3 0 0 1 3 3c0 2-3 2-3 4a1 1 0 0 1-2 0c0-3 3-3 3-4a1 1 0 0 0-2 0 1 1 0 0 1-2 0 3 3 0 0 1 3-3z"/>
      </svg>
    )
  }

  if (iconKey === 'gemini' || engine.id === 'gemini') {
    return (
      <svg className={`${sizeClass} text-indigo-400 fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.627 12 12 0-6.627 5.627-12 12-12-6.627 0-12-5.373-12-12z"/>
      </svg>
    )
  }

  if (iconKey === 'phind' || engine.id === 'phind') {
    return (
      <svg className={`${sizeClass} text-violet-400 fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    )
  }

  if (iconKey === 'kagi' || engine.id === 'kagi') {
    return (
      <svg className={`${sizeClass} text-amber-400 fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M15 15l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }

  if (iconKey === 'ecosia' || engine.id === 'ecosia') {
    return (
      <svg className={`${sizeClass} text-[#43A047] fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h2v3c0 .55.45 1 1 1s1-.45 1-1v-3h2c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 10c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
      </svg>
    )
  }

  if (iconKey === 'youtube' || engine.id === 'youtube') {
    return (
      <svg className={`${sizeClass} text-red-500 fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  }

  if (iconKey === 'github' || engine.id === 'github') {
    return (
      <svg className={`${sizeClass} text-slate-200 fill-current shrink-0 ${className}`} viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    )
  }

  // 2. Direct Image / Favicon / Data URL
  if (engine.icon && (engine.icon.startsWith('http') || engine.icon.startsWith('data:')) && !imgError) {
    return (
      <img
        src={engine.icon}
        alt={engine.name}
        className={`${sizeClass} object-contain rounded-sm shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    )
  }

  // 3. Fallback: Category or Letter Avatar
  if (engine.category === 'AI') {
    return <Sparkles className={`${sizeClass} text-cyan-400 shrink-0 ${className}`} />
  }

  const initial = engine.name ? engine.name.charAt(0).toUpperCase() : 'S'
  return (
    <div
      className={`${sizeClass} rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-[10px] shrink-0 ${className}`}
    >
      {initial}
    </div>
  )
}
