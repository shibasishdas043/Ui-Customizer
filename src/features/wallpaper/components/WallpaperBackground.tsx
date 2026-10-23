import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import type { WallpaperConfig, UnsplashPhoto } from '../types'
import {
  getOrFetchWallpaper,
  getSynchronousCachedActiveWallpaper,
} from '../utils/wallpaperCache'
import {
  getNextPhotoForProvider,
  needsWallpaperChange,
  DEFAULT_COLLECTIONS,
  normalizeCustomImageUrl,
  resolveUnsplashPageToImageUrl,
  optimizeWallpaperResolution,
} from '../utils/unsplashEngine'
import {
  popNextBufferedTabPhoto,
  replenishPreloadBufferInBackground,
  getTabBufferKey,
  clearOutdatedBuffers,
  isBrowserTabReload,
  TAB_SESSION_PHOTO_KEY,
} from '../utils/tabPreloadManager'

interface WallpaperBackgroundProps {
  config: WallpaperConfig
}

/**
 * Shortens long image credits if they exceed a certain word limit,
 * keeping the text clean, readable, and free of trailing punctuation or open brackets.
 */
function truncateCreditWords(text: string, maxWords: number = 7): string {
  if (!text) return ''
  const trimmed = text.trim()
  const words = trimmed.split(/\s+/)
  if (words.length <= maxWords) {
    return trimmed
  }
  const truncated = words.slice(0, maxWords).join(' ')
  // Clean up any trailing punctuation, dashes, or unclosed open parentheses/brackets
  const cleaned = truncated.replace(/[,;:\s\-–—([/{]+$/, '')
  return `${cleaned}…`
}

export const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({ config }) => {
  const provider =
    config.backgroundProvider ||
    (config.backgroundType === 'color'
      ? 'solid_color'
      : config.backgroundType === 'custom'
      ? 'custom_url'
      : 'default')

  const loadRequestId = useRef(0)
  const hasHandledReloadRef = useRef(false)
  const lastCollectionKeyRef = useRef<string>(
    `${provider}_${config.defaultCategory || ''}_${config.customCollectionId || config.unsplashCollectionId || ''}_${config.customSearchQuery || ''}_${config.redditSubreddit || ''}`
  )

  // Determine initial synchronous photo (computed strictly once on component mount)
  const [initialPhoto] = useState<UnsplashPhoto>(() => {
    if (provider === 'local_file') {
      const url = config.localImageDataUrl || DEFAULT_COLLECTIONS.nature.fallbackPhotos[0].url
      return { id: 'local_file', url, author: 'Local Device' }
    }
    if (provider === 'custom_url') {
      const raw = (config.customBackgroundUrl || '').trim()
      const url = raw ? optimizeWallpaperResolution(normalizeCustomImageUrl(raw)) : DEFAULT_COLLECTIONS.nature.fallbackPhotos[0].url
      return { id: 'custom_url', url, author: 'Custom Image' }
    }

    const isReload = isBrowserTabReload()
    const shouldChangeOnReload = isReload && !!config.changeOnReload

    // When changeOnReload is enabled and browser tab is reloaded:
    // Pop a fresh photo directly from the upfront buffer for 0ms instant display!
    if (shouldChangeOnReload) {
      const popped = popNextBufferedTabPhoto(
        provider,
        {
          defaultCategory: config.defaultCategory,
          customCollectionId: config.customCollectionId || config.unsplashCollectionId,
          customSearchQuery: config.customSearchQuery,
          redditSubreddit: config.redditSubreddit,
        },
        true // bypass session cache
      )
      if (popped?.url) {
        return popped
      }
    }

    // When frequency is 'tabs':
    // 1. Check if this tab already has its assigned session photo (prevents jumping on F5/refresh unless shouldChangeOnReload)
    // 2. Otherwise pop the next image from the upfront 2-3 preloaded future buffer (0ms instant load!)
    if (config.changeFrequency === 'tabs') {
      const popped = popNextBufferedTabPhoto(
        provider,
        {
          defaultCategory: config.defaultCategory,
          customCollectionId: config.customCollectionId || config.unsplashCollectionId,
          customSearchQuery: config.customSearchQuery,
          redditSubreddit: config.redditSubreddit,
        },
        shouldChangeOnReload
      )
      if (popped?.url) {
        return popped
      }
    }

    if (config.currentPhoto?.url) {
      return {
        ...config.currentPhoto,
        url: optimizeWallpaperResolution(config.currentPhoto.url),
      }
    }
    if (config.currentUnsplashPhoto?.url) {
      return {
        ...config.currentUnsplashPhoto,
        url: optimizeWallpaperResolution(config.currentUnsplashPhoto.url),
      }
    }
    return DEFAULT_COLLECTIONS.nature.fallbackPhotos[0]
  })

  const initialUrl = initialPhoto.url

  // Active displayed image source (Data URL or Remote URL)
  const [activeImageSrc, setActiveImageSrc] = useState<string>(() => {
    if (provider === 'solid_color') return ''
    return getSynchronousCachedActiveWallpaper(initialUrl) || initialUrl
  })

  // Stable canonical key for Framer Motion to prevent ghost cross-fades when the same photo is loaded in different formats
  const [canonicalPhotoKey, setCanonicalPhotoKey] = useState<string>(() => {
    return initialPhoto.id || initialUrl
  })

  const [activePhotoMetadata, setActivePhotoMetadata] = useState<UnsplashPhoto>(initialPhoto)
  const activeUrlRef = useRef<string>(initialUrl)
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
  })

  // Handle solid color ready state
  useEffect(() => {
    if (provider === 'solid_color') {
      configRef.current.onWallpaperReady?.(true)
    }
  }, [provider])

  // Decode image and unblock UI in lockstep with wallpaper rendering (Bonjourr blackout architecture)
  useEffect(() => {
    if (provider === 'solid_color') return

    let isCancelled = false

    if (!activeImageSrc) {
      configRef.current.onWallpaperReady?.(true)
      return
    }

    const img = new Image()
    img.src = activeImageSrc

    const onDecoded = () => {
      if (!isCancelled) {
        configRef.current.onWallpaperReady?.(true)
      }
    }

    const onDecodeError = () => {
      if (!isCancelled) {
        console.warn('Wallpaper failed to decode, engaging resilient fallback:', activeImageSrc)
        const fallback = DEFAULT_COLLECTIONS.nature.fallbackPhotos[0].url
        setActiveImageSrc((prev) => (prev !== fallback ? fallback : prev))
        configRef.current.onWallpaperReady?.(true)
      }
    }

    if (typeof img.decode === 'function') {
      img.decode().then(onDecoded).catch(onDecodeError)
    } else {
      img.onload = onDecoded
      img.onerror = onDecodeError
    }

    return () => {
      isCancelled = true
    }
  }, [activeImageSrc, provider])

  // Resolve target image URL considering Provider and Change Frequency
  useEffect(() => {
    if (provider === 'solid_color') return

    const currentId = ++loadRequestId.current
    let isCancelled = false

    async function resolveAndLoad() {
      // 1. Custom Image URL provider (cached in IndexedDB for 0ms offline retrieval)
      if (provider === 'custom_url') {
        const rawCustomUrl = (config.customBackgroundUrl || '').trim()
        if (!rawCustomUrl) {
          configRef.current.onWallpaperReady?.(true)
          return
        }

        let targetUrl = optimizeWallpaperResolution(normalizeCustomImageUrl(rawCustomUrl))

        // If user pasted an Unsplash photo page link, automatically resolve to direct high-res CDN photo
        if (rawCustomUrl.includes('unsplash.com/photos/')) {
          try {
            const resolved = await resolveUnsplashPageToImageUrl(rawCustomUrl)
            if (resolved) {
              targetUrl = optimizeWallpaperResolution(resolved)
            }
          } catch {}
        }

        if (isCancelled || currentId !== loadRequestId.current) return

        try {
          const finalSrc = await getOrFetchWallpaper(targetUrl)
          if (isCancelled || currentId !== loadRequestId.current) return

          activeUrlRef.current = targetUrl
          setCanonicalPhotoKey(targetUrl)
          setActiveImageSrc(finalSrc)
          setActivePhotoMetadata({
            id: targetUrl,
            url: targetUrl,
            author: 'Custom Image',
          })
          configRef.current.onWallpaperReady?.(true)
        } catch {
          if (!isCancelled && currentId === loadRequestId.current) {
            configRef.current.onWallpaperReady?.(true)
          }
        }
        return
      }

      // 2. Local File Provider
      if (provider === 'local_file') {
        const localUrl = config.localImageDataUrl || DEFAULT_COLLECTIONS.nature.fallbackPhotos[0].url
        if (localUrl !== activeUrlRef.current) {
          activeUrlRef.current = localUrl
          setCanonicalPhotoKey(localUrl)
          setActiveImageSrc(localUrl)
          setActivePhotoMetadata({
            id: 'local_file',
            url: localUrl,
            author: 'Local Device',
          })
        }
        return
      }

      const currentCollectionKey = `${provider}_${config.defaultCategory || ''}_${config.customCollectionId || config.unsplashCollectionId || ''}_${config.customSearchQuery || ''}_${config.redditSubreddit || ''}`
      const hasCollectionChanged = lastCollectionKeyRef.current !== currentCollectionKey
      lastCollectionKeyRef.current = currentCollectionKey

      const targetOptions = {
        defaultCategory: config.defaultCategory,
        customCollectionId: config.customCollectionId || config.unsplashCollectionId,
        customSearchQuery: config.customSearchQuery,
        redditSubreddit: config.redditSubreddit,
      }

      // 2.5 Dedicated Browser Tab Reload Override
      // When changeOnReload is enabled and the user reloaded this browser tab (F5 / ⟳),
      // we ALWAYS load a new wallpaper based on current provider/settings,
      // regardless of what changeFrequency is set to in the dropdown menu.
      const isReload = isBrowserTabReload()
      const shouldTriggerReloadCycle =
        isReload &&
        !!config.changeOnReload &&
        !hasHandledReloadRef.current

      if (shouldTriggerReloadCycle) {
        hasHandledReloadRef.current = true

        // Check if a fresh photo was already popped from the buffer during initial mount:
        let freshPoppedPhoto: UnsplashPhoto | null = null
        try {
          const sessionRaw = sessionStorage.getItem(TAB_SESSION_PHOTO_KEY)
          if (sessionRaw) {
            const parsed: UnsplashPhoto = JSON.parse(sessionRaw)
            if (parsed?.url && parsed.url === activeUrlRef.current && parsed.url !== config.currentPhoto?.url) {
              freshPoppedPhoto = parsed
            }
          }
        } catch {}

        if (freshPoppedPhoto) {
          activeUrlRef.current = freshPoppedPhoto.url
          setActivePhotoMetadata(freshPoppedPhoto)
          setCanonicalPhotoKey(freshPoppedPhoto.id || freshPoppedPhoto.url)
          configRef.current.onUpdatePhoto?.(freshPoppedPhoto, Date.now())

          // Ensure cached binary is loaded and replenish buffer for future reload:
          getOrFetchWallpaper(freshPoppedPhoto.url, freshPoppedPhoto)
            .then((finalSrc) => {
              if (!isCancelled && currentId === loadRequestId.current && finalSrc) {
                setActiveImageSrc((prev) => (prev !== finalSrc ? finalSrc : prev))
              }
            })
            .catch(() => {})

          replenishPreloadBufferInBackground(provider, targetOptions, freshPoppedPhoto.url)
          return
        }

        // Otherwise (buffer was empty on mount), fetch a fresh photo live:
        try {
          sessionStorage.removeItem(TAB_SESSION_PHOTO_KEY)
          const freshPhoto = await getNextPhotoForProvider({
            provider,
            ...targetOptions,
            currentPhotoUrl: activeUrlRef.current,
            forceRefresh: true,
          })
          if (isCancelled || currentId !== loadRequestId.current) return
          const finalSrc = await getOrFetchWallpaper(freshPhoto.url, freshPhoto)
          if (isCancelled || currentId !== loadRequestId.current) return

          try {
            sessionStorage.setItem(TAB_SESSION_PHOTO_KEY, JSON.stringify(freshPhoto))
          } catch {}

          activeUrlRef.current = freshPhoto.url
          setActivePhotoMetadata(freshPhoto)
          setCanonicalPhotoKey(freshPhoto.id || freshPhoto.url)
          setActiveImageSrc(finalSrc)
          configRef.current.onUpdatePhoto?.(freshPhoto, Date.now())

          replenishPreloadBufferInBackground(provider, targetOptions, freshPhoto.url)
        } catch (e) {
          console.warn('Failed to cycle wallpaper on tab reload:', e)
        }
        return
      }

      // 3. If frequency is 'tabs':
      if (config.changeFrequency === 'tabs') {
        // Case A: Collection, category, or search query changed in settings
        if (hasCollectionChanged) {
          try {
            sessionStorage.removeItem('aura_tab_session_photo_v1')
            const activeBufferKey = getTabBufferKey(provider, targetOptions)
            clearOutdatedBuffers(activeBufferKey)

            const freshPhoto = await getNextPhotoForProvider({
              provider,
              ...targetOptions,
              currentPhotoUrl: activeUrlRef.current,
              forceRefresh: true,
            })
            if (isCancelled || currentId !== loadRequestId.current) return
            const finalSrc = await getOrFetchWallpaper(freshPhoto.url)
            if (isCancelled || currentId !== loadRequestId.current) return

            try {
              sessionStorage.setItem('aura_tab_session_photo_v1', JSON.stringify(freshPhoto))
            } catch {}

            activeUrlRef.current = freshPhoto.url
            setActivePhotoMetadata(freshPhoto)
            setCanonicalPhotoKey(freshPhoto.id || freshPhoto.url)
            setActiveImageSrc(finalSrc)
            configRef.current.onUpdatePhoto?.(freshPhoto, Date.now())

            // Pre-buffer 2 to 3 upfront images for the new collection in background
            replenishPreloadBufferInBackground(provider, targetOptions, freshPhoto.url)
          } catch (e) {
            console.warn('Failed to switch to updated collection:', e)
          }
          return
        }

        // Case B: User clicked "Next Background" in Settings drawer while in 'tabs' mode
        // Strictly guarded so it only runs when an explicit manual cycle request was dispatched in THIS tab session
        const manualCycleToken = sessionStorage.getItem('aura_manual_cycle_request')
        const isManualCycle =
          !!manualCycleToken &&
          manualCycleToken === config.lastWallpaperChange?.toString()

        if (isManualCycle) {
          sessionStorage.removeItem('aura_manual_cycle_request')
          const externalPhoto = configRef.current.currentPhoto || configRef.current.currentUnsplashPhoto
          if (externalPhoto?.url && externalPhoto.url !== activeUrlRef.current) {
            try {
              const finalSrc = await getOrFetchWallpaper(externalPhoto.url)
              if (isCancelled || currentId !== loadRequestId.current) return

              activeUrlRef.current = externalPhoto.url
              setActivePhotoMetadata(externalPhoto)
              setCanonicalPhotoKey(externalPhoto.id || externalPhoto.url)
              setActiveImageSrc(finalSrc)

              // Replenish buffer in background after manual cycle
              replenishPreloadBufferInBackground(provider, targetOptions, externalPhoto.url)
            } catch (e) {
              console.warn('Failed to apply manual wallpaper cycle:', e)
            }
            return
          }
        }

        // Case C: Normal new tab launch:
        const hasSessionPhoto = !!sessionStorage.getItem('aura_tab_session_photo_v1')

        if (!hasSessionPhoto) {
          // Tier 3 Fallback: Both buffer and candidate queue were empty on mount (e.g. continuous tab storm)
          // Live fetch a fresh photo asynchronously for this tab so it NEVER gets stuck on the fallback!
          getNextPhotoForProvider({
            provider,
            ...targetOptions,
            currentPhotoUrl: activeUrlRef.current,
            forceRefresh: true,
          })
            .then(async (freshPhoto) => {
              if (isCancelled || currentId !== loadRequestId.current) return
              const finalSrc = await getOrFetchWallpaper(freshPhoto.url, freshPhoto)
              if (isCancelled || currentId !== loadRequestId.current) return

              try {
                sessionStorage.setItem('aura_tab_session_photo_v1', JSON.stringify(freshPhoto))
              } catch {}

              activeUrlRef.current = freshPhoto.url
              setActivePhotoMetadata(freshPhoto)
              setCanonicalPhotoKey(freshPhoto.id || freshPhoto.url)
              setActiveImageSrc(finalSrc)
            })
            .catch(() => {})
        } else {
          // Ensure active initial photo is retrieved from IndexedDB cache if not already in memory
          getOrFetchWallpaper(activeUrlRef.current).then((finalSrc) => {
            if (!isCancelled && currentId === loadRequestId.current && finalSrc) {
              setActiveImageSrc((prev) => (prev !== finalSrc ? finalSrc : prev))
            }
          }).catch(() => {})
        }

        // Replenish the 2 to 3 upfront buffer in the background while user works
        replenishPreloadBufferInBackground(provider, targetOptions, activeUrlRef.current)
        return
      }

      // 4. Dynamic providers with time-based frequency ('hour', 'day', 'locked', 'period')
      const manualCycleToken = sessionStorage.getItem('aura_manual_cycle_request')
      const isManualCycle =
        !!manualCycleToken &&
        manualCycleToken === config.lastWallpaperChange?.toString()

      if (isManualCycle) {
        sessionStorage.removeItem('aura_manual_cycle_request')
        const externalPhoto = configRef.current.currentPhoto || configRef.current.currentUnsplashPhoto
        if (externalPhoto?.url && externalPhoto.url !== activeUrlRef.current) {
          try {
            const finalSrc = await getOrFetchWallpaper(externalPhoto.url)
            if (isCancelled || currentId !== loadRequestId.current) return

            activeUrlRef.current = externalPhoto.url
            setActivePhotoMetadata(externalPhoto)
            setCanonicalPhotoKey(externalPhoto.id || externalPhoto.url)
            setActiveImageSrc(finalSrc)
          } catch (e) {
            console.warn('Failed to apply manual wallpaper cycle:', e)
          }
          return
        }
      }

      const shouldChange = needsWallpaperChange(
        config.changeFrequency,
        config.lastWallpaperChange,
      )

      const activePhoto = configRef.current.currentPhoto || configRef.current.currentUnsplashPhoto

      if (!hasCollectionChanged && !shouldChange && activePhoto?.url) {
        const highResUrl = optimizeWallpaperResolution(activePhoto.url)
        // Same photo: silently ensure cached binary is ready without triggering any re-mount or crossfade
        if (highResUrl !== activeUrlRef.current) {
          activeUrlRef.current = highResUrl
          setActivePhotoMetadata({ ...activePhoto, url: highResUrl })
          setCanonicalPhotoKey(activePhoto.id || highResUrl)
        }

        getOrFetchWallpaper(highResUrl).then((finalSrc) => {
          if (!isCancelled && currentId === loadRequestId.current && finalSrc) {
            // Update src quietly without touching canonicalPhotoKey
            setActiveImageSrc((prev) => (prev !== finalSrc ? finalSrc : prev))
          }
        }).catch(() => {})

        if (config.changeOnReload) {
          replenishPreloadBufferInBackground(provider, targetOptions, highResUrl)
        }
        return
      }

      // Time threshold has expired, collection changed, or no photo exists yet: fetch next photo
      try {
        const nextPhoto = await getNextPhotoForProvider({
          provider,
          defaultCategory: config.defaultCategory || 'all',
          customCollectionId:
            config.customCollectionId ||
            config.unsplashCollectionId ||
            DEFAULT_COLLECTIONS.nature.id,
          customSearchQuery:
            provider === 'wallhaven' || provider === 'reddit'
              ? (config.customSearchQuery || '')
              : (config.customSearchQuery || 'nature, mountains'),
          redditSubreddit: config.redditSubreddit || 'wallpapers',
          currentPhotoUrl: activePhoto?.url,
          forceRefresh: hasCollectionChanged,
        })

        if (isCancelled || currentId !== loadRequestId.current) return
        if (nextPhoto.url === activeUrlRef.current) return

        const finalSrc = await getOrFetchWallpaper(nextPhoto.url)
        if (isCancelled || currentId !== loadRequestId.current) return

        const img = new Image()
        img.src = finalSrc
        try {
          if (typeof img.decode === 'function') {
            await img.decode()
          } else {
            await new Promise<void>((res) => {
              img.onload = () => res()
              img.onerror = () => res()
            })
          }
        } catch {
          // Graceful fallback to default asset if decode fails
          console.warn('Decoded image check failed, falling back to bundled photo')
        }

        if (isCancelled || currentId !== loadRequestId.current) return

        activeUrlRef.current = nextPhoto.url
        setActivePhotoMetadata(nextPhoto)
        setCanonicalPhotoKey(nextPhoto.id || nextPhoto.url)
        setActiveImageSrc(finalSrc)

        if (configRef.current.onUpdatePhoto) {
          configRef.current.onUpdatePhoto(nextPhoto, Date.now())
        } else if (configRef.current.onUpdateUnsplashPhoto) {
          configRef.current.onUpdateUnsplashPhoto(nextPhoto, Date.now())
        }

        if (config.changeOnReload) {
          replenishPreloadBufferInBackground(provider, targetOptions, nextPhoto.url)
        }
      } catch (err) {
        console.warn('Failed to switch wallpaper:', err)
        // Ensure UI is not stuck on black screen
        const fallback = DEFAULT_COLLECTIONS.nature.fallbackPhotos[0].url
        setActiveImageSrc((prev) => (prev !== fallback ? fallback : prev))
      }
    }

    resolveAndLoad()

    return () => {
      isCancelled = true
    }
  }, [
    provider,
    config.defaultCategory,
    config.customCollectionId,
    config.unsplashCollectionId,
    config.customSearchQuery,
    config.customBackgroundUrl,
    config.localImageDataUrl,
    config.changeFrequency,
    config.changeOnReload,
    config.lastWallpaperChange,
    config.currentPhoto?.url,
    config.currentUnsplashPhoto?.url,
    config.redditSubreddit,
  ])

  const blur = config.backgroundBlur ?? 0
  const brightness = Math.max(0.3, (config.backgroundBrightness ?? 80) / 100)
  const filterStyle = `blur(${blur}px) brightness(${brightness})`
  if (provider === 'solid_color') {
    return (
      <div
        className="fixed inset-0 z-0 select-none pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: config.solidColor || '#000000' }}
      >
        <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/70 pointer-events-none" />
      </div>
    )
  }

  const displayPhoto = activePhotoMetadata || config.currentPhoto || config.currentUnsplashPhoto

  const zoom = (config.wallpaperZoom ?? 100) / 100
  const posX = config.wallpaperOffsetX !== undefined ? config.wallpaperOffsetX : 50
  const posY =
    config.wallpaperOffsetY !== undefined
      ? config.wallpaperOffsetY
      : config.wallpaperPosition === 'top'
      ? 0
      : config.wallpaperPosition === 'bottom'
      ? 100
      : 50

  const bgPosition = `${posX}% ${posY}%`

  // Combined single scale transform to avoid matrix calculation redundancies on GPU
  const combinedScale = zoom * (config.backgroundBlur > 0 ? 1.04 : 1)
  const mainTransform = combinedScale !== 1 ? `scale(${combinedScale})` : 'none'

  // Canvas container:
  // Fills the browser viewport naturally (matching Bonjourr and Rea architecture)
  // so that the wallpaper is centered on the user's visible display, preventing negative top offsets that crop the bottom.
  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  }

  return (
    <>
      {/* Background Image Container at z-0 (behind widgets at z-10+) */}
      <div className="fixed inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <AnimatePresence mode="popLayout" initial={false}>
          {activeImageSrc && (
            <motion.div
              key={canonicalPhotoKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              {/* Subtle ambient backdrop for contain mode */}
              {config.wallpaperFit === 'contain' && (
                <div
                  className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30"
                  style={{
                    backgroundImage: `url("${activeImageSrc}")`,
                    backgroundPosition: 'center',
                    filter: 'blur(35px) brightness(0.5)',
                    transform: 'scale(1.08)',
                  }}
                />
              )}

              {/* Main Wallpaper Canvas */}
              <div style={canvasStyle}>
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url("${activeImageSrc}")`,
                    backgroundSize:
                      config.wallpaperFit === 'contain'
                        ? 'contain'
                        : config.wallpaperFit === 'stretch'
                        ? '100% 100%'
                        : config.wallpaperFit === 'center'
                        ? 'auto'
                        : 'cover',
                    backgroundPosition: bgPosition,
                    backgroundRepeat: 'no-repeat',
                    filter: filterStyle,
                    transform: mainTransform,
                    transformOrigin: zoom !== 1 ? `${posX}% ${posY}%` : 'center center',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optional Ambient Texture Overlay (Grain, Waves, Topographic, CircuitBoard, Honeycomb) */}
        {config.wallpaperTexture && config.wallpaperTexture !== 'none' && (
          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              backgroundImage: `url("/patterns/${config.wallpaperTexture === 'grain' ? 'grain.png' : `${config.wallpaperTexture}.svg`}")`,
              backgroundRepeat: 'repeat',
              opacity: (config.wallpaperTextureOpacity ?? 15) / 100,
              mixBlendMode: 'overlay',
            }}
          />
        )}

        {/* Bonjourr-Style Ambient Contrast Vignette & Protection Gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.36) 0%,
                rgba(0, 0, 0, 0.08) 22%,
                rgba(0, 0, 0, 0.02) 42%,
                rgba(0, 0, 0, 0.08) 68%,
                rgba(0, 0, 0, 0.52) 100%
              ),
              radial-gradient(
                ellipse at center,
                transparent 35%,
                rgba(0, 0, 0, 0.28) 100%
              )
            `,
          }}
        />
      </div>

      {/* Photographer / Provider attribution (Minimal Bonjourr style, pure text without blur/card) */}
      {provider !== 'local_file' && provider !== 'custom_url' && displayPhoto?.author && (
        <div className="fixed bottom-4 left-5 z-20 pointer-events-auto">
          <a
            href={
              displayPhoto.pageUrl ||
              (provider === 'wallhaven'
                ? 'https://wallhaven.cc'
                : provider === 'bing'
                ? 'https://www.bing.com'
                : provider === 'reddit'
                ? 'https://www.reddit.com'
                : displayPhoto.username
                ? `https://unsplash.com/@${displayPhoto.username}?utm_source=Aura&utm_medium=referral`
                : 'https://unsplash.com')
            }
            target="_blank"
            rel="noopener noreferrer"
            title={displayPhoto.author}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white opacity-40 hover:opacity-100 transition-all duration-300 cursor-pointer select-none group drop-shadow-sm hover:drop-shadow-md py-1 max-w-[85vw] sm:max-w-md md:max-w-lg"
          >
            <span className="truncate">
              {provider === 'wallhaven' ? (
                <>Wallpaper on <strong className="font-medium text-white/50 group-hover:text-white group-hover:underline underline-offset-2 transition-colors">Wallhaven</strong></>
              ) : provider === 'bing' ? (
                <><strong className="font-medium text-white/50 group-hover:text-white group-hover:underline underline-offset-2 transition-colors">{truncateCreditWords(displayPhoto.author, 7)}</strong> · Bing Daily</>
              ) : provider === 'reddit' ? (
                <>Photo on <strong className="font-medium text-white/50 group-hover:text-white group-hover:underline underline-offset-2 transition-colors">r/{config.redditSubreddit || 'wallpapers'}</strong></>
              ) : (
                <>Photo by <strong className="font-medium text-white/50 group-hover:text-white group-hover:underline underline-offset-2 transition-colors">{truncateCreditWords(displayPhoto.author, 7)}</strong> on Unsplash</>
              )}
            </span>
            <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-white transition-colors shrink-0" />
          </a>
        </div>
      )}
    </>
  )
}
