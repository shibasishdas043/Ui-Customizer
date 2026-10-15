import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets } from 'lucide-react'
import type { WeatherConfig } from '../types'
import { useWeather } from '../hooks/useWeather'

interface WeatherWidgetProps {
  config: WeatherConfig
  inline?: boolean
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ config, inline = false }) => {
  const { weather } = useWeather(config)

  if (!config.showWeather || !weather) return null

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

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
    if (code <= 3) return <Cloud className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
    if (code >= 51 && code <= 67) return <CloudRain className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
    if (code >= 71 && code <= 77) return <CloudSnow className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
    if (code >= 95) return <CloudLightning className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
    return <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
  }

  const unitSymbol = config.tempUnit === 'fahrenheit' ? '°F' : '°C'

  const content = (
    <div
      style={{ gap: 'var(--weather-gap, 0.625rem)' }}
      className={`flex items-center select-none weather-contrast leading-none ${fontClass}`}
    >
      {/* Temperature & Condition Icon */}
      <div className="flex items-center gap-1.5 leading-none">
        <span
          style={{ transform: 'scale(var(--weather-icon-scale, 1))' }}
          className="shrink-0 flex items-center justify-center transition-transform hover:scale-105 duration-200"
        >
          {getWeatherIcon(weather.weatherCode)}
        </span>
        <span
          style={{ fontSize: 'var(--weather-text-temp, 1.05rem)' }}
          className="font-semibold text-white tracking-tight leading-none"
        >
          {weather.temperature}
          <span className="text-[var(--accent-color,#ee9b00)] ml-0.5">{unitSymbol}</span>
        </span>
      </div>

      <span className="w-1 h-1 rounded-full bg-white/40 shrink-0 select-none self-center" aria-hidden="true" />

      {/* City Location */}
      <span
        style={{ fontSize: 'var(--weather-text-city, 0.875rem)' }}
        className="font-medium text-white/95 tracking-tight leading-none"
      >
        {weather.city}
      </span>

      <span className="w-1 h-1 rounded-full bg-white/40 shrink-0 select-none self-center" aria-hidden="true" />

      {/* Extra Atmospheric Details: Humidity & Wind */}
      <div
        style={{
          fontSize: 'var(--weather-text-details, 0.8125rem)',
          gap: 'var(--weather-gap, 0.625rem)',
        }}
        className="flex items-center text-white/85 font-medium leading-none"
      >
        <span className="flex items-center gap-1 hover:text-cyan-300 transition-colors leading-none">
          <Droplets className="w-3.5 h-3.5 text-cyan-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] shrink-0" />
          <span>{weather.humidity}%</span>
        </span>
        <span className="flex items-center gap-1 hover:text-white transition-colors leading-none">
          <Wind className="w-3.5 h-3.5 text-slate-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] shrink-0" />
          <span>{weather.windSpeed} km/h</span>
        </span>
      </div>
    </div>
  )

  if (inline) {
    return content
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {content}
    </motion.div>
  )
}
