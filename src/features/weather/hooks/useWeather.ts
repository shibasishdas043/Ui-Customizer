import { useState, useEffect } from 'react'
import type { WeatherData, WeatherConfig, GeolocationMode } from '../types'

const WEATHER_CACHE_KEY = 'aura_weather_cache_v1'
const APPROX_LOCATION_CACHE_KEY = 'aura_approx_location_v1'
const WEATHER_CACHE_TTL_MS = 20 * 60 * 1000 // 20 minutes (matches Bonjourr pattern)
const LOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CachedWeatherEnvelope {
  data: WeatherData
  timestamp: number
  cityQuery: string
  tempUnit: string
  mode: GeolocationMode
}

interface CachedApproxLocation {
  city: string
  lat: number
  lon: number
  timestamp: number
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear Sky'
  if (code === 1 || code === 2) return 'Partly Cloudy'
  if (code === 3) return 'Overcast'
  if (code >= 45 && code <= 48) return 'Foggy'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 61 && code <= 65) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Clear'
}

function getInitialCachedWeather(
  city: string,
  unit: string,
  mode: GeolocationMode,
): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CachedWeatherEnvelope
      if (parsed && parsed.data && parsed.tempUnit === unit) {
        if (mode === 'off') {
          if (!city || (parsed.cityQuery && parsed.cityQuery.toLowerCase() === city.toLowerCase())) {
            return parsed.data
          }
        } else {
          return parsed.data
        }
      }
    }
  } catch {}
  return null
}

/**
 * Resolves approximate location via IP Geolocation cascade without requesting browser permissions.
 * Mirrors Bonjourr's default 'approximate' geolocation philosophy to avoid browser permission popups.
 */
async function getApproximateLocation(): Promise<{ city: string; lat: number; lon: number } | null> {
  // 1. Check local cache (fresh within 24 hours)
  try {
    const raw = localStorage.getItem(APPROX_LOCATION_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CachedApproxLocation
      if (
        parsed &&
        typeof parsed.lat === 'number' &&
        typeof parsed.lon === 'number' &&
        Date.now() - parsed.timestamp < LOCATION_CACHE_TTL_MS
      ) {
        return { city: parsed.city, lat: parsed.lat, lon: parsed.lon }
      }
    }
  } catch {}

  // 2. Cascade of reliable, CORS-friendly public IP geolocation endpoints
  const resolvers: Array<() => Promise<{ city: string; lat: number; lon: number }>> = [
    async () => {
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3500) })
      if (!res.ok) throw new Error('ipapi failed')
      const data = await res.json()
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          city: data.city || data.region || 'Current Location',
          lat: data.latitude,
          lon: data.longitude,
        }
      }
      throw new Error('invalid ipapi response')
    },
    async () => {
      const res = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(3500) })
      if (!res.ok) throw new Error('freeipapi failed')
      const data = await res.json()
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          city: data.cityName || data.regionName || 'Current Location',
          lat: data.latitude,
          lon: data.longitude,
        }
      }
      throw new Error('invalid freeipapi response')
    },
    async () => {
      const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) })
      if (!res.ok) throw new Error('ipwhois failed')
      const data = await res.json()
      if (data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          city: data.city || data.region || 'Current Location',
          lat: data.latitude,
          lon: data.longitude,
        }
      }
      throw new Error('invalid ipwhois response')
    },
    async () => {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: AbortSignal.timeout(3500) })
      if (!res.ok) throw new Error('geojs failed')
      const data = await res.json()
      const lat = parseFloat(data.latitude)
      const lon = parseFloat(data.longitude)
      if (!isNaN(lat) && !isNaN(lon)) {
        return {
          city: data.city || data.region || 'Current Location',
          lat,
          lon,
        }
      }
      throw new Error('invalid geojs response')
    },
  ]

  for (const resolve of resolvers) {
    try {
      const loc = await resolve()
      if (loc) {
        try {
          const cacheEntry: CachedApproxLocation = {
            ...loc,
            timestamp: Date.now(),
          }
          localStorage.setItem(APPROX_LOCATION_CACHE_KEY, JSON.stringify(cacheEntry))
        } catch {}
        return loc
      }
    } catch {
      // Try next endpoint in cascade
    }
  }

  // Fallback to expired cache if available
  try {
    const raw = localStorage.getItem(APPROX_LOCATION_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CachedApproxLocation
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
        return { city: parsed.city, lat: parsed.lat, lon: parsed.lon }
      }
    }
  } catch {}

  return null
}

export function useWeather(config: WeatherConfig) {
  const activeMode: GeolocationMode =
    config.geolocationMode || (config.autoLocation === false ? 'off' : 'approximate')

  const [weather, setWeather] = useState<WeatherData | null>(() => {
    return getInitialCachedWeather(config.city, config.tempUnit, activeMode)
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!config.showWeather) return

    let isMounted = true

    async function fetchWeather() {
      // Check if current cache is still fresh to avoid redundant network queries on frequent tab opening
      try {
        const raw = localStorage.getItem(WEATHER_CACHE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as CachedWeatherEnvelope
          const isFresh = Date.now() - parsed.timestamp < WEATHER_CACHE_TTL_MS
          const isSameUnit = parsed.tempUnit === config.tempUnit
          const isSameMode = parsed.mode === activeMode
          const isSameCity = activeMode !== 'off' || parsed.cityQuery.toLowerCase() === (config.city || '').toLowerCase()

          if (isFresh && isSameUnit && isSameMode && isSameCity && parsed.data) {
            if (isMounted) {
              setWeather(parsed.data)
            }
            return
          }
        }
      } catch {}

      setIsLoading(true)
      try {
        let lat = 51.5074
        let lon = -0.1278
        let cityName = config.city || 'London'

        // 1. Resolve coordinates based on geolocationMode
        if (activeMode === 'off' && config.city && config.city.trim()) {
          // Manual location mode: Geocode specified city via Open-Meteo Geocoding
          try {
            const geoRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                config.city.trim(),
              )}&count=1&language=en&format=json`,
              { signal: AbortSignal.timeout(5000) },
            )
            const geoData = await geoRes.json()
            if (geoData.results && geoData.results[0]) {
              lat = geoData.results[0].latitude
              lon = geoData.results[0].longitude
              cityName = geoData.results[0].name
            }
          } catch (e) {
            console.warn('City geocoding error:', e)
          }
        } else if (activeMode === 'precise') {
          // Precise GPS mode: Explicitly requests browser geolocation
          let resolved = false
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            try {
              const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, {
                  timeout: 6000,
                  maximumAge: 10 * 60 * 1000,
                }),
              )
              lat = pos.coords.latitude
              lon = pos.coords.longitude
              cityName = 'Current Location'
              resolved = true
            } catch {
              // Geolocation denied or timed out
            }
          }
          if (!resolved) {
            // Fall back to approximate IP estimation
            const approx = await getApproximateLocation()
            if (approx) {
              lat = approx.lat
              lon = approx.lon
              cityName = approx.city
            }
          }
        } else {
          // Default: 'approximate' (Bonjourr logic: IP-based, NEVER prompts for browser permission)
          const approx = await getApproximateLocation()
          if (approx) {
            lat = approx.lat
            lon = approx.lon
            cityName = approx.city
          }
        }

        // 2. Fetch current weather from Open-Meteo
        const tempParam = config.tempUnit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : ''
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m${tempParam}`,
          { signal: AbortSignal.timeout(6000) },
        )
        const weatherJson = await weatherRes.json()

        if (isMounted && weatherJson.current) {
          const freshWeather: WeatherData = {
            city: cityName,
            temperature: Math.round(weatherJson.current.temperature_2m),
            weatherCode: weatherJson.current.weather_code,
            weatherDescription: getWeatherDescription(weatherJson.current.weather_code),
            windSpeed: Math.round(weatherJson.current.wind_speed_10m),
            humidity: Math.round(weatherJson.current.relative_humidity_2m),
          }

          setWeather(freshWeather)

          // Cache in localStorage for instant 0ms retrieval on future tab opens
          try {
            const envelope: CachedWeatherEnvelope = {
              data: freshWeather,
              timestamp: Date.now(),
              cityQuery: config.city || '',
              tempUnit: config.tempUnit,
              mode: activeMode,
            }
            localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(envelope))
          } catch {}
        }
      } catch (err) {
        console.warn('Weather fetch error:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, WEATHER_CACHE_TTL_MS)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [config.showWeather, config.city, config.tempUnit, config.autoLocation, activeMode])

  return { weather, isLoading }
}
