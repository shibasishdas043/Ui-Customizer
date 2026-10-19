import { useState, useEffect, useCallback, useRef } from 'react'
import type { NowPlayingMedia, MediaPlatform } from '../types'

declare const chrome: any

interface ChromeTabInfo {
  id?: number
  url?: string
  title?: string
  favIconUrl?: string
  audible?: boolean
  mutedInfo?: { muted: boolean }
  windowId?: number
}

function getPlatformFromUrl(url?: string): MediaPlatform {
  if (!url) return 'generic'
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('spotify.com')) return 'spotify'
  if (lower.includes('soundcloud.com')) return 'soundcloud'
  if (lower.includes('netflix.com')) return 'netflix'
  if (lower.includes('music.apple.com')) return 'apple_music'
  return 'generic'
}

function cleanMediaTitle(title?: string): string {
  if (!title) return 'Playing Audio'
  let clean = title.trim()

  // Remove platform branding suffixes
  clean = clean
    .replace(/\s*-\s*YouTube\s*$/i, '')
    .replace(/\s*\|\s*Spotify\s*$/i, '')
    .replace(/\s*\|\s*SoundCloud\s*$/i, '')
    .replace(/\s*-\s*Netflix\s*$/i, '')
    .replace(/\s*\|\s*Apple Music\s*$/i, '')

  // Remove notification counts like "(1) Song Title"
  clean = clean.replace(/^\(\d+\)\s*/, '')

  return clean.trim() || title
}

function getYouTubeThumbnail(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    let videoId: string | null = null
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.replace('/shorts/', '').split('/')[0].split('?')[0]
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.replace('/embed/', '').split('/')[0].split('?')[0]
      } else {
        videoId = parsed.searchParams.get('v')
      }
    } else if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.replace(/^\//, '').split('?')[0]
    }
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }
  } catch {
    // Ignore invalid url
  }
  return undefined
}

interface TabMediaMetadata {
  title?: string
  artist?: string
  artwork?: string
  isPlaying?: boolean
  isMuted?: boolean
}

const MEDIA_URL_PATTERNS = [
  '*://*.youtube.com/*',
  '*://*.spotify.com/*',
  '*://*.soundcloud.com/*',
  '*://music.apple.com/*',
  '*://*.netflix.com/*',
]

function fetchTabMediaMetadata(
  tabId: number,
  callback: (meta: TabMediaMetadata) => void,
) {
  if (typeof chrome === 'undefined' || !chrome.scripting?.executeScript) {
    callback({})
    return
  }

  try {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          try {
            let isPlaying = false
            let isMuted = false
            let title = ''
            let artist = ''
            let artwork = ''

            // 1. HTML5 Media Elements check (<video> and <audio>)
            const mainVideo = (document.querySelector('video.html5-main-video') ||
              document.querySelector('#movie_player video') ||
              document.querySelector('video')) as HTMLVideoElement | null

            if (mainVideo) {
              artwork = mainVideo.poster || ''
              isPlaying = !mainVideo.paused && !mainVideo.ended
              isMuted = mainVideo.muted || mainVideo.volume === 0
            } else {
              const mediaElements = Array.from(
                document.querySelectorAll('video, audio'),
              ) as (HTMLVideoElement | HTMLAudioElement)[]
              if (mediaElements.length > 0) {
                isPlaying = mediaElements.some((el) => !el.paused && !el.ended)
                isMuted = mediaElements.every((el) => el.muted || el.volume === 0)
              }
            }

            // 2. MediaSession API (used by Spotify Web, Apple Music, YouTube Music, SoundCloud)
            const ms = navigator.mediaSession
            if (ms) {
              if (ms.playbackState === 'playing') {
                isPlaying = true
              } else if (ms.playbackState === 'paused' && (!mainVideo || mainVideo.paused)) {
                isPlaying = false
              }
              if (ms.metadata) {
                title = title || ms.metadata.title || ''
                artist = artist || ms.metadata.artist || ''
                artwork = artwork || ms.metadata.artwork?.[0]?.src || ''
              }
            }

            // 3. Fallback for title
            if (!title) {
              title = document.title || ''
            }

            return {
              title,
              artist,
              artwork,
              isPlaying,
              isMuted,
            }
          } catch {
            return {
              title: document.title || '',
              isPlaying: false,
              isMuted: false,
            }
          }
        },
      },
      (results: any) => {
        if (chrome.runtime?.lastError) {
          callback({})
          return
        }
        const data = results?.[0]?.result
        callback(data || {})
      },
    )
  } catch {
    callback({})
  }
}

const MEDIA_STORAGE_KEY = 'aura_last_active_media_v2'
const TAB_ID_STORAGE_KEY = 'aura_last_media_tab_id_v2'

export function useNowPlayingTab(enabled: boolean = true) {
  const isExtensionEnv = typeof chrome !== 'undefined' && !!chrome.tabs && !!chrome.tabs.query
  const activeTabIdRef = useRef<number | null>(
    typeof window !== 'undefined'
      ? Number(localStorage.getItem(TAB_ID_STORAGE_KEY) || sessionStorage.getItem('aura_last_media_tab_id')) || null
      : null
  )

  const [activeMedia, setActiveMedia] = useState<NowPlayingMedia | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(MEDIA_STORAGE_KEY) || sessionStorage.getItem('aura_last_active_media')
        if (cached) {
          const parsed = JSON.parse(cached)
          // Accept cached active media if it has a valid tabId and was seen within the last 45 seconds
          if (parsed && parsed.tabId && (!parsed._savedAt || Date.now() - parsed._savedAt < 45000)) {
            const { _savedAt, ...mediaData } = parsed
            return mediaData as NowPlayingMedia
          }
        }
      } catch {
        // Safe fallback
      }
      if (!isExtensionEnv) {
        const hasDemo = localStorage.getItem('aura_demo_media_active') === 'true'
        if (hasDemo) {
          return {
            tabId: 9999,
            title: 'Full Video: Hookah Bar | Khiladi 786',
            cleanTitle: 'Hookah Bar — Khiladi 786',
            url: 'https://youtube.com/watch?v=demo',
            favIconUrl: 'https://www.youtube.com/s/desktop/f681a8c7/img/favicon.ico',
            thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
            artist: 'Himesh Reshammiya',
            isPlaying: true,
            isMuted: false,
            platform: 'youtube',
          }
        }
      }
    }
    return null
  })

  // Inspect playback state and metadata of a target tab
  const inspectTabState = useCallback((candidateTab: ChromeTabInfo) => {
    if (!candidateTab || candidateTab.id === undefined) return
    const tabId = candidateTab.id
    activeTabIdRef.current = tabId
    try {
      localStorage.setItem(TAB_ID_STORAGE_KEY, String(tabId))
      sessionStorage.setItem('aura_last_media_tab_id', String(tabId))
    } catch {
      // Safe fallback
    }

    const platform = getPlatformFromUrl(candidateTab.url)
    const cleanTitle = cleanMediaTitle(candidateTab.title)
    const thumbnailUrl =
      platform === 'youtube'
        ? getYouTubeThumbnail(candidateTab.url)
        : candidateTab.favIconUrl

    // 1. Reflect tab audible/playing and mute states
    setActiveMedia((prev) => {
      const isSame = prev && prev.tabId === tabId
      const initialPlaying = candidateTab.audible ? true : (isSame ? prev.isPlaying : false)
      const initialMuted = candidateTab.mutedInfo?.muted ?? (isSame ? prev.isMuted : false)
      return {
        tabId,
        title: isSame && prev.title ? prev.title : (candidateTab.title || 'Playing Audio'),
        cleanTitle: isSame && prev.cleanTitle ? prev.cleanTitle : cleanTitle,
        url: candidateTab.url || '',
        favIconUrl: candidateTab.favIconUrl,
        thumbnailUrl: isSame && prev.thumbnailUrl ? prev.thumbnailUrl : thumbnailUrl,
        artist: isSame ? prev.artist : undefined,
        isPlaying: initialPlaying,
        isMuted: initialMuted,
        platform,
      }
    })

    // 2. Enrich with DOM metadata and verify playback state
    fetchTabMediaMetadata(tabId, (meta) => {
      if (activeTabIdRef.current !== tabId) return

      // Authoritative playback state:
      // Tab is playing if audible in Chrome OR if DOM video/audio is active (!paused)
      const isPlaying = Boolean(candidateTab.audible || meta.isPlaying === true)

      // Authoritative mute state:
      // Tab is muted if Chrome tab is muted OR if in-page video/audio is muted or volume === 0
      const isMuted = Boolean(
        candidateTab.mutedInfo?.muted ||
        (meta.isMuted !== undefined ? meta.isMuted : false)
      )

      const finalTitle = meta.title ? cleanMediaTitle(meta.title) : cleanTitle
      const finalThumb = meta.artwork || thumbnailUrl

      const updatedMedia: NowPlayingMedia = {
        tabId,
        title: meta.title || candidateTab.title || 'Playing Audio',
        cleanTitle: finalTitle,
        url: candidateTab.url || '',
        favIconUrl: candidateTab.favIconUrl,
        thumbnailUrl: finalThumb,
        artist: meta.artist || undefined,
        isPlaying,
        isMuted,
        platform,
      }

      setActiveMedia(updatedMedia)
      try {
        localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify({ ...updatedMedia, _savedAt: Date.now() }))
        sessionStorage.setItem('aura_last_active_media', JSON.stringify(updatedMedia))
      } catch {
        // Safe fallback
      }
    })
  }, [])

  // Scan open tabs for active media or currently tracked media tab
  const scanTabs = useCallback(() => {
    if (!enabled || !isExtensionEnv) return

    try {
      const trackedId = activeTabIdRef.current

      const checkTrackedTab = (callbackIfClosed: () => void) => {
        if (trackedId === null) {
          callbackIfClosed()
          return
        }
        chrome.tabs.get(trackedId, (tab?: ChromeTabInfo) => {
          if (chrome.runtime?.lastError || !tab || !tab.id) {
            callbackIfClosed()
            return
          }
          inspectTabState(tab)
        })
      }

      const discoverMediaTabs = () => {
        chrome.tabs.query({ url: MEDIA_URL_PATTERNS }, (mediaTabs: ChromeTabInfo[]) => {
          if (!chrome.runtime?.lastError && mediaTabs && mediaTabs.length > 0) {
            const bestTab = mediaTabs.find((t) => t.audible) || mediaTabs[0]
            inspectTabState(bestTab)
            return
          }

          chrome.tabs.query({ audible: true }, (audibleTabs: ChromeTabInfo[]) => {
            if (!chrome.runtime?.lastError && audibleTabs && audibleTabs.length > 0) {
              inspectTabState(audibleTabs[0])
              return
            }

            // No media tabs or audible tabs exist
            setActiveMedia(null)
            activeTabIdRef.current = null
            try {
              localStorage.removeItem(TAB_ID_STORAGE_KEY)
              localStorage.removeItem(MEDIA_STORAGE_KEY)
              sessionStorage.removeItem('aura_last_media_tab_id')
              sessionStorage.removeItem('aura_last_active_media')
            } catch {
              // Safe fallback
            }
          })
        })
      }

      // 1. Prioritize any currently audible tab
      chrome.tabs.query({ audible: true }, (audibleTabs: ChromeTabInfo[]) => {
        if (!chrome.runtime?.lastError && audibleTabs && audibleTabs.length > 0) {
          const audibleMedia = audibleTabs.find((t) => getPlatformFromUrl(t.url) !== 'generic')
          const candidate = audibleMedia || audibleTabs[0]
          if (candidate && candidate.id !== undefined) {
            inspectTabState(candidate)
            return
          }
        }

        // 2. If no tab is audible, maintain and inspect tracked tab or discover media tabs
        checkTrackedTab(discoverMediaTabs)
      })
    } catch {
      // Ignored
    }
  }, [enabled, isExtensionEnv, inspectTabState])

  useEffect(() => {
    if (!enabled || !isExtensionEnv) return

    // Initial query
    scanTabs()

    // Realtime Tab Listeners
    const handleTabUpdated = (
      tabId: number,
      changeInfo: { audible?: boolean; title?: string; mutedInfo?: { muted: boolean } },
    ) => {
      if (activeTabIdRef.current === tabId) {
        if (changeInfo.audible === true) {
          setActiveMedia((prev) =>
            prev && prev.tabId === tabId ? { ...prev, isPlaying: true } : prev
          )
        }
        if (changeInfo.mutedInfo !== undefined) {
          setActiveMedia((prev) =>
            prev && prev.tabId === tabId ? { ...prev, isMuted: changeInfo.mutedInfo!.muted } : prev
          )
        }
        if (changeInfo.title) {
          setActiveMedia((prev) =>
            prev && prev.tabId === tabId
              ? { ...prev, title: changeInfo.title!, cleanTitle: cleanMediaTitle(changeInfo.title!) }
              : prev
          )
        }
      }
      if (
        changeInfo.audible !== undefined ||
        changeInfo.title !== undefined ||
        changeInfo.mutedInfo !== undefined
      ) {
        scanTabs()
      }
    }

    const handleTabRemoved = (tabId: number) => {
      if (activeTabIdRef.current === tabId) {
        setActiveMedia(null)
        activeTabIdRef.current = null
        scanTabs()
      }
    }

    const handleActivated = () => {
      scanTabs()
    }

    const handleFocusOrVisible = () => {
      if (!document.hidden) {
        scanTabs()
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MEDIA_STORAGE_KEY) {
        if (!e.newValue) {
          setActiveMedia(null)
          activeTabIdRef.current = null
        } else {
          try {
            const parsed = JSON.parse(e.newValue)
            if (parsed && parsed.tabId) {
              const { _savedAt, ...mediaData } = parsed
              setActiveMedia(mediaData)
              activeTabIdRef.current = mediaData.tabId
            }
          } catch {}
        }
      }
    }

    chrome.tabs.onUpdated.addListener(handleTabUpdated)
    chrome.tabs.onRemoved.addListener(handleTabRemoved)
    chrome.tabs.onActivated?.addListener(handleActivated)
    window.addEventListener('focus', handleFocusOrVisible)
    document.addEventListener('visibilitychange', handleFocusOrVisible)
    window.addEventListener('storage', handleStorageChange)

    // Interval polling ensures immediate detection of play/pause transitions across background tabs
    const interval = setInterval(scanTabs, 800)

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated)
      chrome.tabs.onRemoved.removeListener(handleTabRemoved)
      chrome.tabs.onActivated?.removeListener(handleActivated)
      window.removeEventListener('focus', handleFocusOrVisible)
      document.removeEventListener('visibilitychange', handleFocusOrVisible)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [enabled, isExtensionEnv, scanTabs])

  // Media Control: Toggle Play/Pause on the target tab
  const togglePlayPause = useCallback(async () => {
    if (!activeMedia) return

    if (!isExtensionEnv) {
      // Toggle local state in dev
      setActiveMedia((prev) => (prev ? { ...prev, isPlaying: !prev.isPlaying } : null))
      return
    }

    // Optimistically toggle state immediately for instant UI feedback
    const nextPlaying = !activeMedia.isPlaying
    setActiveMedia((prev) => (prev ? { ...prev, isPlaying: nextPlaying } : null))

    try {
      if (chrome.scripting?.executeScript) {
        await chrome.scripting.executeScript({
          target: { tabId: activeMedia.tabId },
          func: () => {
            // Find main video or active video/audio element
            const mainVideo = (document.querySelector('video.html5-main-video') ||
              document.querySelector('#movie_player video') ||
              document.querySelector('video')) as HTMLVideoElement | null
            if (mainVideo) {
              if (mainVideo.paused) {
                mainVideo.play().catch(() => {})
              } else {
                mainVideo.pause()
              }
              return
            }

            const mediaEl = document.querySelector('video, audio') as HTMLMediaElement | null
            if (mediaEl) {
              if (mediaEl.paused) {
                mediaEl.play().catch(() => {})
              } else {
                mediaEl.pause()
              }
              return
            }

            // Fallback: send space key event
            const spaceEvent = new KeyboardEvent('keydown', {
              code: 'Space',
              key: ' ',
              keyCode: 32,
              which: 32,
              bubbles: true,
            })
            document.dispatchEvent(spaceEvent)
          },
        })
      }
    } catch {
      // Scripting might fail if tab URL is chrome:// or restricted
    }
  }, [activeMedia, isExtensionEnv])

  // Media Control: Toggle Mute on the target tab
  const toggleMute = useCallback(() => {
    if (!activeMedia) return

    if (!isExtensionEnv) {
      setActiveMedia((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))
      return
    }

    const targetMuted = !activeMedia.isMuted

    // Optimistically update UI immediately for snappy feedback
    setActiveMedia((prev) => (prev ? { ...prev, isMuted: targetMuted } : null))

    // 1. Update tab-level mute state in Chrome
    chrome.tabs.update(activeMedia.tabId, { muted: targetMuted }, () => {
      if (chrome.runtime?.lastError) {
        // Tab might be closed or restricted
      }
    })

    // 2. Synchronize in-page HTML5 video/audio elements (YouTube, Spotify, etc.)
    try {
      if (chrome.scripting?.executeScript) {
        chrome.scripting.executeScript({
          target: { tabId: activeMedia.tabId },
          func: (mutedVal: boolean) => {
            const mainVideo = (document.querySelector('video.html5-main-video') ||
              document.querySelector('#movie_player video') ||
              document.querySelector('video')) as HTMLVideoElement | null
            if (mainVideo) {
              mainVideo.muted = mutedVal
              if (!mutedVal && mainVideo.volume === 0) {
                mainVideo.volume = 0.8
              }
            }
            const mediaElements = Array.from(
              document.querySelectorAll('video, audio'),
            ) as (HTMLVideoElement | HTMLAudioElement)[]
            mediaElements.forEach((el) => {
              el.muted = mutedVal
              if (!mutedVal && el.volume === 0) {
                el.volume = 0.8
              }
            })
          },
          args: [targetMuted],
        }).catch(() => {})
      }
    } catch {
      // Scripting might fail if tab URL is restricted
    }
  }, [activeMedia, isExtensionEnv])

  // Jump directly to the playing tab
  const jumpToTab = useCallback(() => {
    if (!activeMedia) return

    if (!isExtensionEnv) {
      window.open(activeMedia.url, '_blank')
      return
    }

    chrome.tabs.update(activeMedia.tabId, { active: true }, (tab?: ChromeTabInfo) => {
      if (tab?.windowId) {
        chrome.windows.update(tab.windowId, { focused: true })
      }
    })
  }, [activeMedia, isExtensionEnv])

  return {
    activeMedia: enabled ? activeMedia : null,
    togglePlayPause,
    toggleMute,
    jumpToTab,
  }
}
