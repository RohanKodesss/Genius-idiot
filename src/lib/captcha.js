// Cloudflare Turnstile. The site key is public; the secret lives in Supabase
// (Authentication → Attack Protection → Bot and Abuse Protection).
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
export const CAPTCHA_ENABLED = TURNSTILE_SITE_KEY.length > 0;

let loader;

export function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No browser'));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loader ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => {
      loader = undefined;
      reject(new Error('CAPTCHA failed to load. Check your connection and refresh.'));
    };
    document.head.appendChild(script);
  });
  return loader;
}
