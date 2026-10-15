import { useEffect, useState } from 'react'
import type { BrowserBehaviorConfig } from '../types'

export function useBrowserBehavior(config: BrowserBehaviorConfig) {
  const { newTabMode, newTabRedirectUrl, redirectCountdown = 0, startupMode, startupUrl } = config
  const [isCancelled, setIsCancelled] = useState(false)
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(redirectCountdown)

  // 1. Check for browser startup session override on session initialization
  useEffect(() => {
    const isFirstTabInSession = !sessionStorage.getItem('aura_session_active')
    sessionStorage.setItem('aura_session_active', 'true')

    if (isFirstTabInSession && startupMode === 'custom_url' && startupUrl.trim()) {
      let target = startupUrl.trim()
      if (!/^https?:\/\//i.test(target)) target = `https://${target}`
      window.location.replace(target)
    }
  }, [startupMode, startupUrl])

  // 2. Check for New Tab redirect
  useEffect(() => {
    if (newTabMode !== 'redirect' || !newTabRedirectUrl.trim() || isCancelled) {
      return
    }

    let target = newTabRedirectUrl.trim()
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`

    if (redirectCountdown <= 0) {
      window.location.replace(target)
      return
    }

    const initTimer = setTimeout(() => {
      setRedirectingTo(target)
      setCountdown(redirectCountdown)
    }, 0)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.replace(target)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearTimeout(initTimer)
      clearInterval(timer)
    }
  }, [newTabMode, newTabRedirectUrl, redirectCountdown, isCancelled])

  const cancelRedirect = () => {
    setIsCancelled(true)
    setRedirectingTo(null)
  }

  return {
    redirectingTo,
    countdown,
    cancelRedirect,
    isCancelled,
  }
}
