import { useState } from 'react'
import type React from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Globe } from 'lucide-react'
import { getInitial, getFallbackGradient, getFaviconUrl } from '../utils/faviconHelper'
import { isHardcodedLegacySvg } from '../utils/faviconCacheHelper'
import { GlassSurface } from '../../../shared/components/GlassSurface'

interface BookmarkThumbnailProps {
  title: string
  url: string
  icon?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  interactive?: boolean
  showBackground?: boolean
}

const cardMotionVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 26,
      mass: 0.75,
    },
  },
  hover: {
    y: -5.5,
    scale: 1.08,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
      mass: 0.7,
    },
  },
  tap: {
    y: 0,
    scale: 0.94,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
    },
  },
}

const transparentVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: 'none',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 26,
      mass: 0.75,
    },
  },
  hover: {
    y: -5.5,
    scale: 1.14,
    boxShadow: 'none',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.5))',
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
      mass: 0.7,
    },
  },
  tap: {
    y: 0,
    scale: 0.92,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
    },
  },
}

const iconVariants: Variants = {
  rest: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 26,
    },
  },
  hover: {
    scale: 1.06,
    transition: {
      type: 'spring',
      stiffness: 280,
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
      stiffness: 280,
      damping: 26,
      mass: 0.75,
    },
  },
  hover: {
    y: -5.5,
    scale: 1.075,
    boxShadow: '0 18px 36px -4px rgba(0, 0, 0, 0.55), 0 8px 18px -2px rgba(0, 0, 0, 0.35)',
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
      mass: 0.7,
    },
  },
  tap: {
    y: 0,
    scale: 0.94,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
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
  showBackground = true,
}) => {
  const [failedIcon, setFailedIcon] = useState<string | null>(null)
  
  // Prefer cached Base64 icon; if empty or legacy hardcoded SVG, display genuine Google S2 favicon while background cache bakes
  const displayIcon = icon && !isHardcodedLegacySvg(icon) ? icon : (url ? getFaviconUrl(url, 'google') : '')
  const hasError = !displayIcon || failedIcon === displayIcon

  const dimensions = {
    sm: 'w-9 h-9 rounded-xl text-xs',
    md: 'w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-2xl text-base sm:text-lg',
    lg: 'w-16 h-16 rounded-2xl text-xl',
  }[size]

  // Proportional icon sizing for bold, prominent display (Bonjourr pattern)
  const iconDimensions = showBackground
    ? {
        sm: 'w-5 h-5',
        md: 'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9',
        lg: 'w-10 h-10',
      }[size]
    : {
        sm: 'w-7 h-7',
        md: 'w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11',
        lg: 'w-13 h-13',
      }[size]

  const isMonochrome = title.toLowerCase().includes('github') || title.toLowerCase().includes('x /') || title.toLowerCase() === 'x'

  const sizePixels = {
    sm: 38,
    md: 52,
    lg: 64,
  }[size]

  const radiusPixels = {
    sm: 12,
    md: 18,
    lg: 22,
  }[size]

  if (displayIcon && !hasError) {
    if (showBackground) {
      if (interactive) {
        return (
          <motion.div
            variants={cardMotionVariants}
            className={`flex items-center justify-center will-change-transform ${className}`}
          >
            <GlassSurface
              width={sizePixels}
              height={sizePixels}
              borderRadius={radiusPixels}
              borderWidth={0.07}
              blur={11}
              brightness={50}
              opacity={0.93}
              distortionScale={-180}
              displace={3}
              redOffset={0}
              greenOffset={10}
              blueOffset={20}
              backgroundOpacity={0.28}
              saturation={1}
              className="overflow-hidden flex items-center justify-center shadow-lg"
              contentClassName="flex items-center justify-center p-0 w-full h-full"
            >
              <motion.img
                variants={iconVariants}
                src={displayIcon}
                alt={title || 'Icon'}
                className={`${iconDimensions} object-contain rounded-xs will-change-transform drop-shadow-sm ${
                  isMonochrome ? 'dark:invert dark:brightness-200' : ''
                }`}
                onError={() => setFailedIcon(displayIcon)}
              />
            </GlassSurface>
          </motion.div>
        )
      }

      return (
        <div className={`flex items-center justify-center ${className}`}>
          <GlassSurface
            width={sizePixels}
            height={sizePixels}
            borderRadius={radiusPixels}
            borderWidth={0.07}
            blur={11}
            brightness={50}
            opacity={0.93}
            distortionScale={-180}
            displace={3}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
            backgroundOpacity={0.28}
            saturation={1}
            className="overflow-hidden flex items-center justify-center shadow-lg"
            contentClassName="flex items-center justify-center p-0 w-full h-full"
          >
            <img
              src={displayIcon}
              alt={title || 'Icon'}
              className={`${iconDimensions} object-contain rounded-xs drop-shadow-sm ${
                isMonochrome ? 'dark:invert dark:brightness-200' : ''
              }`}
              onError={() => setFailedIcon(displayIcon)}
            />
          </GlassSurface>
        </div>
      )
    }

    // showBackground === false (e.g. inside full dock shelf or minimal mode)
    if (interactive) {
      return (
        <motion.div
          variants={transparentVariants}
          className={`${dimensions} border-transparent shadow-none flex items-center justify-center overflow-hidden will-change-transform ${className}`}
        >
          <motion.img
            variants={iconVariants}
            src={displayIcon}
            alt={title || 'Icon'}
            className={`${iconDimensions} object-contain rounded-xs will-change-transform drop-shadow-sm ${
              isMonochrome ? 'dark:invert dark:brightness-200' : ''
            }`}
            onError={() => setFailedIcon(displayIcon)}
          />
        </motion.div>
      )
    }

    return (
      <div
        className={`${dimensions} border-transparent shadow-none flex items-center justify-center overflow-hidden ${className}`}
      >
        <img
          src={displayIcon}
          alt={title || 'Icon'}
          className={`${iconDimensions} object-contain rounded-xs drop-shadow-sm ${
            isMonochrome ? 'dark:invert dark:brightness-200' : ''
          }`}
          onError={() => setFailedIcon(displayIcon)}
        />
      </div>
    )
  }

  // Graceful Fallback: Letter Avatar
  const initial = getInitial(title, url)
  const gradient = getFallbackGradient(title || url || 'A')

  if (showBackground) {
    if (interactive) {
      return (
        <motion.div
          variants={cardMotionVariants}
          className={`flex items-center justify-center will-change-transform ${className}`}
        >
          <GlassSurface
            width={sizePixels}
            height={sizePixels}
            borderRadius={radiusPixels}
            borderWidth={0.07}
            blur={11}
            brightness={50}
            opacity={0.93}
            distortionScale={-180}
            displace={3}
            redOffset={0}
            greenOffset={10}
            blueOffset={20}
            backgroundOpacity={0.28}
            saturation={1}
            className="overflow-hidden flex items-center justify-center shadow-lg"
            contentClassName="flex items-center justify-center p-0 w-full h-full font-bold text-neutral-900 dark:text-white"
          >
            {initial && initial !== '?' ? (
              <span className="tracking-tight text-base sm:text-lg">{initial}</span>
            ) : (
              <Globe className={`${iconDimensions} text-neutral-700 dark:text-white/80`} />
            )}
          </GlassSurface>
        </motion.div>
      )
    }

    return (
      <div className={`flex items-center justify-center ${className}`}>
        <GlassSurface
          width={sizePixels}
          height={sizePixels}
          borderRadius={radiusPixels}
          borderWidth={0.07}
          blur={11}
          brightness={50}
          opacity={0.93}
          distortionScale={-180}
          displace={3}
          redOffset={0}
          greenOffset={10}
          blueOffset={20}
          backgroundOpacity={0.28}
          saturation={1}
          className="overflow-hidden flex items-center justify-center shadow-lg"
          contentClassName="flex items-center justify-center p-0 w-full h-full font-bold text-neutral-900 dark:text-white"
        >
          {initial && initial !== '?' ? (
            <span className="tracking-tight text-base sm:text-lg">{initial}</span>
          ) : (
            <Globe className={`${iconDimensions} text-neutral-700 dark:text-white/80`} />
          )}
        </GlassSurface>
      </div>
    )
  }

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
