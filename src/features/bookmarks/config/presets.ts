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
    icon: 'https://services.bonjourr.fr/favicon/blob/https://youtube.com',
    category: 'Media',
  },
  {
    id: 'preset-github',
    name: 'GitHub',
    url: 'https://github.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://github.com',
    category: 'Dev',
  },
  {
    id: 'preset-reddit',
    name: 'Reddit',
    url: 'https://reddit.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://reddit.com',
    category: 'Social',
  },
  {
    id: 'preset-chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://chatgpt.com',
    category: 'Productivity',
  },
  {
    id: 'preset-gmail',
    name: 'Gmail',
    url: 'https://mail.google.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://mail.google.com',
    category: 'Productivity',
  },
  {
    id: 'preset-x',
    name: 'X (Twitter)',
    url: 'https://x.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://x.com',
    category: 'Social',
  },
  {
    id: 'preset-netflix',
    name: 'Netflix',
    url: 'https://netflix.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://netflix.com',
    category: 'Media',
  },
  {
    id: 'preset-spotify',
    name: 'Spotify',
    url: 'https://spotify.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://spotify.com',
    category: 'Media',
  },
  {
    id: 'preset-notion',
    name: 'Notion',
    url: 'https://notion.so',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://notion.so',
    category: 'Productivity',
  },
  {
    id: 'preset-discord',
    name: 'Discord',
    url: 'https://discord.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://discord.com',
    category: 'Social',
  },
  {
    id: 'preset-twitch',
    name: 'Twitch',
    url: 'https://twitch.tv',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://twitch.tv',
    category: 'Media',
  },
  {
    id: 'preset-figma',
    name: 'Figma',
    url: 'https://figma.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://figma.com',
    category: 'Dev',
  },
  {
    id: 'preset-amazon',
    name: 'Amazon',
    url: 'https://amazon.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://amazon.com',
    category: 'Popular',
  },
  {
    id: 'preset-linkedin',
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://linkedin.com',
    category: 'Social',
  },
  {
    id: 'preset-instagram',
    name: 'Instagram',
    url: 'https://instagram.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://instagram.com',
    category: 'Social',
  },
  {
    id: 'preset-google',
    name: 'Google',
    url: 'https://google.com',
    icon: 'https://services.bonjourr.fr/favicon/blob/https://google.com',
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
