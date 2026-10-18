import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, ExternalLink, Music2 } from 'lucide-react'
import type { NowPlayingMedia } from '../types'
import { FluxLines } from '../../../shared/components/FluxLines'
import { GlassSurface } from '../../../shared/components/GlassSurface'
import { useThemeIsDark } from '../../../shared'

interface MediaPillProps {
  media: NowPlayingMedia
  hasSearchAdjacent: boolean
  autoExpandOnHover?: boolean
  showControls?: boolean
  isExpanded?: boolean
  onHoverChange?: (isHovered: boolean) => void
  onTogglePlayPause: () => void
  onToggleMute: () => void
  onJumpToTab: () => void
  isSearchTyping?: boolean
}

export const MediaPill: React.FC<MediaPillProps> = ({
  media,
  hasSearchAdjacent,
  autoExpandOnHover = true,
  showControls = true,
  isExpanded = false,
  onHoverChange,
  onTogglePlayPause,
  onToggleMute,
  onJumpToTab,
  isSearchTyping = false,
}) => {
  const isDark = useThemeIsDark()
  const [internalHovered, setInternalHovered] = useState(false)
  const [failedThumbSrc, setFailedThumbSrc] = useState<string | null>(null)
  const isThumbValid = !!media.thumbnailUrl && failedThumbSrc !== media.thumbnailUrl
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
    }
  }, [])

  // When search bar is hidden, the pill is permanently full width & expanded
  const isFullStandalone = !hasSearchAdjacent

  // Hover state expands to show full playback controls
  const isHoverExpanded = isFullStandalone || isExpanded || (autoExpandOnHover && internalHovered)

  // Typing state in search bar collapses sound pill to exact round circle containing thumbnail only
  const isCircleCollapsed = hasSearchAdjacent && isSearchTyping && !internalHovered

  // Normal idle mode: capsule pill with continuous loop auto-scrolling title beside thumbnail
  const isNormalMode = !isCircleCollapsed && !isHoverExpanded

  const isGlassHovered = internalHovered

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setInternalHovered(true)
    if (!isFullStandalone && autoExpandOnHover) {
      onHoverChange?.(true)
    }
  }

  // Grace period prevents any fluttering/chattering when cursor hovers near pill boundaries
  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
    leaveTimeoutRef.current = setTimeout(() => {
      setInternalHovered(false)
      if (!isFullStandalone && autoExpandOnHover) {
        onHoverChange?.(false)
      }
    }, 180)
  }

  return (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        width: isFullStandalone
          ? '100%'
          : isCircleCollapsed
          ? 50
          : isHoverExpanded
          ? 440
          : 190,
      }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{
        duration: 0.52,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative rounded-full h-[50px] min-h-[50px] cursor-pointer select-none overflow-hidden shrink-0 max-w-[calc(100vw-80px)]"
      title={`${media.cleanTitle} (Click to open tab)`}
      onClick={(e) => {
        // If clicking on the body of the pill (not controls), jump to tab
        const target = e.target as HTMLElement
        if (!target.closest('button')) {
          onJumpToTab()
        }
      }}
    >
      <GlassSurface
        width="100%"
        height={50}
        borderRadius={25}
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
        refraction={true}
        className={`w-full h-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-xl ${
          isGlassHovered
            ? 'shadow-[0_16px_40px_rgba(0,0,0,0.55)]'
            : 'shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
        }`}
        contentClassName="p-0 !justify-start relative overflow-hidden w-full h-full"
      >
        {/* 1. Full-Pill FluxLines Animation Background (covers entire capsule) */}
        <div
          className={`absolute inset-0 w-full h-full pointer-events-none rounded-full overflow-hidden z-0 ${
            isDark ? 'bg-black/15' : 'bg-black/5'
          }`}
        >
          <FluxLines
            colors={
              isDark
                ? ['#ffffff', '#ffffff', '#ffffff']
                : ['#09090b', '#18181b', '#09090b']
            }
            lightMode={!isDark}
            glow={isDark ? 2.2 : 1.2}
            rimWidth={0.2}
            lineWidth={1.2}
            flowDirection="down"
            mouseInteraction={false}
            clickSwirl={false}
            scale={1.4}
            shimmer={1.2}
            speed={0.45}
            paused={!media.isPlaying}
            transparent
            className="w-full h-full pointer-events-none"
          />
          {/* Contrast overlay: deeper on expanded to keep text readable, subtle on collapsed */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
              isHoverExpanded
                ? isDark
                  ? 'bg-black/40 backdrop-blur-[1px]'
                  : 'bg-white/40 backdrop-blur-[1px]'
                : isDark
                  ? 'bg-black/10'
                  : 'bg-transparent'
            }`}
          />
        </div>

        {/* 2. Foreground Elements Layer (z-10) */}
        <div
          className={`relative z-10 flex items-center w-full h-full ${
            isCircleCollapsed ? 'justify-center p-0' : 'pl-3.5 pr-3.5 py-1.5'
          }`}
        >
          {/* Thumbnail / Video Artwork Avatar */}
          <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-black/80 border border-white/20 flex items-center justify-center shadow-md">
            {isThumbValid ? (
              <img
                src={media.thumbnailUrl}
                alt="Media thumbnail"
                className="w-full h-full object-cover select-none pointer-events-none"
                onError={() => setFailedThumbSrc(media.thumbnailUrl || null)}
              />
            ) : media.favIconUrl ? (
              <img
                src={media.favIconUrl}
                alt="Platform icon"
                className="w-4 h-4 object-contain select-none pointer-events-none"
              />
            ) : (
              <Music2 className="w-4 h-4 text-[var(--accent-color)]" />
            )}

            {/* Subtle spinning vinyl ring glow when playing */}
            {media.isPlaying && !media.isMuted && (
              <span className="absolute inset-0 rounded-full border border-[var(--accent-color)]/60 pointer-events-none animate-pulse" />
            )}
          </div>

          {/* Normal Mode vs Hover Expanded Mode Content with smooth cross-fade */}
          <AnimatePresence mode="popLayout" initial={false}>
            {isNormalMode ? (
              <motion.div
                key="marquee-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 min-w-0 overflow-hidden relative mx-2 h-full flex items-center"
                style={{
                  maskImage:
                    'linear-gradient(to right, transparent 0%, black 8px, black calc(100% - 8px), transparent 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 0%, black 8px, black calc(100% - 8px), transparent 100%)',
                }}
              >
                <motion.div
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{
                    ease: 'linear',
                    duration: Math.max(
                      7,
                      (media.cleanTitle.length + (media.artist ? media.artist.length : 0)) * 0.35
                    ),
                    repeat: Infinity,
                  }}
                  className="flex items-center whitespace-nowrap will-change-transform"
                >
                  <span className="pr-8 text-xs font-semibold text-neutral-900 dark:text-white drop-shadow-xs">
                    {media.cleanTitle}
                    {media.artist &&
                    !media.cleanTitle.toLowerCase().includes(media.artist.toLowerCase())
                      ? ` • ${media.artist}`
                      : ''}
                  </span>
                  <span className="pr-8 text-xs font-semibold text-neutral-900 dark:text-white drop-shadow-xs">
                    {media.cleanTitle}
                    {media.artist &&
                    !media.cleanTitle.toLowerCase().includes(media.artist.toLowerCase())
                      ? ` • ${media.artist}`
                      : ''}
                  </span>
                </motion.div>
              </motion.div>
            ) : isHoverExpanded ? (
              <motion.div
                key="expanded-content"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center min-w-0 flex-1 pl-3 overflow-hidden h-full"
              >
                {/* Title & Artist */}
                <div className="flex flex-col justify-center min-w-0 flex-1 pr-2 overflow-hidden">
                  <p
                    className="text-xs sm:text-[13px] font-semibold text-neutral-900 dark:text-white truncate leading-snug tracking-wide select-none"
                    title={media.cleanTitle}
                  >
                    {media.cleanTitle}
                  </p>
                  {media.artist && (
                    <p
                      className="text-[10px] text-neutral-600 dark:text-white/70 truncate leading-tight mt-0.5 select-none"
                      title={media.artist}
                    >
                      {media.artist}
                    </p>
                  )}
                </div>

                {/* Playback Controls */}
                {showControls && (
                  <div
                    className="flex items-center gap-1.5 shrink-0 pl-1 pr-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Play/Pause Button */}
                    <button
                      type="button"
                      onClick={onTogglePlayPause}
                      title={media.isPlaying ? 'Pause' : 'Play'}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-neutral-900 dark:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 outline-none"
                    >
                      {media.isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Mute/Unmute Button */}
                    <button
                      type="button"
                      onClick={onToggleMute}
                      title={media.isMuted ? 'Unmute' : 'Mute'}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-neutral-800 dark:text-white/85 hover:text-black dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 outline-none"
                    >
                      {media.isMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Jump to Tab Button */}
                    <button
                      type="button"
                      onClick={onJumpToTab}
                      title="Open Playing Tab"
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-neutral-800 dark:text-white/85 hover:text-black dark:hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 outline-none"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </GlassSurface>
    </motion.div>
  )
}
