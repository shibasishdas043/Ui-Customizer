import React from 'react'
import { motion } from 'framer-motion'
import { useCurrentTime } from '../hooks/useCurrentTime'
import { formatTime, getGreetingType } from '../utils/timeFormatters'
import { GreetingDisplay } from './GreetingDisplay'

import type { ClockFontFamily } from '../types'

interface GreetingProps {
  userName: string
  showGreeting: boolean
  showDate: boolean
  use24Hour: boolean
  fontFamily?: ClockFontFamily
  align?: 'center' | 'left'
}

export const Greeting: React.FC<GreetingProps> = ({
  userName,
  showGreeting,
  showDate,
  use24Hour,
  fontFamily = 'sans',
  align = 'center',
}) => {
  const currentTime = useCurrentTime()
  const formattedTime = formatTime(currentTime, use24Hour)
  const greetingInfo = getGreetingType(currentTime)

  if (!showGreeting && !showDate) return null

  const fontClass =
    fontFamily === 'mono'
      ? 'font-mono'
      : fontFamily === 'display'
      ? 'font-display'
      : fontFamily === 'caveat'
      ? 'font-caveat'
      : fontFamily === 'playwrite'
      ? 'font-playwrite'
      : fontFamily === 'stalemate'
      ? 'font-stalemate'
      : 'font-sans'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center text-center ${fontClass} drop-shadow-2xl select-none`}
    >
      <GreetingDisplay
        greetingType={greetingInfo.type}
        greetingText={greetingInfo.text}
        userName={userName}
        dateString={formattedTime.dateString}
        showGreeting={showGreeting}
        showDate={showDate}
        align={align}
      />
    </motion.div>
  )
}
