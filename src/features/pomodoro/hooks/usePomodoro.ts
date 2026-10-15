import { useState, useEffect, useRef, useCallback } from 'react'
import type { PomodoroConfig, PomodoroMode } from '../types'

// Web Audio chime generator (works offline without external asset dependencies)
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15) // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
  } catch (e) {
    console.warn('Audio chime unavailable', e)
  }
}

export function usePomodoro(config: PomodoroConfig) {
  const [mode, setMode] = useState<PomodoroMode>('work')
  const [timeLeft, setTimeLeft] = useState(config.workDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const switchMode = useCallback(
    (newMode: PomodoroMode) => {
      setIsRunning(false)
      setMode(newMode)
      if (newMode === 'work') {
        setTimeLeft(config.workDuration * 60)
      } else if (newMode === 'break') {
        setTimeLeft(config.breakDuration * 60)
      } else {
        setTimeLeft(15 * 60)
      }
    },
    [config.workDuration, config.breakDuration],
  )

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (config.soundEnabled) {
              playChime()
            }
            setIsRunning(false)
            if (mode === 'work') {
              switchMode('break')
            } else {
              switchMode('work')
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, mode, config.soundEnabled, switchMode])

  const togglePlay = () => setIsRunning(!isRunning)
  const resetTimer = () => {
    setIsRunning(false)
    switchMode(mode)
  }

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (timeLeft % 60).toString().padStart(2, '0')

  return {
    mode,
    isRunning,
    timeLeft,
    minutes,
    seconds,
    togglePlay,
    resetTimer,
    switchMode,
  }
}
