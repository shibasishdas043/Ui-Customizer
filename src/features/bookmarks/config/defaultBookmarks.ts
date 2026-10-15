import type { BookmarkItem } from '../types'

export const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  {
    id: '1',
    title: 'GitHub',
    url: 'https://github.com',
    icon: 'https://github.githubassets.com/favicons/favicon.svg',
  },
  {
    id: '2',
    title: 'YouTube',
    url: 'https://youtube.com',
    icon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128',
  },
  {
    id: '3',
    title: 'Reddit',
    url: 'https://reddit.com',
    icon: 'https://www.redditstatic.com/shreddit/assets/favicon/192x192.png',
  },
  {
    id: '4',
    title: 'Gmail',
    url: 'https://mail.google.com',
    icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
  },
  {
    id: '5',
    title: 'X / Twitter',
    url: 'https://x.com',
    icon: 'https://abs.twimg.com/favicons/twitter.3.ico',
  },
]
