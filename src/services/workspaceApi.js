import { APP_NAME } from "../config/branding"; // TAKEGRID_BRANDING_V1
// Flask API base URL is configured at build-time via VITE_API_BASE_URL.
// No API key or privileged token should ever be placed in Vite environment variables.
const rawBase = import.meta.env.VITE_API_BASE_URL || "";
export const aiConfigured = Boolean(rawBase.trim());
const BASE = rawBase.replace(/\/$/, "");

export async function requestProjectAI(projectId, operation, payload, options = {}) {
  if (!aiConfigured) throw new Error("AI backend not connected. Set VITE_API_BASE_URL after Flask is ready.");
  const { signal, timeoutMs } = options;
  const controller = timeoutMs ? new AbortController() : null;
  let timedOut = false;
  const abort = () => controller?.abort();
  if (signal?.aborted) throw new Error("AI request cancelled.");
  signal?.addEventListener("abort", abort, { once: true });
  const timer = controller ? setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs) : null;
  try {
    const response = await fetch(`${BASE}/api/projects/${encodeURIComponent(projectId)}/ai/${operation}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      signal: controller ? controller.signal : signal,
    });
    let data = null;
    try { data = await response.json(); } catch { /* non-JSON error */ }
    if (!response.ok || data?.success === false) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
  } catch (error) {
    if (timedOut) throw new Error("Story extraction took too long (75 seconds). AI may be overloaded or rate-limited. Nothing was saved. Retry shortly.");
    if (signal?.aborted || error?.name === "AbortError") throw new Error("Story extraction cancelled. Your story was not changed.");
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
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
  if (!aiConfigured) throw new Error(`${APP_NAME} AI backend is not connected.`);
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
  if (!type.startsWith("image/")) throw new Error(`${APP_NAME} AI did not return an image.`);
  return response.blob();
}
export async function uploadStoryboardFrame(blob) {
  if (!aiConfigured) throw new Error(`${APP_NAME} AI backend is not connected.`);
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

// FRAMEFORGE_CRITICS_REIMAGINE_V1
// Reuse the existing Flask Story Editor; no backend or other AI feature changes.
export async function requestStoryReimagination(payload) {
  if (!aiConfigured) throw new Error("AI backend not connected. Set VITE_API_BASE_URL.");
  // TAKEGRID_REIMAGINE_RELIABILITY_V1: Never leave the preview skeleton stuck indefinitely.
  // Abort is a browser-side deadline; an already-running Flask/Gemini request may still finish.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 150_000);
  try {
    const response = await fetch(`${BASE}/api/ai/story/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    let data = null;
    try { data = await response.json(); } catch { /* non-JSON error */ }
    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || `Story reimagination failed (${response.status}).`);
    }
    if (typeof data?.edited_story !== "string" || !data.edited_story.trim()) {
      throw new Error("AI returned an invalid reimagined story.");
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Reimagine exceeded 150 seconds. The AI models may be busy or rate-limited. Your story was not changed. Check backend logs before retrying.");
    }
    if (error instanceof TypeError) {
      throw new Error("Cannot reach the TakeGrid AI backend. Check that Flask is running and the connection is available.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
