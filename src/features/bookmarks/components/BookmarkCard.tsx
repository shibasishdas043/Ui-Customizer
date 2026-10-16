import type React from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { BookmarkItem } from '../types'
import { BookmarkThumbnail } from './BookmarkThumbnail'

interface BookmarkCardProps {
  bookmark: BookmarkItem
  onEdit?: (bookmark: BookmarkItem, e: React.MouseEvent) => void
  openInNewTab?: boolean
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

const titleVariants: Variants = {
  rest: {
    opacity: 0.88,
    y: 0,
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.75)',
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  hover: {
    opacity: 1,
    y: -1.5,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.95), 0 0 12px rgba(255, 255, 255, 0.25)',
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
  onEdit,
  openInNewTab = false,
  size = 'md',
  showTitle = true,
}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    if (onEdit) {
      e.preventDefault()
      onEdit(bookmark, e)
    }
  }

  const widthClass = {
    sm: 'w-14 sm:w-16',
    md: 'w-16 sm:w-20',
    lg: 'w-20 sm:w-24',
  }[size]

  const textWidthClass = {
    sm: 'max-w-[56px] sm:max-w-[64px]',
    md: 'max-w-[64px] sm:max-w-[76px]',
    lg: 'max-w-[80px] sm:max-w-[96px]',
  }[size]

  return (
    <motion.a
      href={bookmark.url}
      target={openInNewTab ? '_blank' : '_self'}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      onContextMenu={handleContextMenu}
      layout
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`group relative flex flex-col items-center justify-start ${widthClass} cursor-pointer select-none`}
      title={`${bookmark.title}\n(${bookmark.url})${onEdit ? '\nRight-click to edit' : ''}`}
    >
      {/* Pristine squircle thumbnail - silky spring hover interaction */}
      <BookmarkThumbnail
        title={bookmark.title}
        url={bookmark.url}
        icon={bookmark.icon}
        size={size}
        interactive
      />

      {showTitle && (
        <motion.span
          variants={titleVariants}
          className={`text-[11px] sm:text-xs font-medium text-white/90 text-contrast-subtle truncate ${textWidthClass} text-center mt-1.5 pointer-events-none drop-shadow-md`}
        >
          {bookmark.title}
        </motion.span>
      )}
    </motion.a>
  )
}
