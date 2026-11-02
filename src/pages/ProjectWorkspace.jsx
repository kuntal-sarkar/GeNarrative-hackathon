import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowUpRight, BookOpen, Brain, Camera, Clapperboard, Save, Pencil, FilePenLine,
  Film, LayoutDashboard, MessageCircle, MessageSquareText, ScanSearch,
} from "lucide-react";
import { getProject, saveProject } from "../services/projectService";

import StoryEditor from "../components/studio/StoryEditor";
import SceneBreakdown from "../components/studio/SceneBreakdown";
import ShotPlanner from "../components/studio/ShotPlanner";
import Storyboard from "../components/studio/Storyboard";
import ProjectAIChat from "../components/workspace/ProjectAIChat";
import { readScript } from "../services/scriptImport";
import ProjectCritics from "../components/workspace/ProjectCritics";
import ProjectContinuity from "../components/workspace/ProjectContinuity";
import ProjectMemory from "../components/workspace/ProjectMemory";
import "./ProjectWorkspace.css";
import "./WorkspacePolish.css";
import "./CreativeUpgrade.css";

const SECTIONS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, hint: "Project progress and tools" },
  { key: "story", label: "Story", icon: BookOpen, hint: "Create and edit the story" },
  { key: "scenes", label: "Scenes", icon: Clapperboard, hint: "Develop scene breakdowns" },
  { key: "shots", label: "Shots", icon: Camera, hint: "Plan camera directions" },
  { key: "storyboard", label: "Storyboard", icon: Film, hint: "Visualize shot sequence" },
  { key: "critics", label: "Critics", icon: MessageSquareText, hint: "Receive creative feedback" },
  { key: "continuity", label: "Continuity", icon: ScanSearch, hint: "Check story consistency" },
  { key: "memory", label: "Memory", icon: Brain, hint: "Preserve creative intent" },
  { key: "chat", label: "Project AI Chat", icon: MessageCircle, hint: "Ask about scenes and shots" },
];

export default function ProjectWorkspace() {
  const { projectId, section = "overview" } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(() => getProject(projectId));
  const [dirty, setDirty] = useState(false);
  const [storyMode, setStoryMode] = useState("manual");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  useEffect(() => {
    setProject(getProject(projectId));
    setDirty(false);
    setError("");
    setStatus("");
  }, [projectId]);

  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const base = `/projects/${encodeURIComponent(projectId)}`;
  const current = SECTIONS.find(s => s.key === section);

  // Edits are held only in React state. The database/browser is not updated until Save Changes.
  function persist(next) {
    setProject(next);
    setDirty(true);
    setStatus("Unsaved changes");
    setError("");
  }
  function update(field, value) { persist({ ...project, [field]: value }); }
  function saveChanges() {
    if (!project.title?.trim()) {setError("Project title cannot be empty.");return;}
    try {
      const saved = saveProject(project);
      setProject(saved);setDirty(false);setStatus("All changes saved");setError("");
    } catch {setError("Could not save. Check browser storage.");}
  }
  function confirmLeave(e) {
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) {e.preventDefault();}
  }
  function handleScenes(action, payload = {}) {
    let scenes = [...(project.scenes || [])];
    if (action === "add") scenes.push({ id: crypto.randomUUID(), name: "", heading: "", description: "", shots: [] });
    else if (action === "edit") scenes = scenes.map(s => s.id === payload.id && ["name", "heading", "description"].includes(payload.field) ? { ...s, [payload.field]: payload.value } : s);
    else if (action === "delete") {
      const target = scenes.find(s => s.id === payload.id);
      if (target?.shots?.length && !window.confirm("This scene has shots. Delete the scene and all its shots?")) return;
      scenes = scenes.filter(s => s.id !== payload.id);
    } else return;
    persist({ ...project, scenes: scenes.map((s, i) => ({ ...s, number: i + 1 })) });
  }

  function handleShots(sceneId, action, payload = {}) {
    const scenes = (project.scenes || []).map(scene => {
      if (scene.id !== sceneId) return scene;
      let shots = [...(Array.isArray(scene.shots) ? scene.shots : [])];
      if (action === "add") shots.push({ id: crypto.randomUUID(), name: "", type: "", angle: "", movement: "", lighting: "", mood: "", duration: "", description: "", notes: "" });
      else if (action === "edit") {
        if (!["name", "type", "angle", "movement", "lighting", "mood", "duration", "description", "notes"].includes(payload.field)) return scene;
        shots = shots.map(s => s.id === payload.id ? { ...s, [payload.field]: payload.value } : s);
      } else if (action === "delete") shots = shots.filter(s => s.id !== payload.id);
      else if (action === "move") {
        const index = shots.findIndex(s => s.id === payload.id);
        const next = index + payload.direction;
        if (index >= 0 && next >= 0 && next < shots.length) [shots[index], shots[next]] = [shots[next], shots[index]];
      } else return scene;
      return { ...scene, shots };
    });
    persist({ ...project, scenes });
  }

  async function uploadScript(file) {
    if (!file) return;
    if (project.story?.trim() && !window.confirm("Replace current script? Existing scenes and shots remain and may no longer match.")) return;
    try {
      const imported = await readScript(file);
      persist({ ...project, story: imported.text, sourceFilename: imported.filename });
    } catch (err) { setError(err.message || "Could not read script."); }
  }

  if (!project) return <div className="ws-empty ws-missing"><h1>Project not found</h1><p>It may have been deleted or saved in another browser.</p><Link className="ws-primary" to="/studio">Back to projects</Link></div>;
  if (!current) return <div className="ws-empty"><h1>Section not found</h1><Link to={base}>Open project overview</Link></div>;

  const sceneCount = project.scenes?.length || 0;
  const shotCount = (project.scenes || []).reduce((sum, s) => sum + (Array.isArray(s.shots) ? s.shots.length : 0), 0);
  const memoryCount = project.creativeDecisions?.length || 0;

  return <div className="project-workspace">
    <div className="ws-crumb"><Link to="/studio" onClick={confirmLeave}><ArrowLeft size={16}/> My projects</Link><span>/</span><span>{project.title || "Untitled Story"}</span></div>
    <header className="ws-project-header"><div><span className="ws-eyebrow">PROJECT WORKSPACE</span><h1>{project.title || "Untitled Story"}</h1><p>{project.genre || "Story"} · {project.language || "English"} · Saved in this browser</p></div><button className="ws-ghost ws-header-chat" type="button" onClick={()=>navigate(`${base}/chat`)}><MessageCircle size={17}/> Ask AI</button></header>
    <div className="ff-savebar"><div><span className={`ff-save-dot ${dirty ? "pending" : ""}`}/><strong>{dirty ? "Unsaved changes" : "All changes saved"}</strong><span>{dirty ? "Click Save Changes to keep your edits" : "Edits do not save automatically"}</span></div><button className="ws-primary" type="button" disabled={!dirty} onClick={saveChanges}><Save size={17}/> Save Changes</button></div>
    {error && <div className="ws-error" role="alert">{error}</div>}
    <div className="ws-workspace-grid">
      <aside className="ws-local-nav">
        <div className="ws-local-nav-title">PROJECT TOOLS</div>
        <button type="button" className="ws-mobile-tools-toggle" aria-expanded={mobileToolsOpen} onClick={()=>setMobileToolsOpen(v=>!v)}>{current.label} · Change tool <ArrowUpRight size={16}/></button>
        <div className={`ws-local-links ${mobileToolsOpen ? "ws-show-mobile" : ""}`}>
          {SECTIONS.map(({ key, label, icon: Icon }) => <NavLink key={key} to={key === "overview" ? base : `${base}/${key}`} end className={({isActive}) => `ws-local-link ${isActive ? "active" : ""}`} onClick={()=>setMobileToolsOpen(false)}><Icon size={19}/><span>{label}</span></NavLink>)}
        </div>
      </aside>
      <main className="ws-main-panel">
        {section === "overview" && <div className="ff-overview">
          <div className="ff-overview-hero"><span className="ws-eyebrow">PROJECT OVERVIEW</span><h2>{project.title}</h2><p>{project.idea?.trim() || "Add a story idea or synopsis in the Story section."}</p><div className="ff-overview-meta"><span>{project.genre||"Drama"}</span><span>{project.language||"English"}</span></div></div>
          <div className="ff-overview-stats"><div><span>Scenes</span><strong>{sceneCount}</strong></div><div><span>Shots planned</span><strong>{shotCount}</strong></div><div><span>Creative decisions</span><strong>{memoryCount}</strong></div></div>
          <div className="ff-overview-grid"><section className="ff-summary-card"><h3>Story status</h3><p>{project.story?.trim()?`${project.story.trim().split(/\s+/).length} words written` : "No story written yet"}</p><p>{sceneCount ? `${sceneCount} scenes outlined` : "Scene breakdown not started"}</p><button className="ws-ghost" onClick={()=>navigate(`${base}/story`)}>Open story editor <ArrowUpRight size={15}/></button></section><section className="ff-summary-card"><h3>Planning progress</h3><p>{sceneCount ? `${(project.scenes||[]).filter(s=>(s.shots||[]).length>0).length} of ${sceneCount} scenes have shot plans` : "Add scenes to begin planning"}</p><p>{shotCount} shots across all scenes</p><button className="ws-ghost" onClick={()=>navigate(`${base}/shots`)}>Open shot planner <ArrowUpRight size={15}/></button></section><section className="ff-summary-card"><h3>Creative progress</h3><p>{memoryCount} saved creative decisions</p><p>{project.latestCritique ? "A creative critique is available" : "No creative critique yet"}</p><button className="ws-ghost" onClick={()=>navigate(`${base}/critics`)}>Open critics <ArrowUpRight size={15}/></button></section></div>
          <p className="ff-overview-note">Progress is derived from your actual project data; no estimated completion percentage.</p>
        </div>}
        {section === "story" && <div className="ff-story-workspace">
          <div className="ff-story-head"><div><span className="ws-eyebrow">STORY WORKSPACE</span><h2>Edit your story</h2><p>Keep your original writing in control. AI editing will be available when the Flask + Gemini backend is connected.</p></div></div>
          <div className="ff-story-actions"><button className={`ff-story-action ${storyMode === "manual" ? "selected" : ""}`} onClick={()=>setStoryMode("manual")}><Pencil size={18}/> Edit by yourself</button><button className={`ff-story-action ${storyMode === "ai" ? "selected" : ""}`} onClick={()=>setStoryMode("ai")}><FilePenLine size={18}/> Edit with AI</button></div>
          {storyMode === "manual" ? <div className="ff-story-panel"><div className="ff-story-fields"><label className="ws-field">Genre<select value={project.genre||"Drama"} onChange={e=>update("genre",e.target.value)}>{["Drama","Thriller","Mystery","Horror","Romance","Sci-Fi","Comedy","Other"].map(g=><option key={g}>{g}</option>)}</select></label><label className="ws-field">Preferred language<select value={project.language||"English"} onChange={e=>update("language",e.target.value)}>{["English","Hindi","Bengali","Hinglish"].map(g=><option key={g}>{g}</option>)}</select></label></div><label className="ws-field">Story idea / synopsis<textarea rows={3} value={project.idea||""} onChange={e=>update("idea",e.target.value)} placeholder="Short description of your story"/></label><label className="ws-field">Project / story title<input value={project.title||""} onChange={e=>update("title",e.target.value)} placeholder="Story name"/></label><label className="ws-field">Story text<textarea className="ff-story-text" rows={14} value={project.story||""} onChange={e=>update("story",e.target.value)} placeholder="Write your story here..."/></label><div className="ff-story-footer"><label className="ff-upload-script">Import PDF / TXT / MD<input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={e=>{const f=e.target.files?.[0];if(f)uploadScript(f);e.target.value="";}}/></label><span>{(project.story||"").trim()?(project.story||"").trim().split(/\s+/).length:0} words · Save Changes to keep edits</span></div></div> : <div className="ff-story-panel"><h3>AI-powered editing</h3><p>Open the project AI writing room to request rewrites, improve dialogue and discuss edits. You can continue any conversation later. Proposed story changes require your approval and Save Changes.</p><p className="ws-connection">Backend not connected. No generated content or pretend AI results.</p><button className="ws-primary" type="button" onClick={()=>navigate(`${base}/chat`, { state: { chatIntent: "story" } })}><MessageCircle size={17}/> Open AI writing room</button></div>}
        </div>}
        {section === "scenes" && <SceneBreakdown scenes={project.scenes || []} onScenesChange={handleScenes}/>}
        {section === "shots" && <ShotPlanner scenes={project.scenes || []} onChange={handleShots}/>}
        {section === "storyboard" && <Storyboard scenes={project.scenes || []}/>}
        {section === "critics" && <ProjectCritics project={project} onSave={persist}/>}
        {section === "continuity" && <ProjectContinuity project={project} onSave={persist}/>}
        {section === "memory" && <ProjectMemory project={project} onSave={persist}/>}
        {section === "chat" && <ProjectAIChat project={project} onSave={persist} onOpenStory={()=>navigate(`${base}/story`)}/>}
      </main>
    </div>
  </div>;
}
