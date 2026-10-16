import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BookmarkItem } from '../types'
import { BookmarkCard } from './BookmarkCard'
import { BookmarkEditorModal } from './BookmarkEditorModal'
import { migrateBookmarksToPermanentCache } from '../utils/faviconCacheHelper'

interface QuickLinksProps {
  links: BookmarkItem[]
  onUpdateLinks: (links: BookmarkItem[]) => void
  visible: boolean
  openInNewTab?: boolean
  cols?: number | 'auto'
  size?: 'sm' | 'md' | 'lg'
  showTitles?: boolean
}

export const QuickLinks: React.FC<QuickLinksProps> = ({
  links,
  onUpdateLinks,
  visible,
  openInNewTab = false,
  cols = 'auto',
  size = 'md',
  showTitles = true,
}) => {
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null)

  // Background permanent favicon cache migrator:
  // Converts any uncached remote favicons into permanent Base64 Data URLs on mount.
  useEffect(() => {
    if (!links || links.length === 0) return
    let isMounted = true

    migrateBookmarksToPermanentCache(links).then((migrated) => {
      if (isMounted && migrated) {
        onUpdateLinks(migrated)
      }
    })

    return () => {
      isMounted = false
    }
  }, [links, onUpdateLinks])

  if (!visible || links.length === 0) return null

  const handleEdit = (bookmark: BookmarkItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingBookmark(bookmark)
  }

  const handleSave = (item: BookmarkItem) => {
    onUpdateLinks(links.map((l) => (l.id === item.id ? item : l)))
  }

  // Calculate layout classes (Bonjourr / Rea architectural pattern)
  const isFixedCols = typeof cols === 'number' && cols > 0
  const count = links.length

  const getLayoutClasses = () => {
    if (isFixedCols) {
      return 'grid justify-items-center justify-center gap-3 sm:gap-4 md:gap-5'
    }

    if (count <= 4) {
      return 'flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5'
    }

    if (count <= 6) {
      return 'grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 justify-items-center justify-center gap-3 sm:gap-4 md:gap-5'
    }

    return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 justify-items-center justify-center gap-3 sm:gap-4 md:gap-5'
  }

  const getContainerMaxWidth = () => {
    if (isFixedCols) {
      if (cols <= 4) return 'max-w-lg'
      if (cols <= 6) return 'max-w-2xl'
      return 'max-w-4xl'
    }

    if (count <= 4) return 'max-w-md'
    if (count <= 6) return 'max-w-2xl'
    return 'max-w-3xl sm:max-w-4xl'
  }

  return (
    <div className={`w-full ${getContainerMaxWidth()} mx-auto px-4 relative z-10 transition-all duration-300`}>
      <motion.div
        layout
        className={getLayoutClasses()}
        style={isFixedCols ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
      >
        <AnimatePresence initial={false}>
          {links.map((link) => (
            <BookmarkCard
              key={link.id}
              bookmark={link}
              onEdit={handleEdit}
              openInNewTab={openInNewTab}
              size={size}
              showTitle={showTitles}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Editor modal for direct right-click editing */}
      <BookmarkEditorModal
        isOpen={!!editingBookmark}
        onClose={() => setEditingBookmark(null)}
        onSave={handleSave}
        initialBookmark={editingBookmark}
      />
    </div>
  )
}
