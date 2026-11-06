import { useEffect, useRef, useState } from "react";

import { Link, NavLink, useBlocker, useNavigate, useParams } from "react-router-dom";

import {

  ArrowLeft, ArrowUpRight, BookOpen, Brain, Camera, Clapperboard, Save, Pencil, FilePenLine, AlertTriangle, Archive,

  Film, LayoutDashboard, MessageCircle, MessageSquareText, ScanSearch, ChevronDown, UploadCloud, UsersRound, History,

} from "lucide-react";

import { getProject, saveProject } from "../services/projectService";

import IOSSelect from "../components/ui/IOSSelect";

import SceneBreakdown from "../components/studio/SceneBreakdown";

import ShotPlanner from "../components/studio/ShotPlanner";

import Storyboard from "../components/studio/Storyboard";

import ProjectAIChat from "../components/workspace/ProjectAIChat";

import { readScript } from "../services/scriptImport";

import ProjectCritics from "../components/workspace/ProjectCritics";

import ProjectContinuity from "../components/workspace/ProjectContinuity";

import ProjectMemory from "../components/workspace/ProjectMemory";

import CharacterBible from "../components/characters/CharacterBible";

import VersionHistory from "../components/versions/VersionHistory";

import ExportBackup from "../components/export/ExportBackup";

import ProjectDashboard, { lastSectionKey } from "../components/dashboard/ProjectDashboard";

import { recordVersion, applyVersionFields } from "../services/versionHistory";

import useWorkspaceKeyboard from "../hooks/useWorkspaceKeyboard";

import "../styles/WorkspaceKeyboard.css";

import "./ProjectWorkspace.css";

import "./WorkspacePolish.css";

import "./CreativeUpgrade.css";

import "../styles/WorkspaceRefresh.css";

import "../styles/FrameforgePolish.css";

import "../styles/WorkspaceMicroFix.css";

import "../styles/WorkspaceDraftIndicators.css";

const GENRES = ["Drama", "Thriller", "Mystery", "Horror", "Romance", "RomCom", "Sci-Fi", "Comedy", "Other"];

const SECTION_FIELDS = {

  critics: ["latestCritique", "critiques"],

  continuity: ["continuity", "continuityChecks", "continuityIssues"],

  memory: ["creativeDecisions", "creativeMemory", "intentions"],

  chat: [

    "conversations", "chats", "chatSessions", "chatHistory",

    "chatThreads", "activeChatThreadId", "chatMessages"

  ],

};

const sameData = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const SCENE_EDIT_FIELDS = ["name", "heading", "description", "location", "time_of_day", "characters", "dialogue", "source_excerpt"];
const normalizedSceneText = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
const isEquivalentScene = (a, b) => Boolean(
  (normalizedSceneText(a.source_excerpt) && normalizedSceneText(a.source_excerpt) === normalizedSceneText(b.source_excerpt)) ||
  (normalizedSceneText(a.heading) && normalizedSceneText(a.description) &&
   normalizedSceneText(a.heading) === normalizedSceneText(b.heading) &&
   normalizedSceneText(a.description) === normalizedSceneText(b.description))
);

const SECTIONS = [

  { key: "overview", label: "Overview", icon: LayoutDashboard, hint: "Project progress and tools" },

  { key: "story", label: "Story", icon: BookOpen, hint: "Create and edit the story" },

  { key: "characters", label: "Characters", icon: UsersRound, hint: "Manage the character bible" },

  { key: "versions", label: "Version History", icon: History, hint: "Review and restore saved changes" },

  { key: "export", label: "Export & Backup", icon: Archive, hint: "Export and restore saved projects" },

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

  const [historyRevision, setHistoryRevision] = useState(0);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const workspaceRef = useRef(null);

  const leaveDialogRef = useRef(null);

  // Check each workspace section independently so a draft in Story still shows

  // its indicator while the user works in Scenes or Shots.

  const storedSnapshot = savedRevision >= 0 ? getProject(projectId) : null;

  const draftSections = (() => {

    if (!project || !storedSnapshot) return [];

    const outstanding = [];

    if (!sameData(project.characters || [], storedSnapshot.characters || [])) outstanding.push("characters");

    if (["title", "idea", "genre", "story", "sourceFilename"].some(k => !sameData(project[k], storedSnapshot[k]))) outstanding.push("story");

    const dScenes = project.scenes || [], sScenes = storedSnapshot.scenes || [];

    if (!sameData(dScenes.map(s => Object.fromEntries(["id", ...SCENE_EDIT_FIELDS].map(k => [k, s[k] ?? null]))), sScenes.map(s => Object.fromEntries(["id", ...SCENE_EDIT_FIELDS].map(k => [k, s[k] ?? null]))))) outstanding.push("scenes");

    const extractShots = scenes => scenes.map(s => ({ sceneId: s.id, shots: (s.shots || []).map(shot => shot) }));

    if (!sameData(extractShots(dScenes), extractShots(sScenes))) outstanding.push("shots");

    for (const [key, fields] of Object.entries(SECTION_FIELDS)) {

      if (fields.some(field => !sameData(project[field], storedSnapshot[field]))) outstanding.push(key);

    }

    return outstanding;

  })();

  const hasUnsaved = draftSections.length > 0;

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {

    if (!hasUnsaved) return false;

    const here = currentLocation.pathname.match(/^\/projects\/([^/]+)/);

    const there = nextLocation.pathname.match(/^\/projects\/([^/]+)/);

    return !here || !there || here[1] !== there[1];

  });

  useEffect(() => {

    setShowLeaveDialog(blocker.state === "blocked");

  }, [blocker.state]);

  function stayInProject() { setShowLeaveDialog(false); if (blocker.state === "blocked") blocker.reset(); }

  function leaveProject() { setShowLeaveDialog(false); if (blocker.state === "blocked") blocker.proceed(); }

  useWorkspaceKeyboard({ workspaceRef, leaveDialogRef, showLeaveDialog, stayInProject });

  function reviewDrafts() {

    const first = draftSections[0];

    stayInProject();

    if (first) navigate(`/projects/${encodeURIComponent(projectId)}/${first}`);

  }

  useEffect(() => {

    setProject(getProject(projectId));

    setDirty(false);

    setError("");

    setStatus("");

  }, [projectId]);

  useEffect(() => {

    const warn = (e) => { if (hasUnsaved) { e.preventDefault(); e.returnValue = ""; } };

    window.addEventListener("beforeunload", warn);

    return () => window.removeEventListener("beforeunload", warn);

  }, [hasUnsaved]);

  // Track the last workspace tool without changing existing project storage.

  useEffect(() => {

    if (!projectId || section === "overview" || !SECTIONS.some(item => item.key === section)) return;

    try { localStorage.setItem(lastSectionKey(projectId), section); } catch { /* Restricted browser storage. */ }

  }, [projectId, section]);

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

      const historyResult = recordVersion(projectId, latest, next, success);

      if (historyResult.recorded) setHistoryRevision(n => n + 1);

      setSavedRevision(n => n + 1);

      setStatus(historyResult.warning ? `${success}. ${historyResult.warning}` : success);

      setError("");

      // Do not overwrite any unsaved inputs in React state.

      const draftComparable = { ...project, updatedAt: null };

      const savedComparable = { ...next, updatedAt: null };

      setDirty(JSON.stringify(draftComparable) !== JSON.stringify(savedComparable));

    } catch (err) { setError(err?.message || "Could not save. Check available browser storage."); }

  }

  // Persist one critic decision immediately, without saving unrelated drafts.

  function saveCriticDecision(record) {

    try {

      if (!record || !["accept", "reject", "modify"].includes(record.type)) {

        throw new Error("Invalid creative decision.");

      }

      const latest = getProject(projectId);

      if (!latest) throw new Error("Project was removed from storage.");

      if (!latest.title?.trim()) throw new Error("Project title cannot be empty.");

      const updated = {

        ...latest,

        creativeDecisions: [...(latest.creativeDecisions || []), record],

      };

      saveProject(updated);

      const historyResult = recordVersion(

        projectId, latest, updated,

        `Creative recommendation ${record.type}`

      );

      // Retain unsaved Story/Scenes/Chat edits in React memory.

      setProject(previous => previous ? ({

        ...previous,

        creativeDecisions: [...(previous.creativeDecisions || []), record],

      }) : previous);

      setSavedRevision(n => n + 1);

      if (historyResult.recorded) setHistoryRevision(n => n + 1);

      const nextDraft = {

        ...project,

        creativeDecisions: [...(project.creativeDecisions || []), record],

        updatedAt: null,

      };

      setDirty(!sameData(nextDraft, { ...updated, updatedAt: null }));

      const success = `${record.type[0].toUpperCase() + record.type.slice(1)} decision saved`;

      setStatus(historyResult.warning ? `${success}. ${historyResult.warning}` : success);

      setError("");

      return true;

    } catch (err) {

      setError(err?.message || "Could not save creative decision.");

      return false;

    }

  }

  function restoreHistoryVersion(version, side) {

    if (hasUnsaved) { setError("Save or discard unsaved changes before restoring a version."); return; }

    try {

      const latest = getProject(projectId);

      if (!latest) throw new Error("Project was removed from storage.");

      const restored = applyVersionFields(latest, version, side);

      // Save current data FIRST so it stays recoverable, then update the workspace.

      const changed = JSON.stringify({ ...latest, updatedAt: null }) !== JSON.stringify({ ...restored, updatedAt: null });

      if (!changed) { setStatus("This version already matches the current saved fields."); setError(""); return; }

      saveProject(restored);

      const historyResult = recordVersion(projectId, latest, restored, `Restored ${version.label}`);

      setProject(getProject(projectId));

      setDirty(false);

      setSavedRevision(n => n + 1);

      if (historyResult.recorded) setHistoryRevision(n => n + 1);

      setStatus(historyResult.warning ? `Version restored. ${historyResult.warning}` : "Version restored successfully");

      setError("");

    } catch (err) { setError(err?.message || "Unable to restore the selected version."); }

  }

  function saveStoryDetails() {

    const { title, idea, genre } = project;

    savePartial(latest => ({ ...latest, title: title.trim(), idea, genre }), "Story details saved");

  }

  const savedProject = storedSnapshot;

  const storyDetailsSaved = Boolean(savedProject && ["title", "idea", "genre"].every(k => (savedProject[k] || "") === (project?.[k] || "")));

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

      // Save only this scene's editable fields. Preserve already-saved shots and unrelated drafts.
      const editable = Object.fromEntries(SCENE_EDIT_FIELDS
        .filter(key => Object.prototype.hasOwnProperty.call(draftScene, key))
        .map(key => [key, draftScene[key]]));
      const savedScene = pos >= 0
        ? { ...original[pos], ...editable }
        : { ...draftScene, shots: [] };

      if (pos >= 0) original[pos] = savedScene;
      else {
        // Insert at the position the creator chose, without saving other draft scenes.
        const draftOrder = (project.scenes || []).map(scene => scene.id);
        const beforeId = draftOrder.slice(draftOrder.indexOf(sceneId) + 1)
          .find(id => original.some(scene => scene.id === id));
        const insertAt = beforeId ? original.findIndex(scene => scene.id === beforeId) : original.length;
        original.splice(insertAt, 0, savedScene);
      }

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

      const draftOrder = (draftScene.shots || []).map(shot => shot.id);

      shots.sort((a, b) => draftOrder.indexOf(a.id) - draftOrder.indexOf(b.id));

      scenes[pos] = { ...scenes[pos], shots };

      return { ...latest, scenes };

    }, "Shot saved");

  }


  // FRAMEFORGE_STORYBOARD_V1_SAVE
  // Only approve frames for an already saved shot; preserve all other unsaved edits.
  async function saveStoryboardFrame(sceneId, shotId, storyboardImage) {
    try {
      const latest = getProject(projectId);
      const storedShot = latest?.scenes?.find(scene => scene.id === sceneId)?.shots?.find(shot => shot.id === shotId);
      if (!storedShot) throw new Error("Save this shot in Shot Planner before approving a storyboard image.");
      const next = {
        ...latest,
        scenes: (latest.scenes || []).map(scene => scene.id !== sceneId ? scene : ({
          ...scene,
          shots: (scene.shots || []).map(shot => shot.id !== shotId ? shot : ({ ...shot, storyboardImage }))
        }))
      };
      saveProject(next);
      const historyResult = recordVersion(projectId, latest, next, "Storyboard frame saved");
      if (historyResult.recorded) setHistoryRevision(n => n + 1);
      setSavedRevision(n => n + 1);
      setProject(previous => previous ? ({
        ...previous,
        scenes: (previous.scenes || []).map(scene => scene.id !== sceneId ? scene : ({
          ...scene,
          shots: (scene.shots || []).map(shot => shot.id !== shotId ? shot : ({ ...shot, storyboardImage }))
        }))
      }) : previous);
      const draftNext = {
        ...project,
        scenes: (project.scenes || []).map(scene => scene.id !== sceneId ? scene : ({
          ...scene,
          shots: (scene.shots || []).map(shot => shot.id !== shotId ? shot : ({ ...shot, storyboardImage }))
        })), updatedAt: null
      };
      setDirty(!sameData(draftNext, { ...next, updatedAt: null }));
      setStatus(historyResult.warning ? `Storyboard frame saved. ${historyResult.warning}` : "Storyboard frame saved");
      setError("");
      return true;
    } catch (err) {
      setError(err?.message || "Could not save storyboard frame.");
      throw err;
    }
  }

  function isSceneSaved(scene) {

    const original = getProject(projectId)?.scenes?.find(s => s.id === scene.id);

    return Boolean(original && SCENE_EDIT_FIELDS.every(key => sameData(original[key], scene[key])));

  }

  function isShotSaved(sceneId, shot) {

    const original = getProject(projectId)?.scenes?.find(s => s.id === sceneId)?.shots?.find(s => s.id === shot.id);

    return Boolean(original && ["name", "type", "angle", "movement", "lighting", "mood", "duration", "description", "notes", "characterName", "characterRole", "expression", "dialogue", "dialogueStatus", "dialogueCue", "audioNotes"].every(k => (original[k] || "") == (shot[k] || "")));

  }

  function handleScenes(action, payload = {}) {
    let scenes = [...(project.scenes || [])];

    if (action === "add") {
      scenes.push({ id: crypto.randomUUID(), name: "", heading: "", description: "", shots: [] });
    } else if (action === "addAI") {
      const incoming = payload.scene;
      if (!incoming || typeof incoming !== "object") return;
      if (scenes.some(scene => isEquivalentScene(scene, incoming))) {
        window.alert("This scene already exists. No duplicate was added.");
        return;
      }
      const requested = Number(payload.position);
      const position = Number.isInteger(requested)
        ? Math.max(0, Math.min(scenes.length, requested))
        : scenes.length;
      scenes.splice(position, 0, { ...incoming, id: crypto.randomUUID(), shots: [] });
    } else if (action === "updateAI") {
      const incoming = payload.scene;
      const targetId = payload.id;
      const target = scenes.find(scene => scene.id === targetId);
      if (!target || !incoming || typeof incoming !== "object") return;
      if (scenes.some(scene => scene.id !== targetId && isEquivalentScene(scene, incoming))) {
        window.alert("This AI suggestion already matches a different scene. No changes applied.");
        return;
      }
      if (!window.confirm(`Apply the AI suggestion to "${target.name || target.heading || "this scene"}" as an UNSAVED draft?\n\nThis updates its draft description and metadata but preserves its existing shots. Click Save Scene to keep it.`)) return;
      // Preserve creator title, identity, planned shots and all other project data.
      scenes = scenes.map(scene => scene.id === targetId ? {
        ...scene,
        heading: incoming.heading || scene.heading,
        description: incoming.description || scene.description,
        location: incoming.location || scene.location,
        time_of_day: incoming.time_of_day || scene.time_of_day,
        characters: Array.isArray(incoming.characters) ? [...incoming.characters] : scene.characters,
        dialogue: Array.isArray(incoming.dialogue) ? [...incoming.dialogue] : scene.dialogue,
        source_excerpt: incoming.source_excerpt || scene.source_excerpt,
      } : scene);
    } else if (action === "edit") {
      scenes = scenes.map(scene => scene.id === payload.id && ["name", "heading", "description"].includes(payload.field)
        ? { ...scene, [payload.field]: payload.value } : scene);
    } else if (action === "delete") {
      const target = scenes.find(scene => scene.id === payload.id);
      if (!target) return;
      if (target.shots?.length && !window.confirm("This scene has shots. Delete the scene and all its shots?")) return;
      scenes = scenes.filter(scene => scene.id !== payload.id);
      if (getProject(projectId)?.scenes?.some(scene => scene.id === payload.id)) {
        savePartial(latest => ({
          ...latest,
          scenes: (latest.scenes || []).filter(scene => scene.id !== payload.id)
            .map((scene, index) => ({ ...scene, number: index + 1 })),
        }), "Scene deleted");
      }
    } else return;

    const numbered = scenes.map((scene, index) => ({ ...scene, number: index + 1 }));
    if (action === "delete") {
      setProject(previous => ({ ...previous, scenes: numbered }));
      setDirty(JSON.stringify({ ...project, scenes: numbered, updatedAt: null }) !==
        JSON.stringify({ ...getProject(projectId), updatedAt: null }));
    } else {
      persist(previous => ({ ...previous, scenes: numbered }));
    }
  }

  function handleShots(sceneId, action, payload = {}) {

    const scene = project.scenes?.find(s => s.id === sceneId);

    if (!scene) return;

    const currentShots = [...(scene.shots || [])];

    const isSaved = shotId => Boolean(getProject(projectId)?.scenes?.find(s => s.id === sceneId)?.shots?.some(s => s.id === shotId));

    let nextShots = currentShots;

    if (action === "add") nextShots = [...currentShots, { id: crypto.randomUUID(), name: "", type: "", angle: "", movement: "", lighting: "", mood: "", duration: "", description: "", notes: "" }];
    else if (action === "addAI") {
      if (!payload.shot || typeof payload.shot !== "object") return;
      nextShots = [...currentShots, {
        ...payload.shot,
        id: crypto.randomUUID(),
      }];
    }

    else if (action === "edit") {

      if (!["name", "type", "angle", "movement", "lighting", "mood", "duration", "description", "notes", "characterName", "characterRole", "expression", "dialogue", "dialogueStatus", "dialogueCue", "audioNotes"].includes(payload.field)) return;

      nextShots = currentShots.map(shot => shot.id === payload.id ? { ...shot, [payload.field]: payload.value } : shot);

    } else if (action === "delete") {

      if (!window.confirm("Delete this shot permanently?")) return;

      nextShots = currentShots.filter(shot => shot.id !== payload.id);

      if (isSaved(payload.id)) savePartial(latest => ({ ...latest, scenes: (latest.scenes || []).map(s => s.id !== sceneId ? s : ({ ...s, shots: (s.shots || []).filter(shot => shot.id !== payload.id) })) }), "Shot deleted");

    } else if (action === "move") {

      const i = currentShots.findIndex(shot => shot.id === payload.id);

      const j = i + payload.direction;

      if (i < 0 || j < 0 || j >= currentShots.length) return;

      nextShots = [...currentShots];

      [nextShots[i], nextShots[j]] = [nextShots[j], nextShots[i]];

      const savedOrder = nextShots.map(shot => shot.id);

      // Saved items can reorder immediately; unsaved shots retain draft-only order.

      if (currentShots.every(shot => isSaved(shot.id))) {

        savePartial(latest => ({

          ...latest, scenes: (latest.scenes || []).map(s => s.id !== sceneId ? s : ({

            ...s,

            shots: [...(s.shots || [])].sort((a, b) => savedOrder.indexOf(a.id) - savedOrder.indexOf(b.id))

          }))

        }), "Shot order saved");

      } else {

        setStatus("Shot moved in draft. Save new shots to keep their order.");

      }

    } else return;

    const nextProject = { ...project, scenes: (project.scenes || []).map(s => s.id === sceneId ? ({ ...s, shots: nextShots }) : s) };

    setProject(nextProject);

    const stored = getProject(projectId);

    setDirty(JSON.stringify({ ...nextProject, updatedAt: null }) !== JSON.stringify({ ...stored, updatedAt: null }));

    setError("");

  }

  async function uploadScript(file) {

    if (!file) return;

    try {

      const imported = await readScript(file);

      // Append rather than replace, including when edits happen while PDF extraction is running.

      persist(previous => ({

        ...previous,

        story: [previous.story?.trimEnd(), imported.text.trim()].filter(Boolean).join("\n\n"),

        sourceFilename: imported.filename,

      }));

      setStatus(`${imported.filename} appended below the existing story. Save Story Text to keep it.`);

    } catch (err) { setError(err.message || "Could not read script."); }

  }

  function saveChatConversation() {

    savePartial(latest => {

      // Save the actual chatThreads used by ProjectAIChat, not just legacy chat keys.

      const keys = ["chatThreads", "activeChatThreadId", "chatMessages", "conversations", "chats", "chatSessions", "chatHistory"];

      const delta = Object.fromEntries(keys.filter(k => Object.prototype.hasOwnProperty.call(project, k)).map(k => [k, project[k]]));

      return { ...latest, ...delta };

    }, "Conversation saved");

  }

  if (!project) return <div className="ws-empty ws-missing"><h1>Project not found</h1><p>It may have been deleted or saved in another browser.</p><Link className="ws-primary" to="/studio">Back to projects</Link></div>;

  if (!current) return <div className="ws-empty"><h1>Section not found</h1><Link to={base}>Open project overview</Link></div>;

  const sceneCount = project.scenes?.length || 0;

  const shotCount = (project.scenes || []).reduce((sum, s) => sum + (Array.isArray(s.shots) ? s.shots.length : 0), 0);

  const memoryCount = project.creativeDecisions?.length || 0;

  return <div ref={workspaceRef} className="project-workspace">

    <div className="ws-crumb"><Link to="/studio"><ArrowLeft size={16} /> My projects</Link><span>/</span><span>{project.title || "Untitled Story"}</span></div>

    <header className="ws-project-header"><div><span className="ws-eyebrow">PROJECT WORKSPACE</span><h1>{project.title || "Untitled Story"}</h1><p>{project.genre || "Story"} · {project.language || "English"} · Saved in this browser</p></div><button className="ws-ghost ws-header-chat" type="button" onClick={() => navigate(`${base}/chat`)}><MessageCircle size={17} /> Ask AI</button></header>

    <div className="ff-section-save-indicator" role="status"><span className={`ff-save-dot ${hasUnsaved ? "pending" : ""}`} /><span>{hasUnsaved ? `Unsaved changes in ${draftSections.map(k => SECTIONS.find(s => s.key === k)?.label || k).join(", ")}` : "All saved"}</span></div>

    {error && <div className="ws-error" role="alert">{error}</div>}{status && !error && <div className="ff-operation-status" role="status">{status}</div>}

    <div className="ws-workspace-grid">

      <aside className="ws-local-nav">

        <div className="ws-local-nav-title">PROJECT TOOLS</div>

        <button type="button" className="ws-mobile-tools-toggle" aria-expanded={mobileToolsOpen} aria-controls="ff-project-tool-list" onClick={() => setMobileToolsOpen(v => !v)}><span className="ff-mobile-tools-title"><CurrentIcon size={19} /> <span><small>PROJECT TOOLS</small><strong>{current.label}</strong></span>{draftSections.includes(section) && <span className="ff-draft-marker" title="Unsaved changes" />}</span><span className="ff-tools-switch">Choose tool <ChevronDown size={17} /></span></button>

        <div id="ff-project-tool-list" className={`ws-local-links ${mobileToolsOpen ? "ws-show-mobile" : ""}`}>

          {SECTIONS.map(({ key, label, icon: Icon }) => <NavLink key={key} to={key === "overview" ? base : `${base}/${key}`} end className={({ isActive }) => `ws-local-link ${isActive ? "active" : ""}`} onClick={() => setMobileToolsOpen(false)}><Icon size={19} /><span>{label}</span>{draftSections.includes(key) && <span className="ff-draft-marker" aria-label={`${label} has unsaved changes`} title="Unsaved changes" />}</NavLink>)}

        </div>

      </aside>

      <main className="ws-main-panel">

        {section === "overview" && <div className="ff-overview">

          <div className="ff-overview-hero"><span className="ws-eyebrow">PROJECT OVERVIEW</span><h2>{project.title}</h2><p>{project.idea?.trim() || "Add a story idea or synopsis in the Story section."}</p><div className="ff-overview-meta"><span>{project.genre || "Drama"}</span><span>{project.language || "English"}</span></div><div className="ff-overview-stats"><div><span>Scenes</span><strong>{sceneCount}</strong></div><div><span>Shots planned</span><strong>{shotCount}</strong></div><div><span>Creative decisions</span><strong>{memoryCount}</strong></div></div></div>

          <div className="ff-overview-grid"><section className="ff-summary-card"><h3>Story status</h3><p>{project.story?.trim() ? `${project.story.trim().split(/\s+/).length} words written` : "No story written yet"}</p><p>{sceneCount ? `${sceneCount} scenes outlined` : "Scene breakdown not started"}</p><button className="ws-ghost" onClick={() => navigate(`${base}/story`)}>Open story editor <ArrowUpRight size={15} /></button></section><section className="ff-summary-card"><h3>Planning progress</h3><p>{sceneCount ? `${(project.scenes || []).filter(s => (s.shots || []).length > 0).length} of ${sceneCount} scenes have shot plans` : "Add scenes to begin planning"}</p><p>{shotCount} shots across all scenes</p><button className="ws-ghost" onClick={() => navigate(`${base}/shots`)}>Open shot planner <ArrowUpRight size={15} /></button></section><section className="ff-summary-card"><h3>Creative progress</h3><p>{memoryCount} saved creative decisions</p><p>{project.latestCritique ? "A creative critique is available" : "No creative critique yet"}</p><button className="ws-ghost" onClick={() => navigate(`${base}/critics`)}>Open critics <ArrowUpRight size={15} /></button></section></div>

          <p className="ff-overview-note">Progress is derived from your actual project data; no estimated completion percentage.</p>

          <ProjectDashboard project={storedSnapshot || project} projectId={projectId} historyRevision={historyRevision} onNavigate={(tool) => navigate(`${base}/${tool}`)} />

        </div>}

        {section === "story" && <div className="ff-story-workspace">

          <div className="ff-story-head"><div><span className="ws-eyebrow">STORY WORKSPACE</span><h2>Edit your story</h2><p>Keep your original writing in control. AI editing will be available when the Flask + Gemini backend is connected.</p></div></div>

          <div className="ff-story-actions"><button className={`ff-story-action ${storyMode === "manual" ? "selected" : ""}`} onClick={() => setStoryMode("manual")}><Pencil size={18} /> Edit by yourself</button><button className={`ff-story-action ${storyMode === "ai" ? "selected" : ""}`} onClick={() => setStoryMode("ai")}><FilePenLine size={18} /> Edit with AI</button></div>

          {storyMode === "manual" ? <div className="ff-story-panel"><div className="ff-story-fields ff-locked-details"><label className="ws-field">Genre<IOSSelect value={project.genre || "Drama"} onChange={e => update("genre", e.target.value)}>{[...new Set([...GENRES, project.genre].filter(Boolean))].map(g => <option key={g} value={g}>{g}</option>)}</IOSSelect><small>Editable · Save Story Details to apply</small></label><div className="ff-locked-meta"><span>Language</span><strong>{project.language || "Not specified"}</strong><small>Selected when project was created</small></div></div><label className="ws-field">Story idea / synopsis<textarea rows={3} value={project.idea || ""} onChange={e => update("idea", e.target.value)} placeholder="Short description of your story" /></label><label className="ws-field">Project / story title<input value={project.title || ""} onChange={e => update("title", e.target.value)} placeholder="Story name" /></label><div className="ff-inline-save"><span>Title, genre and synopsis</span><button type="button" className="ws-small-primary" onClick={saveStoryDetails} disabled={storyDetailsSaved}><Save size={15} /> {storyDetailsSaved ? "Saved" : "Save Story Details"}</button></div><label className="ws-field">Story text<textarea className="ff-story-text" rows={14} value={project.story || ""} onChange={e => update("story", e.target.value)} placeholder="Write your story here..." /></label><div className="ff-story-footer"><label className="ff-upload-script"><UploadCloud size={17} /> Append PDF / TXT / MD<input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={e => { const f = e.target.files?.[0]; if (f) uploadScript(f); e.target.value = ""; }} /></label><span>{(project.story || "").trim() ? (project.story || "").trim().split(/\s+/).length : 0} words · Imported text is appended</span><button type="button" className="ws-small-primary" onClick={saveStoryText} disabled={storyTextSaved}><Save size={15} /> {storyTextSaved ? "Saved" : "Save Story Text"}</button></div></div> : <div className="ff-story-panel"><h3>AI-powered editing</h3><p>Open the project AI writing room to request rewrites, improve dialogue and discuss edits. You can continue any conversation later. Proposed story changes require your approval and must be saved with the relevant section Save button.</p><p className="ws-connection">Backend not connected. No generated content or pretend AI results.</p><button className="ws-primary" type="button" onClick={() => navigate(`${base}/chat`, { state: { chatIntent: "story" } })}><MessageCircle size={17} /> Open AI writing room</button></div>}

        </div>}

        {section === "versions" && <VersionHistory projectId={projectId} revision={historyRevision} hasUnsaved={hasUnsaved} onRestore={restoreHistoryVersion} />}

        {section === "export" && <ExportBackup projectId={projectId} hasUnsaved={hasUnsaved} />}

        {section === "characters" && <CharacterBible project={project} characters={project.characters || []} onChange={value => update("characters", value)} onSave={() => savePartial(latest => ({ ...latest, characters: project.characters || [] }), "Characters saved")} saved={sameData(project.characters || [], storedSnapshot?.characters || [])} />}

        {section === "scenes" && <SceneBreakdown project={project} scenes={project.scenes || []} onScenesChange={handleScenes} onSaveScene={saveScene} isSceneSaved={isSceneSaved} />}

        {section === "shots" && <ShotPlanner project={project} scenes={project.scenes || []} onChange={handleShots} onSaveShot={saveShot} isShotSaved={isShotSaved} />}

        {section === "storyboard" && <Storyboard scenes={project.scenes || []} onSaveFrame={saveStoryboardFrame} />}

        {section === "critics" && <ProjectCritics project={project} onSave={value => { persist(value); setStatus("Review draft changed. Use Save This Section to keep the review."); }} onDecision={saveCriticDecision} />}

        {section === "continuity" && <ProjectContinuity project={project} onSave={persist} />}

        {section === "memory" && <ProjectMemory project={project} onSave={persist} />}

        {section === "chat" && <ProjectAIChat project={project} onSave={persist} onSaveConversation={saveChatConversation} canSaveConversation={draftSections.includes("chat")} onOpenStory={() => navigate(`${base}/story`)} />}

        {["critics", "continuity", "memory"].includes(section) && dirty && <div className="ff-other-save"><button type="button" className="ws-small-primary" onClick={() => savePartial(latest => {

          const keys = section === "chat" ? ["conversations", "chats", "chatSessions", "chatHistory", "story"] : section === "memory" ? ["creativeDecisions", "creativeMemory", "intentions"] : section === "critics" ? ["latestCritique", "critiques", "creativeDecisions", "story", "scenes"] : ["continuity", "continuityChecks", "continuityIssues"];

          const delta = Object.fromEntries(keys.filter(k => Object.prototype.hasOwnProperty.call(project, k)).map(k => [k, project[k]]));

          return { ...latest, ...delta };

        }, "Section saved")}><Save size={15} /> Save {section === "chat" ? "Conversation" : "This Section"}</button></div>}

      </main>

    </div>

    {showLeaveDialog && blocker.state === "blocked" && <div className="ff-leave-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) stayInProject(); }}>

      <section ref={leaveDialogRef} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby="ff-leave-title" aria-describedby="ff-leave-message" className="ff-leave-dialog">

        <div className="ff-leave-icon"><AlertTriangle size={23} /></div>

        <h2 id="ff-leave-title">You have unsaved changes</h2>

        <p id="ff-leave-message">Changes in <strong>{draftSections.map(k => SECTIONS.find(s => s.key === k)?.label || k).join(", ")}</strong> are not saved. Review and use each card's Save button before leaving, or discard those edits.</p>

        <div className="ff-leave-actions">

          <button type="button" className="ff-stay-button" onClick={stayInProject}>Stay here</button>

          <button type="button" className="ff-review-button" onClick={reviewDrafts}>Review changes</button>

          <button type="button" className="ff-discard-button" onClick={leaveProject}>Leave without saving</button>

        </div>

      </section>

    </div>}

  </div>;

}
