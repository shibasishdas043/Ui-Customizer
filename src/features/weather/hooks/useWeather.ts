import { useState, useEffect, useCallback } from 'react'
import type { WeatherData, WeatherConfig, GeolocationMode } from '../types'
import { resolveLocation, clearLocationCache } from '../utils/locationService'

const WEATHER_CACHE_KEY = 'aura_weather_cache_v2'
const WEATHER_CACHE_TTL_MS = 20 * 60 * 1000 // 20 minutes

interface CachedWeatherEnvelope {
  data: WeatherData
  timestamp: number
  cityQuery: string
  tempUnit: string
  mode: GeolocationMode
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
  mode: GeolocationMode
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
  } catch {
    // Ignore cache parse errors
  }
  return null
}

export function useWeather(config: WeatherConfig) {
  const activeMode: GeolocationMode =
    config.geolocationMode || (config.autoLocation === false ? 'off' : 'approximate')

  const [weather, setWeather] = useState<WeatherData | null>(() => {
    return getInitialCachedWeather(config.city, config.tempUnit, activeMode)
  })
  const [isLoading, setIsLoading] = useState(false)

  const fetchWeather = useCallback(
    async (forceRefresh = false) => {
      if (!config.showWeather) return

      // 1. Check local cache freshness (unless forceRefresh is requested)
      if (!forceRefresh) {
        try {
          const raw = localStorage.getItem(WEATHER_CACHE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw) as CachedWeatherEnvelope
            const isFresh = Date.now() - parsed.timestamp < WEATHER_CACHE_TTL_MS
            const isSameUnit = parsed.tempUnit === config.tempUnit
            const isSameMode = parsed.mode === activeMode
            const isSameCity =
              activeMode !== 'off' ||
              parsed.cityQuery.toLowerCase() === (config.city || '').toLowerCase()

            if (isFresh && isSameUnit && isSameMode && isSameCity && parsed.data) {
              setWeather(parsed.data)
              return
            }
          }
        } catch {
          // Ignore cache parse error
        }
      }

      setIsLoading(true)

      try {
        if (forceRefresh) {
          clearLocationCache()
        }

        // 2. Resolve robust location via locationService (IP cascade, GPS, or manual)
        const location = await resolveLocation(activeMode, config.city, forceRefresh)

        // 3. Fetch comprehensive weather metrics from Open-Meteo
        const tempParam = config.tempUnit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : ''
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m${tempParam}&timezone=auto`

        const weatherRes = await fetch(weatherUrl, {
          signal: AbortSignal.timeout(6000),
        })

        if (!weatherRes.ok) throw new Error('Open-Meteo query failed')
        const weatherJson = await weatherRes.json()

        if (weatherJson.current) {
          const freshWeather: WeatherData = {
            city: location.city,
            country: location.country,
            temperature: Math.round(weatherJson.current.temperature_2m),
            feelsLike: Math.round(
              weatherJson.current.apparent_temperature ?? weatherJson.current.temperature_2m
            ),
            weatherCode: weatherJson.current.weather_code,
            weatherDescription: getWeatherDescription(weatherJson.current.weather_code),
            windSpeed: Math.round(weatherJson.current.wind_speed_10m),
            humidity: Math.round(weatherJson.current.relative_humidity_2m),
            isDay: weatherJson.current.is_day === 1,
          }

          setWeather(freshWeather)

          // 4. Save to localStorage envelope
          try {
            const envelope: CachedWeatherEnvelope = {
              data: freshWeather,
              timestamp: Date.now(),
              cityQuery: config.city || '',
              tempUnit: config.tempUnit,
              mode: activeMode,
            }
            localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(envelope))
          } catch {
            // Storage quota
          }
        }
      } catch (err) {
        console.warn('Weather update error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [config.showWeather, config.city, config.tempUnit, activeMode]
  )

  useEffect(() => {
    const initTimer = setTimeout(() => {
      fetchWeather()
    }, 0)
    const interval = setInterval(() => {
      fetchWeather()
    }, WEATHER_CACHE_TTL_MS)

    const handleWindowRefresh = () => {
      fetchWeather(true)
    }
    window.addEventListener('aura:weather-refresh', handleWindowRefresh)

    return () => {
      clearTimeout(initTimer)
      clearInterval(interval)
      window.removeEventListener('aura:weather-refresh', handleWindowRefresh)
    }
  }, [fetchWeather])

  const refreshWeather = useCallback(() => {
    return fetchWeather(true)
  }, [fetchWeather])

  return { weather, isLoading, refreshWeather }
}
