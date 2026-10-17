import { useState, useEffect } from 'react'

/**
 * Hook to reactively determine if the UI is currently in dark mode.
 * Synchronizes with document.documentElement's .dark class and data-theme attribute.
 */
export function useThemeIsDark(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true
    return (
      document.documentElement.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark'
    )
  })

  useEffect(() => {
    if (typeof document === 'undefined') return

    const updateDark = () => {
      const isCurrentlyDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark'
      setIsDark(isCurrentlyDark)
    }

    updateDark()

    const observer = new MutationObserver(updateDark)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      // Small timeout to allow App.tsx listener to update html classes first
      setTimeout(updateDark, 10)
    }
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

  return isDark
}
