import React from 'react'
import { motion } from 'framer-motion'
import type { ClockConfig } from '../types'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { formatTime, getGreetingType } from '../utils/timeFormatters'
import { ClockDisplay } from './ClockDisplay'
import { GreetingDisplay } from './GreetingDisplay'
import { AnalogClock } from './AnalogClock'

interface ClockProps {
  config: ClockConfig
  layout?: 'center' | 'top-left'
  weatherSlot?: React.ReactNode
}

export const Clock: React.FC<ClockProps> = ({ config, layout = 'center', weatherSlot }) => {
  const currentTime = useCurrentTime()
  const isTopLeft = layout === 'top-left'

  // If used in top-left navigation (digital mode), only render if showClock is enabled
  if (isTopLeft) {
    if (!config.showClock) return null
  } else {
    // In center layout, render if clock OR greeting OR date OR weatherSlot is active
    const hasAnyContent = config.showClock || config.showGreeting || config.showDate || !!weatherSlot
    if (!hasAnyContent) return null
  }

  const formattedTime = formatTime(currentTime, config.use24Hour)
  const greetingInfo = getGreetingType(currentTime)

  const fontClass =
    config.fontFamily === 'mono'
      ? 'font-mono'
      : config.fontFamily === 'display'
      ? 'font-display'
      : config.fontFamily === 'caveat'
      ? 'font-caveat'
      : config.fontFamily === 'playwrite'
      ? 'font-playwrite'
      : config.fontFamily === 'stalemate'
      ? 'font-stalemate'
      : 'font-sans'

  return (
    <motion.div
      initial={{ opacity: 0, y: isTopLeft ? -10 : 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col ${
        isTopLeft ? 'items-start text-left justify-center leading-none' : 'items-center justify-center text-center'
      } ${fontClass} drop-shadow-2xl select-none`}
    >
      {/* Clock Face / Digits (only when showClock is active) */}
      {config.showClock && (
        config.analog ? (
          <AnalogClock time={currentTime} showSeconds={config.showSeconds} />
        ) : (
          <ClockDisplay
            time={formattedTime}
            showSeconds={config.showSeconds}
            use24Hour={config.use24Hour}
            isCompact={isTopLeft}
          />
        )
      )}

      {/* Greeting Display (Greeting, Date, and Merged Weather Line) */}
      {!isTopLeft && (
        <GreetingDisplay
          greetingType={greetingInfo.type}
          greetingText={greetingInfo.text}
          userName={config.userName}
          dateString={formattedTime.dateString}
          showGreeting={config.showGreeting}
          showDate={config.showDate}
          align="center"
          weatherSlot={weatherSlot}
        />
      )}
    </motion.div>
  )
}
