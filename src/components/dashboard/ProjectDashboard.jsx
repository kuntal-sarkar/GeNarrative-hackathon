import { ArrowRight, BookOpen, Camera, Check, Clock3, Clapperboard, History, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { readVersions } from "../../services/versionHistory";
import "./ProjectDashboard.css";

// Records only visited workspace sections; no project data is modified.
export const lastSectionKey = (projectId) => `frameforge_dashboard_last_section_v1_${projectId}`;

const targets = [
  { key: "story", label: "Story", description: "Story text saved", test: (p) => Boolean(p.story?.trim()), icon: BookOpen },
  { key: "characters", label: "Characters", description: "Character profiles added", test: (p) => Array.isArray(p.characters) && p.characters.length > 0, icon: UsersRound },
  { key: "scenes", label: "Scenes", description: "Scenes outlined", test: (p) => Array.isArray(p.scenes) && p.scenes.length > 0, icon: Clapperboard },
  { key: "shots", label: "Shots", description: "Shot plans added", test: (p) => (p.scenes || []).some(s => Array.isArray(s.shots) && s.shots.length), icon: Camera },
  { key: "memory", label: "Memory", description: "Creative decisions recorded", test: (p) => Array.isArray(p.creativeDecisions) && p.creativeDecisions.length > 0, icon: Check },
];
const visitable = new Set(["story", "characters", "scenes", "shots", "storyboard", "critics", "continuity", "memory", "chat", "versions", "export"]);

function timestamp(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ProjectDashboard({ project, projectId, onNavigate, historyRevision = 0 }) {
  const history = useMemo(() => readVersions(projectId), [projectId, historyRevision]);
  const versions = history.slice(0, 4);
  const sections = targets.map(item => ({ ...item, hasContent: item.test(project) }));
  const contentCount = sections.filter(item => item.hasContent).length;
  let lastSection = null;
  try {
    const stored = localStorage.getItem(lastSectionKey(projectId));
    if (visitable.has(stored)) lastSection = stored;
  } catch { /* Browser storage may be restricted. */ }
  const lastLabel = lastSection === "chat" ? "Project AI Chat" : lastSection === "versions" ? "Version History" : lastSection === "export" ? "Export & Backup" : lastSection ? lastSection[0].toUpperCase() + lastSection.slice(1) : "Story";
  const scenes = Array.isArray(project.scenes) ? project.scenes : [];
  const shots = scenes.reduce((count, scene) => count + (Array.isArray(scene.shots) ? scene.shots.length : 0), 0);
  const characters = Array.isArray(project.characters) ? project.characters.length : 0;
  const go = (name) => onNavigate(name);

  return <section className="ff-dashboard" aria-labelledby="ff-dashboard-heading">
    <div className="ff-dashboard-heading">
      <div><span className="ff-dashboard-eyebrow">AT A GLANCE</span><h3 id="ff-dashboard-heading">Your creative workspace</h3><p>Based on your saved project content. No estimated completion scores.</p></div>
      <button type="button" className="ff-dashboard-continue" onClick={() => go(lastSection || "story")}>Continue {lastLabel} <ArrowRight size={16}/></button>
    </div>
    <div className="ff-dashboard-metrics" aria-label="Saved project statistics">
      <div><strong>{characters}</strong><span>Characters</span></div>
      <div><strong>{scenes.length}</strong><span>Scenes</span></div>
      <div><strong>{shots}</strong><span>Shots</span></div>
      <div><strong>{history.length}</strong><span>Saved versions kept</span></div>
    </div>
    <div className="ff-dashboard-columns">
      <section className="ff-dashboard-card" aria-label="Workspace content checklist">
        <div className="ff-dashboard-cardhead"><div><h4>Workspace checklist</h4><p>{contentCount} of {sections.length} sections contain saved content</p></div></div>
        <div className="ff-dashboard-checklist">{sections.map(({key, label, description, icon: Icon, hasContent}) =>
          <button type="button" key={key} className="ff-dashboard-checkrow" onClick={() => go(key)}>
            <span className="ff-dashboard-checkicon"><Icon size={17}/></span>
            <span className="ff-dashboard-checkcopy"><strong>{label}</strong><small>{description}</small></span>
            <span className={`ff-dashboard-checkstate ${hasContent ? "is-filled" : ""}`}>{hasContent ? "Has content" : "Not started"}</span>
            <ArrowRight size={14} className="ff-dashboard-chevron"/>
          </button>)}
        </div>
      </section>
      <section className="ff-dashboard-card" aria-label="Recent project saves">
        <div className="ff-dashboard-cardhead"><div><h4>Recent saves</h4><p>From saved Version History entries</p></div><button className="ff-dashboard-textlink" type="button" onClick={() => go("versions")}>View history <ArrowRight size={14}/></button></div>
        {versions.length ? <div className="ff-dashboard-activity">{versions.map(item => <div className="ff-dashboard-activityrow" key={item.id}>
          <span className="ff-dashboard-activityicon"><History size={16}/></span>
          <div><strong>{item.label || "Changes saved"}</strong><small>{item.fields?.length || 0} saved field(s) · {timestamp(item.createdAt)}</small></div>
        </div>)}</div> : <div className="ff-dashboard-empty"><Clock3 size={22}/><strong>No recorded saves yet</strong><p>New saves will appear here when Version History records them.</p></div>}
      </section>
    </div>
  </section>;
}
