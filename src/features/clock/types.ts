export type ClockFontFamily = 'sans' | 'display' | 'mono' | 'caveat' | 'playwrite' | 'stalemate'

export interface ClockConfig {
  showClock: boolean
  analog: boolean
  use24Hour: boolean
  showSeconds: boolean
  showDate: boolean
  showGreeting: boolean
  userName: string
  fontFamily: ClockFontFamily
}

export interface FormattedTime {
  hours: string
  minutes: string
  seconds: string
  period: string
  dateString: string
}

export type GreetingType = 'morning' | 'afternoon' | 'evening' | 'night'
