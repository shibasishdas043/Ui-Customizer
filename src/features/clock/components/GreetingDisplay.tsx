import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react'
import type { GreetingType } from '../types'

interface GreetingDisplayProps {
  greetingType: GreetingType
  greetingText: string
  userName: string
  dateString: string
  showGreeting: boolean
  showDate: boolean
  align?: 'center' | 'left'
  weatherSlot?: React.ReactNode
}

export const GreetingDisplay: React.FC<GreetingDisplayProps> = ({
  greetingType,
  greetingText,
  userName,
  dateString,
  showGreeting,
  showDate,
  align = 'center',
  weatherSlot,
}) => {
  const getIcon = () => {
    switch (greetingType) {
      case 'morning':
        return <Sunrise className="w-4.5 h-4.5 text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
      case 'afternoon':
        return <Sun className="w-4.5 h-4.5 text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
      case 'evening':
        return <Sunset className="w-4.5 h-4.5 text-orange-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
      case 'night':
        return <Moon className="w-4.5 h-4.5 text-indigo-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
    }
  }

  if (!showGreeting && !showDate && !weatherSlot) return null

  const isLeft = align === 'left'

  return (
    <div
      className={`mt-2.5 flex flex-wrap items-center gap-2 sm:gap-3 weather-contrast ${
        isLeft ? 'justify-start text-left' : 'justify-center text-center'
      }`}
    >
      {/* 1. Greeting */}
      {showGreeting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontSize: isLeft
              ? 'var(--weather-text-city, 0.875rem)'
              : 'calc(var(--weather-text-city, 0.875rem) * 1.15)',
          }}
          className="flex items-center gap-1.5 font-medium text-white"
        >
          {getIcon()}
          <span>
            {greetingText}
            {userName ? (
              <>
                ,{' '}
                <span
                  className="font-semibold text-[var(--accent-color)]"
                  style={{ color: 'var(--accent-color)' }}
                >
                  {userName}
                </span>
              </>
            ) : (
              ''
            )}
          </span>
        </motion.div>
      )}

      {/* Separator between Greeting and Date */}
      {showGreeting && showDate && (
        <span className="w-1 h-1 rounded-full bg-white/40 shrink-0 select-none self-center" aria-hidden="true" />
      )}

      {/* 2. Date */}
      {showDate && (
        <span
          style={{
            fontSize: isLeft
              ? 'var(--weather-text-city, 0.875rem)'
              : 'calc(var(--weather-text-city, 0.875rem) * 1.15)',
          }}
          className="font-normal tracking-wide text-white/90"
        >
          {dateString}
        </span>
      )}

      {/* Separator between (Greeting/Date) and Weather */}
      {(showGreeting || showDate) && weatherSlot && (
        <span className="w-1 h-1 rounded-full bg-white/40 shrink-0 select-none" aria-hidden="true" />
      )}

      {/* 3. Merged Weather Line */}
      {weatherSlot && (
        <div className="flex items-center">
          {weatherSlot}
        </div>
      )}
    </div>
  )
}
