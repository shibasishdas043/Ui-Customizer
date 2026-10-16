export { WeatherWidget } from './components/WeatherWidget'
export { useWeather } from './hooks/useWeather'
export {
  resolveLocation,
  getApproximateLocation,
  getPreciseLocation,
  searchCities,
  geocodeCity,
  reverseGeocode,
  clearLocationCache,
} from './utils/locationService'
export type {
  WeatherConfig,
  WeatherData,
  GeolocationMode,
  ResolvedLocation,
  CitySearchResult,
} from './types'
