// Bypass Chrome's native Omnibox focus lock on New Tab pages (chrome_url_overrides)
// Only when the user has Auto-Focus enabled in extension settings.
(function () {
  try {
    if (typeof window === 'undefined' || !window.location) return;

    // 1. Only execute in browser extension context (Chrome / Edge / Firefox extension newtab)
    var isExtension =
      window.location.protocol === 'chrome-extension:' ||
      window.location.protocol === 'moz-extension:' ||
      window.location.protocol === 'edge-extension:';

    var rawSettings = localStorage.getItem('aura_customizer_settings_v1');
    var isAutoFocusEnabled = true;

    if (rawSettings) {
      try {
        var parsed = JSON.parse(rawSettings);
        if (parsed.showSearch === false || parsed.searchAutoFocus === false) {
          isAutoFocusEnabled = false;
        }
      } catch {
        // Fallback to default
      }
    }

    var search = window.location.search || '';

    // 2. When Auto-Focus is turned OFF by the user:
    // Do NOT redirect. Clean any residual focus parameter so Chrome preserves
    // its native omnibox focus and clean address bar.
    if (!isAutoFocusEnabled) {
      if (search.includes('focus')) {
        var cleanQuery = search
          .replace(/[?&]focus=[^&]*/g, '')
          .replace(/^&/, '?');
        var cleanUrl = window.location.pathname + (cleanQuery.length > 1 ? cleanQuery : '');
        window.history.replaceState(null, '', cleanUrl);
      }
      return;
    }

    // 3. When Auto-Focus IS enabled:
    // Only in extension context, replace URL once with '?focus=1' to relinquish omnibox focus to the page
    if (isExtension && !search.includes('focus')) {
      var sep = search.length > 0 ? '&' : '?';
      window.location.replace(window.location.pathname + search + sep + 'focus=1');
    }
  } catch {
    // Safe fallback
  }
})();
