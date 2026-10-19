import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, X } from 'lucide-react'

interface UpdateAvailableToastProps {
  availableVersion?: string
  onApplyUpdate: () => void
}

export const UpdateAvailableToast: React.FC<UpdateAvailableToastProps> = ({
  availableVersion,
  onApplyUpdate,
}) => {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl p-4 shadow-2xl border border-white/15 bg-neutral-900/90 dark:bg-black/90 backdrop-blur-2xl text-white select-none"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-color,#3b82f6)]/20 text-[var(--accent-color,#3b82f6)] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">Update Ready</span>
              {availableVersion && (
                <span className="px-1.5 py-0.2 rounded-md bg-[var(--accent-color,#3b82f6)]/25 text-[var(--accent-color,#3b82f6)] text-[10px] font-mono font-bold">
                  v{availableVersion}
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">
              A new version of Aura was released and downloaded by Chrome. Restart the extension to apply the update.
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={onApplyUpdate}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent-color,#3b82f6)] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart & Update</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium transition-all cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-6 h-6 rounded-lg text-white/40 hover:text-white/90 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
