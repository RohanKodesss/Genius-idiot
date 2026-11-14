import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, THEME_KEY } from '../lib/theme';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const next = theme === 'dark' ? 'light' : 'dark';

  const toggle = () => {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage can be blocked; the theme still applies for this page view.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`grid h-9 w-9 place-items-center rounded-xl border border-transparent text-slate hover:border-sand hover:bg-ivory hover:text-ink ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
