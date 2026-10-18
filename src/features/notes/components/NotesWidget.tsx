import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, X, Minimize2, Maximize2 } from 'lucide-react'
import type { NotesConfig } from '../types'

interface NotesWidgetProps {
  config: NotesConfig
  onUpdateContent: (content: string) => void
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({ config, onUpdateContent }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!config.showNotes) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className={`glass-panel rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isExpanded ? 'w-96 sm:w-[480px] h-96' : 'w-80 h-72'
            }`}
          >
            {/* Notes Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03]">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Scratchpad</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notes Textarea */}
            <textarea
              value={config.content}
              onChange={(e) => onUpdateContent(e.target.value)}
              placeholder="Jot down quick thoughts, todos, or reminders..."
              className="flex-1 w-full p-4 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-400/60 focus:outline-none resize-none leading-relaxed font-sans"
            />
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="p-3.5 rounded-2xl bg-black/35 hover:bg-black/50 backdrop-blur-md text-amber-300 hover:text-amber-200 shadow-xl flex items-center justify-center cursor-pointer group"
            title="Open Notes"
          >
            <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
