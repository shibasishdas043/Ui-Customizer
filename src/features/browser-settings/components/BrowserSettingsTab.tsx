import React from 'react'
import { Globe, ArrowRight, ExternalLink, ShieldCheck, Home, Info, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react'
import type { BrowserBehaviorConfig } from '../types'
import { getAppVersion, isExtensionRuntime } from '../../../shared'
import { useAutoUpdate } from '../../auto-update'

function formatLastChecked(timestamp: number): string {
  if (!timestamp) return 'Never'
  const diff = Date.now() - timestamp
  if (diff < 60 * 1000) return 'Just now'
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / (60 * 1000))
    return `${mins}m ago`
  }
  const date = new Date(timestamp)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface BrowserSettingsTabProps {
  config: BrowserBehaviorConfig
  onUpdate: (updater: Partial<BrowserBehaviorConfig>) => void
}

export const BrowserSettingsTab: React.FC<BrowserSettingsTabProps> = ({ config, onUpdate }) => {
  const version = getAppVersion()
  const isExtension = isExtensionRuntime()
  const { updateInfo, checkForUpdate, applyUpdate } = useAutoUpdate()

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

      {/* 4. Extension & Version Information */}
      <div className="p-4 rounded-2xl bg-white/[0.03] space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#141413] dark:text-[#cfc4b2] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            Extension Information
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-lg bg-[var(--accent-color)]/15 text-[var(--accent-color)] font-semibold lowercase tracking-normal">
            v{version}
          </span>
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-white/[0.04] shadow-xs">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#736e65] dark:text-[#a8a49c]">Installed Version</span>
            <span className="font-mono font-bold text-sm text-[#141413] dark:text-[#faf9f5]">v{version}</span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-white/[0.04] shadow-xs">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#736e65] dark:text-[#a8a49c]">Runtime Platform</span>
            <span className="font-semibold text-xs text-[#141413] dark:text-[#faf9f5] flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{isExtension ? 'Chrome Extension (MV3)' : 'Web Dashboard'}</span>
            </span>
          </div>
        </div>

        {/* Update Checker Status & Actions */}
        <div className="pt-2.5 border-t border-black/5 dark:border-white/5 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="block text-xs font-semibold text-[#141413] dark:text-[#faf9f5]">
                Auto-Update Checker
              </span>
              <p className="text-[11px] text-[#736e65] dark:text-[#a8a49c] font-medium">
                Checks daily • Last check: {formatLastChecked(updateInfo.lastCheckedTime)}
              </p>
            </div>

            {updateInfo.status === 'update_available' ? (
              <button
                type="button"
                onClick={applyUpdate}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart & Update</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={checkForUpdate}
                disabled={updateInfo.status === 'checking'}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#141413] dark:text-[#ece6dc] text-xs font-semibold flex items-center gap-1.5 border border-black/5 dark:border-white/5 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updateInfo.status === 'checking' ? 'animate-spin text-[var(--accent-color)]' : ''}`} />
                <span>{updateInfo.status === 'checking' ? 'Checking...' : 'Check for Updates'}</span>
              </button>
            )}
          </div>

          {/* Real-time status feedback */}
          {updateInfo.status === 'up_to_date' && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Aura is currently up to date (v{version}).</span>
            </div>
          )}

          {updateInfo.status === 'update_available' && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>New version v{updateInfo.availableVersion} downloaded by Chrome! Click &ldquo;Restart &amp; Update&rdquo; to apply.</span>
            </div>
          )}

          {updateInfo.status === 'throttled' && (
            <p className="text-[10px] text-[#736e65] dark:text-[#a8a49c]">
              Check throttled by Chrome (already checked recently).
            </p>
          )}

          {updateInfo.error && (
            <p className="text-[10px] text-amber-500">
              Update check error: {updateInfo.error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

