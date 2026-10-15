import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Palette,
  Image as ImageIcon,
  Clock,
  Code,
  RotateCcw,
  Download,
  Upload,
  Check,
  Compass,
  Bookmark,
} from 'lucide-react'
import type { CustomizerSettings } from '../types'
import { ThemeTab } from './tabs/ThemeTab'
import { WallpaperTab } from './tabs/WallpaperTab'
import { WidgetsTab } from './tabs/WidgetsTab'
import { CustomCssTab } from './tabs/CustomCssTab'
import { BrowserSettingsTab } from '../../../features/browser-settings'
import { QuickLinksManager } from '../../../features/bookmarks'

interface CustomizerDrawerProps {
  isOpen: boolean
  onClose: () => void
  settings: CustomizerSettings
  onUpdate: (updater: Partial<CustomizerSettings>) => void
  onReset: () => void
}

type TabType = 'appearance' | 'background' | 'widgets' | 'links' | 'browser' | 'css'

interface TabItem {
  id: TabType
  label: string
  sublabel: string
  icon: React.ReactNode
  description: string
}

const TABS: TabItem[] = [
  {
    id: 'appearance',
    label: 'Theme & Styling',
    sublabel: 'Colors, fonts & dark mode',
    icon: <Palette className="w-4 h-4" />,
    description: 'Customize theme mode, accent colors, greetings, and typography styles.',
  },
  {
    id: 'background',
    label: 'Wallpaper',
    sublabel: 'Sources, sizing & positioning',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'Configure wallpaper providers, Unsplash collections, blur, zoom, and panning.',
  },
  {
    id: 'widgets',
    label: 'Widgets & Clock',
    sublabel: 'Time, weather, search & quotes',
    icon: <Clock className="w-4 h-4" />,
    description: 'Personalize clock display, weather forecast, quotes, and search providers.',
  },
  {
    id: 'links',
    label: 'Quick Links',
    sublabel: 'Bookmarks dock & shortcuts',
    icon: <Bookmark className="w-4 h-4" />,
    description: 'Manage quick access bookmarks dock, reorder links, and customize icons.',
  },
  {
    id: 'browser',
    label: 'Browser Behavior',
    sublabel: 'New tab & startup controls',
    icon: <Compass className="w-4 h-4" />,
    description: 'Control startpage actions when launching browser or opening a new tab.',
  },
  {
    id: 'css',
    label: 'Custom CSS',
    sublabel: 'Live styling code injection',
    icon: <Code className="w-4 h-4" />,
    description: 'Write custom CSS rules to fine-tune and restyle any startpage element in real time.',
  },
]

export const CustomizerDrawer: React.FC<CustomizerDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdate,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance')
  const [copiedStatus, setCopiedStatus] = useState(false)

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(settings, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', 'aura-customizer-config.json')
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setCopiedStatus(true)
    setTimeout(() => setCopiedStatus(false), 2000)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8')
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string)
          onUpdate(parsed)
          alert('Settings imported successfully!')
        } catch {
          alert('Invalid JSON file format')
        }
      }
    }
  }

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0]

  const isDark =
    settings.themeMode === 'system'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      : settings.themeMode === 'dark'

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 lg:p-8 backdrop-blur-md transition-colors duration-300"
        style={{
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.45)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          data-settings-theme={isDark ? 'dark' : 'light'}
          className="settings-modal w-full max-w-[1040px] xl:max-w-[1140px] h-[92vh] sm:h-[86vh] max-h-[820px] min-h-[520px] rounded-3xl sm:rounded-[32px] flex flex-col md:flex-row overflow-hidden relative transition-colors duration-300"
          style={{
            backgroundColor: isDark ? '#212529' : '#f2f4f3',
            color: isDark ? '#f8f9fa' : '#212529',
            boxShadow: isDark
              ? '0 30px 90px rgba(0, 0, 0, 0.85)'
              : '0 25px 70px rgba(0, 0, 0, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Sidebar Navigation (Desktop) / Header & Tabs (Mobile) */}
          <aside
            className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col select-none transition-colors duration-300"
            style={{
              backgroundColor: isDark ? '#1a1e21' : '#e5e8e6',
            }}
          >
            {/* Brand Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center shrink-0 shadow-sm shadow-[var(--accent-glow)] overflow-hidden border border-white/[0.08] p-1">
                  <img src="/icons/icon-48.png" alt="Aura Logo" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold tracking-tight transition-colors"
                    style={{ color: isDark ? '#ffffff' : '#212529' }}
                  >
                    UI Customizer
                  </h2>
                  <p
                    className="text-[11px] mt-0.5 transition-colors"
                    style={{ color: isDark ? '#94a3b8' : '#6c757d' }}
                  >
                    Startpage & Browser
                  </p>
                </div>
              </div>
              {/* Mobile close button */}
              <button
                onClick={onClose}
                aria-label="Close settings"
                className={`md:hidden w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]' : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.06]'
                }`}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Mobile Navigation Bar (Horizontal Scrollable Tabs) */}
            <div
              className="flex md:hidden overflow-x-auto p-2 gap-1.5 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transition-colors"
              style={{
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.04)',
              }}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-sm'
                        : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Desktop Navigation Tabs (Spacious Vertical List) */}
            <nav className="hidden md:flex flex-1 flex-col p-3 gap-1.5 overflow-y-auto">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold shadow-md shadow-[var(--accent-glow)]'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isActive
                          ? 'bg-black/15 text-inherit'
                          : isDark
                          ? 'bg-white/[0.03] text-slate-400 group-hover:text-white group-hover:bg-white/[0.06]'
                          : 'bg-black/[0.04] text-slate-500 group-hover:text-slate-900 group-hover:bg-black/[0.07]'
                      }`}
                    >
                      {tab.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-semibold truncate leading-tight ${
                          isActive
                            ? ''
                            : isDark
                            ? 'text-slate-200 group-hover:text-white'
                            : 'text-slate-800 group-hover:text-slate-950'
                        }`}
                      >
                        {tab.label}
                      </div>
                      <div
                        className={`text-[10px] truncate mt-0.5 leading-tight ${
                          isActive
                            ? 'opacity-85 font-medium'
                            : isDark
                            ? 'text-slate-500 group-hover:text-slate-400'
                            : 'text-slate-500 group-hover:text-slate-700'
                        }`}
                      >
                        {tab.sublabel}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* Sidebar Footer: Export, Import & Reset */}
            <div
              className="p-3.5 flex flex-col gap-2 shrink-0 border-t transition-colors duration-300"
              style={{
                backgroundColor: isDark ? '#14171a' : '#dbe0dd',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExport}
                  title="Export settings to JSON file"
                  className={`h-8.5 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                    isDark
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/[0.06]'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border-black/[0.08] shadow-xs'
                  }`}
                >
                  {copiedStatus ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate">{copiedStatus ? 'Exported!' : 'Export'}</span>
                </button>

                <label
                  title="Import settings from JSON file"
                  className={`h-8.5 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                    isDark
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/[0.06]'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border-black/[0.08] shadow-xs'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="truncate">Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={() => {
                  if (confirm('Reset all settings to default?')) {
                    onReset()
                  }
                }}
                className={`h-8 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                    : 'text-rose-600 hover:text-rose-700 hover:bg-rose-500/10'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-transparent">
            {/* Section Header */}
            <div
              className="px-6 py-4 flex items-center justify-between shrink-0 border-b transition-colors"
              style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.07)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-color)]/10 text-[var(--accent-color)] flex items-center justify-center shrink-0">
                  {currentTab.icon}
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-sm sm:text-base font-bold tracking-tight truncate transition-colors"
                    style={{ color: isDark ? '#ffffff' : '#212529' }}
                  >
                    {currentTab.label}
                  </h3>
                  <p
                    className="text-[11px] truncate mt-0.5 transition-colors"
                    style={{ color: isDark ? '#94a3b8' : '#6c757d' }}
                  >
                    {currentTab.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 ml-3">
                <span
                  className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-mono"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
                    color: isDark ? '#94a3b8' : '#6c757d',
                  }}
                >
                  ESC
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.06]'
                  }`}
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Tab Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              {activeTab === 'appearance' && (
                <ThemeTab settings={settings} onUpdate={onUpdate} />
              )}
              {activeTab === 'background' && (
                <WallpaperTab settings={settings} onUpdate={onUpdate} />
              )}
              {activeTab === 'widgets' && (
                <WidgetsTab
                  settings={settings}
                  onUpdate={onUpdate}
                  onNavigateToLinks={() => setActiveTab('links')}
                />
              )}
              {activeTab === 'links' && (
                <QuickLinksManager
                  links={settings.quickLinks}
                  onUpdateLinks={(newLinks) => onUpdate({ quickLinks: newLinks })}
                  showQuickLinks={settings.showQuickLinks}
                  onToggleShow={(show) => onUpdate({ showQuickLinks: show })}
                  openInNewTab={settings.bookmarksInNewTab}
                  onToggleNewTab={(inNewTab) => onUpdate({ bookmarksInNewTab: inNewTab })}
                />
              )}
              {activeTab === 'browser' && (
                <BrowserSettingsTab
                  config={{
                    newTabMode: settings.newTabMode,
                    newTabRedirectUrl: settings.newTabRedirectUrl,
                    startupMode: settings.startupMode,
                    startupUrl: settings.startupUrl,
                    homepageUrl: settings.homepageUrl,
                    redirectCountdown: settings.redirectCountdown,
                  }}
                  onUpdate={onUpdate}
                />
              )}
              {activeTab === 'css' && (
                <CustomCssTab settings={settings} onUpdate={onUpdate} />
              )}
            </div>
          </main>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

