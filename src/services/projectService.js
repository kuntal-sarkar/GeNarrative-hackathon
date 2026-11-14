import {
  listCloudProjects,
  createCloudProject,
  updateCloudProject,
  deleteCloudProject,
} from "./cloudProjects";

const LEGACY_KEY = "frameforge_projects_v1";
const DRAFT_KEY = "frameforge_story_draft_v1";
const prefix = "takegrid:account-projects:v2:";
const pendingPrefix = "takegrid:pending-projects:v2:";
const remotePrefix = "takegrid:known-cloud-projects:v2:";

let activeUserId = null;
let ready = false;
let flushing = false;
let bootVersion = 0;
let debounceTimer = null;
let syncError = "";
let pendingPromise = Promise.resolve();

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("takegrid:projects-changed"));
}

function accountKey() { return activeUserId ? `${prefix}${activeUserId}` : LEGACY_KEY; }
function pendingKey() { return `${pendingPrefix}${activeUserId}`; }
function cloudKey() { return `${remotePrefix}${activeUserId}`; }
function parse(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value ?? fallback; }
  catch { return fallback; }
}
function validItems(value) { return Array.isArray(value) ? value.filter((p) => p && typeof p.id === "string") : []; }
function pendingOps() { return activeUserId ? parse(pendingKey(), {}) : {}; }
function knownCloud() { return new Set(activeUserId ? parse(cloudKey(), []) : []); }
function storeKnown(set) { localStorage.setItem(cloudKey(), JSON.stringify([...set])); }
function putProjects(items) { localStorage.setItem(accountKey(), JSON.stringify(items)); notify(); }
function setError(message) {
  syncError = message || "";
  if (syncError) console.error("[TakeGrid cloud sync]", syncError);
  notify();
}
function storeOp(projectId, op) {
  const ops = pendingOps();
  ops[projectId] = { ...op, stamp: `${Date.now()}-${crypto.randomUUID()}` };
  localStorage.setItem(pendingKey(), JSON.stringify(ops));
  scheduleFlush();
}

export function getProjects() {
  return validItems(parse(accountKey(), [])).map((p) => ({
    ...p,
    title: typeof p.title === "string" ? p.title : "Untitled Story",
    story: typeof p.story === "string" ? p.story : "",
    idea: typeof p.idea === "string" ? p.idea : "",
    genre: typeof p.genre === "string" ? p.genre : "Drama",
    language: typeof p.language === "string" ? p.language : "English",
    mode: ["ai", "script", "blank"].includes(p.mode) ? p.mode : "blank",
    scenes: Array.isArray(p.scenes) ? p.scenes.filter((s) => s && typeof s.id === "string") : [],
  }));
}
export function getProject(id) { return getProjects().find((p) => p.id === id) || null; }

export function createProject(mode = "blank") {
  const now = new Date().toISOString();
  const project = {
    id: crypto.randomUUID(), title: "Untitled Story", idea: "", story: "",
    genre: "Drama", language: "English", mode, scenes: [],
    createdAt: now, updatedAt: now,
  };
  putProjects([project, ...getProjects()]);
  if (activeUserId) storeOp(project.id, { type: "upsert", project });
  return project;
}
export function saveProject(project) {
  if (!project?.id) throw new Error("Invalid project");
  const saved = { ...project, updatedAt: new Date().toISOString() };
  const existing = getProjects();
  const next = existing.some((p) => p.id === saved.id)
    ? existing.map((p) => p.id === saved.id ? saved : p)
    : [saved, ...existing];
  putProjects(next);
  if (activeUserId) storeOp(saved.id, { type: "upsert", project: saved });
  return saved;
}
export function deleteProject(id) {
  putProjects(getProjects().filter((p) => p.id !== id));
  if (activeUserId) storeOp(id, { type: "delete" });
}
export function hasLegacyDraft() { return Boolean(localStorage.getItem(DRAFT_KEY)); }

export function cloudSyncStatus() {
  return {
    signedIn: Boolean(activeUserId),
    ready,
    queued: Object.keys(pendingOps()).length,
    syncing: flushing,
    error: syncError,
  };
}

function scheduleFlush() {
  if (!activeUserId || !ready) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { void flushCloudProjects(); }, 650);
}

export async function flushCloudProjects() {
  if (!activeUserId || !ready || flushing) return;
  const owner = activeUserId;
  const version = bootVersion;
  flushing = true;
  notify();
  try {
    // Serialized writes: later edits for the same project cannot be overwritten by earlier requests.
    const ops = pendingOps();
    for (const [id, op] of Object.entries(ops)) {
      if (activeUserId !== owner || bootVersion !== version) break;
      const known = knownCloud();
      try {
        if (op.type === "delete") {
          if (known.has(id)) await deleteCloudProject(id);
          known.delete(id);
        } else if (op.project) {
          if (known.has(id)) await updateCloudProject(op.project);
          else await createCloudProject(op.project);
          known.add(id);
        }
        if (activeUserId !== owner || bootVersion !== version) break;
        storeKnown(known);
        const latest = pendingOps();
        if (latest[id]?.stamp === op.stamp) {
          delete latest[id];
          localStorage.setItem(pendingKey(), JSON.stringify(latest));
        }
        syncError = "";
      } catch (error) {
        setError(error?.message || "Cloud save failed.");
        // Do NOT discard unsuccessful operations; retry on next edit/reload or manual retry.
        break;
      }
    }
  } finally {
    flushing = false;
    notify();
    if (activeUserId === owner && bootVersion === version && !syncError && Object.keys(pendingOps()).length) scheduleFlush();
  }
}

export async function activateCloudProjects(userId) {
  const version = ++bootVersion;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = null;
  ready = false;
  syncError = "";
  activeUserId = userId || null;
  notify();
  if (!activeUserId) { ready = true; return; }

  const owner = activeUserId;
  try {
    const result = await listCloudProjects();
    if (bootVersion !== version || activeUserId !== owner) return;
    const remote = validItems(result.projects);
    const local = validItems(parse(accountKey(), []));
    const pending = pendingOps();
    const remoteIds = new Set(remote.map((p) => p.id));
    // Cloud is authoritative, except for unsent local operations kept in the retry queue.
    // Do not silently import legacy browser projects into another user's account.
    const merged = new Map(remote.map((p) => [p.id, p]));
    for (const [id, op] of Object.entries(pending)) {
      if (op.type === "delete") merged.delete(id);
      else if (op.type === "upsert" && op.project) merged.set(id, op.project);
    }
    // Unqueued local-only records are not silently pushed or merged across accounts.
    // Prior cloud IDs are retained for update-vs-create decisions.
    storeKnown(remoteIds);
    putProjects([...merged.values()].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")));
    ready = true;
    scheduleFlush();
  } catch (error) {
    if (bootVersion !== version || activeUserId !== owner) return;
    setError(`Could not load cloud projects: ${error?.message || "Unknown error"}`);
    // Fail CLOSED: don't allow edits to an incomplete local snapshot that might
    // silently overwrite newer cloud data. App bootstrap shows an error/retry.
    throw error;
  }
}

export function deactivateCloudProjects() {
  ++bootVersion;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = null;
  activeUserId = null;
  ready = false;
  syncError = "";
  notify();
}
