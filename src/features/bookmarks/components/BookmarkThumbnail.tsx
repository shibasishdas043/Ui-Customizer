import { useState } from 'react'
import type React from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Globe } from 'lucide-react'
import { getInitial, getFallbackGradient, getFaviconUrl } from '../utils/faviconHelper'
import { isHardcodedLegacySvg } from '../utils/faviconCacheHelper'

interface BookmarkThumbnailProps {
  title: string
  url: string
  icon?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  interactive?: boolean
}

const thumbnailVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow:
      '0 4px 16px -2px rgba(0, 0, 0, 0.35), 0 2px 6px -1px rgba(0, 0, 0, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
      mass: 0.75,
    },
  },
  hover: {
    y: -5.5,
    scale: 1.075,
    boxShadow:
      '0 18px 36px -4px rgba(0, 0, 0, 0.55), 0 8px 18px -2px rgba(0, 0, 0, 0.35), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.38)',
    borderColor: 'rgba(255, 255, 255, 0.38)',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 24,
      mass: 0.65,
    },
  },
  tap: {
    y: 0,
    scale: 0.94,
    boxShadow: '0 2px 8px -1px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 30,
    },
  },
}

const iconVariants: Variants = {
  rest: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
    },
  },
  hover: {
    scale: 1.06,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 24,
    },
  },
  tap: {
    scale: 0.95,
  },
}

const fallbackVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.35), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
      mass: 0.75,
    },
  },
  hover: {
    y: -5.5,
    scale: 1.075,
    boxShadow: '0 18px 36px -4px rgba(0, 0, 0, 0.55), 0 8px 18px -2px rgba(0, 0, 0, 0.35)',
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 24,
      mass: 0.65,
    },
  },
  tap: {
    y: 0,
    scale: 0.94,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 30,
    },
  },
}

export const BookmarkThumbnail: React.FC<BookmarkThumbnailProps> = ({
  title,
  url,
  icon,
  size = 'md',
  className = '',
  interactive = false,
}) => {
  const [failedIcon, setFailedIcon] = useState<string | null>(null)
  
  // Prefer cached Base64 icon; if empty or legacy hardcoded SVG, display genuine Google S2 favicon while background cache bakes
  const displayIcon = icon && !isHardcodedLegacySvg(icon) ? icon : (url ? getFaviconUrl(url, 'google') : '')
  const hasError = !displayIcon || failedIcon === displayIcon

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

  if (displayIcon && !hasError) {
    if (interactive) {
      return (
        <motion.div
          variants={thumbnailVariants}
          className={`${dimensions} backdrop-blur-xl backdrop-saturate-150 flex items-center justify-center overflow-hidden border will-change-transform ${className}`}
          style={{
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            backdropFilter: 'blur(20px) saturate(150%)',
          }}
        >
          <motion.img
            variants={iconVariants}
            src={displayIcon}
            alt={title || 'Icon'}
            className={`${iconDimensions} object-contain rounded-sm will-change-transform ${
              isMonochrome ? 'invert brightness-200' : ''
            }`}
            onError={() => setFailedIcon(displayIcon)}
          />
        </motion.div>
      )
    }

    return (
      <div
        className={`${dimensions} bg-black/35 backdrop-blur-xl backdrop-saturate-150 flex items-center justify-center overflow-hidden shadow-lg border border-white/10 ${className}`}
        style={{
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          backdropFilter: 'blur(20px) saturate(150%)',
        }}
      >
        <img
          src={displayIcon}
          alt={title || 'Icon'}
          className={`${iconDimensions} object-contain rounded-sm ${
            isMonochrome ? 'invert brightness-200' : ''
          }`}
          onError={() => setFailedIcon(displayIcon)}
        />
      </div>
    )
  }

  // Graceful Fallback: Letter Avatar with dynamic gradient
  const initial = getInitial(title, url)
  const gradient = getFallbackGradient(title || url || 'A')

  if (interactive) {
    return (
      <motion.div
        variants={fallbackVariants}
        className={`${dimensions} bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white select-none border border-white/10 will-change-transform ${className}`}
      >
        {initial && initial !== '?' ? (
          <span className="tracking-tight drop-shadow-sm">{initial}</span>
        ) : (
          <Globe className={`${iconDimensions} text-white/90`} />
        )}
      </motion.div>
    )
  }

  return (
    <div
      className={`${dimensions} bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-lg select-none border border-white/10 ${className}`}
    >
      {initial && initial !== '?' ? (
        <span className="tracking-tight drop-shadow-sm">{initial}</span>
      ) : (
        <Globe className={`${iconDimensions} text-white/90`} />
      )}
    </div>
  )
}
