import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

// Publishable key only. Never put SUPABASE_SECRET_KEY in Vite env variables.
// TAKEGRID_RECOVERY_LINK_FIX_V2
// Capture recovery proof before Supabase consumes/cleans the URL fragment.
// Never retain or log the access/refresh tokens themselves.
export const recoveryRedirectDetected = typeof window !== 'undefined' &&
  window.location.pathname === '/reset-password' &&
  new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type') === 'recovery' &&
  !new URLSearchParams(window.location.hash.replace(/^#/, '')).has('error');

export const supabase = url && key
  ? createClient(url, key, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : null;
