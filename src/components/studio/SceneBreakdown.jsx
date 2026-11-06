import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Clapperboard, Save, MapPin, WandSparkles, LoaderCircle, Check, X, ChevronRight } from "lucide-react";
import { aiConfigured, requestSceneBreakdown } from "../../services/workspaceApi";
import "./SceneBreakdown.css";
import "./WorkspaceCards.css";

// Creator-first workflow: manual scene, or one AI suggestion at a time.
// AI never edits/replaces saved scenes. Adding creates an UNSAVED scene draft.
const clean = value => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
const sameSource = (a, b) => Boolean(clean(a.source_excerpt) && clean(a.source_excerpt) === clean(b.source_excerpt));
const sameHeadingAndTime = (a, b) => Boolean(
  clean(a.heading) && clean(a.heading) === clean(b.heading) &&
  clean(a.time_of_day) && clean(a.time_of_day) === clean(b.time_of_day)
);
const sameHeadingAndDescription = (a, b) => Boolean(
  clean(a.heading) && clean(a.heading) === clean(b.heading) &&
  clean(a.description) && clean(a.description) === clean(b.description)
);
const isPresent = (existing, suggestion) =>
  sameSource(existing, suggestion) || sameHeadingAndTime(existing, suggestion) || sameHeadingAndDescription(existing, suggestion);

export default function SceneBreakdown({ scenes = [], onScenesChange, onSaveScene, isSceneSaved, project }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [added, setAdded] = useState(0);
  const panelRef = useRef(null);
  const story = typeof project?.story === "string" ? project.story : "";
  const existingScenes = Array.isArray(scenes) ? scenes : [];
  const current = aiSuggestions[currentIndex];
  const finished = aiSuggestions.length > 0 && currentIndex >= aiSuggestions.length;
  const duplicate = current && existingScenes.some(existing => isPresent(existing, current));

  useEffect(() => {
    if (aiOpen) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [aiOpen]);

  async function analyze() {
    if (aiBusy) return;
    setAiOpen(true);
    setAiError("");
    setAiSuggestions([]);
    setCurrentIndex(0);
    setAdded(0);
    if (!story.trim()) {
      setAiError("Your story is empty. Write the story in the Story tab first.");
      return;
    }
    if (!aiConfigured) {
      setAiError("AI backend is not connected. Check VITE_API_BASE_URL in .env.local.");
      return;
    }
    setAiBusy(true);
    try {
      const result = await requestSceneBreakdown({
        story,
        project_context: {
          title: project?.title || "",
          genre: project?.genre || "",
          language: project?.language || "English",
        },
      });
      const suggestions = Array.isArray(result?.scenes)
        ? result.scenes.filter(scene => scene && typeof scene.heading === "string" && typeof scene.description === "string")
        : [];
      if (!suggestions.length) throw new Error("Gemini did not return any usable scenes.");
      setAiSuggestions(suggestions);
    } catch (error) {
      setAiError(error?.message || "Could not analyze the story.");
    } finally {
      setAiBusy(false);
    }
  }

  function nextSuggestion() {
    setAiError("");
    setCurrentIndex(index => index + 1);
  }

  function addSuggestion() {
    if (!current || duplicate) return;
    onScenesChange("addAI", {
      // No position and no existing ID: parent adds a NEW draft at the end.
      scene: {
        name: current.heading || `Scene ${current.scene_number || currentIndex + 1}`,
        heading: current.heading || "",
        description: current.description || "",
        location: current.location || "Unspecified",
        time_of_day: current.time_of_day || "Unspecified",
        characters: Array.isArray(current.characters) ? current.characters : [],
        dialogue: Array.isArray(current.dialogue) ? current.dialogue : [],
        source_excerpt: current.source_excerpt || "",
      },
    });
    setAdded(count => count + 1);
    nextSuggestion();
  }

  return <section className="scene-breakdown ff-section ff-clean-panel">
    <div className="scene-breakdown-header">
      <div>
        <span className="studio-eyebrow">STORY STRUCTURE</span>
        <h2>Scenes <small className="ff-count">{existingScenes.length}</small></h2>
        <p>Create scenes manually or use Gemini. Every new scene needs a separate Save Scene.</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="scene-outline-btn" onClick={() => onScenesChange("add")}>
          <Plus size={16}/> Add Scene Manually
        </button>
        <button type="button" className="ws-small-primary" disabled={aiBusy} onClick={analyze}>
          {aiBusy ? <LoaderCircle size={16} className="ff-char__spin"/> : <WandSparkles size={16}/>}
          {aiBusy ? "Analyzing..." : "Analyze Story with AI"}
        </button>
      </div>
    </div>

    {aiOpen && <div ref={panelRef} style={{ scrollMarginTop: 100, border: "1px solid #dce1e7", background: "#fff", borderRadius: 14, padding: 16, margin: "18px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0 }}>AI Scene Suggestions</h3>
        <button type="button" className="scene-outline-btn" onClick={() => setAiOpen(false)} aria-label="Close AI panel"><X size={15}/> Close</button>
      </div>
      <p style={{ margin: "8px 0 14px" }}>Review one scene at a time. <strong>Add Scene</strong> puts it at the bottom of your scene list as an unsaved draft. <strong>Skip</strong> ignores it. No existing scenes or shots will be changed.</p>
      {aiBusy && <p role="status"><LoaderCircle size={16} className="ff-char__spin"/> FRAMEFORGE AI is analyzing your story...</p>}
      {aiError && <p role="alert" style={{ color: "#b42318" }}>{aiError}</p>}
      {!aiBusy && current && <article style={{ display: "grid", gap: 10, borderTop: "1px solid #e6e9ee", paddingTop: 16 }}>
        <span style={{ color: "#637083", fontSize: 13, fontWeight: 600 }}>Suggestion {currentIndex + 1} of {aiSuggestions.length}</span>
        <h3 style={{ margin: 0 }}>{current.heading || `Scene ${currentIndex + 1}`}</h3>
        <p style={{ margin: 0 }}><strong>Location:</strong> {current.location || "Unspecified"} · <strong>Time:</strong> {current.time_of_day || "Unspecified"}</p>
        <p style={{ margin: 0 }}>{current.description}</p>
        {!!current.characters?.length && <p style={{ margin: 0 }}><strong>Characters:</strong> {current.characters.join(", ")}</p>}
        {!!current.dialogue?.length && <p style={{ margin: 0 }}><strong>Dialogue:</strong> {current.dialogue.join(" | ")}</p>}
        {current.source_excerpt && <details><summary>View original story excerpt</summary><p style={{ whiteSpace: "pre-wrap" }}>{current.source_excerpt}</p></details>}
        {duplicate && <p role="status" style={{ color: "#825200", margin: 0 }}>This scene appears to already be in your project. Skip to avoid adding it again.</p>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
          <button type="button" className="scene-outline-btn" onClick={nextSuggestion}>Skip <ChevronRight size={15}/></button>
          {!duplicate && <button type="button" className="ws-small-primary" onClick={addSuggestion}><Plus size={15}/> Add Scene (unsaved)</button>}
        </div>
      </article>}
      {!aiBusy && finished && <div role="status" style={{ paddingTop: 10 }}>
        <h3 style={{ margin: "0 0 8px" }}>Review finished</h3>
        <p>{added} scene{added === 1 ? "" : "s"} added as unsaved drafts. Scroll down to the scene cards, edit if needed, then click <strong>Save Scene</strong> on each one.</p>
        <button type="button" className="scene-outline-btn" onClick={() => setAiOpen(false)}><Check size={15}/> Done</button>
      </div>}
    </div>}

    {!existingScenes.length ? <div className="scene-empty-state"><Clapperboard size={28}/><h3>No scenes yet</h3><p>Use Add Scene Manually or Analyze Story with AI above.</p></div> : <div className="ff-scene-list">{existingScenes.map((scene, index) => <article className="ff-scene-card" key={scene.id}>
      <header className="ff-entry-head"><span className="ff-entry-index">SCENE {String(index + 1).padStart(2, "0")}</span><div className="ff-entry-name"><strong>{scene.name?.trim() || scene.heading?.trim() || "Untitled scene"}</strong><span>{(scene.shots || []).length} planned shots</span></div><button className="ff-danger-icon" type="button" title="Delete scene" aria-label={`Delete scene ${index + 1}`} onClick={() => { if (window.confirm("Delete this scene and its shots? This deletion takes effect immediately.")) onScenesChange("delete", { id: scene.id }); }}><Trash2 size={17}/></button></header>
      <div className="ff-entry-body ff-scene-fields"><label className="studio-field"><span>Scene name</span><input value={scene.name || ""} onChange={e => onScenesChange("edit", { id: scene.id, field: "name", value: e.target.value })} placeholder="e.g. The first encounter"/></label><label className="studio-field"><span><MapPin size={14}/> Location / heading</span><input value={scene.heading || ""} onChange={e => onScenesChange("edit", { id: scene.id, field: "heading", value: e.target.value })} placeholder="INT. OLD HOUSE — NIGHT"/></label><label className="studio-field ff-scene-description"><span>What happens in this scene?</span><textarea rows={4} value={scene.description || ""} onChange={e => onScenesChange("edit", { id: scene.id, field: "description", value: e.target.value })} placeholder="Describe character actions and key events"/></label></div>
      <footer className="ff-card-footer"><span>{isSceneSaved?.(scene) ? "Saved" : "Unsaved scene"}</span><button type="button" className="ws-small-primary" onClick={() => onSaveScene(scene.id)} disabled={isSceneSaved?.(scene)}><Save size={15}/> {isSceneSaved?.(scene) ? "Saved" : "Save Scene"}</button></footer>
    </article>)}</div>}
    <p className="ff-unsaved-note">Scenes are saved individually. AI does not update your existing scenes or shots.</p>
  </section>;
}
