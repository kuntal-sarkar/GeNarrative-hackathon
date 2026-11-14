// Supabase access tokens are fetched at request time; never store in UI state.
import { supabase } from './supabaseClient';

export async function authorizedAIFetch(url, options = {}) {
  if (!supabase) throw new Error('Supabase Auth is not configured.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) {
    throw new Error('Please sign in to use TakeGrid AI.');
  }
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  // The browser must set the multipart boundary; do not set Content-Type for FormData.
  return fetch(url, { ...options, headers });
}
