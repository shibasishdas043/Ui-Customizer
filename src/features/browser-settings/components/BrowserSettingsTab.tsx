import React from 'react'
import { Globe, ArrowRight, ExternalLink, ShieldCheck, Home } from 'lucide-react'
import type { BrowserBehaviorConfig } from '../types'

interface BrowserSettingsTabProps {
  config: BrowserBehaviorConfig
  onUpdate: (updater: Partial<BrowserBehaviorConfig>) => void
}

export const BrowserSettingsTab: React.FC<BrowserSettingsTabProps> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] shadow-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[var(--accent-color)] mt-0.5 shrink-0" />
        <div className="text-xs text-[#383531] dark:text-[#cfc4b2] leading-relaxed font-medium">
          <strong className="text-[#141413] dark:text-[#faf9f5] block mb-0.5 font-bold">Browser Control Center</strong>
          Configure what webpage opens when you launch your browser, click the home button, or open a new tab.
        </div>
      </div>

      {/* 1. New Tab Behavior */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          New Tab Action
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onUpdate({ newTabMode: 'aura' })}
            className={`p-3.5 rounded-2xl text-xs font-semibold text-left transition-all cursor-pointer border-0 outline-none ${
              config.newTabMode === 'aura'
                ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:text-[#faf9f5] shadow-xs'
            }`}
          >
            Aura Startpage
            <span className={`block text-[10px] font-medium mt-1 ${config.newTabMode === 'aura' ? 'opacity-90' : 'text-[#383531] dark:text-[#cfc4b2]'}`}>
              Displays your custom widgets and wallpapers.
            </span>
          </button>

          <button
            type="button"
            onClick={() => onUpdate({ newTabMode: 'redirect' })}
            className={`p-3.5 rounded-2xl text-xs font-semibold text-left transition-all cursor-pointer border-0 outline-none ${
              config.newTabMode === 'redirect'
                ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)]'
                : 'bg-white dark:bg-white/[0.04] text-[#141413] dark:text-[#ece6dc] hover:bg-[#f5f0e8] dark:hover:text-[#faf9f5] shadow-xs'
            }`}
          >
            Saved Webpage
            <span className={`block text-[10px] font-medium mt-1 ${config.newTabMode === 'redirect' ? 'opacity-90' : 'text-[#383531] dark:text-[#cfc4b2]'}`}>
              Redirects to your chosen website.
            </span>
          </button>
        </div>

        {config.newTabMode === 'redirect' && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-[#141413] dark:text-[#cfc4b2] mb-1">
                Saved Webpage URL for New Tabs
              </label>
              <input
                type="text"
                value={config.newTabRedirectUrl}
                onChange={(e) => onUpdate({ newTabRedirectUrl: e.target.value })}
                placeholder="https://google.com or https://github.com"
                className="h-10 w-full px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs text-[#141413] dark:text-[#ece6dc] placeholder:text-[#524f49] dark:placeholder:text-[#a8a49c] outline-none border-0 shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#141413] dark:text-[#ece6dc] mb-1">
                <span>Redirect Delay</span>
                <span className="text-[#141413] dark:text-[#cfc4b2] font-mono font-bold text-[11px]">{config.redirectCountdown}s (0 = instant)</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={config.redirectCountdown}
                onChange={(e) => onUpdate({ redirectCountdown: Number(e.target.value) })}
                className="w-full accent-[var(--accent-color)] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Startup Browser Webpage */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          On Browser Startup
        </h4>
        <p className="text-[11px] text-[#383531] dark:text-[#cfc4b2] font-medium">
          Choose whether the first tab of a fresh browser session opens Aura or a specific website.
        </p>

        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-xs text-[#141413] dark:text-[#ece6dc] font-semibold cursor-pointer">
            <input
              type="radio"
              name="startupMode"
              checked={config.startupMode === 'aura'}
              onChange={() => onUpdate({ startupMode: 'aura' })}
              className="accent-[var(--accent-color)]"
            />
            <span>Open Aura Startpage</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-[#141413] dark:text-[#ece6dc] font-semibold cursor-pointer">
            <input
              type="radio"
              name="startupMode"
              checked={config.startupMode === 'custom_url'}
              onChange={() => onUpdate({ startupMode: 'custom_url' })}
              className="accent-[var(--accent-color)]"
            />
            <span>Open Specific Webpage</span>
          </label>

          {config.startupMode === 'custom_url' && (
            <input
              type="text"
              value={config.startupUrl}
              onChange={(e) => onUpdate({ startupUrl: e.target.value })}
              placeholder="e.g. https://mail.google.com"
              className="h-10 w-full px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs text-[#141413] dark:text-[#ece6dc] placeholder:text-[#524f49] dark:placeholder:text-[#a8a49c] outline-none border-0 mt-2 shadow-xs"
            />
          )}
        </div>
      </div>

      {/* 3. Homepage Button URL */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3.5">
        <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center gap-2">
          <Home className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          Home Button Webpage
        </h4>
        <p className="text-[11px] text-[#383531] dark:text-[#cfc4b2] font-medium">
          Save your preferred home button URL for quick reference and access.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={config.homepageUrl}
            onChange={(e) => onUpdate({ homepageUrl: e.target.value })}
            placeholder="https://..."
            className="flex-1 h-10 px-3.5 rounded-xl bg-white dark:bg-white/[0.04] text-xs text-[#141413] dark:text-[#ece6dc] placeholder:text-[#524f49] dark:placeholder:text-[#a8a49c] outline-none border-0 shadow-xs"
          />
          {config.homepageUrl && (
            <a
              href={config.homepageUrl.startsWith('http') ? config.homepageUrl : `https://${config.homepageUrl}`}
              target="_blank"
              rel="noreferrer"
              className="h-10 w-10 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-[#f5f0e8] dark:hover:bg-white/[0.08] text-[#141413] dark:text-[#ece6dc] hover:text-black dark:hover:text-white flex items-center justify-center transition-all shadow-xs"
              title="Test URL"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
