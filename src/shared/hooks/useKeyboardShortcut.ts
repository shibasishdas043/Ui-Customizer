import { useEffect } from 'react'

export function useKeyboardShortcut(key: string, callback: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase()) {
        callback(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback])
}
