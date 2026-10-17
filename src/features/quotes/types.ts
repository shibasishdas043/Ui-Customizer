export type QuoteType =
  | 'classic'
  | 'stoic'
  | 'wisdom'
  | 'office'
  | 'inspirobot'
  | 'hitokoto'
  | 'user'
  | 'url'

export type QuoteFrequency = 'tabs' | 'hour' | 'day' | 'locked'

export type QuoteCategory = 'all' | 'simplicity' | 'mindfulness' | 'philosophy' | 'tech'

export interface QuoteItem {
  quote: string
  author: string
  category?: string
  id?: string
}

export interface QuotesConfig {
  showQuotes: boolean
  quoteType?: QuoteType
  quoteFrequency?: QuoteFrequency
  alwaysShowAuthor?: boolean
  quoteLanguage?: string
  customQuotesText?: string
  customQuotesUrl?: string
  currentQuoteIndex?: number
  lastQuoteChange?: number
  onUpdateQuote?: (quote: QuoteItem, timestamp: number) => void
}
