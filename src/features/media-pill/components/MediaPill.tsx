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

  // Hover state expands to show full playback controls (respecting controlled isExpanded if provided)
  const isHoverExpanded =
    isFullStandalone || (isExpanded !== undefined ? isExpanded : (autoExpandOnHover && internalHovered))

  // Typing state in search bar collapses sound pill to exact round circle containing thumbnail only
  const isCircleCollapsed = hasSearchAdjacent && isSearchTyping && !isHoverExpanded

  // Normal idle mode: capsule pill with continuous loop auto-scrolling title beside thumbnail
  const isNormalMode = !isCircleCollapsed && !isHoverExpanded

  const isGlassHovered = isHoverExpanded || internalHovered

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
    }, 280)
  }

  const targetWidth = isFullStandalone
    ? '100%'
    : isCircleCollapsed
    ? 50
    : isHoverExpanded
    ? hasSearchAdjacent && !isSearchTyping
      ? 620
      : 440
    : 190

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative shrink-0 flex items-center"
    >
      {/* Boundary Hit Cushion:
        A subtle 6px invisible buffer around the pill preventing micro cursor movements on the 1px rounded border from fluttering
      */}
      <div
        className="absolute -inset-1.5 z-10 pointer-events-auto rounded-full"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8, width: targetWidth }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          width: targetWidth,
        }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{
          duration: 0.42,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative rounded-full h-[50px] min-h-[50px] cursor-pointer select-none overflow-hidden shrink-0 max-w-[calc(100vw-80px)] z-20 will-change-[width,transform]"
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
        className={`w-full h-full transition-shadow duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-xl ${
          isGlassHovered
            ? 'shadow-[0_16px_40px_rgba(0,0,0,0.55)]'
            : 'shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
        }`}
        contentClassName="p-0 relative overflow-hidden w-full h-full flex items-center justify-start"
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
        <div className="relative z-10 flex items-center w-full h-full p-0 overflow-hidden">
          {/* Thumbnail / Video Artwork Avatar container (permanently anchored in a 50x50 center box) */}
          <div className="w-[50px] h-[50px] shrink-0 flex items-center justify-center select-none">
            <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-black/80 border border-white/20 flex items-center justify-center shadow-md">
              <div
                className="w-full h-full flex items-center justify-center will-change-transform"
                style={{
                  animation: 'vinyl-spin 20s linear infinite',
                  animationPlayState: media.isPlaying ? 'running' : 'paused',
                }}
              >
                {isThumbValid ? (
                  <img
                    src={media.thumbnailUrl}
                    alt="Media thumbnail"
                    className="w-full h-full object-cover select-none pointer-events-none rounded-full"
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
              </div>

              {/* Subtle spinning vinyl ring glow when playing */}
              {media.isPlaying && !media.isMuted && (
                <span className="absolute inset-0 rounded-full border border-[var(--accent-color)]/60 pointer-events-none animate-pulse" />
              )}
            </div>
          </div>

          {/* Normal Mode vs Hover Expanded Mode Content with smooth optical cross-fade */}
          <motion.div
            initial={false}
            animate={{
              opacity: isCircleCollapsed ? 0 : 1,
              filter: isCircleCollapsed ? 'blur(3px)' : 'blur(0px)',
            }}
            transition={{
              duration: isCircleCollapsed ? 0.2 : 0.32,
              delay: isCircleCollapsed ? 0 : 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`relative flex-1 min-w-0 h-full flex items-center overflow-hidden pr-3 will-change-[opacity,filter] ${
              isCircleCollapsed ? 'pointer-events-none' : ''
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
                  {isNormalMode ? (
                    <motion.div
                      key="marquee-title"
                      initial={{ opacity: 0, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(3px)' }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full min-w-0 overflow-hidden relative mx-2 h-full flex items-center"
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
                      initial={{ opacity: 0, x: 10, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: 8, filter: 'blur(3px)' }}
                      transition={{
                        duration: 0.32,
                        delay: 0.05,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="w-full flex items-center min-w-0 pl-1 overflow-hidden h-full will-change-transform"
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
              </motion.div>
        </div>
      </GlassSurface>
    </motion.div>
    </div>
  )
}
