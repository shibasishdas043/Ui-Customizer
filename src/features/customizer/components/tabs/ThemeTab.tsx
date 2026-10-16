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
            className="block text-[11px] font-bold uppercase tracking-[1.5px] mb-2.5 transition-colors"
            style={{ color: isDark ? '#cfc4b2' : '#141413' }}
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
                  className={`h-11 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer border-0 outline-none ${
                    isSelected
                      ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                      : isDark
                      ? 'bg-[#22201d] text-[#ece6dc] hover:bg-[#292622] hover:text-[#faf9f5]'
                      : 'bg-white text-[#141413] hover:bg-[#f5f0e8] hover:text-[#000000] shadow-xs'
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
            className="block text-[11px] font-bold uppercase tracking-[1.5px] mb-2.5 transition-colors"
            style={{ color: isDark ? '#cfc4b2' : '#141413' }}
          >
            Greeting Name
          </label>
          <input
            type="text"
            value={settings.userName}
            onChange={(e) => onUpdate({ userName: e.target.value })}
            placeholder="e.g. Alex"
            className={`h-11 w-full px-4 rounded-2xl text-sm font-medium transition-all outline-none border-0 shadow-xs ${
              isDark
                ? 'bg-[#141311] focus:bg-[#1c1a17] text-[#faf9f5] placeholder:text-[#8e8b82]'
                : 'bg-[#ffffff] focus:bg-[#ffffff] text-[#141413] placeholder:text-[#524f49]'
            }`}
          />
        </div>
      </div>

      {/* 3. Accent Color Palette */}
      <div>
        <label
          className="block text-[11px] font-bold uppercase tracking-[1.5px] mb-2.5 transition-colors"
          style={{ color: isDark ? '#cfc4b2' : '#141413' }}
        >
          Accent Color
        </label>
        <div
          className="flex items-center justify-between p-3.5 rounded-2xl transition-colors border-0 outline-none shadow-xs"
          style={{
            backgroundColor: isDark ? '#22201d' : '#ffffff',
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
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border-0 outline-none ${
                  isSelected
                    ? 'scale-110 ring-2 ring-black/30 dark:ring-white/40'
                    : 'opacity-85 hover:opacity-100 hover:scale-105'
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
          className="block text-[11px] font-bold uppercase tracking-[1.5px] mb-2.5 transition-colors"
          style={{ color: isDark ? '#cfc4b2' : '#141413' }}
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
                className={`h-[74px] rounded-2xl flex flex-col items-center justify-center p-2.5 transition-all cursor-pointer text-center border-0 outline-none ${
                  isSelected
                    ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold scale-[1.02]'
                    : isDark
                    ? 'bg-[#22201d] text-[#ece6dc] hover:bg-[#292622] hover:text-[#faf9f5]'
                    : 'bg-white text-[#141413] hover:bg-[#f5f0e8] hover:text-[#000000] shadow-xs'
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
                      ? 'text-[#faf9f5]'
                      : 'text-[#141413]'
                  }`}
                >
                  {f.name}
                </div>
                <div
                  className={`text-[10px] mt-0.5 tracking-tight ${
                    isSelected
                      ? 'opacity-90 font-medium'
                      : isDark
                      ? 'text-[#b5b1a8] font-medium'
                      : 'text-[#383531] font-semibold'
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
