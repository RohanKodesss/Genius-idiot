import { useEffect, useRef } from 'react';
import { CAPTCHA_ENABLED, TURNSTILE_SITE_KEY, loadTurnstile } from '../lib/captcha';

// Renders a Turnstile widget and reports its single-use token. Remount (change
// `key`) to reset it after a failed attempt.
export default function Turnstile({ onToken, onError }) {
  const container = useRef(null);
  const callbacks = useRef({ onToken, onError });
  callbacks.current = { onToken, onError };

  useEffect(() => {
    if (!CAPTCHA_ENABLED) return undefined;
    let widgetId;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        widgetId = turnstile.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
          callback: (token) => callbacks.current.onToken?.(token),
          'expired-callback': () => callbacks.current.onToken?.(''),
          'error-callback': () => callbacks.current.onToken?.(''),
        });
      })
      .catch((error) => callbacks.current.onError?.(error.message));

    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, []);

  if (!CAPTCHA_ENABLED) return null;
  return <div ref={container} className="flex justify-center" />;
}
