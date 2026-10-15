export type QuoteFrequency = 'tabs' | 'hour' | 'day' | 'locked'
export type QuoteCategory = 'all' | 'simplicity' | 'mindfulness' | 'philosophy' | 'tech'

export interface QuoteItem {
  quote: string
  author: string
  category?: QuoteCategory
}

export interface QuotesConfig {
  showQuotes: boolean
  quoteFrequency?: QuoteFrequency
  alwaysShowAuthor?: boolean
  quoteCategory?: QuoteCategory
  currentQuoteIndex?: number
  lastQuoteChange?: number
  onUpdateQuote?: (quoteIndex: number, timestamp: number) => void
}

