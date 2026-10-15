# Chrome Web Store Publishing Guide for Aura

This guide provides copy-paste ready metadata, privacy disclosures, and step-by-step instructions for publishing **Aura · UI Customizer & Startpage** to the [Google Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## 1. Quick Packaging Command

To generate the ready-to-upload ZIP package:

```bash
npm run package
```

This command automatically:
1. Compiles TypeScript and runs Vite production build (`tsc -b && vite build`) into `dist/`.
2. Validates Manifest V3 compliance (verifies description length <= 132 chars, icons, and permissions).
3. Packages all production files into `aura-extension.zip` with `manifest.json` at the root of the archive.

---

## 2. Store Listing Tab (Metadata)

### Extension Name (Max 45 characters)
```text
Aura · UI Customizer & Startpage
```

### Summary Description (Max 132 characters)
```text
A stunning, minimalist startpage with dynamic wallpapers, clock, weather, custom search, and personal productivity tools.
```

### Detailed Description
```markdown
Transform every new tab into an elegant, tranquil, and deeply customizable workspace.

Aura replaces cluttered default browser tabs with a lightning-fast, privacy-first dashboard featuring dynamic 4K photography, minimalist dual clocks, live weather forecasts, visual bookmarks, and productivity tools.

✨ KEY FEATURES:

🖼️ DYNAMIC 4K WALLPAPERS & AMBIENCE
• Curated Collections: Built-in Nature, Mountains, and Beaches photography with local offline fallbacks.
• Multi-Provider Support: Connect directly to Unsplash collections, Unsplash keyword search, Wallhaven (1080p, 2K & 4K), Microsoft Bing Daily Wallpaper, and Reddit photography subreddits (r/wallpapers, r/EarthPorn, r/spaceporn).
• Custom Image URLs & Local Uploads: Render any web image or local photo from your device.
• Ambient Texture Overlays: Add tactile film grain, topographic lines, waves, circuit boards, or honeycombs.
• Custom Framing: Adjust Blur (0–20px), Brightness (30–100%), Zoom / Scale (50–150%), and Pan offsets.

⏱️ TIME, DATE & SOLAR GREETINGS
• Digital Layout: Minimalist time with solar-phase greetings (Good morning, afternoon, evening, night).
• Analog Mode: High-precision Swiss/Braun-inspired analog clock with fluid second hand.
• 12-hour (AM/PM) and 24-hour display modes with optional seconds counter.
• Typography Styles: Choose between Sans (Inter), Display (Outfit), and Monospace (JetBrains Mono).

🌦️ OPEN-SOURCE WEATHER FORECAST
• Live temperature, conditions, and daily high/low powered by Open-Meteo.
• Metric (°C) and Imperial (°F) units.
• Automatic approximate location or manual city search.

🔍 MULTI-ENGINE SEARCH BAR
• Instantly search across Google, DuckDuckGo, Bing, Ecosia, Brave, or Yahoo.
• Fast keyboard shortcuts and search provider switching.

⚡ PRODUCTIVITY & BOOKMARKS
• Visual quick-access bookmarks dock with high-res favicons.
• Daily inspiring quotes curated for mindfulness, philosophy, design, and code.
• Fully functional offline with 24-hour local caching.

🔒 PRIVACY & SECURITY FIRST:
• 100% Client-Side: Zero user accounts, zero analytics, zero trackers, and zero telemetry.
• No Data Collection: Aura never collects, tracks, sells, or monetizes your browsing history or personal data.
• Open-Source: Transparent code verified under the MIT License.

Replace browser clutter with calm and clarity. Install Aura today.
```

### Category
- **Primary Category:** `Productivity`
- **Secondary Category:** `Photos`

### Language
- `English`

---

## 3. Privacy Practices Tab

The Chrome Web Store enforces strict disclosure guidelines. Use the answers below:

### Single Purpose Description
```text
Aura is a minimalist, privacy-first new-tab startpage that replaces the browser's default new tab page with customizable wallpapers, clock, weather, quick links, and productivity widgets.
```

### Permission Justifications

| Requested Permission | Justification Text to Paste |
| :--- | :--- |
| **Storage** | Used strictly to store user preferences locally (chosen theme, wallpaper provider, custom bookmarks, clock format, and weather units) across browser sessions. |

### Host Permissions Justification
Paste the following explanation under the **Host Permissions** field:
```text
Host permissions are required strictly to perform client-side HTTP requests for user-configured features:
1. Open-Meteo (api.open-meteo.com, geocoding-api.open-meteo.com): Fetches live non-commercial weather data and city geocoding.
2. IPAPI (ipapi.co): Provides optional approximate geolocation when automatic weather location is enabled.
3. Unsplash, Wallhaven, Bing, and Reddit (services.bonjourr.fr, images.unsplash.com, unsplash.com, wallhaven.cc, bing.com, bing.biturl.top, reddit.com, redd.it): Downloads high-resolution wallpapers and image feeds chosen by the user.
No data is ever sent to or tracked by third-party servers.
```

### Data Usage Disclosures (Checkboxes)
- **Do you collect personal information?** ➡️ **No** (Uncheck all personal data categories).
- **Certification:** Check the box certifying that your extension complies with the Developer Program Policies and does not sell or transfer user data.

### Privacy Policy URL
```text
https://github.com/shibasishdas043/Ui-Customizer/blob/main/PRIVACY.md
```

---

## 4. Graphic Assets Checklist

| Asset | Dimensions | Requirement | Location in Repo |
| :--- | :--- | :--- | :--- |
| **Store Icon** | 128 x 128 px (PNG) | **Required** | `public/icons/icon-128.png` |
| **Screenshot 1** | 1280 x 800 px (PNG/JPEG) | **Required** (At least 1) | Capture of Aura Digital Clock & Nature Wallpaper |
| **Screenshot 2** | 1280 x 800 px (PNG/JPEG) | Recommended | Capture of Aura Analog Clock Layout |
| **Screenshot 3** | 1280 x 800 px (PNG/JPEG) | Recommended | Capture of Settings Drawer (Customizer) |
| **Small Promo Tile** | 440 x 280 px (PNG) | Recommended | Minimal banner with Aura icon & title |
| **Marquee Promo Tile** | 1400 x 560 px (PNG) | Optional | Banner for CWS featured promotions |

---

## 5. Upload & Submission Steps

1. Run `npm run package` in your terminal to build and produce `aura-extension.zip`.
2. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Click **Add new item** and drag and drop `aura-extension.zip`.
4. In the **Store Listing** tab, paste the Name, Summary, and Detailed Description provided in Section 2 above.
5. Upload the **128x128 icon** and at least one **1280x800 screenshot**.
6. In the **Privacy** tab:
   - Paste the **Single Purpose Description**.
   - Paste the **Host Permissions Justification**.
   - Enter the **Privacy Policy URL**.
   - Verify the data usage declarations.
7. Click **Save draft** and then **Submit for review**!
