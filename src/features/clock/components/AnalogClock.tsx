import React from 'react'
import { motion } from 'framer-motion'

interface AnalogClockProps {
  time: Date
  showSeconds: boolean
}

export const AnalogClock: React.FC<AnalogClockProps> = ({ time, showSeconds }) => {
  const seconds = time.getSeconds()
  const minutes = time.getMinutes()
  const hours = time.getHours() % 12

  // Angles in degrees
  const secondDeg = seconds * 6
  const minuteDeg = minutes * 6 + seconds * 0.1
  const hourDeg = hours * 30 + minutes * 0.5

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center justify-center mb-8 sm:mb-10 select-none"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-48 h-48 sm:w-56 sm:h-56 overflow-visible"
        style={{
          filter: 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.55))',
        }}
      >
        {/* Subtle Minimalist Dial Face */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="rgba(0, 0, 0, 0.18)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />

        {/* 12 Minimal Hour Tick Marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const isQuarter = i % 3 === 0
          return (
            <line
              key={i}
              x1="100"
              y1="16"
              x2="100"
              y2={isQuarter ? '27' : '23'}
              stroke="white"
              strokeWidth={isQuarter ? 2.4 : 1.4}
              strokeOpacity={isQuarter ? 0.95 : 0.6}
              strokeLinecap="round"
              transform={`rotate(${i * 30}, 100, 100)`}
            />
          )
        })}

        {/* Hour Hand (Precision Watchmaker Proportions) */}
        <line
          x1="100"
          y1="102"
          x2="100"
          y2="54"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          transform={`rotate(${hourDeg}, 100, 100)`}
        />

        {/* Minute Hand (Slender & Elegant) */}
        <line
          x1="100"
          y1="102"
          x2="100"
          y2="28"
          stroke="rgba(255, 255, 255, 0.95)"
          strokeWidth="1.8"
          strokeLinecap="round"
          transform={`rotate(${minuteDeg}, 100, 100)`}
        />

        {/* Second Needle (Ultra-Fine Accent Needle) */}
        {showSeconds && (
          <g transform={`rotate(${secondDeg}, 100, 100)`}>
            <line
              x1="100"
              y1="108"
              x2="100"
              y2="20"
              stroke="var(--accent-color, #0081a7)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Precision Center Pin */}
            <circle cx="100" cy="100" r="3.2" fill="var(--accent-color, #0081a7)" />
            <circle cx="100" cy="100" r="1.2" fill="white" />
          </g>
        )}

        {/* Center Pin if seconds are disabled */}
        {!showSeconds && (
          <circle cx="100" cy="100" r="2.8" fill="white" />
        )}
      </svg>
    </motion.div>
  )
}

