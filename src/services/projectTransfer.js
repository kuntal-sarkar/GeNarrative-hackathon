import { getProject, saveProject, deleteProject } from "./projectService.js";
import { readVersions } from "./versionHistory.js";

const FORMAT = "frameforge-project-backup";
const VERSION = 1;
const VERSION_PREFIX = "frameforge_project_versions_v1_";
const MAX_BACKUP_BYTES = 12 * 1024 * 1024;
const cleanFilename = (s) => String(s || "project").replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 80) || "project";
const clone = (value) => JSON.parse(JSON.stringify(value));
const isObject = value => Boolean(value && typeof value === "object" && !Array.isArray(value));

export function downloadText(filename, content, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["\ufeff", content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function getSavedProject(projectId) {
  const project = getProject(projectId);
  if (!project) throw new Error("Saved project not found. Save your changes first.");
  return project;
}

function readableScenes(project, includeShots) {
  const scenes = Array.isArray(project.scenes) ? project.scenes : [];
  const lines = [];
  scenes.forEach((scene, index) => {
    lines.push(`Scene ${index + 1}: ${scene.name || scene.heading || "Untitled scene"}`);
    if (scene.heading && scene.heading !== scene.name) lines.push(scene.heading);
    if (scene.description) lines.push(scene.description);
    if (includeShots) (Array.isArray(scene.shots) ? scene.shots : []).forEach((shot, shotIndex) => {
      lines.push(`  Shot ${shotIndex + 1}: ${shot.name || "Untitled shot"}`);
      ["type", "angle", "movement", "lighting", "mood", "duration", "description", "notes"].forEach(key => {
        if (shot[key] !== undefined && shot[key] !== null && String(shot[key]).trim()) {
          lines.push(`  ${key[0].toUpperCase() + key.slice(1)}: ${shot[key]}`);
        }
      });
    });
    lines.push("");
  });
  return lines.join("\n").trim();
}

export function formattedExport(project, selection) {
  const chunks = [];
  const add = (label, text) => {
    if (typeof text === "string" && text.trim()) chunks.push({ title: label, text: text.trim() });
  };
  if (selection === "story" || selection === "all") {
    add("Story idea / synopsis", project.idea);
    add("Story", project.story);
  }
  if (selection === "scenes") add("Scenes", readableScenes(project, false));
  if (selection === "shots" || selection === "all") add("Scenes & shots", readableScenes(project, true));
  return { title: project.title || "Untitled Story", meta: [project.genre, project.language].filter(Boolean).join("  |  "), chunks };
}

export function exportTxt(projectId, selection) {
  const report = formattedExport(getSavedProject(projectId), selection);
  const text = [report.title, report.meta, "", ...report.chunks.flatMap(c => [c.title.toUpperCase(), "-".repeat(c.title.length), c.text, ""])].join("\n");
  downloadText(`${cleanFilename(report.title)}-${selection}.txt`, text);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function exportPdf(projectId, selection) {
  const report = formattedExport(getSavedProject(projectId), selection);
  const popup = window.open("", "_blank");
  if (!popup) throw new Error("The browser blocked the PDF window. Allow pop-ups for this site and try again.");
  const sections = report.chunks.length ? report.chunks.map(c => `<section><h2>${escapeHtml(c.title)}</h2><div class="content">${escapeHtml(c.text)}</div></section>`).join("") : "<p>No saved content in this section yet.</p>";
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(report.title)} - FRAMEFORGE</title><style>
    @page{size:A4;margin:20mm 18mm}*{box-sizing:border-box}body{font:12pt/1.6 system-ui,-apple-system,'Segoe UI',Arial,sans-serif;color:#172a46;max-width:850px;margin:36px auto;padding:0 24px}
    header{border-bottom:2px solid #ff6b5b;padding-bottom:18px;margin-bottom:28px}small{color:#6c7f9d;letter-spacing:.13em;font-weight:700;font-size:10px}h1{font-size:27px;line-height:1.22;margin:8px 0}header p{margin:0;color:#5e708b;font-size:12px}h2{font-size:16px;margin:28px 0 12px;break-after:avoid}section{break-inside:auto}.content{white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;font-size:11pt;line-height:1.65}section+section{border-top:1px solid #dce5ed;margin-top:28px}footer{margin-top:36px;font-size:10px;color:#7b8ca0}
    .notice{margin:12px 0 22px;border:1px solid #f4d4cb;border-radius:10px;background:#fff4dc;padding:12px 15px;font-size:12px;print-color-adjust:exact}
    @media print{body{max-width:none;margin:0;padding:0}.notice{display:none}}
  </style></head><body><div class="notice">Choose <strong>Save as PDF</strong> in the print dialog. This preview uses your browser's PDF engine for accurate text and language support.</div><header><small>FRAMEFORGE / CREATIVE PRODUCTION</small><h1>${escapeHtml(report.title)}</h1><p>${escapeHtml(report.meta)}</p></header>${sections}<footer>Exported from saved project content · FRAMEFORGE</footer></body></html>`;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  // Let the page paint before triggering the browser print / Save as PDF dialog.
  popup.setTimeout(() => popup.print(), 400);
}

export function exportJsonBackup(projectId) {
  const project = getSavedProject(projectId);
  const payload = {
    format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(),
    project: clone(project), versions: readVersions(projectId),
  };
  downloadText(`${cleanFilename(project.title)}-frameforge-backup.json`, JSON.stringify(payload, null, 2) + "\n", "application/json;charset=utf-8");
}

function validVersion(entry) {
  return isObject(entry) && typeof entry.id === "string" && typeof entry.createdAt === "string" && typeof entry.label === "string" &&
    Array.isArray(entry.fields) && entry.fields.length > 0 && entry.fields.every(field => typeof field === "string" && !["id", "createdAt", "updatedAt"].includes(field)) &&
    isObject(entry.before) && isObject(entry.after) &&
    entry.fields.every(field => Object.prototype.hasOwnProperty.call(entry.before, field) && Object.prototype.hasOwnProperty.call(entry.after, field));
}

export async function inspectBackup(file) {
  if (!file) throw new Error("Choose a JSON backup file.");
  if (file.size > MAX_BACKUP_BYTES) throw new Error("Backup is larger than the 12 MB safety limit.");
  const data = JSON.parse(await file.text());
  if (!isObject(data) || data.format !== FORMAT || data.version !== VERSION || !isObject(data.project) || !Array.isArray(data.versions)) {
    throw new Error("This is not a compatible FRAMEFORGE project backup (version 1).");
  }
  const p = data.project;
  if (typeof p.id !== "string" || !p.id || typeof p.title !== "string" || !p.title.trim() ||
      typeof p.story !== "string" || typeof p.idea !== "string" || !Array.isArray(p.scenes) ||
      p.scenes.some(scene => !isObject(scene) || typeof scene.id !== "string" || (scene.shots !== undefined && (!Array.isArray(scene.shots) || scene.shots.some(shot => !isObject(shot) || typeof shot.id !== "string")))) ||
      (p.characters !== undefined && (!Array.isArray(p.characters) || p.characters.some(c => !isObject(c)))) ||
      data.versions.length > 24 || data.versions.some(entry => !validVersion(entry))) {
    throw new Error("Backup project/history data is incomplete or invalid.");
  }
  return { payload: data, preview: {
    title: p.title, genre: p.genre || "", language: p.language || "",
    scenes: p.scenes.length, shots: p.scenes.reduce((n, scene) => n + (scene.shots?.length || 0), 0),
    characters: Array.isArray(p.characters) ? p.characters.length : 0, versions: data.versions.length,
  }};
}

// Import creates a separate ID. Existing projects and their browser history are never overwritten.
export function restoreAsNewProject(payload) {
  if (!payload || payload.format !== FORMAT || payload.version !== VERSION || !isObject(payload.project)) {
    throw new Error("Backup validation failed. Re-select the JSON file.");
  }
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const source = clone(payload.project);
  const project = { ...source, id, title: `${source.title} (Restored)`, createdAt: now, updatedAt: now };
  let projectWritten = false;
  try {
    // Save the history first so a quota error leaves the original project list unchanged.
    if (payload.versions.length) localStorage.setItem(VERSION_PREFIX + id, JSON.stringify(payload.versions));
    saveProject(project);
    projectWritten = true;
    return id;
  } catch (error) {
    // Only delete the newly generated ID, never the imported-from or existing project.
    if (projectWritten) { try { deleteProject(id); } catch { /* best effort */ } }
    localStorage.removeItem(VERSION_PREFIX + id);
    throw new Error(`Could not restore this backup. ${error?.message || "Check available browser storage."}`);
  }
}
