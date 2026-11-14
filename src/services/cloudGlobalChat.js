import { supabase } from './supabaseClient';

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(method, body) {
  if (!supabase) throw new Error('Supabase Auth is not configured.');
  if (!BASE) throw new Error('VITE_API_BASE_URL is not configured.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error('Sign in required.');
  const response = await fetch(`${BASE}/api/user/global-chat`, {
    method,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Global chat request failed (${response.status}).`);
  }
  return payload;
}

export const fetchGlobalChat = () => request('GET');
export const pushGlobalChat = (threads, currentId) => request('PUT', { threads, currentId });
