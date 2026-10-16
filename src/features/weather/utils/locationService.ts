import type { ResolvedLocation, CitySearchResult, GeolocationMode } from '../types'

const LOCATION_CACHE_KEY = 'aura_location_cache_v2'
const LOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CachedLocationEnvelope {
  location: ResolvedLocation
  timestamp: number
}

/**
 * Free Reverse Geocoding API via BigDataCloud.
 * 100% Free, Unlimited Client-Side Queries, Zero API Key.
 * Resolves (lat, lon) into human-readable city, state, and country.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<{ city: string; state?: string; country?: string } | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    const res = await fetch(url, { signal: signal || AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const data = await res.json()

    const city =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      data.countryName

    if (city && typeof city === 'string' && city.trim().length > 0) {
      return {
        city: city.trim(),
        state: data.principalSubdivision || undefined,
        country: data.countryName || undefined,
      }
    }
  } catch {
    // Graceful fallback
  }

  return null
}

/**
 * Resolves approximate user location via a high-resilience cascade of free IP Geolocation endpoints.
 * Requires zero browser permission popups and zero API keys.
 */
export async function getApproximateLocation(
  forceRefresh = false
): Promise<ResolvedLocation> {
  // 1. Check local cache if not forcing refresh
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(LOCATION_CACHE_KEY)
      if (raw) {
        const envelope = JSON.parse(raw) as CachedLocationEnvelope
        if (
          envelope &&
          envelope.location &&
          Date.now() - envelope.timestamp < LOCATION_CACHE_TTL_MS
        ) {
          return { ...envelope.location, source: 'cache' }
        }
      }
    } catch {
      // LocalStorage error fallback
    }
  }

  // 2. Cascade of top free, CORS-friendly, zero-key IP geolocation providers
  const providers: Array<() => Promise<{ city?: string; lat: number; lon: number; country?: string; state?: string }>> = [
    // Provider 1: ipwho.is (Fast, clean metadata, 10k/month free)
    async () => {
      const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) })
      if (!res.ok) throw new Error('ipwhois failed')
      const data = await res.json()
      if (data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          city: data.city || undefined,
          state: data.region || undefined,
          country: data.country || undefined,
          lat: data.latitude,
          lon: data.longitude,
        }
      }
      throw new Error('invalid ipwhois payload')
    },

    // Provider 2: freeipapi.com (Reliable, 60 req/min free)
    async () => {
      const res = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(3500) })
      if (!res.ok) throw new Error('freeipapi failed')
      const data = await res.json()
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          city: data.cityName || undefined,
          state: data.regionName || undefined,
          country: data.countryName || undefined,
          lat: data.latitude,
          lon: data.longitude,
        }
      }
      throw new Error('invalid freeipapi payload')
    },

    // Provider 3: get.geojs.io (Uncapped, Cloudflare CDN backed)
    async () => {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: AbortSignal.timeout(3500) })
      if (!res.ok) throw new Error('geojs failed')
      const data = await res.json()
      const lat = parseFloat(data.latitude)
      const lon = parseFloat(data.longitude)
      if (!isNaN(lat) && !isNaN(lon)) {
        return {
          city: data.city || undefined,
          state: data.region || undefined,
          country: data.country || undefined,
          lat,
          lon,
        }
      }
      throw new Error('invalid geojs payload')
    },

    // Provider 4: ipapi.co (Well-known fallback)
    async () => {
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3500) })
      if (!res.ok) throw new Error('ipapi failed')
      const data = await res.json()
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          city: data.city || undefined,
          state: data.region || undefined,
          country: data.country_name || undefined,
          lat: data.latitude,
          lon: data.longitude,
        }
      }
      throw new Error('invalid ipapi payload')
    },
  ]

  for (const fetchProvider of providers) {
    try {
      const rawLoc = await fetchProvider()
      if (rawLoc && typeof rawLoc.lat === 'number' && typeof rawLoc.lon === 'number') {
        // Enhance city name accuracy via BigDataCloud reverse geocoding if city is missing or generic
        let finalCity = rawLoc.city
        let finalState = rawLoc.state
        let finalCountry = rawLoc.country

        if (!finalCity || finalCity.toLowerCase() === 'current location') {
          const rev = await reverseGeocode(rawLoc.lat, rawLoc.lon)
          if (rev?.city) {
            finalCity = rev.city
            finalState = rev.state || finalState
            finalCountry = rev.country || finalCountry
          }
        }

        const resolved: ResolvedLocation = {
          city: finalCity || finalCountry || 'Current Location',
          lat: rawLoc.lat,
          lon: rawLoc.lon,
          state: finalState,
          country: finalCountry,
          source: 'ip',
        }

        saveLocationToCache(resolved)
        return resolved
      }
    } catch {
      // Continue to next provider in cascade
    }
  }

  // Fallback to expired cache if available
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY)
    if (raw) {
      const envelope = JSON.parse(raw) as CachedLocationEnvelope
      if (envelope?.location) {
        return { ...envelope.location, source: 'cache' }
      }
    }
  } catch {
    // Ignore cache retrieval errors
  }

  // Universal Default Fallback: London, UK
  return {
    city: 'London',
    lat: 51.5074,
    lon: -0.1278,
    country: 'United Kingdom',
    source: 'ip',
  }
}

/**
 * High-accuracy GPS geolocation via browser navigator API.
 * Uses BigDataCloud reverse geocoding to resolve the real city name.
 */
export async function getPreciseLocation(): Promise<ResolvedLocation> {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 6000,
          maximumAge: 10 * 60 * 1000,
          enableHighAccuracy: true,
        })
      })

      const lat = pos.coords.latitude
      const lon = pos.coords.longitude

      // Resolve human-readable city name instead of showing "Current Location"
      const rev = await reverseGeocode(lat, lon)

      const resolved: ResolvedLocation = {
        city: rev?.city || 'Current Location',
        lat,
        lon,
        state: rev?.state,
        country: rev?.country,
        source: 'gps',
      }

      saveLocationToCache(resolved)
      return resolved
    } catch {
      // User denied permission or GPS timed out -> Fall back to approximate IP
    }
  }

  return getApproximateLocation()
}

/**
 * Searches cities globally for manual search with live autocomplete.
 * Powered by Open-Meteo Geocoding API (100% Free, Open Source, Zero API Key).
 */
export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<CitySearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return []

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=8&language=en&format=json`
    const res = await fetch(url, { signal: signal || AbortSignal.timeout(4000) })
    if (!res.ok) return []
    const data = await res.json()

    if (Array.isArray(data.results)) {
      return data.results.map((item: Record<string, unknown>) => ({
        id: Number(item.id),
        name: String(item.name || ''),
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        country: item.country ? String(item.country) : undefined,
        countryCode: item.country_code ? String(item.country_code) : undefined,
        admin1: item.admin1 ? String(item.admin1) : undefined,
        admin2: item.admin2 ? String(item.admin2) : undefined,
      }))
    }
  } catch {
    // Return empty on abort or network error
  }

  return []
}

/**
 * Geocodes a specific city name for manual location mode.
 */
export async function geocodeCity(
  cityQuery: string,
  signal?: AbortSignal
): Promise<ResolvedLocation | null> {
  const results = await searchCities(cityQuery, signal)
  if (results.length > 0) {
    const top = results[0]
    return {
      city: top.name,
      lat: top.latitude,
      lon: top.longitude,
      state: top.admin1,
      country: top.country,
      source: 'manual',
    }
  }
  return null
}

/**
 * Unified resolver based on configured geolocation mode.
 */
export async function resolveLocation(
  mode: GeolocationMode,
  manualCity?: string,
  forceRefresh = false
): Promise<ResolvedLocation> {
  if (mode === 'off' && manualCity && manualCity.trim()) {
    // Check if an exact manual location envelope already exists in cache
    if (!forceRefresh) {
      try {
        const raw = localStorage.getItem(LOCATION_CACHE_KEY)
        if (raw) {
          const envelope = JSON.parse(raw) as CachedLocationEnvelope
          if (
            envelope &&
            envelope.location &&
            envelope.location.source === 'manual' &&
            envelope.location.city.toLowerCase() === manualCity.trim().toLowerCase()
          ) {
            return envelope.location
          }
        }
      } catch {
        // Cache read fallback
      }
    }

    const manual = await geocodeCity(manualCity.trim())
    if (manual) return manual
  }

  if (mode === 'precise') {
    return getPreciseLocation()
  }

  return getApproximateLocation(forceRefresh)
}

/**
 * Clears the cached location to force instant re-detection.
 */
export function clearLocationCache(): void {
  try {
    localStorage.removeItem(LOCATION_CACHE_KEY)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Explicitly caches a user-selected manual location.
 */
export function saveManualLocation(location: ResolvedLocation): void {
  saveLocationToCache(location)
}

function saveLocationToCache(location: ResolvedLocation): void {
  try {
    const envelope: CachedLocationEnvelope = {
      location,
      timestamp: Date.now(),
    }
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(envelope))
  } catch {
    // Storage quota or privacy restriction
  }
}
