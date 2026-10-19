import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BookmarkItem, QuickLinksStyle } from '../types'
import { BookmarkCard } from './BookmarkCard'
import { migrateBookmarksToPermanentCache } from '../utils/faviconCacheHelper'
import { GlassSurface } from '../../../shared/components/GlassSurface'

interface QuickLinksProps {
  links: BookmarkItem[]
  onUpdateLinks: (links: BookmarkItem[]) => void
  visible: boolean
  openInNewTab?: boolean
  cols?: number | 'auto'
  size?: 'sm' | 'md' | 'lg'
  showTitles?: boolean
  styleMode?: QuickLinksStyle
  showBackground?: boolean
}

export const QuickLinks: React.FC<QuickLinksProps> = ({
  links,
  onUpdateLinks,
  visible,
  openInNewTab = false,
  cols = 'auto',
  size = 'md',
  showTitles = true,
  styleMode = 'dock',
  showBackground = true,
}) => {
  const [isAltPressed, setIsAltPressed] = useState(false)

  // Background permanent favicon cache migrator
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

  // Bonjourr Alt-key shortcut navigation (Hold Alt to reveal numbers, Alt+1..9 to open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.key === 'Alt') {
        setIsAltPressed(true)
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', ''), 10)
        if (digit >= 1 && digit <= 9 && links[digit - 1]) {
          e.preventDefault()
          const targetLink = links[digit - 1]
          if (openInNewTab) {
            window.open(targetLink.url, '_blank', 'noopener,noreferrer')
          } else {
            window.location.href = targetLink.url
          }
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(false)
      }
    }

    const handleBlur = () => {
      setIsAltPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [links, openInNewTab])

  if (!visible || links.length === 0) return null

  // Calculate layout classes (Bonjourr / Rea architectural pattern)
  // Columns only apply in 'grid' mode — 'inline' is a fluid pill row and 'dock' is a single-row shelf
  const isFixedCols = styleMode === 'grid' && typeof cols === 'number' && cols > 0

  const getLayoutClasses = () => {
    if (styleMode === 'inline') {
      return 'flex flex-wrap items-center justify-center gap-3 sm:gap-3.5 max-w-5xl mx-auto'
    }

    if (isFixedCols) {
      return 'grid justify-items-center justify-center gap-3 sm:gap-4 md:gap-5'
    }

    // Auto-flow dock: flexible wrap with centered alignment so links naturally stay in 1 row!
    return 'flex flex-wrap items-start justify-center gap-3 sm:gap-4 md:gap-5'
  }

  const linkCards = (
    <motion.div
      layout
      transition={{ layout: { type: 'spring', damping: 28, stiffness: 260 } }}
      className={getLayoutClasses()}
      style={isFixedCols ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
    >
      <AnimatePresence initial={false}>
        {links.map((link, index) => (
          <BookmarkCard
            key={link.id}
            bookmark={link}
            index={index}
            openInNewTab={openInNewTab}
            size={size}
            showTitle={showTitles}
            styleMode={styleMode}
            showBackground={showBackground}
            isAltPressed={isAltPressed}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )

  return (
    <div className="w-full flex justify-center px-4 relative z-10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
      {styleMode === 'dock' ? (
        <GlassSurface
          width="auto"
          height="auto"
          borderRadius={28}
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
          className="inline-flex max-w-full"
          contentClassName="px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-center w-auto h-auto"
        >
          {linkCards}
        </GlassSurface>
      ) : (
        <div className="w-full max-w-5xl mx-auto flex justify-center">
          {linkCards}
        </div>
      )}
    </div>
  )
}
