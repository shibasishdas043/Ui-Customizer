# Aura · Next-Gen Startpage & UI Customizer

<p align="center">
  <img src="public/icons/icon-128.png" alt="Aura Logo" width="80" height="80" />
</p>

<p align="center">
  <strong>A lightning-fast, privacy-first browser extension & startpage dashboard.</strong><br />
  Transform every new tab into an elegant, focused, and deeply customizable workspace.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.3-646cff?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript&logoColor=white" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/Manifest-V3-10b981?logo=googlechrome&logoColor=white" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/License-MIT-purple" alt="MIT License" />
</p>

---

## ✨ Overview

**Aura** blends high-performance startpage utilities with state-of-the-art aesthetics. Engineered to replace cluttered default new-tab pages, Aura provides instantaneous wallpaper loading, dynamic typography harmonizing, multi-engine search, a visual bookmarks dock, and comprehensive browser navigation controls—all with **zero third-party tracking**, **zero bloat**, and **offline resilience**.

---

## 🚀 Key Features

### 1. 🖼️ Dynamic Wallpaper & Ambience Engine
- **Multi-Source Support:**
  - **Curated Collections:** Bundled Nature, Mountains, and Beach photos with local offline fallbacks (<3MB total package).
  - **Unsplash Collections:** Paste any Unsplash collection ID or link with auto-cleaning and multiple ID support.
  - **Unsplash Keyword Search:** Real-time search by query (e.g., `nature`, `architecture`, `minimalism`).
  - **Custom Image URLs:** Direct link support with automatic format normalization.
  - **Local Device Uploads:** Select and render any high-resolution image directly from your local storage.
  - **Solid Color Presets:** Curated obsidian, midnight, and charcoal solid backdrops.
- **Intelligent 30-Day Cache & FIFO Queue:** Rotates and stores up to 30 high-res wallpapers locally with automated LRU cleanup.
- **Zero-Flicker Blackout Shield:** Completely eliminates white screen flashes on startup; starts with pure black `#000000` until wallpaper decode finishes.
- **Display Customization:** Real-time Blur (0–20px), Brightness adjustment (20–100%), Zoom / Scale (50–150%), and Pan X/Y offsets.

---

### 2. ⏱️ Dual Clock & Adaptive Layout System
- **Digital Layout (Top-Left):**
  - Minimalist layout pairing digital time, solar-phase greetings (*Good morning, Good afternoon, Good evening, Good night*), and live weather side-by-side.
  - 12-hour (with AM/PM) and 24-hour modes, optional seconds counter, and localized date.
- **Analog Layout (Center Hero):**
  - High-precision analog clock with accent-colored second hand and subtle glow.
  - Dynamically rearranges the top navigation slots and renders a floating settings trigger at the bottom-right corner.
- **Optical Typography Scaling:** Customized baseline, colon alignment, and gap metrics calibrated for every font choice.

---

### 3. 🎨 Dual-Theme Settings Modal
- **White (Light) Mode:** Meticulously tuned to `#f2f4f3` with elevated white cards (`#ffffff`), dark charcoal headings (`#212529`), high-contrast body typography, and soft gray pill controls.
- **Dark Mode:** Deep charcoal aesthetic using `#212529` background, `#1a1e21` sidebar, `#14171a` footer, and subtle translucent glass cards.
- **Harmonized Color Palette:**
  - `Ocean Blue` (`#0081a7`)
  - `Turquoise Cyan` (`#00afb9`)
  - `Warm Cream` (`#fdfcdc`)
  - `Soft Peach` (`#fed9b7`)
  - `Coral Rose` (`#f07167`)
- **6 Premium Typefaces:**
  - `Inter` (Variable Clean Sans)
  - `Outfit` (Modern Bold Display)
  - `JetBrains Mono` / `Cascadia Code` (Developer Monospace)
  - `Caveat` (Handwritten Cursive)
  - `Playwrite AR` (Elegant Script)
  - `Stalemate` (Calligraphic Accent)

---

### 4. 🔍 Multi-Engine Omni Search
- **11 Prominent Search Providers:** Google, Bing, DuckDuckGo, Brave, Perplexity AI, YouTube, GitHub, Ecosia, Yahoo, Yandex, and Startpage.
- **Custom Search Engine Builder:** Add any custom search URL with `%s` query templating.
- **Categorization:** Badges for AI engines, Developer platforms, and Media hubs.
- **Instant Domain Routing:** Direct URL pattern detection navigates straight to websites when typing domain names (e.g., `github.com`).
- **Global Shortcut:** Press <kbd>/</kbd> from anywhere on the screen to focus search instantly.

---

### 5. 📌 Visual Bookmarks Dock (Quick Links)
- **High-Res Favicon Proxy:** Automatically fetches crisp site icons via Google's secure favicon cache with fallback monogram rendering.
- **Custom Icon Options:** Upload custom PNG/SVG icons, input direct image URLs, or choose from popular preset badges.
- **1-Click Presets:** Instant addition of popular sites (YouTube, GitHub, Reddit, ChatGPT, Gmail, X, Netflix, Spotify).
- **Navigation Controls:** Configure whether bookmarks open in the current tab or in a new browser tab.
- **Reordering & Management:** Quick drag/arrow reordering, inline editing, and deletion.

---

### 6. 🌐 Browser Behavior & Startup Controller
- **New Tab Action:** Choose between opening the Aura startpage or instantly redirecting to a saved webpage (e.g. your work dashboard or Google).
- **Safety Delay Countdown:** Set an optional delay (0–10s) with an instant cancel button before redirecting.
- **Startup Mode:** Choose what webpage opens when launching your browser session for the day.
- **Homepage Destination:** Configure your preferred homepage button URL.

---

### 7. ⛅ Live Weather & Daily Quotes
- **Zero-API-Key Weather (Open-Meteo):** Instant temperature, weather condition icon, wind speed, and humidity.
- **Auto-Location & Manual Override:** Use geolocation or search for any global city.
- **Unit Switching:** Seamless toggle between Celsius (°C) and Fahrenheit (°F).
- **Daily Quotes:** Non-intrusive inspirational quote rotation at the bottom of the startpage.

---

### 8. 💻 Live Custom CSS Injector & Backup
- **Real-Time CSS Engine:** Write custom CSS overrides that apply directly to DOM nodes without page refreshes.
- **JSON Configuration Backup:** Export all customizer settings into a `.json` backup file or import existing profiles with 1 click.

---

## 🏛️ Architecture & Project Structure

The project strictly adheres to a **Feature-Sliced Modular Architecture**:

```text
Ui-Customizer/
├── public/                           # Static assets, fonts, icons & extension manifest
│   ├── backgrounds/                  # Bundled offline fallback wallpapers (<3MB)
│   ├── font/                         # Self-hosted variable Google Fonts
│   ├── icons/                        # Browser extension icons (16, 32, 48, 128px)
│   ├── favicon.png                   # Startpage web favicon
│   └── manifest.json                 # Manifest V3 configuration
├── scripts/                          # Automated verification and feature test suites
│   ├── download_fallback_wallpapers.js
│   └── verify_features.ts            # 85-point end-to-end logic test suite
├── src/
│   ├── app/                          # Core bootstrap, layout & global design system
│   │   ├── App.tsx                   # Top-level feature coordinator
│   │   ├── index.css                 # Tailwind v4 theme, optical scales & customizer tokens
│   │   └── main.tsx                  # React 19 entry point
│   ├── features/                     # Isolated feature slices
│   │   ├── bookmarks/                # Quick links dock, favicon resolver & editor modals
│   │   ├── browser-settings/         # New Tab & Startup redirect controller
│   │   ├── clock/                    # Digital/analog clocks & astronomical greetings
│   │   ├── customizer/               # Dual-theme settings modal, tabs & CSS injection
│   │   ├── quotes/                   # Inspiring quotes widget
│   │   ├── search/                   # Omni search bar & engine manager
│   │   ├── wallpaper/                # Wallpaper engine, Unsplash API & FIFO caching
│   │   └── weather/                  # Open-Meteo live weather widget
│   └── shared/                       # Reusable UI primitives and global hooks
│       ├── components/               # Navbar & glassmorphic primitives
│       └── hooks/                    # Keyboard shortcuts & outside click listeners
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📦 Installation & Getting Started

### Method 1: Install from GitHub Release (No Coding Required)
1. Download **`aura-extension.zip`** from the [Latest GitHub Release](https://github.com/shibasishdas043/Ui-Customizer/releases/latest).
2. Extract the downloaded zip file into a folder on your computer.
3. Open your browser's extension manager:
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
4. Toggle on **Developer mode** (top-right corner).
5. Click **Load unpacked** (top-left) and select the extracted folder.
6. Open a new tab to experience Aura!

---

### Method 2: Build From Source

#### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

```bash
# Clone the repository
git clone https://github.com/shibasishdas043/Ui-Customizer.git
cd Ui-Customizer

# Install dependencies
npm install

# Run locally in development mode (live browser preview at http://localhost:3000)
npm run dev

# Build production bundle
npm run build

# Or package production zip for Chrome Web Store distribution
npm run package
```

After running `npm run build`, load the generated `dist/` directory as an unpacked extension using **Load unpacked** in your browser's extension manager.

---

## 🧪 Testing & Code Quality

Aura adheres to strict engineering and security standards with an automated 96-point feature verification suite:

```bash
# Run oxlint (0 warnings, 0 errors policy)
npm run lint

# Run end-to-end feature verification suite (96/96 tests)
npx tsx scripts/verify_features.ts

# Production TypeScript type check & build
npm run build
```

---

## 🛡️ Chrome Web Store Ready

- **Manifest V3 Compliant:** Strict permissions (`storage` only) and zero external remote scripts.
- **Privacy First:** All customizer settings, cached wallpapers, and bookmarks reside on your device. Zero telemetry, zero analytics, zero external user data tracking.
- **Zip Packaging:** `npm run package` compiles, validates Manifest V3 rules, and generates `aura-extension.zip` ready for instant Chrome Web Store Developer Dashboard upload.


---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>/</kbd> | Instantly focus the search bar |
| <kbd>Escape</kbd> | Close search bar suggestions or exit Settings modal |
| <kbd>Enter</kbd> | Execute search query or navigate to entered URL |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).