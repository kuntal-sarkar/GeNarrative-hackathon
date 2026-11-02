// Temporary browser persistence. Only user-created content is stored.
const STORAGE_KEY = "frameforge_projects_v1";
const LEGACY_STORAGE_KEY = "frameforge_story_draft_v1";

export function getProjects() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((p) => p && typeof p.id === "string").map((p) => ({
      ...p,
      title: typeof p.title === "string" ? p.title : "Untitled Story",
      story: typeof p.story === "string" ? p.story : "",
      idea: typeof p.idea === "string" ? p.idea : "",
      genre: typeof p.genre === "string" ? p.genre : "Drama",
      language: typeof p.language === "string" ? p.language : "English",
      mode: ["ai", "script", "blank"].includes(p.mode) ? p.mode : "blank",
      scenes: Array.isArray(p.scenes) ? p.scenes.filter((s) => s && typeof s.id === "string") : [],
    }));
  } catch {
    return [];
  }
}

export function getProject(id) {
  return getProjects().find((p) => p.id === id) || null;
}

export function createProject(mode = "blank") {
  const now = new Date().toISOString();
  const project = {
    id: crypto.randomUUID(), title: "Untitled Story", idea: "", story: "",
    genre: "Drama", language: "English", mode, scenes: [],
    createdAt: now, updatedAt: now,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([project, ...getProjects()]));
  window.dispatchEvent(new Event("frameforge:projects-changed"));
  return project;
}

export function saveProject(project) {
  if (!project?.id) throw new Error("Invalid project");
  const saved = { ...project, updatedAt: new Date().toISOString() };
  const existing = getProjects();
  const next = existing.some((p) => p.id === saved.id)
    ? existing.map((p) => p.id === saved.id ? saved : p)
    : [saved, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("frameforge:projects-changed"));
  return saved;
}

export function deleteProject(id) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getProjects().filter((p) => p.id !== id)));
  window.dispatchEvent(new Event("frameforge:projects-changed"));
}

// Do not erase old drafts. Provide an explicit migration path only if requested.
export function hasLegacyDraft() {
  return Boolean(localStorage.getItem(LEGACY_STORAGE_KEY));
}
