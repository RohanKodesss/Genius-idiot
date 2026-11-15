// Theme selection, kept pure so it can be tested without a browser.
export const THEME_KEY = 'gi:theme';

// `stored` is whatever was saved last; falls back to the OS preference.
export function resolveTheme(stored, prefersDark) {
  if (stored === 'dark' || stored === 'light') return stored;
  return prefersDark ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0A0A0A' : '#F7F7F4');
}
