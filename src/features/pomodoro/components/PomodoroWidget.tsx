import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Timer, X, Coffee, Brain } from 'lucide-react'
import type { PomodoroConfig } from '../types'
import { usePomodoro } from '../hooks/usePomodoro'

interface PomodoroWidgetProps {
  config: PomodoroConfig
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { mode, isRunning, minutes, seconds, togglePlay, resetTimer, switchMode } =
    usePomodoro(config)

  if (!config.showPomodoro) return null

  return (
    <div className="fixed bottom-6 left-6 z-40 select-none">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="w-72 glass-panel rounded-2xl p-5 shadow-2xl flex flex-col items-center"
          >
            {/* Header with Close */}
            <div className="w-full flex items-center justify-between pb-2 mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Timer className="w-4 h-4 text-rose-400" />
                <span>Focus Timer</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 mb-4">
              <button
                type="button"
                onClick={() => switchMode('work')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  mode === 'work'
                    ? 'bg-rose-500/20 text-rose-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Brain className="w-3 h-3" />
                Focus
              </button>
              <button
                type="button"
                onClick={() => switchMode('break')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  mode === 'break'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coffee className="w-3 h-3" />
                Break
              </button>
            </div>

            {/* Countdown Digits */}
            <div className="text-4xl font-mono font-semibold text-white tracking-tight my-2 drop-shadow">
              {minutes}:{seconds}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={togglePlay}
                className={`p-3 rounded-xl flex items-center justify-center text-white shadow-lg transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={resetTimer}
                className="p-3 rounded-xl glass-card text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="p-3.5 rounded-2xl bg-black/35 hover:bg-black/50 backdrop-blur-md text-rose-400 hover:text-rose-300 shadow-xl flex items-center justify-center cursor-pointer group"
            title="Open Focus Timer"
          >
            <Timer className="w-5 h-5 transition-transform group-hover:scale-110" />
            {isRunning && (
              <span className="ml-2 font-mono text-xs font-semibold text-slate-100">
                {minutes}:{seconds}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
