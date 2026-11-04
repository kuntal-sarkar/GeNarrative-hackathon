import { getProjects } from "./projectService";

const clean = value => typeof value === "string" ? value.trim() : "";
const snippet = (value, query) => {
  const source = clean(value).replace(/\s+/g, " ");
  const lower = source.toLocaleLowerCase();
  const at = lower.indexOf(query.toLocaleLowerCase());
  const start = Math.max(0, at < 0 ? 0 : at - 55);
  const end = Math.min(source.length, (at < 0 ? 0 : at) + Math.max(query.length, 1) + 92);
  return `${start ? "…" : ""}${source.slice(start, end)}${end < source.length ? "…" : ""}`;
};
const uri = (id, section) => `/projects/${encodeURIComponent(id)}/${section}`;

// All results are derived from saved project data; never fabricate content or results.
export function searchSavedProjects(term, limit = 80) {
  const query = clean(term).toLocaleLowerCase();
  if (!query) return [];
  const results = [];
  const add = (project, category, title, values, section, id) => {
    const fields = values.filter(Boolean).map(clean).filter(Boolean);
    if (!fields.some(value => value.toLocaleLowerCase().includes(query))) return;
    const matched = fields.find(value => value.toLocaleLowerCase().includes(query)) || title;
    results.push({
      id: `${project.id}:${category}:${id}`,
      category, title: clean(title) || `Untitled ${category.toLowerCase()}`,
      project: project.title || "Untitled project",
      preview: snippet(matched, query), path: uri(project.id, section),
    });
  };
  for (const project of getProjects()) {
    if (!project?.id) continue;
    add(project, "Projects", project.title, [project.title, project.idea, project.genre], "overview", "project");
    add(project, "Stories", "Story text", [project.story], "story", "story");
    const characters = Array.isArray(project.characters) ? project.characters : [];
    characters.forEach((character, index) => {
      if (!character || typeof character !== "object") return;
      add(project, "Characters", character.name || `Character ${index + 1}`,
        [character.name, character.role, character.personality, character.goals, character.notes, character.backstory, character.appearance, character.motivation, character.arc],
        "characters", character.id || index);
    });
    const scenes = Array.isArray(project.scenes) ? project.scenes : [];
    scenes.forEach((scene, sceneIndex) => {
      if (!scene || typeof scene !== "object") return;
      add(project, "Scenes", scene.name || scene.heading || `Scene ${sceneIndex + 1}`,
        [scene.name, scene.heading, scene.description], "scenes", scene.id || sceneIndex);
      const shots = Array.isArray(scene.shots) ? scene.shots : [];
      shots.forEach((shot, shotIndex) => {
        if (!shot || typeof shot !== "object") return;
        add(project, "Shots", shot.name || `Shot ${shotIndex + 1}`,
          [shot.name, shot.type, shot.angle, shot.movement, shot.description, shot.notes, shot.lighting, shot.mood],
          "shots", `${scene.id || sceneIndex}:${shot.id || shotIndex}`);
      });
    });
    const memories = ["creativeDecisions", "creativeMemory", "intentions"];
    memories.forEach(key => {
      const entries = Array.isArray(project[key]) ? project[key] : [];
      entries.forEach((entry, index) => {
        if (!entry) return;
        const fields = typeof entry === "string" ? [entry] : [entry.reason, entry.suggestion, entry.perspective, entry.note, entry.title, entry.description, entry.content];
        add(project, "Memory", typeof entry === "object" ? entry.title || entry.reason || `Memory ${index + 1}` : `Memory ${index + 1}`,
          fields, "memory", `${key}:${entry.id || index}`);
      });
    });
  }
  // Preserve source/project order, then keep result set bounded for responsive UI.
  return results.slice(0, limit);
}
