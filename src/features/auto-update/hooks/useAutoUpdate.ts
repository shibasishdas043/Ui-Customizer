import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getLastCheckTime,
  setLastCheckTime,
  shouldCheckForUpdate,
  requestChromeUpdateCheck,
  applyUpdate,
} from '../utils/updateChecker'
import { getAppVersion, isExtensionRuntime } from '../../../shared/utils/version'
import type { UpdateInfo } from '../types'

declare const chrome: any

export function useAutoUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>(() => ({
    status: 'idle',
    currentVersion: getAppVersion(),
    lastCheckedTime: getLastCheckTime(),
    isExtension: isExtensionRuntime(),
  }))

  const isCheckingRef = useRef(false)

  // 1. Listen for Chrome's onUpdateAvailable event (fired when Chrome completes downloading an update)
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onUpdateAvailable) return

    const handleUpdateAvailable = (details: { version: string }) => {
      setUpdateInfo((prev) => ({
        ...prev,
        status: 'update_available',
        availableVersion: details.version,
      }))
    }

    try {
      chrome.runtime.onUpdateAvailable.addListener(handleUpdateAvailable)
    } catch {}

    return () => {
      try {
        chrome.runtime.onUpdateAvailable.removeListener(handleUpdateAvailable)
      } catch {}
    }
  }, [])

  // 2. Perform an update check (either triggered manually or by daily scheduler)
  const checkForUpdate = useCallback(async (_force = false) => {
    if (isCheckingRef.current) return
    isCheckingRef.current = true

    setUpdateInfo((prev) => ({ ...prev, status: 'checking', error: undefined }))

    const result = await requestChromeUpdateCheck()
    const now = Date.now()
    setLastCheckTime(now)

    if (result.status === 'update_available') {
      setUpdateInfo((prev) => ({
        ...prev,
        status: 'update_available',
        availableVersion: result.version,
        lastCheckedTime: now,
      }))
    } else if (result.status === 'throttled') {
      setUpdateInfo((prev) => ({
        ...prev,
        status: 'throttled',
        lastCheckedTime: now,
      }))
    } else if (result.status === 'error') {
      setUpdateInfo((prev) => ({
        ...prev,
        status: 'error',
        error: result.error,
        lastCheckedTime: now,
      }))
    } else {
      setUpdateInfo((prev) => ({
        ...prev,
        status: 'up_to_date',
        lastCheckedTime: now,
      }))
    }

    isCheckingRef.current = false
  }, [])

  // 3. Once-in-a-day automatic check on initial tab mount
  useEffect(() => {
    if (shouldCheckForUpdate(false)) {
      // Delay slightly (3s) after tab mount so initial startpage render is completely prioritized
      const timer = setTimeout(() => {
        checkForUpdate(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [checkForUpdate])

  return {
    updateInfo,
    checkForUpdate: () => checkForUpdate(true),
    applyUpdate,
  }
}
