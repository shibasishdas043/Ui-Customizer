// Bypass Chrome's native Omnibox focus lock on New Tab pages (chrome_url_overrides)
// By replacing the URL with '?focus=1' on initial load, Chrome relinquishes omnibox focus
// to the webpage, allowing the search bar input to gain autofocus instantly.
(function () {
  try {
    if (typeof window !== 'undefined' && window.location) {
      var search = window.location.search || '';
      if (!search.includes('focus')) {
        var sep = search.length > 0 ? '&' : '?';
        window.location.replace(window.location.pathname + search + sep + 'focus=1');
      }
    }
  } catch {
    // Safe fallback
  }
})();
