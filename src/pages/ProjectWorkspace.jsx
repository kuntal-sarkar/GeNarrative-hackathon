import { useEffect, useState } from "react";
import { Link, NavLink, useBlocker, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowUpRight, BookOpen, Brain, Camera, Clapperboard, Save, Pencil, FilePenLine,
  Film, LayoutDashboard, MessageCircle, MessageSquareText, ScanSearch, ChevronDown, UploadCloud,
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
import "../styles/WorkspaceRefresh.css";
import "../styles/WorkspaceMicroFix.css";

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
  const [savedRevision, setSavedRevision] = useState(0);
  // Block navigation away from the current project while changes are unsaved.
  // Switching between workspace sections is allowed: the draft lives in this component.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!dirty) return false;
    const currentMatch = currentLocation.pathname.match(/^\/projects\/([^/]+)/);
    const nextMatch = nextLocation.pathname.match(/^\/projects\/([^/]+)/);
    return !currentMatch || !nextMatch || currentMatch[1] !== nextMatch[1];
  });

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("Unsaved project changes will be lost. Leave without saving?")) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

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
  const CurrentIcon = current?.icon || LayoutDashboard;

  // Edits are held only in React state. The database/browser is not updated until Save Changes.
  function persist(nextOrUpdater) {
    setProject(previous => typeof nextOrUpdater === "function" ? nextOrUpdater(previous) : nextOrUpdater);
    setDirty(true);
    setStatus("Unsaved changes");
    setError("");
  }
  function update(field, value) { persist(previous => ({ ...previous, [field]: value })); }
  // An individual Save commits ONLY the selected fields/card. Every other draft stays in memory.
  function savePartial(merge, success = "Section saved") {
    try {
      const latest = getProject(projectId);
      if (!latest) throw new Error("Project was removed from storage.");
      const next = merge(latest);
      if (!next?.title?.trim()) throw new Error("Project title cannot be empty.");
      saveProject(next);
      setSavedRevision(n => n + 1);
      setStatus(success);
      setError("");
      // Do not overwrite any unsaved inputs in React state.
      const draftComparable = { ...project, updatedAt: null };
      const savedComparable = { ...next, updatedAt: null };
      setDirty(JSON.stringify(draftComparable) !== JSON.stringify(savedComparable));
    } catch (err) { setError(err?.message || "Could not save. Check available browser storage."); }
  }
  function saveStoryDetails() {
    const { title, genre, language, idea } = project;
    savePartial(latest => ({ ...latest, title: title.trim(), genre, language, idea }), "Story details saved");
  }
  const savedProject = savedRevision >= 0 ? getProject(projectId) : null;
  const storyDetailsSaved = Boolean(savedProject && ["title", "genre", "language", "idea"].every(k => (savedProject[k] || "") === (project?.[k] || "")));
  const storyTextSaved = Boolean(savedProject && ["story", "sourceFilename"].every(k => (savedProject[k] || "") === (project?.[k] || "")));
  function saveStoryText() {
    const { story, sourceFilename } = project;
    savePartial(latest => ({ ...latest, story, sourceFilename }), "Story text saved");
  }
  function saveScene(sceneId) {
    const draftScene = project.scenes?.find(scene => scene.id === sceneId);
    if (!draftScene) return;
    savePartial(latest => {
      const original = [...(latest.scenes || [])];
      const pos = original.findIndex(scene => scene.id === sceneId);
      const savedScene = pos >= 0 ? { ...original[pos], name: draftScene.name, heading: draftScene.heading, description: draftScene.description } : { ...draftScene, shots: [] };
      if (pos >= 0) original[pos] = savedScene;
      else original.push(savedScene);
      return { ...latest, scenes: original.map((scene, i) => ({ ...scene, number: i + 1 })) };
    }, "Scene saved");
  }
  function saveShot(sceneId, shotId) {
    const draftScene = project.scenes?.find(scene => scene.id === sceneId);
    const draftShot = draftScene?.shots?.find(shot => shot.id === shotId);
    if (!draftShot) return;
    savePartial(latest => {
      const scenes = [...(latest.scenes || [])];
      let pos = scenes.findIndex(scene => scene.id === sceneId);
      if (pos < 0) throw new Error("Save this scene first, then save its shots.");
      const shots = [...(scenes[pos].shots || [])];
      const shotPos = shots.findIndex(shot => shot.id === shotId);
      if (shotPos < 0) shots.push(draftShot);
      else shots[shotPos] = draftShot;
      scenes[pos] = { ...scenes[pos], shots };
      return { ...latest, scenes };
    }, "Shot saved");
  }
  function isSceneSaved(scene) {
    const original = getProject(projectId)?.scenes?.find(s => s.id === scene.id);
    return Boolean(original && ["name", "heading", "description"].every(k => (original[k] || "") === (scene[k] || "")));
  }
  function isShotSaved(sceneId, shot) {
    const original = getProject(projectId)?.scenes?.find(s => s.id === sceneId)?.shots?.find(s => s.id === shot.id);
    return Boolean(original && ["name", "type", "angle", "movement", "lighting", "mood", "duration", "description", "notes"].every(k => (original[k] || "") == (shot[k] || "")));
  }
  function handleScenes(action, payload = {}) {
    let scenes = [...(project.scenes || [])];
    if (action === "add") scenes.push({ id: crypto.randomUUID(), name: "", heading: "", description: "", shots: [] });
    else if (action === "edit") scenes = scenes.map(s => s.id === payload.id && ["name", "heading", "description"].includes(payload.field) ? { ...s, [payload.field]: payload.value } : s);
    else if (action === "delete") {
      const target = scenes.find(s => s.id === payload.id);
      if (target?.shots?.length && !window.confirm("This scene has shots. Delete the scene and all its shots?")) return;
      scenes = scenes.filter(s => s.id !== payload.id);
      if (getProject(projectId)?.scenes?.some(s => s.id === payload.id)) {
        savePartial(latest => ({ ...latest, scenes: (latest.scenes || []).filter(s => s.id !== payload.id).map((s,i) => ({ ...s, number:i+1 })) }), "Scene deleted");
      }
    } else return;
    if (action === "delete") {
      setProject(previous => ({ ...previous, scenes: scenes.map((s, i) => ({ ...s, number: i + 1 })) }));
      setDirty(JSON.stringify({ ...project, scenes: scenes.map((s,i) => ({...s,number:i+1})), updatedAt:null }) !== JSON.stringify({ ...getProject(projectId), updatedAt:null }));
    } else persist(previous => ({ ...previous, scenes: scenes.map((s, i) => ({ ...s, number: i + 1 })) }));
  }

  function handleShots(sceneId, action, payload = {}) {
    const scene = project.scenes?.find(s => s.id === sceneId);
    if (!scene) return;
    const currentShots = [...(scene.shots || [])];
    const isSaved = shotId => Boolean(getProject(projectId)?.scenes?.find(s => s.id === sceneId)?.shots?.some(s => s.id === shotId));
    let nextShots = currentShots;
    if (action === "add") nextShots = [...currentShots, { id: crypto.randomUUID(), name: "", type: "", angle: "", movement: "", lighting: "", mood: "", duration: "", description: "", notes: "" }];
    else if (action === "edit") {
      if (!["name", "type", "angle", "movement", "lighting", "mood", "duration", "description", "notes"].includes(payload.field)) return;
      nextShots = currentShots.map(shot => shot.id === payload.id ? { ...shot, [payload.field]: payload.value } : shot);
    } else if (action === "delete") {
      if (!window.confirm("Delete this shot permanently?")) return;
      nextShots = currentShots.filter(shot => shot.id !== payload.id);
      if (isSaved(payload.id)) savePartial(latest => ({ ...latest, scenes: (latest.scenes || []).map(s => s.id !== sceneId ? s : ({ ...s, shots: (s.shots || []).filter(shot => shot.id !== payload.id) })) }), "Shot deleted");
    } else if (action === "move") {
      const i = currentShots.findIndex(shot => shot.id === payload.id);
      const j = i + payload.direction;
      if (i < 0 || j < 0 || j >= currentShots.length) return;
      if (!isSaved(currentShots[i].id) || !isSaved(currentShots[j].id)) {
        setError("Save both shots before reordering them."); return;
      }
      nextShots = [...currentShots];
      [nextShots[i], nextShots[j]] = [nextShots[j], nextShots[i]];
      const order = nextShots.map(shot => shot.id);
      savePartial(latest => ({ ...latest, scenes: (latest.scenes || []).map(s => s.id !== sceneId ? s : ({ ...s,
        shots: [...(s.shots || [])].sort((a,b) => order.indexOf(a.id)-order.indexOf(b.id)) })) }), "Shot order saved");
    } else return;
    const nextProject = { ...project, scenes: (project.scenes || []).map(s => s.id === sceneId ? ({ ...s, shots: nextShots }) : s) };
    setProject(nextProject);
    const stored = getProject(projectId);
    setDirty(JSON.stringify({ ...nextProject, updatedAt:null }) !== JSON.stringify({ ...stored, updatedAt:null }));
    setError("");
  }

  async function uploadScript(file) {
    if (!file) return;

    try {
      const imported = await readScript(file);
      // Append rather than replace, including when edits happen while PDF extraction is running.
      persist(previous => ({ ...previous,
        story: [previous.story?.trimEnd(), imported.text.trim()].filter(Boolean).join("\n\n"),
        sourceFilename: imported.filename,
      }));
      setStatus(`${imported.filename} appended below the existing story. Save Story Text to keep it.`);
    } catch (err) { setError(err.message || "Could not read script."); }
  }

  if (!project) return <div className="ws-empty ws-missing"><h1>Project not found</h1><p>It may have been deleted or saved in another browser.</p><Link className="ws-primary" to="/studio">Back to projects</Link></div>;
  if (!current) return <div className="ws-empty"><h1>Section not found</h1><Link to={base}>Open project overview</Link></div>;

  const sceneCount = project.scenes?.length || 0;
  const shotCount = (project.scenes || []).reduce((sum, s) => sum + (Array.isArray(s.shots) ? s.shots.length : 0), 0);
  const memoryCount = project.creativeDecisions?.length || 0;

  return <div className="project-workspace">
    <div className="ws-crumb"><Link to="/studio"><ArrowLeft size={16}/> My projects</Link><span>/</span><span>{project.title || "Untitled Story"}</span></div>
    <header className="ws-project-header"><div><span className="ws-eyebrow">PROJECT WORKSPACE</span><h1>{project.title || "Untitled Story"}</h1><p>{project.genre || "Story"} · {project.language || "English"} · Saved in this browser</p></div><button className="ws-ghost ws-header-chat" type="button" onClick={()=>navigate(`${base}/chat`)}><MessageCircle size={17}/> Ask AI</button></header>
    <div className="ff-section-save-indicator" role="status"><span className={`ff-save-dot ${dirty ? "pending" : ""}`}/><span>{dirty ? "Unsaved draft — use the Save button in the edited card" : "All saved"}</span></div>
    {error && <div className="ws-error" role="alert">{error}</div>}{status && !error && <div className="ff-operation-status" role="status">{status}</div>}
    <div className="ws-workspace-grid">
      <aside className="ws-local-nav">
        <div className="ws-local-nav-title">PROJECT TOOLS</div>
        <button type="button" className="ws-mobile-tools-toggle" aria-expanded={mobileToolsOpen} aria-controls="ff-project-tool-list" onClick={()=>setMobileToolsOpen(v=>!v)}><span className="ff-mobile-tools-title"><CurrentIcon size={19}/> <span><small>PROJECT TOOLS</small><strong>{current.label}</strong></span></span><span className="ff-tools-switch">Choose tool <ChevronDown size={17}/></span></button>
        <div id="ff-project-tool-list" className={`ws-local-links ${mobileToolsOpen ? "ws-show-mobile" : ""}`}>
          {SECTIONS.map(({ key, label, icon: Icon }) => <NavLink key={key} to={key === "overview" ? base : `${base}/${key}`} end className={({isActive}) => `ws-local-link ${isActive ? "active" : ""}`} onClick={()=>setMobileToolsOpen(false)}><Icon size={19}/><span>{label}</span></NavLink>)}
        </div>
      </aside>
      <main className="ws-main-panel">
        {section === "overview" && <div className="ff-overview">
          <div className="ff-overview-hero"><span className="ws-eyebrow">PROJECT OVERVIEW</span><h2>{project.title}</h2><p>{project.idea?.trim() || "Add a story idea or synopsis in the Story section."}</p><div className="ff-overview-meta"><span>{project.genre||"Drama"}</span><span>{project.language||"English"}</span></div><div className="ff-overview-stats"><div><span>Scenes</span><strong>{sceneCount}</strong></div><div><span>Shots planned</span><strong>{shotCount}</strong></div><div><span>Creative decisions</span><strong>{memoryCount}</strong></div></div></div>
          <div className="ff-overview-grid"><section className="ff-summary-card"><h3>Story status</h3><p>{project.story?.trim()?`${project.story.trim().split(/\s+/).length} words written` : "No story written yet"}</p><p>{sceneCount ? `${sceneCount} scenes outlined` : "Scene breakdown not started"}</p><button className="ws-ghost" onClick={()=>navigate(`${base}/story`)}>Open story editor <ArrowUpRight size={15}/></button></section><section className="ff-summary-card"><h3>Planning progress</h3><p>{sceneCount ? `${(project.scenes||[]).filter(s=>(s.shots||[]).length>0).length} of ${sceneCount} scenes have shot plans` : "Add scenes to begin planning"}</p><p>{shotCount} shots across all scenes</p><button className="ws-ghost" onClick={()=>navigate(`${base}/shots`)}>Open shot planner <ArrowUpRight size={15}/></button></section><section className="ff-summary-card"><h3>Creative progress</h3><p>{memoryCount} saved creative decisions</p><p>{project.latestCritique ? "A creative critique is available" : "No creative critique yet"}</p><button className="ws-ghost" onClick={()=>navigate(`${base}/critics`)}>Open critics <ArrowUpRight size={15}/></button></section></div>
          <p className="ff-overview-note">Progress is derived from your actual project data; no estimated completion percentage.</p>
        </div>}
        {section === "story" && <div className="ff-story-workspace">
          <div className="ff-story-head"><div><span className="ws-eyebrow">STORY WORKSPACE</span><h2>Edit your story</h2><p>Keep your original writing in control. AI editing will be available when the Flask + Gemini backend is connected.</p></div></div>
          <div className="ff-story-actions"><button className={`ff-story-action ${storyMode === "manual" ? "selected" : ""}`} onClick={()=>setStoryMode("manual")}><Pencil size={18}/> Edit by yourself</button><button className={`ff-story-action ${storyMode === "ai" ? "selected" : ""}`} onClick={()=>setStoryMode("ai")}><FilePenLine size={18}/> Edit with AI</button></div>
          {storyMode === "manual" ? <div className="ff-story-panel"><div className="ff-story-fields"><label className="ws-field">Genre<select value={project.genre||"Drama"} onChange={e=>update("genre",e.target.value)}>{["Drama","Thriller","Mystery","Horror","Romance","Sci-Fi","Comedy","Other"].map(g=><option key={g}>{g}</option>)}</select></label><label className="ws-field">Preferred language<select value={project.language||"English"} onChange={e=>update("language",e.target.value)}>{["English","Hindi","Bengali","Hinglish"].map(g=><option key={g}>{g}</option>)}</select></label></div><label className="ws-field">Story idea / synopsis<textarea rows={3} value={project.idea||""} onChange={e=>update("idea",e.target.value)} placeholder="Short description of your story"/></label><label className="ws-field">Project / story title<input value={project.title||""} onChange={e=>update("title",e.target.value)} placeholder="Story name"/></label><div className="ff-inline-save"><span>Title, genre, language and synopsis</span><button type="button" className="ws-small-primary" onClick={saveStoryDetails} disabled={storyDetailsSaved}><Save size={15}/> {storyDetailsSaved ? "Saved" : "Save Story Details"}</button></div><label className="ws-field">Story text<textarea className="ff-story-text" rows={14} value={project.story||""} onChange={e=>update("story",e.target.value)} placeholder="Write your story here..."/></label><div className="ff-story-footer"><label className="ff-upload-script"><UploadCloud size={17}/> Append PDF / TXT / MD<input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={e=>{const f=e.target.files?.[0];if(f)uploadScript(f);e.target.value="";}}/></label><span>{(project.story||"").trim()?(project.story||"").trim().split(/\s+/).length:0} words · Imported text is appended</span><button type="button" className="ws-small-primary" onClick={saveStoryText} disabled={storyTextSaved}><Save size={15}/> {storyTextSaved ? "Saved" : "Save Story Text"}</button></div></div> : <div className="ff-story-panel"><h3>AI-powered editing</h3><p>Open the project AI writing room to request rewrites, improve dialogue and discuss edits. You can continue any conversation later. Proposed story changes require your approval and must be saved with the relevant section Save button.</p><p className="ws-connection">Backend not connected. No generated content or pretend AI results.</p><button className="ws-primary" type="button" onClick={()=>navigate(`${base}/chat`, { state: { chatIntent: "story" } })}><MessageCircle size={17}/> Open AI writing room</button></div>}
        </div>}
        {section === "scenes" && <SceneBreakdown scenes={project.scenes || []} onScenesChange={handleScenes} onSaveScene={saveScene} isSceneSaved={isSceneSaved}/>}
        {section === "shots" && <ShotPlanner scenes={project.scenes || []} onChange={handleShots} onSaveShot={saveShot} isShotSaved={isShotSaved}/>}
        {section === "storyboard" && <Storyboard scenes={project.scenes || []}/>}
        {section === "critics" && <ProjectCritics project={project} onSave={value => { persist(value); setStatus("Review draft changed. Use an individual Save action when available."); }}/>}
        {section === "continuity" && <ProjectContinuity project={project} onSave={persist}/>}
        {section === "memory" && <ProjectMemory project={project} onSave={persist}/>}
        {section === "chat" && <ProjectAIChat project={project} onSave={persist} onOpenStory={()=>navigate(`${base}/story`)}/>}
        {["critics", "continuity", "memory", "chat"].includes(section) && dirty && <div className="ff-other-save"><button type="button" className="ws-small-primary" onClick={() => savePartial(latest => {
          const keys = section === "chat" ? ["conversations", "chats", "chatSessions", "chatHistory", "story"] : section === "memory" ? ["creativeDecisions", "creativeMemory", "intentions"] : section === "critics" ? ["latestCritique", "critiques", "creativeDecisions", "story", "scenes"] : ["continuity", "continuityChecks"];
          const delta = Object.fromEntries(keys.filter(k => Object.prototype.hasOwnProperty.call(project,k)).map(k => [k,project[k]]));
          return { ...latest, ...delta };
        }, "Section saved")}><Save size={15}/> Save {section === "chat" ? "Conversation" : "This Section"}</button></div>}
      </main>
    </div>
  </div>;
}
