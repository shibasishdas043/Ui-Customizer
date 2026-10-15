# Privacy Policy for Aura · UI Customizer & Startpage

**Last Updated:** October 2026

Aura ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains our data collection and privacy practices for the **Aura · UI Customizer & Startpage** browser extension.

---

## 1. Single Purpose Description
Aura is a minimalist, privacy-first new-tab startpage and browser dashboard that provides customizable 4K wallpapers, time and date displays, local weather forecasts, quick navigation bookmarks, and productivity widgets.

---

## 2. Information Collection and Use

### No Personal Data Collection
- **We do not collect, store, transmit, or share any personally identifiable information (PII).**
- There are no user accounts, logins, telemetry systems, advertising trackers, or analytical beacons included in Aura.
- We do not sell, rent, monetize, or disclose your personal data or browsing activity to any third parties.

### Local Client-Side Storage
All user configurations, preferences, and cached assets are stored **strictly on your local device** using standard browser storage APIs (`chrome.storage.local` and `localStorage` / `IndexedDB`):
- **User Interface Preferences:** Chosen theme (dark/light), accent color, typography, clock format (12/24 hour), and custom CSS.
- **Wallpaper Settings:** Selected provider, collection IDs, search keywords, blur/brightness levels, and rolling offline wallpaper cache.
- **Bookmarks & Quick Links:** Custom shortcut links and icons created by the user.
- **Weather Configuration:** Temperature unit (°C/°F) and selected city/coordinates.

---

## 3. Browser Permissions Justification

Aura adheres strictly to Google's **Least Privilege Principle**. We only request permissions essential to the core functionality of the extension:

| Permission | Purpose |
| :--- | :--- |
| `storage` | Saves user customizer preferences, widget visibility, and bookmarks locally across browser sessions. |

### Host Permissions Justification
Aura makes direct, client-side HTTP requests exclusively to fetch user-requested resources:

| Host Pattern | Justification |
| :--- | :--- |
| `https://services.bonjourr.fr/*`<br/>`https://images.unsplash.com/*`<br/>`https://unsplash.com/*` | Curates and fetches dynamic high-resolution photography from Unsplash. |
| `https://wallhaven.cc/*` | Searches and retrieves high-resolution wallpapers from Wallhaven when the Wallhaven provider is selected. |
| `https://www.bing.com/*`<br/>`https://bing.biturl.top/*` | Downloads Microsoft's daily curated wallpaper when the Bing Daily provider is selected. |
| `https://*.reddit.com/*`<br/>`https://*.redd.it/*` | Retrieves community photography from photography subreddits (e.g. `r/wallpapers`, `r/EarthPorn`) when Reddit mode is chosen. |
| `https://api.open-meteo.com/*`<br/>`https://geocoding-api.open-meteo.com/*` | Fetches non-commercial, open-source weather and temperature forecasts. |
| `https://ipapi.co/*` | Provides optional approximate city/region geolocation when automatic weather location is enabled (coordinates are never logged or stored externally). |

---

## 4. Third-Party Services & Links
When you use optional search engines (Google, DuckDuckGo, Bing, Ecosia, etc.) or click bookmark shortcuts, you are directed to third-party websites governed by their respective privacy policies. Aura does not track or intercept your search queries or outbound link clicks.

---

## 5. Security
Because all processing and caching take place locally within your browser sandbox, your settings and browsing habits remain confidential on your device.

---

## 6. Open Source & Transparency
Aura is open-source software. You can inspect the complete source code, build scripts, and dependencies on GitHub:
[https://github.com/shibasishdas043/Ui-Customizer](https://github.com/shibasishdas043/Ui-Customizer)

---

## 7. Contact
If you have any questions or concerns regarding this Privacy Policy, please open an issue on our GitHub repository:
[https://github.com/shibasishdas043/Ui-Customizer/issues](https://github.com/shibasishdas043/Ui-Customizer/issues)
