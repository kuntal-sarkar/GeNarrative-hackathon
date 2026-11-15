import { getProjects } from "./projectService";

const clean = value => typeof value === "string" ? value.trim() : "";
const normalized = value => value.toLocaleLowerCase();
const uri = (id, section) => `/projects/${encodeURIComponent(id)}/${section}`;
const firstText = (...values) => values.find(value => clean(value)) || "";

// Only values from the current account's saved projects are searched.
// Collect nested text from known project sections without assuming a rigid AI response schema.
function textValues(value, depth = 0) {
  if (typeof value === "string") return value.trim() ? [value] : [];
  if (depth > 6 || value == null) return [];
  if (Array.isArray(value)) return value.flatMap(item => textValues(item, depth + 1));
  if (typeof value !== "object") return [];
  const excluded = new Set(["id", "owner_id", "ownerId", "createdAt", "updatedAt", "timestamp", "imageUrl", "previewUrl", "frameId", "url", "base64", "imageData", "blob", "mimeType", "contentType"]);
  return Object.entries(value).flatMap(([key, item]) => excluded.has(key) ? [] : textValues(item, depth + 1));
}

function snippet(value, term) {
  const source = clean(value).replace(/\s+/g, " ");
  const index = normalized(source).indexOf(term);
  const start = Math.max(0, index - 55);
  const end = Math.min(source.length, index + term.length + 92);
  return `${start ? "…" : ""}${source.slice(start, end)}${end < source.length ? "…" : ""}`;
}

// One result per saved entity. No arbitrary first-80 cap; users can scroll all matches.
export function searchSavedProjects(term) {
  const query = normalized(clean(term));
  if (!query) return [];
  const results = [];
  const add = (project, category, title, values, section, id) => {
    const fields = values.flatMap(value => textValues(value));
    const match = fields.find(value => normalized(value).includes(query));
    if (!match) return;
    results.push({
      id: `${project.id}:${category}:${id}`,
      category,
      title: clean(title) || `Untitled ${category.toLowerCase()}`,
      project: clean(project.title) || "Untitled project",
      preview: snippet(match, query),
      path: uri(project.id, section),
    });
  };

  for (const project of getProjects()) {
    if (!project?.id) continue;
    add(project, "Projects", project.title, [project.title, project.idea, project.genre, project.language, project.description, project.logline, project.synopsis], "overview", "project");
    add(project, "Stories", "Story text", [project.story], "story", "story");

    const characters = Array.isArray(project.characters) ? project.characters : [];
    characters.forEach((character, index) => {
      if (!character || typeof character !== "object") return;
      add(project, "Characters", firstText(character.name, `Character ${index + 1}`), [character], "characters", character.id || index);
    });

    const scenes = Array.isArray(project.scenes) ? project.scenes : [];
    scenes.forEach((scene, sceneIndex) => {
      if (!scene || typeof scene !== "object") return;
      const { shots, ...sceneContent } = scene;
      add(project, "Scenes", firstText(scene.name, scene.heading, scene.title, `Scene ${sceneIndex + 1}`), [sceneContent], "scenes", scene.id || sceneIndex);
      const nestedShots = Array.isArray(shots) ? shots : [];
      nestedShots.forEach((shot, shotIndex) => {
        if (!shot || typeof shot !== "object") return;
        add(project, "Shots", firstText(shot.name, shot.title, `Shot ${shotIndex + 1}`), [shot], "shots", `${scene.id || sceneIndex}:${shot.id || shotIndex}`);
      });
    });

    // Some TakeGrid project versions store shots as a project-level array.
    (Array.isArray(project.shots) ? project.shots : []).forEach((shot, index) => {
      if (!shot || typeof shot !== "object") return;
      add(project, "Shots", firstText(shot.name, shot.title, `Shot ${index + 1}`), [shot], "shots", `root:${shot.id || index}`);
    });

    const memoryKeys = ["creativeDecisions", "creativeMemory", "intentions", "memories", "memory"];
    memoryKeys.forEach(key => {
      const entries = Array.isArray(project[key]) ? project[key] : [];
      entries.forEach((entry, index) => {
        if (!entry) return;
        const title = typeof entry === "object" ? firstText(entry.title, entry.reason, `Memory ${index + 1}`) : `Memory ${index + 1}`;
        add(project, "Memory", title, [entry], "memory", `${key}:${entry?.id || index}`);
      });
    });
  }
  return results;
}
