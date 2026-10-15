import React from 'react'
import { Check, Sun, Moon, Laptop } from 'lucide-react'
import type { CustomizerSettings, AccentColor, FontFamily, ThemeMode } from '../../types'

interface ThemeTabProps {
  settings: CustomizerSettings
  onUpdate: (updater: Partial<CustomizerSettings>) => void
}

const ACCENT_COLORS: { id: AccentColor; name: string; hex: string; isLight?: boolean }[] = [
  { id: 'ocean', name: 'Deep Ocean Blue', hex: '#0081a7' },
  { id: 'cyan', name: 'Turquoise Cyan', hex: '#00afb9' },
  { id: 'cream', name: 'Warm Cream', hex: '#fdfcdc', isLight: true },
  { id: 'peach', name: 'Soft Peach', hex: '#fed9b7', isLight: true },
  { id: 'coral', name: 'Coral Rose', hex: '#f07167' },
]

export const ThemeTab: React.FC<ThemeTabProps> = ({ settings, onUpdate }) => {
  const isDark =
    settings.themeMode === 'system'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      : settings.themeMode === 'dark'

  return (
    <div className="space-y-6">
      {/* 1 & 2. Color Theme and Greeting Name in 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            className="block text-[11px] font-semibold uppercase tracking-wider mb-2.5 transition-colors"
            style={{ color: isDark ? '#94a3b8' : '#495057' }}
          >
            Color Theme
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {([
              { id: 'dark', name: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
              { id: 'light', name: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
              { id: 'system', name: 'System', icon: <Laptop className="w-3.5 h-3.5" /> },
            ] as { id: ThemeMode; name: string; icon: React.ReactNode }[]).map((t) => {
              const isSelected = settings.themeMode === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdate({ themeMode: t.id })}
                  className={`h-11 rounded-2xl flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm border-transparent'
                      : isDark
                      ? 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200 border-white/[0.06]'
                      : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-black/[0.08] shadow-xs'
                  }`}
                >
                  {t.icon}
                  <span>{t.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label
            className="block text-[11px] font-semibold uppercase tracking-wider mb-2.5 transition-colors"
            style={{ color: isDark ? '#94a3b8' : '#495057' }}
          >
            Greeting Name
          </label>
          <input
            type="text"
            value={settings.userName}
            onChange={(e) => onUpdate({ userName: e.target.value })}
            placeholder="e.g. Alex"
            className={`h-11 w-full px-4 rounded-2xl text-sm transition-all outline-none border ${
              isDark
                ? 'bg-black/25 focus:bg-black/35 text-slate-100 placeholder:text-slate-500 border-white/[0.08] focus:border-[var(--accent-color)]'
                : 'bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 border-black/[0.1] focus:border-[var(--accent-color)] shadow-xs'
            }`}
          />
        </div>
      </div>

      {/* 3. Accent Color Palette */}
      <div>
        <label
          className="block text-[11px] font-semibold uppercase tracking-wider mb-2.5 transition-colors"
          style={{ color: isDark ? '#94a3b8' : '#495057' }}
        >
          Accent Color
        </label>
        <div
          className="flex items-center justify-between p-3.5 rounded-2xl border transition-colors"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          {ACCENT_COLORS.map((color) => {
            const isSelected =
              settings.accentColor === color.id ||
              (color.id === 'ocean' && (settings.accentColor as string) === 'indigo') ||
              (color.id === 'cyan' && (settings.accentColor as string) === 'emerald') ||
              (color.id === 'coral' && (settings.accentColor as string) === 'rose') ||
              (color.id === 'peach' && (settings.accentColor as string) === 'amber') ||
              (color.id === 'ocean' && (settings.accentColor as string) === 'violet')

            return (
              <button
                key={color.id}
                onClick={() => onUpdate({ accentColor: color.id })}
                style={{ backgroundColor: color.hex }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'scale-110 shadow-lg shadow-black/60'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={`${color.name} (${color.hex})`}
              >
                {isSelected && (
                  <Check
                    className={`w-4 h-4 stroke-[2.5] ${
                      color.isLight ? 'text-slate-950' : 'text-white'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Typography Selector */}
      <div>
        <label
          className="block text-[11px] font-semibold uppercase tracking-wider mb-2.5 transition-colors"
          style={{ color: isDark ? '#94a3b8' : '#495057' }}
        >
          Typography Style
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'sans', name: 'Inter', subname: 'Clean Sans', fontClass: 'font-sans' },
            { id: 'display', name: 'Display', subname: 'Modern Bold', fontClass: 'font-display' },
            { id: 'mono', name: 'Mono', subname: 'Monospace', fontClass: 'font-mono' },
            { id: 'caveat', name: 'Caveat', subname: 'Handwritten', fontClass: 'font-caveat' },
            { id: 'playwrite', name: 'Playwrite', subname: 'Cursive Script', fontClass: 'font-playwrite' },
            { id: 'stalemate', name: 'Stalemate', subname: 'Calligraphy', fontClass: 'font-stalemate' },
          ].map((f) => {
            const isSelected = settings.fontFamily === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onUpdate({ fontFamily: f.id as FontFamily })}
                className={`h-[74px] rounded-2xl flex flex-col items-center justify-center p-2.5 transition-all cursor-pointer text-center border ${
                  isSelected
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-md scale-[1.02] border-transparent'
                    : isDark
                    ? 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white border-white/[0.06]'
                    : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-black/[0.08] shadow-xs'
                }`}
              >
                <div
                  className={`leading-tight ${
                    f.id === 'caveat'
                      ? 'text-[20px] font-bold font-caveat -mt-1 mb-0.5'
                      : f.id === 'stalemate'
                      ? 'text-[24px] font-normal font-stalemate -mt-1.5 mb-0.5'
                      : f.id === 'playwrite'
                      ? 'text-[13px] font-medium font-playwrite'
                      : f.id === 'mono'
                      ? 'text-[14px] font-semibold font-mono'
                      : 'text-[15px] font-bold ' + f.fontClass
                  } ${
                    isSelected
                      ? 'text-[var(--accent-contrast,#ffffff)] font-bold'
                      : isDark
                      ? 'text-white'
                      : 'text-slate-900'
                  }`}
                >
                  {f.name}
                </div>
                <div
                  className={`text-[10px] mt-0.5 tracking-tight ${
                    isSelected
                      ? 'opacity-85 font-medium'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {f.subname}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
