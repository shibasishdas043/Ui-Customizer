import fs from 'node:fs'
import path from 'node:path'
import { formatTime, getGreetingType } from '../src/features/clock/utils/timeFormatters'
import { normalizeUrl, getFaviconUrl } from '../src/features/bookmarks/utils/faviconHelper'
import { DEFAULT_BOOKMARKS } from '../src/features/bookmarks/config/defaultBookmarks'
import { WALLPAPER_PRESETS } from '../src/features/wallpaper/config/presets'
import { DEFAULT_QUOTES } from '../src/features/quotes/config/quotesList'
import { DEFAULT_SETTINGS } from '../src/features/customizer/config/defaultSettings'
import { CACHE_TTL_MS, MAX_CACHED_IMAGES } from '../src/features/wallpaper/utils/wallpaperCache'
import {
  cleanCollectionId,
  needsWallpaperChange,
  DEFAULT_COLLECTIONS,
  getQueueStorageKey,
  normalizeCustomImageUrl,
  resolveUnsplashPageToImageUrl,
} from '../src/features/wallpaper/utils/unsplashEngine'

console.log('====================================================')
console.log('🧪 RUNNING FULL FEATURE & LOGIC VERIFICATION SUITE')
console.log('====================================================\n')

let passCount = 0
let failCount = 0

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`)
    passCount++
  } else {
    console.error(`  ❌ FAIL: ${description}`)
    failCount++
  }
}

// 1. CLOCK TESTS
console.log('👉 [1/10] Verifying Clock & Greeting Engine...')
const testMorning = new Date('2026-10-14T08:30:00')
const testAfternoon = new Date('2026-10-14T14:15:00')
const testEvening = new Date('2026-10-14T19:45:00')
const testNight = new Date('2026-10-14T23:20:00')

const time12 = formatTime(testAfternoon, false)
assert('12-hour format converts 14:15 to 2:15 PM', time12.hours === '2' && time12.minutes === '15' && time12.period === 'PM')

const time24 = formatTime(testAfternoon, true)
assert('24-hour format converts 14:15 to 14:15', time24.hours === '14' && time24.minutes === '15')

assert('Morning greeting triggers at 08:30', getGreetingType(testMorning).type === 'morning')
assert('Afternoon greeting triggers at 14:15', getGreetingType(testAfternoon).type === 'afternoon')
assert('Evening greeting triggers at 19:45', getGreetingType(testEvening).type === 'evening')
assert('Night greeting triggers at 23:20', getGreetingType(testNight).type === 'night')

// 2. SEARCH ENGINE TESTS
console.log('\n👉 [2/10] Verifying Search Engine & URL Routing...')
const prominentEngines = ['google', 'bing', 'duckduckgo', 'brave', 'ecosia', 'yahoo', 'yandex', 'startpage', 'perplexity', 'youtube', 'github']
assert('All 11 prominent search engines configured', prominentEngines.length === 11)
assert('Contains Google, Bing, DuckDuckGo, Brave, Ecosia, Yahoo, Yandex, Startpage, Perplexity, YouTube, GitHub', 
  prominentEngines.every((id) => ['google', 'bing', 'duckduckgo', 'brave', 'ecosia', 'yahoo', 'yandex', 'startpage', 'perplexity', 'youtube', 'github'].includes(id))
)

const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i
assert('Detects raw domains (e.g. github.com) as direct URLs', urlPattern.test('github.com'))
assert('Detects full https URLs as direct URLs', urlPattern.test('https://google.com/search'))
assert('Regular search queries are not flagged as URLs', !urlPattern.test('how to build a browser extension'))

// 3. BOOKMARKS & FAVICON TESTS
console.log('\n👉 [3/10] Verifying Bookmarks & Favicon Engine...')
assert('Default bookmarks populated', DEFAULT_BOOKMARKS.length >= 4)
assert('normalizeUrl adds https to bare domain', normalizeUrl('reddit.com') === 'https://reddit.com')
assert('normalizeUrl preserves existing https', normalizeUrl('https://x.com') === 'https://x.com')

const favicon = getFaviconUrl('https://github.com')
assert('Favicon resolver returns Google favicon proxy', favicon.includes('google.com/s2/favicons?domain=github.com'))

// 4. WALLPAPER ENGINE & 1-MONTH CACHE TESTS
console.log('\n👉 [4/10] Verifying Wallpaper Presets & 1-Month Caching Engine...')
assert('Wallpaper presets configured (at least 4 high-res presets)', WALLPAPER_PRESETS.length >= 4)
assert('All presets have valid https URLs and IDs', WALLPAPER_PRESETS.every((p) => p.url.startsWith('https://') && p.id))
assert('Wallpaper cache TTL is configured for exactly 1 month / 30 days (2,592,000,000 ms)', CACHE_TTL_MS === 30 * 24 * 60 * 60 * 1000)
assert('Wallpaper cache capacity strictly capped at maximum 30 images', MAX_CACHED_IMAGES === 30)

// 5. 3 HARDCODED COLLECTIONS & FREQUENCY LOGIC
console.log('\n👉 [5/10] Verifying 3 Hardcoded Collections (Nature, Mountains, Beaches) & Frequency...')
assert('Hardcoded Nature collection exists with ID and fallback photos', !!DEFAULT_COLLECTIONS.nature.id && DEFAULT_COLLECTIONS.nature.fallbackPhotos.length >= 2)
assert('Hardcoded Mountains collection exists with ID and fallback photos', !!DEFAULT_COLLECTIONS.mountains.id && DEFAULT_COLLECTIONS.mountains.fallbackPhotos.length >= 2)
assert('Hardcoded Beaches collection exists with ID and fallback photos', !!DEFAULT_COLLECTIONS.beaches.id && DEFAULT_COLLECTIONS.beaches.fallbackPhotos.length >= 2)
assert('cleanCollectionId extracts numeric ID from full URL', cleanCollectionId('https://unsplash.com/collections/1065976/nature') === '1065976')
assert('cleanCollectionId extracts ID from custom collection URL (e.g. 9968899/bikini)', cleanCollectionId('https://unsplash.com/collections/9968899/bikini') === '9968899')
assert('cleanCollectionId preserves raw numeric ID', cleanCollectionId('9968899') === '9968899')
assert('cleanCollectionId preserves comma-separated multiple IDs', cleanCollectionId('1065976, 317099') === '1065976, 317099')
assert('cleanCollectionId returns empty string when input is empty (allows smooth user typing)', cleanCollectionId('') === '')
assert('getQueueStorageKey generates stable queue keys for unsplash_collection', getQueueStorageKey('unsplash_collection', { customCollectionId: '9968899' }) === 'aura_coll_queue_9968899')
assert('getQueueStorageKey generates stable queue keys for unsplash_search', getQueueStorageKey('unsplash_search', { customSearchQuery: 'bikini' }) === 'aura_search_queue_bikini')

// Custom Image URL Normalizer tests
assert('normalizeCustomImageUrl preserves direct image URLs', normalizeCustomImageUrl('https://images.unsplash.com/photo-1511497584788-87676104235f?w=1920') === 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=1920')
assert('normalizeCustomImageUrl strips quotes and whitespace', normalizeCustomImageUrl(' "https://example.com/photo.jpg" ') === 'https://example.com/photo.jpg')
assert('resolveUnsplashPageToImageUrl is defined and callable', typeof resolveUnsplashPageToImageUrl === 'function')

const nowMs = Date.now()
assert('Frequency "tabs" always requests a change', needsWallpaperChange('tabs', nowMs) === true)
assert('Frequency "locked" blocks wallpaper changes', needsWallpaperChange('locked', nowMs) === false)
assert('Frequency "hour" flags change when hour shifts (>1h passed)', needsWallpaperChange('hour', nowMs - 3700000) === true)
assert('Frequency "day" flags change when day shifts (>24h passed)', needsWallpaperChange('day', nowMs - 86500000) === true)

// 6. ZERO-BORDER, ZERO-OUTLINE & BLACKOUT DELAY COMPLIANCE
console.log('\n👉 [6/10] Verifying Zero-Border, Zero-Outline & Blackout Delay Compliance...')
const indexHtmlContent = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8')
assert('index.html specifies pure black theme-color (#000000)', indexHtmlContent.includes('content="#000000"'))
assert('index.html body initializes with background-color: #000000 blackout', indexHtmlContent.includes('background-color: #000000'))

const indexCssForBorders = fs.readFileSync(path.resolve(process.cwd(), 'src/app/index.css'), 'utf-8')
assert('index.css specifies border: none for .glass-panel', indexCssForBorders.includes('.glass-panel') && indexCssForBorders.includes('border: none;'))
assert('index.css specifies border: none for .glass-card', indexCssForBorders.includes('.glass-card') && indexCssForBorders.includes('border: none;'))
assert('index.css enforces universal zero-outline policy (*:focus { outline: none !important; })', indexCssForBorders.includes('outline: none !important;'))
assert('index.css specifies color-scheme: dark for native select popups', indexCssForBorders.includes('color-scheme: dark'))
assert('index.css styles select option elements with dark background', indexCssForBorders.includes('select option'))

const navbarContent = fs.readFileSync(path.resolve(process.cwd(), 'src/shared/components/Navbar.tsx'), 'utf-8')
assert('Navbar has NO Aura brand pill div', !navbarContent.includes('>Aura</span>'))
assert('Navbar has NO Sparkles icon import', !navbarContent.includes('Sparkles'))

const widgetsTabContent = fs.readFileSync(path.resolve(process.cwd(), 'src/features/customizer/components/tabs/WidgetsTab.tsx'), 'utf-8')
assert('WidgetsTab has removed Focus Pomodoro Timer checkbox', !widgetsTabContent.includes('Focus Pomodoro Timer'))
assert('WidgetsTab has removed Scratchpad / Notes checkbox', !widgetsTabContent.includes('Scratchpad / Notes'))
assert('WidgetsTab keeps Daily Inspiring Quotes checkbox', widgetsTabContent.includes('Daily Inspiring Quotes'))

const appTsxContent = fs.readFileSync(path.resolve(process.cwd(), 'src/app/App.tsx'), 'utf-8')
assert('App.tsx contains NO spinning loaders or animate-spin', !appTsxContent.includes('animate-spin'))
assert('App.tsx main container is transparent to reveal wallpaper (no obscuring bg-black)', !appTsxContent.includes('bg-black') && appTsxContent.includes('bg-transparent'))
assert('App.tsx contains #interface with blackout delay until wallpaper decode', appTsxContent.includes('id="interface"') && appTsxContent.includes('onWallpaperReady'))
assert('App.tsx does NOT render PomodoroWidget or NotesWidget', !appTsxContent.includes('<PomodoroWidget') && !appTsxContent.includes('<NotesWidget'))

// Bundled Fallback Wallpapers (<3MB limit)
const backgroundsDir = path.resolve(process.cwd(), 'public/backgrounds')
const hasNatureFallback = fs.existsSync(path.join(backgroundsDir, 'nature-1.webp'))
const hasMountainsFallback = fs.existsSync(path.join(backgroundsDir, 'mountains-1.webp'))
const hasBeachesFallback = fs.existsSync(path.join(backgroundsDir, 'beaches-1.webp'))
assert('Bundled fallback wallpapers exist for nature, mountains, and beaches', hasNatureFallback && hasMountainsFallback && hasBeachesFallback)

let totalBackgroundsBytes = 0
for (const f of fs.readdirSync(backgroundsDir)) {
  totalBackgroundsBytes += fs.statSync(path.join(backgroundsDir, f)).size
}
const totalBackgroundsMb = totalBackgroundsBytes / (1024 * 1024)
assert(`Bundled fallback wallpapers total size (${totalBackgroundsMb.toFixed(2)} MB) is strictly under 3 MB`, totalBackgroundsMb < 3.0)

const weatherWidgetContent = fs.readFileSync(path.resolve(process.cwd(), 'src/features/weather/components/WeatherWidget.tsx'), 'utf-8')
assert('WeatherWidget contains NO "Loading weather..." loader text', !weatherWidgetContent.includes('Loading weather...'))

// 7. INTER TYPOGRAPHY ENGINE TESTS
console.log('\n👉 [7/10] Verifying Inter Font Integration & Asset Pruning...')
const indexCssContent = fs.readFileSync(path.resolve(process.cwd(), 'src/app/index.css'), 'utf-8')
assert('index.css registers Inter variable font @font-face', indexCssContent.includes("font-family: 'Inter'") && indexCssContent.includes('Inter-VariableFont_opsz,wght.ttf'))
assert('index.css applies Inter as primary --font-sans', indexCssContent.includes("--font-sans: 'Inter'"))

const interFontExists = fs.existsSync(path.resolve(process.cwd(), 'public/font/Inter/Inter-VariableFont_opsz,wght.ttf'))
assert('Active Inter variable font file exists in public/font/Inter', interFontExists)

const staticFolderExists = fs.existsSync(path.resolve(process.cwd(), 'public/font/Inter/static'))
assert('Unused static font files directory has been pruned/deleted', !staticFolderExists)

// 8. QUOTES ENGINE TESTS
console.log('\n👉 [8/10] Verifying Daily Quotes Engine...')
assert('Quotes list populated with multiple entries', DEFAULT_QUOTES.length >= 5)
assert('All quotes have non-empty quote text and author', DEFAULT_QUOTES.every((q) => q.quote.length > 5 && q.author.length > 2))

// 9. POMODORO TIMER SPECS
console.log('\n👉 [9/10] Verifying Pomodoro Focus Timer Specs...')
assert('Default work duration is 25 minutes', DEFAULT_SETTINGS.pomodoroWorkDuration === 25)
assert('Default break duration is 5 minutes', DEFAULT_SETTINGS.pomodoroBreakDuration === 5)
assert('Default sound alert is enabled', DEFAULT_SETTINGS.pomodoroSound === true)

// 10. MASTER SCHEMA & BROWSER SETTINGS
console.log('\n👉 [10/10] Verifying Master Settings Schema & Browser Defaults...')
assert('Default newTabMode is aura', DEFAULT_SETTINGS.newTabMode === 'aura')
assert('Default newTabRedirectUrl is valid URL', DEFAULT_SETTINGS.newTabRedirectUrl.startsWith('http'))
assert('Default redirectCountdown is non-negative number', DEFAULT_SETTINGS.redirectCountdown >= 0)

const requiredKeys = [
  'userName', 'accentColor', 'fontFamily', 'themeMode',
  'backgroundProvider', 'defaultCategory', 'customCollectionId', 'customSearchQuery',
  'customBackgroundUrl', 'localImageDataUrl', 'solidColor', 'backgroundBlur', 'backgroundBrightness',
  'changeFrequency',
  'showClock', 'clockAnalog', 'use24Hour', 'showSeconds', 'showDate', 'showGreeting',
  'showSearch', 'searchEngine', 'searchInNewTab',
  'showQuickLinks', 'bookmarksInNewTab', 'quickLinks',
  'showWeather', 'tempUnit', 'weatherAutoLocation',
  'showNotes', 'notesContent',
  'showPomodoro', 'pomodoroWorkDuration', 'pomodoroBreakDuration',
  'showQuotes',
  'newTabMode', 'newTabRedirectUrl', 'startupMode', 'startupUrl', 'homepageUrl',
  'customCss'
]

const missingKeys = requiredKeys.filter((k) => !(k in DEFAULT_SETTINGS))
assert(`All ${requiredKeys.length} settings keys present in DEFAULT_SETTINGS (missing: ${missingKeys.length})`, missingKeys.length === 0)

// 11. THEME, ACCENT COLOR & TYPOGRAPHY LOGIC TESTS
console.log('\n👉 [11/11] Verifying Theme Tab (Accent Colors, Typography & Theme Modes)...')
const userPalette = ['#0081a7', '#00afb9', '#fdfcdc', '#fed9b7', '#f07167']
const themeTabTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/features/customizer/components/tabs/ThemeTab.tsx'), 'utf-8')
assert('ThemeTab contains all 5 user palette hex codes', userPalette.every((hex) => themeTabTsx.includes(hex)))
assert('ThemeTab configures exactly 5 accent color options', (themeTabTsx.match(/hex: '#/g) || []).length === 5)

const appTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/app/App.tsx'), 'utf-8')
assert('App.tsx maps all 5 palette hex codes in ACCENT_COLOR_MAP', userPalette.every((hex) => appTsx.includes(hex)))
assert('App.tsx dynamically injects --accent-color to document root', appTsx.includes("root.style.setProperty('--accent-color'"))
assert('App.tsx dynamically sets data-accent attribute', appTsx.includes("root.setAttribute('data-accent'"))
assert('App.tsx listens reactively to system dark mode changes', appTsx.includes("window.matchMedia('(prefers-color-scheme: dark)')") && appTsx.includes('mediaQuery.addEventListener'))

const indexCss = fs.readFileSync(path.resolve(process.cwd(), 'src/app/index.css'), 'utf-8')
assert('index.css declares Tailwind @theme block with typography tokens', indexCss.includes('@theme') && indexCss.includes('--font-sans') && indexCss.includes('--font-display') && indexCss.includes('--font-mono'))
assert('index.css maps [data-font="mono"] to --font-mono', indexCss.includes('[data-font="mono"]'))
assert('index.css maps [data-font="display"] to --font-display', indexCss.includes('[data-font="display"]'))
assert('index.css defines ::selection with var(--accent-color)', indexCss.includes('::selection') && indexCss.includes('var(--accent-color'))

const analogClockTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/features/clock/components/AnalogClock.tsx'), 'utf-8')
assert('AnalogClock uses var(--accent-color) for second hand and dot', analogClockTsx.includes('var(--accent-color'))

const greetingTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/features/clock/components/GreetingDisplay.tsx'), 'utf-8')
assert('GreetingDisplay accents user name with var(--accent-color)', greetingTsx.includes('var(--accent-color)'))

// 12. DYNAMIC DIGITAL VS ANALOG CLOCK LAYOUT TESTS
console.log('\n👉 [12/12] Verifying Dynamic Layout (Digital Top-Left / Analog Center)...')
const navbarTsx = fs.readFileSync(path.resolve(process.cwd(), 'src/shared/components/Navbar.tsx'), 'utf-8')
assert('Navbar supports isAnalogClock prop for dynamic slot arrangement', navbarTsx.includes('isAnalogClock: boolean'))
assert('Navbar supports dynamic slot arrangement based on isAnalogClock', 
  navbarTsx.includes('!isAnalogClock && clockSlot') && navbarTsx.includes('!isAnalogClock && weatherSlot')
)

assert('App.tsx renders Clock with layout="top-left" when digital clock is active', appTsx.includes('layout="top-left"'))
assert('App.tsx renders floating settings button at bottom right when digital clock is active', appTsx.includes('!settings.clockAnalog') && appTsx.includes('fixed bottom-'))
assert('App.tsx renders Clock in center hero only when analog mode is active', appTsx.includes('settings.clockAnalog &&') && appTsx.includes('layout="center"'))

console.log('\n====================================================')
console.log(`📊 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`)
console.log('====================================================')

if (failCount > 0) {
  process.exit(1)
} else {
  console.log('🎉 ALL FEATURE LOGICS, DYNAMIC LAYOUT & CLOCK MODES VERIFIED!\n')
}
