import React, { useState } from 'react'
import { Globe } from 'lucide-react'
import { getInitial, getFallbackGradient } from '../utils/faviconHelper'

interface BookmarkThumbnailProps {
  title: string
  url: string
  icon?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const BookmarkThumbnail: React.FC<BookmarkThumbnailProps> = ({
  title,
  url,
  icon,
  size = 'md',
  className = '',
}) => {
  const [failedIcon, setFailedIcon] = useState<string | null>(null)
  const hasError = !icon || failedIcon === icon

  const dimensions = {
    sm: 'w-8 h-8 rounded-xl text-xs',
    md: 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-base sm:text-lg',
    lg: 'w-16 h-16 rounded-2xl text-xl',
  }[size]

  const iconDimensions = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6 sm:w-7 sm:h-7',
    lg: 'w-8 h-8',
  }[size]

  const isMonochrome = title.toLowerCase().includes('github') || title.toLowerCase().includes('x /') || title.toLowerCase() === 'x'

  if (icon && !hasError) {
    return (
      <div
        className={`${dimensions} bg-black/40 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-lg transition-transform ${className}`}
      >
        <img
          src={icon}
          alt={title || 'Icon'}
          className={`${iconDimensions} object-contain rounded-sm transition-all ${
            isMonochrome ? 'invert brightness-200' : ''
          }`}
          onError={() => setFailedIcon(icon)}
        />
      </div>
    )
  }

  // Graceful Fallback: Letter Avatar with dynamic gradient
  const initial = getInitial(title, url)
  const gradient = getFallbackGradient(title || url || 'A')

  return (
    <div
      className={`${dimensions} bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-lg select-none ${className}`}
    >
      {initial && initial !== '?' ? (
        <span className="tracking-tight drop-shadow-sm">{initial}</span>
      ) : (
        <Globe className={`${iconDimensions} text-white/90`} />
      )}
    </div>
  )
}
