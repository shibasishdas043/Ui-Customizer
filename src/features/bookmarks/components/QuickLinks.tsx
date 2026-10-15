import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BookmarkItem } from '../types'
import { BookmarkCard } from './BookmarkCard'
import { BookmarkEditorModal } from './BookmarkEditorModal'

interface QuickLinksProps {
  links: BookmarkItem[]
  onUpdateLinks: (links: BookmarkItem[]) => void
  visible: boolean
  openInNewTab?: boolean
}

export const QuickLinks: React.FC<QuickLinksProps> = ({
  links,
  onUpdateLinks,
  visible,
  openInNewTab = false,
}) => {
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null)

  if (!visible || links.length === 0) return null

  const handleEdit = (bookmark: BookmarkItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingBookmark(bookmark)
  }

  const handleSave = (item: BookmarkItem) => {
    onUpdateLinks(links.map((l) => (l.id === item.id ? item : l)))
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 relative z-10">
      <motion.div layout className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <AnimatePresence>
          {links.map((link) => (
            <BookmarkCard
              key={link.id}
              bookmark={link}
              onEdit={handleEdit}
              openInNewTab={openInNewTab}
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
