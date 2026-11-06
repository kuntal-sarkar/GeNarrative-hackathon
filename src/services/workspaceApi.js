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
// Scene Breakdown AI â€” reuse the existing Flask endpoint and private backend key.
export async function requestSceneBreakdown(payload) {
  if (!aiConfigured) throw new Error("AI backend not connected. Set VITE_API_BASE_URL.");
  const response = await fetch(`${BASE}/api/ai/scenes/breakdown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let data = null;
  try { data = await response.json(); } catch { throw new Error("Invalid response from Scene Breakdown API."); }
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Scene Breakdown request failed (${response.status})`);
  }
  return data;
}

// FRAMEFORGE_STORYBOARD_V1_API
export async function requestStoryboardImage(description, style = "black_white", quality = "standard") {
  if (!aiConfigured) throw new Error("FRAMEFORGE AI backend is not connected.");
  const response = await fetch(`${BASE}/api/ai/storyboard/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, style, quality }),
  });
  if (!response.ok) {
    let error = `Frame generation failed (${response.status}).`;
    try { const data = await response.json(); if (data?.error) error = data.error; } catch { /* response may not be JSON */ }
    throw new Error(error);
  }
  const type = response.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error("FRAMEFORGE AI did not return an image.");
  return response.blob();
}
export async function uploadStoryboardFrame(blob) {
  if (!aiConfigured) throw new Error("FRAMEFORGE AI backend is not connected.");
  const formData = new FormData();
  formData.append("image", blob, "frame.png");
  const response = await fetch(`${BASE}/api/ai/storyboard/frames`, { method: "POST", body: formData });
  let data = null;
  try { data = await response.json(); } catch { /* non-json error */ }
  if (!response.ok || !data?.success || !data.frameId) throw new Error(data?.error || `Could not store image (${response.status}).`);
  return data;
}
export function storyboardFrameUrl(frameId) {
  if (!aiConfigured || !/^[0-9a-f-]{36}$/.test(String(frameId || ""))) return "";
  return `${BASE}/api/ai/storyboard/frames/${encodeURIComponent(frameId)}`;
}
