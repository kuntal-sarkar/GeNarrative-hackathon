const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function requestGlobalAI(operation, payload, files = [], signal) {
  if (!BASE) throw new Error('AI backend not connected. Configure VITE_API_BASE_URL.');
  const options = { method: 'POST', signal };
  if (files.length) {
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    files.forEach(file => form.append('files', file, file.name));
    options.body = form;
  } else {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(payload);
  }
  const response = await fetch(`${BASE}/api/global-ai/${operation}`, options);
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    const status = response.status;
    const friendly = status === 429 || status === 503
      ? 'AI is busy right now. Please try again shortly.'
      : 'Something went wrong. Please try again.';
    const error = new Error(friendly);
    error.status = status;
    throw error;
  }
  return result;
}
