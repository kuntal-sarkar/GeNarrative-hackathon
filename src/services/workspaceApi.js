// Flask API base URL is configured at build-time via VITE_API_BASE_URL.
// No API key or privileged token should ever be placed in Vite environment variables.
const rawBase = import.meta.env.VITE_API_BASE_URL || "";
export const aiConfigured = Boolean(rawBase.trim());
const BASE = rawBase.replace(/\/$/, "");

export async function requestProjectAI(projectId, operation, payload) {
  if (!aiConfigured) throw new Error("AI backend not connected. Set VITE_API_BASE_URL after Flask is ready.");
  const response = await fetch(`${BASE}/api/projects/${encodeURIComponent(projectId)}/ai/${operation}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let data = null;
  try { data = await response.json(); } catch { /* non-JSON error */ }
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data;
}
