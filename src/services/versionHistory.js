// Version history is separate from the user's existing project storage.
// A failed history write must NEVER interrupt or undo the user's regular Save.
const PREFIX = "frameforge_project_versions_v1_";
const MAX_ENTRIES = 24;
const MAX_CHARS = 1_250_000;
const SKIP_FIELDS = new Set(["id", "createdAt", "updatedAt"]);

const clone = (value) => JSON.parse(JSON.stringify(value));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function readVersions(projectId) {
  if (!projectId) return [];
  try {
    const data = JSON.parse(localStorage.getItem(PREFIX + projectId) || "[]");
    return Array.isArray(data) ? data.filter(item =>
      item && typeof item.id === "string" &&
      typeof item.createdAt === "string" &&
      item.before && typeof item.before === "object" &&
      item.after && typeof item.after === "object" &&
      Array.isArray(item.fields) && item.fields.length
    ) : [];
  } catch { return []; }
}

// Record only the fields actually saved, not the unsaved React draft.
// Each entry preserves values both immediately BEFORE and AFTER a save.
export function recordVersion(projectId, previous, next, label = "Changes saved") {
  if (!projectId || !previous || !next) return { recorded: false };
  const fields = [...new Set([...Object.keys(previous), ...Object.keys(next)])]
    .filter(key => !SKIP_FIELDS.has(key) && !equal(previous[key], next[key]));
  if (!fields.length) return { recorded: false };
  const before = {}, after = {};
  for (const field of fields) {
    before[field] = previous[field] === undefined ? null : clone(previous[field]);
    after[field] = next[field] === undefined ? null : clone(next[field]);
  }
  const version = {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(),
    label, fields, before, after,
  };
  try {
    let entries = [version, ...readVersions(projectId)].slice(0, MAX_ENTRIES);
    // Keep history within a small browser-storage budget; discard oldest first.
    let serialized = JSON.stringify(entries);
    while (serialized.length > MAX_CHARS && entries.length > 1) {
      entries = entries.slice(0, -1);
      serialized = JSON.stringify(entries);
    }
    if (serialized.length > MAX_CHARS) return { recorded: false, warning: "This save is too large for browser version history." };
    localStorage.setItem(PREFIX + projectId, serialized);
    return { recorded: true };
  } catch {
    return { recorded: false, warning: "Saved successfully, but browser storage could not keep a history snapshot." };
  }
}

export function applyVersionFields(current, version, side) {
  if (!version || !["before", "after"].includes(side)) throw new Error("Invalid version selection.");
  const data = version[side];
  if (!data || !Array.isArray(version.fields) || !version.fields.length) throw new Error("Invalid version data.");
  const next = { ...current };
  for (const field of version.fields) {
    if (SKIP_FIELDS.has(field) || !Object.prototype.hasOwnProperty.call(data, field)) throw new Error("Version data is incomplete.");
    next[field] = clone(data[field]);
  }
  if (!next.title || typeof next.title !== "string" || !next.title.trim()) {
    throw new Error("Cannot restore an empty project title.");
  }
  return next;
}
