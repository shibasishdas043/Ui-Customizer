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
          className="settings-modal w-full max-w-[1040px] xl:max-w-[1140px] h-[92vh] sm:h-[86vh] max-h-[820px] min-h-[520px] rounded-3xl sm:rounded-[32px] flex flex-col md:flex-row overflow-hidden relative transition-colors duration-300 border-0 outline-none"
          style={{
            backgroundColor: isDark ? '#181715' : '#faf9f5',
            color: isDark ? '#dcd9d2' : '#3d3d3a',
            boxShadow: isDark
              ? '0 32px 100px rgba(0, 0, 0, 0.85)'
              : '0 25px 70px rgba(20, 20, 19, 0.14)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Sidebar Navigation (Desktop) / Header & Tabs (Mobile) */}
          <aside
            className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col select-none transition-colors duration-300 border-0 outline-none"
            style={{
              backgroundColor: isDark ? '#141311' : '#f5f0e8',
            }}
          >
            {/* Brand Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden p-1 transition-colors border-0 outline-none"
                  style={{
                    backgroundColor: isDark ? '#22201d' : '#efe9de',
                  }}
                >
                  <img src="/icons/icon-48.png" alt="Aura Logo" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h2
                    className="settings-serif-title text-base sm:text-lg font-normal tracking-tight transition-colors"
                    style={{ color: isDark ? '#faf9f5' : '#141413' }}
                  >
                    UI Customizer
                  </h2>
                  <p
                    className="text-[11px] mt-0.5 transition-colors font-medium"
                    style={{ color: isDark ? '#a8a49c' : '#383531' }}
                  >
                    Startpage & Browser
                  </p>
                </div>
              </div>
              {/* Mobile close button */}
              <button
                onClick={onClose}
                aria-label="Close settings"
                className={`md:hidden w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-0 outline-none ${
                  isDark ? 'text-[#b5b1a8] hover:text-[#faf9f5] hover:bg-[#22201d]' : 'text-[#141413] hover:text-[#000000] hover:bg-[#e8e0d2]'
                }`}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Mobile Navigation Bar (Horizontal Scrollable Tabs) */}
            <div
              className="flex md:hidden overflow-x-auto p-2 gap-1.5 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transition-colors border-0 outline-none"
              style={{
                backgroundColor: isDark ? '#0f0e0d' : '#e8e0d2',
              }}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 border-0 outline-none ${
                      isActive
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                        : isDark
                        ? 'text-[#b5b1a8] hover:text-[#faf9f5] hover:bg-[#22201d]'
                        : 'text-[#141413] hover:text-[#000000] hover:bg-[#efe9de] font-medium'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Desktop Navigation Tabs (Spacious Vertical List) */}
            <nav className="hidden md:flex flex-1 flex-col p-3 gap-1.5 overflow-y-auto border-0 outline-none">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer relative border-0 outline-none ${
                      isActive
                        ? 'bg-[var(--accent-color)] text-[var(--accent-contrast,#ffffff)] font-semibold'
                        : isDark
                        ? 'text-[#b5b1a8] hover:text-[#faf9f5] hover:bg-[#22201d]'
                        : 'text-[#141413] hover:text-[#000000] hover:bg-[#e8e0d2]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all border-0 outline-none ${
                        isActive
                          ? 'bg-black/15 text-inherit'
                          : isDark
                          ? 'bg-[#181715] text-[#b5b1a8] group-hover:text-[#faf9f5] group-hover:bg-[#252320]'
                          : 'bg-[#ffffff] text-[#141413] group-hover:text-[#000000] group-hover:bg-[#ffffff] shadow-sm'
                      }`}
                    >
                      {tab.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-[13px] truncate leading-tight ${
                          isActive
                            ? 'font-semibold'
                            : isDark
                            ? 'text-[#faf9f5] font-medium'
                            : 'text-[#141413] font-semibold'
                        }`}
                      >
                        {tab.label}
                      </div>
                      <div
                        className={`text-[11px] truncate mt-0.5 leading-tight ${
                          isActive
                            ? 'opacity-90 font-normal'
                            : isDark
                            ? 'text-[#a8a49c] group-hover:text-[#faf9f5]'
                            : 'text-[#383531] group-hover:text-[#141413] font-medium'
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
              className="p-3.5 flex flex-col gap-2 shrink-0 transition-colors duration-300 border-0 outline-none"
              style={{
                backgroundColor: isDark ? '#0f0e0d' : '#e8e0d2',
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExport}
                  title="Export settings to JSON file"
                  className={`h-8.5 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border-0 outline-none ${
                    isDark
                      ? 'bg-[#22201d] hover:bg-[#292622] text-[#faf9f5]'
                      : 'bg-[#ffffff] hover:bg-[#ede6d8] text-[#141413] font-semibold shadow-sm'
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
                  className={`h-8.5 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border-0 outline-none ${
                    isDark
                      ? 'bg-[#22201d] hover:bg-[#292622] text-[#faf9f5]'
                      : 'bg-[#ffffff] hover:bg-[#ede6d8] text-[#141413] font-semibold shadow-sm'
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
                className={`h-8 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border-0 outline-none ${
                  isDark
                    ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                    : 'text-rose-700 hover:text-rose-800 hover:bg-rose-500/15 font-semibold'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-transparent border-0 outline-none">
            {/* Section Header */}
            <div
              className="px-6 py-4 flex items-center justify-between shrink-0 transition-colors border-0 outline-none"
              style={{
                backgroundColor: 'transparent',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-0 outline-none shadow-sm"
                  style={{
                    backgroundColor: isDark ? '#22201d' : '#ffffff',
                    color: 'var(--accent-color)',
                  }}
                >
                  {currentTab.icon}
                </div>
                <div className="min-w-0">
                  <h3
                    className="settings-serif-title text-base sm:text-lg font-normal tracking-tight truncate transition-colors"
                    style={{ color: isDark ? '#faf9f5' : '#141413' }}
                  >
                    {currentTab.label}
                  </h3>
                  <p
                    className="text-[11px] truncate mt-0.5 transition-colors font-medium"
                    style={{ color: isDark ? '#a8a49c' : '#383531' }}
                  >
                    {currentTab.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 ml-3">
                <span
                  className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-mono border-0 outline-none shadow-sm"
                  style={{
                    backgroundColor: isDark ? '#22201d' : '#ffffff',
                    color: isDark ? '#dcd9d2' : '#141413',
                    fontWeight: 600,
                  }}
                >
                  ESC
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-0 outline-none ${
                    isDark
                      ? 'text-[#a8a49c] hover:text-[#faf9f5] hover:bg-[#22201d]'
                      : 'text-[#141413] hover:text-[#000000] hover:bg-[#e8e0d2]'
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
                  cols={settings.quickLinksCols}
                  onUpdateCols={(cols) => onUpdate({ quickLinksCols: cols })}
                  size={settings.quickLinksSize}
                  onUpdateSize={(size) => onUpdate({ quickLinksSize: size })}
                  showTitles={settings.quickLinksShowTitle}
                  onToggleShowTitles={(show) => onUpdate({ quickLinksShowTitle: show })}
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

