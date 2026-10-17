import { useState, useEffect, useCallback } from 'react'
import type { CustomizerSettings } from '../types'
import { DEFAULT_SETTINGS } from '../config/defaultSettings'

declare const chrome: any

const STORAGE_KEY = 'aura_customizer_settings_v1'

function migrateSettings(raw: CustomizerSettings): CustomizerSettings {
  const next = { ...raw }

  // 1. Heal broken YouTube icon in quick links
  if (Array.isArray(next.quickLinks)) {
    next.quickLinks = next.quickLinks.map((link) => {
      if (
        (link.url.includes('youtube.com') || link.title.toLowerCase() === 'youtube') &&
        (!link.icon || link.icon.includes('f7c8ec1b'))
      ) {
        return {
          ...link,
          icon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128',
        }
      }
      return link
    })
  }

  // 2. Ensure searchEngines exists and is populated with at least the 5 major defaults
  if (!Array.isArray(next.searchEngines) || next.searchEngines.length === 0) {
    next.searchEngines = DEFAULT_SETTINGS.searchEngines
  }

  // 3. Ensure searchEngine ID points to a valid engine in searchEngines
  const engineExists = next.searchEngines.some((e) => e.id === next.searchEngine)
  if (!engineExists) {
    next.searchEngine = next.searchEngines[0]?.id || 'google'
  }

  // 4. Ensure weatherGeolocation is valid (default to 'approximate' if invalid or missing)
  if (!next.weatherGeolocation) {
    next.weatherGeolocation = 'approximate'
  }

  return next
}

export function useSettingsStorage() {
  const [settings, setSettings] = useState<CustomizerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return migrateSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage', e)
    }
    return DEFAULT_SETTINGS
  })

  const [isLoaded, setIsLoaded] = useState(
    () => !(typeof chrome !== 'undefined' && chrome?.storage?.local)
  )

  // Sync with chrome.storage.local if running in extension context
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY], (result: Record<string, any>) => {
        if (result && result[STORAGE_KEY]) {
          setSettings((prev) => migrateSettings({ ...prev, ...result[STORAGE_KEY] }))
        }
        setIsLoaded(true)
      })
    }
  }, [])

  // Persist whenever settings are updated
  const updateSettings = useCallback(
    (updater: Partial<CustomizerSettings> | ((prev: CustomizerSettings) => CustomizerSettings)) => {
      setSettings((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch (e) {
          console.warn('Failed to write settings to localStorage', e)
        }
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
          chrome.storage.local.set({ [STORAGE_KEY]: next })
        }
        return next
      })
    },
    [],
  )

  const resetSettings = useCallback(() => {
    updateSettings(DEFAULT_SETTINGS)
  }, [updateSettings])

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoaded,
  }
}
