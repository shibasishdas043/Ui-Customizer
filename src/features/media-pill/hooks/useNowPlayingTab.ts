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

// 1. AI Chatbots & LLM Tools (voice mode, TTS, or audio context must never activate media pill)
const EXCLUDED_AI_DOMAINS = [
  'chatgpt.com',
  'chat.openai.com',
  'oaistatic.com',
  'claude.ai',
  'anthropic.com',
  'gemini.google.com',
  'bard.google.com',
  'copilot.microsoft.com',
  'perplexity.ai',
  'poe.com',
  'character.ai',
  'mistral.ai',
  'chat.mistral.ai',
  'deepseek.com',
  'chat.deepseek.com',
  'grok.com',
  'x.ai',
  'huggingface.co',
  'meta.ai',
  'pi.ai',
]

// 2. Communication, Meetings, VoIP & Messaging Tools (calls, notification chimes)
const EXCLUDED_COMM_DOMAINS = [
  'meet.google.com',
  'zoom.us',
  'teams.microsoft.com',
  'teams.live.com',
  'discord.com',
  'slack.com',
  'web.whatsapp.com',
  'web.telegram.org',
  'messenger.com',
  'skype.com',
  'web.skype.com',
]

/**
 * Returns true if the URL belongs to an AI chatbot, meeting tool, or browser internal page.
 */
export function isExcludedNonMediaUrl(url?: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()

  // Browser internal or extension pages
  if (
    lower.startsWith('chrome://') ||
    lower.startsWith('chrome-extension://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('brave://') ||
    lower.startsWith('about:') ||
    lower.startsWith('view-source:')
  ) {
    return true
  }

  if (EXCLUDED_AI_DOMAINS.some((domain) => lower.includes(domain))) {
    return true
  }

  if (EXCLUDED_COMM_DOMAINS.some((domain) => lower.includes(domain))) {
    return true
  }

  return false
}

/**
 * Checks both URL and tab title to prevent AI chatbots or meeting calls from being treated as media.
 */
export function isExcludedTab(tab?: ChromeTabInfo): boolean {
  if (!tab) return true
  if (tab.url && isExcludedNonMediaUrl(tab.url)) return true
  if (tab.title) {
    const lowerTitle = tab.title.toLowerCase()
    if (
      lowerTitle.endsWith(' - chatgpt') ||
      lowerTitle.endsWith(' | chatgpt') ||
      lowerTitle.endsWith(' - claude') ||
      lowerTitle.endsWith(' | claude') ||
      lowerTitle.endsWith(' - gemini') ||
      lowerTitle.endsWith(' | gemini') ||
      lowerTitle.endsWith(' - deepseek')
    ) {
      return true
    }
  }
  return false
}

/**
 * Detects the media platform from the tab URL.
 * Recognizes all major audio/video services and falls back to 'generic' for arbitrary media playback.
 */
export function getPlatformFromUrl(url?: string): MediaPlatform {
  if (!url) return 'generic'
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('spotify.com')) return 'spotify'
  if (lower.includes('soundcloud.com')) return 'soundcloud'
  if (lower.includes('netflix.com')) return 'netflix'
  if (lower.includes('music.apple.com')) return 'apple_music'
  if (lower.includes('twitch.tv')) return 'twitch'
  if (lower.includes('deezer.com')) return 'deezer'
  if (lower.includes('tidal.com')) return 'tidal'
  if (lower.includes('bandcamp.com')) return 'bandcamp'
  if (lower.includes('music.amazon.')) return 'amazon_music'
  if (lower.includes('vimeo.com')) return 'vimeo'
  return 'generic'
}

export function isKnownMediaPlatform(url?: string): boolean {
  if (!url) return false
  return getPlatformFromUrl(url) !== 'generic'
}

export function isYouTubeWatchUrl(url?: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.includes('/watch') ||
    lower.includes('/shorts/') ||
    lower.includes('/embed/') ||
    lower.includes('music.youtube.com')
  )
}

/**
 * Dynamically sanitizes song, video, or sound titles across any platform.
 */
export function cleanMediaTitle(title?: string): string {
  if (!title) return 'Playing Audio'
  let clean = title.trim()

  // Remove notification counts like "(1) Song Title" or "(99+) "
  clean = clean.replace(/^\(\d+\+?\)\s*/, '')

  // Remove leading playback / stream indicators
  clean = clean.replace(/^[▶►⏸🔴]\s*/u, '')

  // Remove platform branding suffixes across known platforms
  clean = clean
    .replace(/\s*-\s*YouTube\s*$/i, '')
    .replace(/\s*\|\s*Spotify\s*$/i, '')
    .replace(/\s*\|\s*SoundCloud\s*$/i, '')
    .replace(/\s*-\s*Netflix\s*$/i, '')
    .replace(/\s*\|\s*Apple Music\s*$/i, '')
    .replace(/\s*-\s*Twitch\s*$/i, '')
    .replace(/\s*-\s*Deezer\s*$/i, '')
    .replace(/\s*-\s*TIDAL\s*$/i, '')
    .replace(/\s*\|\s*Bandcamp\s*$/i, '')
    .replace(/\s*on\s*Vimeo\s*$/i, '')
    .replace(/\s*-\s*Vimeo\s*$/i, '')
    .replace(/\s*\|\s*Amazon Music\s*$/i, '')
    .replace(/\s*-\s*Soundpuddle\s*$/i, '')
    .replace(/\s*-\s*Mixcloud\s*$/i, '')

  return clean.trim() || title
}

export function getYouTubeThumbnail(url?: string): string | undefined {
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
  hasMedia?: boolean
}

/**
 * Universal in-page metadata extraction.
 * Injected into the target media tab to inspect live MediaSession, player APIs, or HTML5 audio/video elements.
 */
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
            let hasMedia = false
            let title = ''
            let artist = ''
            let artwork = ''

            // 1. Highest Priority: navigator.mediaSession (live, dynamically updated on song/video change)
            const ms = navigator.mediaSession
            if (ms) {
              if (ms.playbackState === 'playing') {
                isPlaying = true
                hasMedia = true
              } else if (ms.playbackState === 'paused') {
                hasMedia = true
              }
              if (ms.metadata) {
                hasMedia = true
                if (ms.metadata.title) title = ms.metadata.title.trim()
                if (ms.metadata.artist) artist = ms.metadata.artist.trim()
                if (ms.metadata.album && !artist) artist = ms.metadata.album.trim()
                if (ms.metadata.artwork && ms.metadata.artwork.length > 0) {
                  const artList = Array.from(ms.metadata.artwork)
                  const bestArt = artList.sort((a, b) => {
                    const sA = parseInt(a.sizes?.split('x')[0] || '0', 10)
                    const sB = parseInt(b.sizes?.split('x')[0] || '0', 10)
                    return sB - sA
                  })[0]
                  if (bestArt?.src) artwork = bestArt.src
                }
              }
            }

            // 2. YouTube Player & Real-time DOM check
            const ytPlayer = (document.getElementById('movie_player') as any)
            if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
              const state = ytPlayer.getPlayerState()
              // 1 = PLAYING, 3 = BUFFERING
              if (state === 1 || state === 3) {
                isPlaying = true
                hasMedia = true
              } else if (state === 2) {
                hasMedia = true
              }
              if (typeof ytPlayer.isMuted === 'function') {
                isMuted = ytPlayer.isMuted()
              }

              // Live DOM title for YouTube (updates immediately on SPA navigation)
              const ytDomTitle = (
                document.querySelector(
                  'h1.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string, ytd-watch-metadata #title h1, h1.title yt-formatted-string'
                )?.textContent || ''
              ).trim()
              if (ytDomTitle) {
                title = ytDomTitle
              }

              const ytDomChannel = (
                document.querySelector(
                  'ytd-channel-name #text, #upload-info #channel-name a, #owner #channel-name a'
                )?.textContent || ''
              ).trim()
              if (ytDomChannel && !artist) {
                artist = ytDomChannel
              }

              // Secondary fallback to videoData if DOM title wasn't found
              if (!title && typeof ytPlayer.getVideoData === 'function') {
                const videoData = ytPlayer.getVideoData()
                if (videoData?.title) title = videoData.title.trim()
                if (videoData?.author && !artist) artist = videoData.author.trim()
              }
            }

            // 3. Platform-specific DOM queries for Spotify, SoundCloud, Twitch
            // Spotify Web Player
            const spotifyTrack = (
              document.querySelector(
                '[data-testid="context-item-info-title"] a, [data-testid="track-info-name"]'
              )?.textContent || ''
            ).trim()
            if (spotifyTrack) {
              hasMedia = true
              if (!title) title = spotifyTrack
              const spotifyArtist = (
                document.querySelector(
                  '[data-testid="context-item-info-artist"] a, [data-testid="track-info-artists"]'
                )?.textContent || ''
              ).trim()
              if (spotifyArtist && !artist) artist = spotifyArtist
              const spotifyCover = document.querySelector('[data-testid="cover-art-image"]')?.getAttribute('src')
              if (spotifyCover && !artwork) artwork = spotifyCover
              const playBtn = document.querySelector('[data-testid="control-button-playpause"]')
              const playLabel = playBtn?.getAttribute('aria-label')?.toLowerCase() || ''
              if (playLabel.includes('pause')) isPlaying = true
            }

            // SoundCloud
            const scTitle = (
              document.querySelector('.playbackSoundBadge__titleLink')?.getAttribute('title') ||
              document.querySelector('.playbackSoundBadge__titleLink')?.textContent ||
              ''
            ).trim()
            if (scTitle) {
              hasMedia = true
              if (!title) title = scTitle
              const scArtist = (
                document.querySelector('.playbackSoundBadge__lightLink')?.textContent || ''
              ).trim()
              if (scArtist && !artist) artist = scArtist
              const scCoverEl = document.querySelector('.playbackSoundBadge__avatar span') as HTMLElement | null
              if (scCoverEl && !artwork) {
                const bg = scCoverEl.style.backgroundImage
                const match = bg.match(/url\(["']?([^"']+)["']?\)/)
                if (match && match[1]) artwork = match[1]
              }
            }

            // Twitch
            const twitchTitle = (
              document.querySelector('[data-a-target="stream-title"]')?.textContent || ''
            ).trim()
            if (twitchTitle) {
              hasMedia = true
              if (!title) title = twitchTitle
              const streamer = (
                document.querySelector('[data-a-target="user-channel-name"]')?.textContent || ''
              ).trim()
              if (streamer && !artist) artist = streamer
              const twitchAvatar = document.querySelector('.channel-header__user-avatar img')?.getAttribute('src')
              if (twitchAvatar && !artwork) artwork = twitchAvatar
            }

            // 4. HTML5 <video> and <audio> elements (Universal across ALL websites)
            const mediaElements = Array.from(
              document.querySelectorAll('video, audio'),
            ) as (HTMLVideoElement | HTMLAudioElement)[]
            if (mediaElements.length > 0) {
              hasMedia = true
              const activeEl = mediaElements.find(
                (el) => !el.paused && !el.ended && el.readyState > 1,
              )
              if (activeEl) {
                isPlaying = true
                isMuted = activeEl.muted || activeEl.volume === 0
                if (!artwork && (activeEl as HTMLVideoElement).poster) {
                  artwork = (activeEl as HTMLVideoElement).poster
                }
              } else {
                const first = mediaElements[0]
                if (first && (first.muted || first.volume === 0)) {
                  isMuted = true
                }
              }

              if (!title) {
                for (const el of mediaElements) {
                  const t = el.getAttribute('title') || el.getAttribute('aria-label')
                  if (t && t.trim()) {
                    title = t.trim()
                    break
                  }
                }
              }
            }

            // 5. Universal OpenGraph & Page Metadata Fallback
            if (!artwork) {
              const ogImg =
                document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')
              if (ogImg) artwork = ogImg
            }

            if (!title) {
              const ogTitle =
                document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                document.querySelector('h1')?.textContent?.trim() ||
                document.title ||
                ''
              if (ogTitle) title = ogTitle
            }

            return {
              title,
              artist,
              artwork,
              isPlaying,
              isMuted,
              hasMedia,
            }
          } catch {
            return {
              title: document.title || '',
              isPlaying: false,
              isMuted: false,
              hasMedia: false,
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

function purgeMediaStorage() {
  try {
    localStorage.removeItem(MEDIA_STORAGE_KEY)
    localStorage.removeItem(TAB_ID_STORAGE_KEY)
    localStorage.removeItem('aura_last_active_media')
    localStorage.removeItem('aura_last_media_tab_id')
    sessionStorage.removeItem('aura_last_media_tab_id')
    sessionStorage.removeItem('aura_last_active_media')
  } catch {
    // Safe fallback
  }
}

export function useNowPlayingTab(enabled: boolean = true) {
  const isExtensionEnv = typeof chrome !== 'undefined' && !!chrome.tabs && !!chrome.tabs.query
  const lastFetchRef = useRef<{ tabId: number; time: number; meta: TabMediaMetadata } | null>(null)

  const activeTabIdRef = useRef<number | null>(
    (() => {
      if (typeof window === 'undefined') return null
      try {
        const cached = localStorage.getItem(MEDIA_STORAGE_KEY) || localStorage.getItem('aura_last_active_media')
        if (cached) {
          const parsed = JSON.parse(cached)
          // Purge invalid cached tabs (AI chatbots or meeting calls)
          if (parsed?.url && isExcludedNonMediaUrl(parsed.url)) {
            purgeMediaStorage()
            return null
          }
        }
        return (
          Number(localStorage.getItem(TAB_ID_STORAGE_KEY) || sessionStorage.getItem('aura_last_media_tab_id')) ||
          null
        )
      } catch {
        return null
      }
    })(),
  )

  const [activeMedia, setActiveMedia] = useState<NowPlayingMedia | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(MEDIA_STORAGE_KEY) || sessionStorage.getItem('aura_last_active_media')
        if (cached) {
          const parsed = JSON.parse(cached)
          // Reject cached active media if it belongs to an excluded URL
          if (parsed?.url && isExcludedNonMediaUrl(parsed.url)) {
            purgeMediaStorage()
            return null
          }
          // Accept cached active media if recent (< 30 seconds)
          if (parsed && parsed.tabId && (!parsed._savedAt || Date.now() - parsed._savedAt < 30000)) {
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

  // Completely resets active media state and clears persistent storage
  const clearActiveMedia = useCallback(() => {
    setActiveMedia(null)
    activeTabIdRef.current = null
    lastFetchRef.current = null
    purgeMediaStorage()
  }, [])

  // Inspect playback state and metadata of a target candidate tab
  const inspectTabState = useCallback(
    (candidateTab: ChromeTabInfo, forceRefresh: boolean = false) => {
      if (!candidateTab || candidateTab.id === undefined) return
      const tabId = candidateTab.id

      // 1. Instantly reject any excluded non-media tab (AI chatbots, meetings, browser internal URLs)
      if (isExcludedTab(candidateTab)) {
        if (activeTabIdRef.current === tabId) {
          clearActiveMedia()
        }
        return
      }

      const platform = getPlatformFromUrl(candidateTab.url)
      const cleanTitle = cleanMediaTitle(candidateTab.title)
      const thumbnailUrl =
        platform === 'youtube'
          ? getYouTubeThumbnail(candidateTab.url)
          : candidateTab.favIconUrl

      // 2. INSTANT OPTIMISTIC SYNC:
      // Prevent frozen titles when opening a new tab by syncing the tab's current title immediately
      activeTabIdRef.current = tabId
      try {
        localStorage.setItem(TAB_ID_STORAGE_KEY, String(tabId))
        sessionStorage.setItem('aura_last_media_tab_id', String(tabId))
      } catch {
        // Safe fallback
      }

      setActiveMedia((prev) => {
        // If already tracking this tab with this exact title and playing status, maintain prev
        if (
          prev &&
          prev.tabId === tabId &&
          prev.cleanTitle === cleanTitle &&
          prev.isPlaying === (candidateTab.audible ?? prev.isPlaying)
        ) {
          return prev
        }
        return {
          tabId,
          title: candidateTab.title || 'Playing Audio',
          cleanTitle,
          url: candidateTab.url || '',
          favIconUrl: candidateTab.favIconUrl,
          thumbnailUrl: prev && prev.tabId === tabId && prev.thumbnailUrl ? prev.thumbnailUrl : thumbnailUrl,
          artist: prev && prev.tabId === tabId ? prev.artist : undefined,
          isPlaying: candidateTab.audible ? true : (prev && prev.tabId === tabId ? prev.isPlaying : false),
          isMuted: candidateTab.mutedInfo?.muted ?? (prev && prev.tabId === tabId ? prev.isMuted : false),
          platform,
        }
      })

      const applyMetadata = (meta: TabMediaMetadata) => {
        // Authoritative playback state:
        const isPlaying = Boolean(candidateTab.audible || meta.isPlaying === true)
        const hasRealMedia = Boolean(
          candidateTab.audible ||
            meta.isPlaying ||
            meta.hasMedia ||
            meta.artwork ||
            meta.artist ||
            (platform === 'youtube' && isYouTubeWatchUrl(candidateTab.url)),
        )

        // If tab is silent and has no loaded media, clear it
        if (!hasRealMedia && !candidateTab.audible) {
          if (activeTabIdRef.current === tabId) {
            clearActiveMedia()
          }
          return
        }

        const isMuted = Boolean(
          candidateTab.mutedInfo?.muted ||
            (meta.isMuted !== undefined ? meta.isMuted : false),
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
          localStorage.setItem(
            MEDIA_STORAGE_KEY,
            JSON.stringify({ ...updatedMedia, _savedAt: Date.now() }),
          )
          sessionStorage.setItem('aura_last_active_media', JSON.stringify(updatedMedia))
        } catch {
          // Safe fallback
        }
      }

      // 3. Enrich with live DOM & MediaSession metadata (with 1.5s cache unless forceRefresh)
      if (
        !forceRefresh &&
        lastFetchRef.current &&
        lastFetchRef.current.tabId === tabId &&
        Date.now() - lastFetchRef.current.time < 1500
      ) {
        applyMetadata(lastFetchRef.current.meta)
        return
      }

      fetchTabMediaMetadata(tabId, (meta) => {
        lastFetchRef.current = { tabId, time: Date.now(), meta }
        applyMetadata(meta)
      })
    },
    [clearActiveMedia],
  )

  // Scan open tabs for active media or currently tracked media tab
  const scanTabs = useCallback(
    (forceRefresh: boolean = false) => {
      if (!enabled || !isExtensionEnv) return

      try {
        // 1. Check for any currently audible tab
        chrome.tabs.query({ audible: true }, (audibleTabs: ChromeTabInfo[]) => {
          if (chrome.runtime?.lastError) return

          // Filter out excluded AI chatbots, video calls, and browser internal pages
          const validAudibleTabs = (audibleTabs || []).filter((t) => !isExcludedTab(t))

          if (validAudibleTabs.length > 0) {
            // Prioritize known media platforms (YouTube, Spotify, etc.) over generic audible tabs
            const knownAudible = validAudibleTabs.find((t) => getPlatformFromUrl(t.url) !== 'generic')
            const candidate = knownAudible || validAudibleTabs[0]
            if (candidate && candidate.id !== undefined) {
              inspectTabState(candidate, forceRefresh)
              return
            }
          }

          // 2. If NO tab is currently audible, check the currently tracked media tab
          const trackedId = activeTabIdRef.current
          if (trackedId !== null) {
            chrome.tabs.get(trackedId, (tab?: ChromeTabInfo) => {
              if (chrome.runtime?.lastError || !tab || !tab.id) {
                clearActiveMedia()
                return
              }

              if (isExcludedTab(tab)) {
                clearActiveMedia()
                return
              }

              // Tracked tab is open: inspect its paused/holding state
              inspectTabState(tab, forceRefresh)
            })
            return
          }

          // 3. No audible tabs and no tracked tab: clean state
          clearActiveMedia()
        })
      } catch {
        // Ignored
      }
    },
    [enabled, isExtensionEnv, inspectTabState, clearActiveMedia],
  )

  useEffect(() => {
    if (!enabled || !isExtensionEnv) return

    // Immediately trigger a force scan on mount to eliminate frozen titles on opening a new tab
    scanTabs(true)

    // Realtime Tab Listeners
    const handleTabUpdated = (
      tabId: number,
      changeInfo: { audible?: boolean; title?: string; url?: string; mutedInfo?: { muted: boolean } },
    ) => {
      // If the tracked tab changed URL to an excluded domain or non-media page, clear it immediately
      if (activeTabIdRef.current === tabId && changeInfo.url && isExcludedNonMediaUrl(changeInfo.url)) {
        clearActiveMedia()
        return
      }

      if (activeTabIdRef.current === tabId) {
        lastFetchRef.current = null
        if (changeInfo.audible !== undefined) {
          setActiveMedia((prev) =>
            prev && prev.tabId === tabId ? { ...prev, isPlaying: changeInfo.audible! } : prev,
          )
        }
        if (changeInfo.mutedInfo !== undefined) {
          setActiveMedia((prev) =>
            prev && prev.tabId === tabId ? { ...prev, isMuted: changeInfo.mutedInfo!.muted } : prev,
          )
        }
        if (changeInfo.title) {
          const clean = cleanMediaTitle(changeInfo.title)
          setActiveMedia((prev) =>
            prev && prev.tabId === tabId
              ? { ...prev, title: changeInfo.title!, cleanTitle: clean }
              : prev,
          )
        }
      }

      if (
        changeInfo.audible !== undefined ||
        changeInfo.title !== undefined ||
        changeInfo.url !== undefined ||
        changeInfo.mutedInfo !== undefined
      ) {
        scanTabs(true)
      }
    }

    const handleTabRemoved = (tabId: number) => {
      if (activeTabIdRef.current === tabId) {
        clearActiveMedia()
        scanTabs(true)
      }
    }

    const handleActivated = () => {
      lastFetchRef.current = null
      scanTabs(true)
    }

    const handleFocusOrVisible = () => {
      if (!document.hidden) {
        lastFetchRef.current = null
        scanTabs(true)
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MEDIA_STORAGE_KEY) {
        if (!e.newValue) {
          clearActiveMedia()
        } else {
          try {
            const parsed = JSON.parse(e.newValue)
            if (parsed && parsed.tabId) {
              if (parsed.url && isExcludedNonMediaUrl(parsed.url)) {
                clearActiveMedia()
                return
              }
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

    // Polling interval ensures immediate detection of background track transitions
    const interval = setInterval(() => scanTabs(false), 800)

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated)
      chrome.tabs.onRemoved.removeListener(handleTabRemoved)
      chrome.tabs.onActivated?.removeListener(handleActivated)
      window.removeEventListener('focus', handleFocusOrVisible)
      document.removeEventListener('visibilitychange', handleFocusOrVisible)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [enabled, isExtensionEnv, scanTabs, clearActiveMedia])

  // Universal Media Control: Toggle Play/Pause on the target tab
  const togglePlayPause = useCallback(async () => {
    if (!activeMedia) return
    lastFetchRef.current = null

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
            // 1. YouTube Player API
            const ytPlayer = (document.getElementById('movie_player') as any)
            if (
              ytPlayer &&
              typeof ytPlayer.playVideo === 'function' &&
              typeof ytPlayer.pauseVideo === 'function'
            ) {
              const state = ytPlayer.getPlayerState?.()
              if (state === 1) {
                ytPlayer.pauseVideo()
              } else {
                ytPlayer.playVideo()
              }
              return
            }

            // 2. Platform UI buttons (Spotify, SoundCloud, Apple Music, Twitch)
            const spotifyBtn = document.querySelector(
              '[data-testid="control-button-playpause"]',
            ) as HTMLElement | null
            if (spotifyBtn) {
              spotifyBtn.click()
              return
            }

            const scBtn = document.querySelector('.playControls__play') as HTMLElement | null
            if (scBtn) {
              scBtn.click()
              return
            }

            const appleBtn = document.querySelector('button.playback-play') as HTMLElement | null
            if (appleBtn) {
              appleBtn.click()
              return
            }

            const twitchBtn = document.querySelector(
              'button[data-a-target="player-play-pause-button"]',
            ) as HTMLElement | null
            if (twitchBtn) {
              twitchBtn.click()
              return
            }

            // 3. Universal HTML5 Media Elements (<video> and <audio>)
            const mediaElements = Array.from(
              document.querySelectorAll('video, audio'),
            ) as (HTMLVideoElement | HTMLAudioElement)[]
            if (mediaElements.length > 0) {
              const playingEl = mediaElements.find((el) => !el.paused && !el.ended)
              if (playingEl) {
                playingEl.pause()
              } else {
                const candidate = mediaElements[0]
                candidate.play().catch(() => {})
              }
            }
          },
        })
      }
    } catch {
      // Revert optimistic toggle if injection fails
      setActiveMedia((prev) => (prev ? { ...prev, isPlaying: !nextPlaying } : null))
    }
  }, [activeMedia, isExtensionEnv])

  // Universal Media Control: Toggle Mute on the target tab
  const toggleMute = useCallback(() => {
    if (!activeMedia) return
    lastFetchRef.current = null

    if (!isExtensionEnv) {
      setActiveMedia((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))
      return
    }

    const nextMuted = !activeMedia.isMuted
    setActiveMedia((prev) => (prev ? { ...prev, isMuted: nextMuted } : null))

    try {
      chrome.tabs.update(activeMedia.tabId, { muted: nextMuted }, () => {
        if (chrome.runtime?.lastError) {
          // Tab may have been closed
        }
      })

      if (chrome.scripting?.executeScript) {
        chrome.scripting.executeScript({
          target: { tabId: activeMedia.tabId },
          func: (mutedVal: boolean) => {
            // YouTube
            const ytPlayer = (document.getElementById('movie_player') as any)
            if (ytPlayer) {
              if (mutedVal && typeof ytPlayer.mute === 'function') {
                ytPlayer.mute()
              } else if (!mutedVal && typeof ytPlayer.unMute === 'function') {
                ytPlayer.unMute()
              }
            }

            // Universal HTML5 Media
            const mediaElements = Array.from(
              document.querySelectorAll('video, audio'),
            ) as (HTMLVideoElement | HTMLAudioElement)[]
            for (const el of mediaElements) {
              el.muted = mutedVal
            }
          },
          args: [nextMuted],
        })
      }
    } catch {
      // Revert on error
      setActiveMedia((prev) => (prev ? { ...prev, isMuted: !nextMuted } : null))
    }
  }, [activeMedia, isExtensionEnv])

  // Media Navigation: Focus the active media tab and its window
  const jumpToTab = useCallback(() => {
    if (!activeMedia || !isExtensionEnv) return
    try {
      chrome.tabs.get(activeMedia.tabId, (tab?: ChromeTabInfo) => {
        if (chrome.runtime?.lastError || !tab) return
        chrome.tabs.update(activeMedia.tabId, { active: true })
        if (tab.windowId) {
          chrome.windows.update(tab.windowId, { focused: true })
        }
      })
    } catch {
      // Ignored
    }
  }, [activeMedia, isExtensionEnv])

  return {
    activeMedia,
    togglePlayPause,
    toggleMute,
    jumpToTab,
  }
}
