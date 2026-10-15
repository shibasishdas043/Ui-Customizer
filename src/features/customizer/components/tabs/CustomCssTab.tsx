import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { CustomizerSettings } from '../../types'

interface CustomCssTabProps {
  settings: CustomizerSettings
  onUpdate: (updater: Partial<CustomizerSettings>) => void
}

export const CustomCssTab: React.FC<CustomCssTabProps> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-slate-400">
          CSS rules apply directly to startpage components without page reload.
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" /> Live Applied
        </span>
      </div>

      <textarea
        value={settings.customCss}
        onChange={(e) => onUpdate({ customCss: e.target.value })}
        placeholder="/* Add custom CSS rules here */&#10;.clock-text {&#10;  letter-spacing: -0.04em;&#10;}"
        spellCheck={false}
        className="w-full h-[460px] p-5 rounded-2xl bg-black/35 hover:bg-black/40 focus:bg-black/50 font-mono text-xs text-slate-100 placeholder:text-slate-600 outline-none leading-relaxed resize-none transition-colors border-0"
      />
    </div>
  )
}
