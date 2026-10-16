export type GeolocationMode = 'approximate' | 'precise' | 'off'

export interface WeatherData {
  city: string
  temperature: number
  weatherCode: number
  weatherDescription: string
  windSpeed: number
  humidity: number
  feelsLike?: number
  isDay?: boolean
  country?: string
}

export interface WeatherConfig {
  showWeather: boolean
  tempUnit: 'celsius' | 'fahrenheit'
  city: string
  autoLocation?: boolean
  geolocationMode?: GeolocationMode
  fontFamily?: string
}

export interface ResolvedLocation {
  city: string
  lat: number
  lon: number
  country?: string
  state?: string
  source: 'cache' | 'gps' | 'ip' | 'manual'
}

export interface CitySearchResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  countryCode?: string
  admin1?: string
}
