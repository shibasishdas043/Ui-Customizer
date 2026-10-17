import type React from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { BookmarkItem } from '../types'
import { BookmarkThumbnail } from './BookmarkThumbnail'

interface BookmarkCardProps {
  bookmark: BookmarkItem
  index?: number
  openInNewTab?: boolean
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
  styleMode?: 'dock' | 'grid' | 'inline' | 'minimal'
  showBackground?: boolean
  isAltPressed?: boolean
}

const titleVariants: Variants = {
  rest: {
    opacity: 0.9,
    y: 0,
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.75)',
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  hover: {
    opacity: 1,
    y: -1.5,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.95), 0 0 12px rgba(255, 255, 255, 0.3)',
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  tap: {
    y: 0,
    opacity: 0.85,
    transition: { duration: 0.1 },
  },
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  index = 0,
  openInNewTab = false,
  size = 'md',
  showTitle = true,
  styleMode = 'dock',
  showBackground = true,
  isAltPressed = false,
}) => {
  const isEffectiveBackground = styleMode === 'minimal' ? false : showBackground

  // 1. Inline Capsule Mode (Bonjourr inline style)
  if (styleMode === 'inline') {
    return (
      <motion.a
        href={bookmark.url}
        target={openInNewTab ? '_blank' : '_self'}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        layout
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.96 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className="group relative flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/35 hover:bg-black/55 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all cursor-pointer select-none shadow-md"
        title={`${bookmark.title}\n(${bookmark.url})`}
      >
        <BookmarkThumbnail
          title={bookmark.title}
          url={bookmark.url}
          icon={bookmark.icon}
          size="sm"
          interactive={false}
          showBackground={false}
        />
        {showTitle && (
          <span className="text-xs font-semibold text-white/95 truncate max-w-[120px] drop-shadow-sm">
            {bookmark.title}
          </span>
        )}
        {isAltPressed && index < 9 && (
          <span className="px-1.5 py-0.2 rounded-md bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] text-[10px] font-bold font-mono shadow-xs">
            {index + 1}
          </span>
        )}
      </motion.a>
    )
  }

  // 2. Standard Dock / Grid Card Mode
  const widthClass = {
    sm: 'w-14 sm:w-16',
    md: 'w-16 sm:w-18 md:w-20',
    lg: 'w-20 sm:w-22 md:w-24',
  }[size]

  const textWidthClass = {
    sm: 'max-w-[62px] sm:max-w-[72px]',
    md: 'max-w-[76px] sm:max-w-[88px]',
    lg: 'max-w-[92px] sm:max-w-[108px]',
  }[size]

  return (
    <motion.a
      href={bookmark.url}
      target={openInNewTab ? '_blank' : '_self'}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      layout
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`group relative flex flex-col items-center justify-start ${widthClass} cursor-pointer select-none`}
      title={`${bookmark.title}\n(${bookmark.url})${
        index < 9 ? `\nAlt+${index + 1} to open` : ''
      }`}
    >
      <div className="relative">
        {/* Squircle thumbnail with calibrated spring interaction */}
        <BookmarkThumbnail
          title={bookmark.title}
          url={bookmark.url}
          icon={bookmark.icon}
          size={size}
          interactive
          showBackground={isEffectiveBackground}
        />

        {/* Bonjourr Alt-key shortcut badge overlay */}
        {isAltPressed && index < 9 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] text-[10px] font-extrabold font-mono flex items-center justify-center shadow-md z-20 pointer-events-none ring-1.5 ring-black/40"
          >
            {index + 1}
          </motion.div>
        )}
      </div>

      {showTitle && (
        <motion.span
          variants={titleVariants}
          className={`text-[11px] sm:text-xs font-semibold text-white/95 text-contrast-subtle truncate ${textWidthClass} text-center mt-1.5 pointer-events-none drop-shadow-md tracking-tight`}
        >
          {bookmark.title}
        </motion.span>
      )}
    </motion.a>
  )
}
