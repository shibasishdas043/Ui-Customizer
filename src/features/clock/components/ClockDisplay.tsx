import React from 'react'
import type { FormattedTime } from '../types'

interface ClockDisplayProps {
  time: FormattedTime
  showSeconds: boolean
  use24Hour: boolean
  isCompact?: boolean
}

export const ClockDisplay: React.FC<ClockDisplayProps> = ({
  time,
  showSeconds,
  use24Hour,
  isCompact = false,
}) => {
  return (
    <div className="inline-flex items-baseline tracking-tight select-none leading-none">
      {/* Primary Digits Container (Hours, Minutes, and Optional Seconds) */}
      <span
        style={{
          fontSize: isCompact
            ? 'var(--clock-size-compact, 2.25rem)'
            : 'var(--clock-size-hero, 6.5rem)',
          fontWeight: 'var(--clock-font-weight, 600)',
          letterSpacing: 'var(--clock-letter-spacing, -0.02em)',
          lineHeight: 1,
        }}
        className="text-white text-contrast-strong tabular-nums inline-flex items-center"
      >
        <span>{time.hours}</span>
        <span
          style={{ top: 'var(--clock-colon-offset, -0.04em)' }}
          className="inline-block relative mx-[0.05em] text-white/75 font-normal select-none"
        >
          :
        </span>
        <span>{time.minutes}</span>

        {showSeconds && (
          <>
            <span
              style={{ top: 'var(--clock-colon-offset, -0.04em)' }}
              className="inline-block relative mx-[0.05em] text-white/75 font-normal select-none"
            >
              :
            </span>
            <span>{time.seconds}</span>
          </>
        )}
      </span>

      {/* AM / PM Indicator */}
      {!use24Hour && time.period && (
        <span
          style={{
            fontSize: isCompact
              ? 'var(--clock-period-size, 0.825rem)'
              : 'calc(var(--clock-size-hero, 6.5rem) * 0.18)',
            marginBottom: 'var(--clock-period-offset, 0.08em)',
            letterSpacing: '0.12em',
          }}
          className="ml-2 sm:ml-2.5 font-semibold uppercase text-white/70 text-contrast-strong select-none self-end"
        >
          {time.period}
        </span>
      )}
    </div>
  )
}
