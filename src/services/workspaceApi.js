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

// Multipart variant for messages with attachments. Backend must explicitly implement
// this contract: a JSON `payload` field and repeated `files` multipart fields.
// No file contents are stored in project localStorage.
export async function requestProjectAIWithAttachments(projectId, operation, payload, files) {
  if (!aiConfigured) throw new Error("AI backend not connected. Set VITE_API_BASE_URL after Flask is ready.");
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  for (const file of files) form.append("files", file, file.name);
  const response = await fetch(`${BASE}/api/projects/${encodeURIComponent(projectId)}/ai/${operation}`, {
    method: "POST",
    body: form, // Browser sets multipart/form-data boundary automatically.
  });
  let data = null;
  try { data = await response.json(); } catch { /* non-JSON backend error */ }
  if (!response.ok) throw new Error(data?.error || `Attachment request failed (${response.status}). The backend must support multipart uploads.`);
  return data;
}


// Character Bible AI — Flask + Gemini integration
// POST /api/ai/characters/generate
export async function requestCharacterBible(payload) {
  if (!aiConfigured) {
    throw new Error(
      "AI backend not connected. Set VITE_API_BASE_URL."
    );
  }

  const response = await fetch(
    `${BASE}/api/ai/characters/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from Character Bible API.");
  }

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.error || `Character Bible request failed (${response.status})`
    );
  }

  return data;
}