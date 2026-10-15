export type GeolocationMode = 'approximate' | 'precise' | 'off'

export interface WeatherData {
  city: string
  temperature: number
  weatherCode: number
  weatherDescription: string
  windSpeed: number
  humidity: number
}

export interface WeatherConfig {
  showWeather: boolean
  tempUnit: 'celsius' | 'fahrenheit'
  city: string
  autoLocation?: boolean
  geolocationMode?: GeolocationMode
  fontFamily?: string
}
