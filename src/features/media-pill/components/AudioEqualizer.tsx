import React from 'react'
import { motion } from 'framer-motion'

interface AudioEqualizerProps {
  isPlaying: boolean
  isMuted: boolean
  className?: string
  barCount?: number
}

export const AudioEqualizer: React.FC<AudioEqualizerProps> = ({
  isPlaying,
  isMuted,
  className = '',
  barCount = 3,
}) => {
  const active = isPlaying && !isMuted

  // Staggered keyframe sequences for organic audio visualization
  const sequences = [
    [0.3, 0.95, 0.45, 0.85, 0.3],
    [0.75, 0.35, 1.0, 0.5, 0.75],
    [0.4, 0.9, 0.3, 0.95, 0.4],
    [0.65, 0.4, 0.8, 0.35, 0.65],
  ]

  const bars = Array.from({ length: barCount })

  return (
    <div
      className={`flex items-end justify-center gap-0.5 h-3.5 w-4 select-none pointer-events-none ${className}`}
      aria-label={active ? 'Playing audio' : 'Audio paused'}
    >
      {bars.map((_, i) => {
        const seq = sequences[i % sequences.length]
        const duration = 0.85 + (i * 0.15)

        return (
          <motion.span
            key={i}
            animate={
              active
                ? {
                    scaleY: seq,
                    opacity: [0.75, 1, 0.8, 1, 0.75],
                  }
                : {
                    scaleY: 0.25,
                    opacity: 0.4,
                  }
            }
            transition={
              active
                ? {
                    duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : {
                    duration: 0.25,
                  }
            }
            style={{ originY: 1 }}
            className="w-0.5 h-full rounded-full bg-[var(--accent-color)] shadow-[0_0_8px_var(--accent-color)]"
          />
        )
      })}
    </div>
  )
}
