import { useEffect, useRef } from 'react';

// Shared, explicit-render Cloudflare Turnstile script. Supabase Auth validates
// the resulting captchaToken; the frontend must NEVER receive the secret key.
let turnstileLoader;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileLoader) {
    turnstileLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable'));
      script.onerror = () => reject(new Error('Unable to load Turnstile'));
      document.head.appendChild(script);
    });
  }
  return turnstileLoader;
}

export const turnstileConfigured = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim());

export default function AuthTurnstile({ onToken, resetKey = 0 }) {
  const container = useRef(null);
  const widgetId = useRef(null);
  const callbackRef = useRef(onToken);
  callbackRef.current = onToken;

  useEffect(() => {
    let active = true;
    let api;
    callbackRef.current?.('');
    if (!turnstileConfigured) return () => {};
    loadTurnstile().then((turnstile) => {
      if (!active || !container.current) return;
      api = turnstile;
      widgetId.current = turnstile.render(container.current, {
        sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY.trim(),
        theme: 'light',
        callback: (token) => callbackRef.current?.(token),
        'expired-callback': () => callbackRef.current?.(''),
        'error-callback': () => callbackRef.current?.(''),
      });
    }).catch(() => callbackRef.current?.(''));
    return () => {
      active = false;
      if (api && widgetId.current !== null) {
        try { api.remove(widgetId.current); } catch { /* Widget already removed */ }
      }
      widgetId.current = null;
    };
  }, [resetKey]);

  if (!turnstileConfigured) return <p role="alert" className="tg-auth-feedback tg-auth-error">Turnstile site key missing. Add VITE_TURNSTILE_SITE_KEY to frontend .env.local.</p>;
  return <div style={{ margin: '12px 0', minHeight: 65 }} ref={container} aria-label="Bot verification" />;
}
