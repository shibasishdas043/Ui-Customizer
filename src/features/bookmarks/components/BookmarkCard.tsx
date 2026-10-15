import React from 'react'
import { motion } from 'framer-motion'
import type { BookmarkItem } from '../types'
import { BookmarkThumbnail } from './BookmarkThumbnail'

interface BookmarkCardProps {
  bookmark: BookmarkItem
  onEdit?: (bookmark: BookmarkItem, e: React.MouseEvent) => void
  openInNewTab?: boolean
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onEdit,
  openInNewTab = false,
}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    if (onEdit) {
      e.preventDefault()
      onEdit(bookmark, e)
    }
  }

  return (
    <motion.a
      href={bookmark.url}
      target={openInNewTab ? '_blank' : '_self'}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      onContextMenu={handleContextMenu}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ y: -3, scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col items-center justify-center w-16 sm:w-20 transition-all cursor-pointer select-none"
      title={`${bookmark.title}\n(${bookmark.url})${onEdit ? '\nRight-click to edit' : ''}`}
    >
      {/* Pristine squircle thumbnail - zero hover clutter buttons */}
      <BookmarkThumbnail
        title={bookmark.title}
        url={bookmark.url}
        icon={bookmark.icon}
        size="md"
        className="group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]"
      />

      <span className="text-[11px] sm:text-xs font-medium text-white/95 text-contrast-subtle truncate max-w-[64px] sm:max-w-[76px] text-center mt-1.5">
        {bookmark.title}
      </span>
    </motion.a>
  )
}
