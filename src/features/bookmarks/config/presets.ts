import type { BookmarkItem } from '../types'

export interface BookmarkPreset {
  id: string
  name: string
  url: string
  icon: string
  category: 'Popular' | 'Social' | 'Dev' | 'Media' | 'Productivity'
}

export const BOOKMARK_PRESETS: BookmarkPreset[] = [
  {
    id: 'preset-youtube',
    name: 'YouTube',
    url: 'https://youtube.com',
    icon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128',
    category: 'Media',
  },
  {
    id: 'preset-github',
    name: 'GitHub',
    url: 'https://github.com',
    icon: 'https://github.githubassets.com/favicons/favicon.svg',
    category: 'Dev',
  },
  {
    id: 'preset-reddit',
    name: 'Reddit',
    url: 'https://reddit.com',
    icon: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png',
    category: 'Social',
  },
  {
    id: 'preset-chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    icon: 'https://chatgpt.com/favicon.ico',
    category: 'Productivity',
  },
  {
    id: 'preset-gmail',
    name: 'Gmail',
    url: 'https://mail.google.com',
    icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    category: 'Productivity',
  },
  {
    id: 'preset-x',
    name: 'X (Twitter)',
    url: 'https://x.com',
    icon: 'https://abs.twimg.com/favicons/twitter.3.ico',
    category: 'Social',
  },
  {
    id: 'preset-netflix',
    name: 'Netflix',
    url: 'https://netflix.com',
    icon: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico',
    category: 'Media',
  },
  {
    id: 'preset-spotify',
    name: 'Spotify',
    url: 'https://spotify.com',
    icon: 'https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png',
    category: 'Media',
  },
  {
    id: 'preset-notion',
    name: 'Notion',
    url: 'https://notion.so',
    icon: 'https://www.notion.so/images/favicon.ico',
    category: 'Productivity',
  },
  {
    id: 'preset-discord',
    name: 'Discord',
    url: 'https://discord.com',
    icon: 'https://discord.com/assets/favicon.ico',
    category: 'Social',
  },
  {
    id: 'preset-twitch',
    name: 'Twitch',
    url: 'https://twitch.tv',
    icon: 'https://static.twitchcdn.net/assets/favicon-32-e29e246c124e438f130c.png',
    category: 'Media',
  },
  {
    id: 'preset-figma',
    name: 'Figma',
    url: 'https://figma.com',
    icon: 'https://static.figma.com/app/icon/1/favicon.ico',
    category: 'Dev',
  },
  {
    id: 'preset-amazon',
    name: 'Amazon',
    url: 'https://amazon.com',
    icon: 'https://www.amazon.com/favicon.ico',
    category: 'Popular',
  },
  {
    id: 'preset-linkedin',
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    icon: 'https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
    category: 'Social',
  },
  {
    id: 'preset-instagram',
    name: 'Instagram',
    url: 'https://instagram.com',
    icon: 'https://static.cdninstagram.com/rsrc.php/v3/yI/r/VsNE-guiASz.png',
    category: 'Social',
  },
  {
    id: 'preset-google',
    name: 'Google',
    url: 'https://google.com',
    icon: 'https://www.google.com/favicon.ico',
    category: 'Popular',
  },
]

export function presetToBookmark(preset: BookmarkPreset): BookmarkItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: preset.name,
    url: preset.url,
    icon: preset.icon,
    iconType: 'preset',
  }
}
