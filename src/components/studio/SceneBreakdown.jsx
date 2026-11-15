import { APP_NAME } from "../../config/branding"; // TAKEGRID_BRANDING_V1
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
  const [elapsedStage, setElapsedStage] = useState(0); // TAKEGRID_SCENES_PROGRESS_REVIEW_V1
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

  useEffect(() => {
    if (!aiBusy) { setElapsedStage(0); return; }
    const started = Date.now();
    const tick = () => {
      const elapsed = Date.now() - started;
      setElapsedStage(elapsed >= 4000 ? 2 : elapsed >= 2000 ? 1 : 0);
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [aiBusy]);

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
      {aiBusy && <div className="tg-scene-progress" role="status" aria-live="polite">
        <div className="tg-scene-progress__top">
          <span className="tg-scene-progress__symbol"><WandSparkles size={18}/></span>
          <div className="tg-scene-progress__copy">
            <strong>Building your scene breakdown</strong>
            <span>{APP_NAME} AI is working on your story. Suggestions will appear here when ready.</span>
          </div>
          <span className="tg-scene-progress__live"><span className="tg-scene-progress__pulse"/> AI working</span>
        </div>
        <div className="tg-scene-progress__track" aria-hidden="true"><span/></div>
        <div className="tg-scene-progress__steps" aria-label="Visual processing stages, not live backend completion">
          {['Story context', 'Scene structure', 'Scene previews'].map((label, index) => (
            <div key={label} className={`tg-scene-progress__step ${elapsedStage === index ? 'is-active' : ''} ${elapsedStage > index ? 'is-past' : ''}`}>
              <span className="tg-scene-progress__dot" aria-hidden="true"/>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="tg-scene-progress__foot">Stages change over time as a visual guide; the AI response determines when analysis is finished.</p>
      </div>}
      {aiError && <p role="alert" style={{ color: "#b42318" }}>{aiError}</p>}
      {!aiBusy && current && <article className="tg-scene-review">
        <div className="tg-scene-review__top">
          <span className="tg-scene-review__eyebrow"><Clapperboard size={15}/> SCENE SUGGESTION</span>
          <span className="tg-scene-review__count">{currentIndex + 1} / {aiSuggestions.length}</span>
        </div>
        <h3 className="tg-scene-review__heading">{current.heading || `Scene ${currentIndex + 1}`}</h3>
        <div className="tg-scene-review__meta">
          <span><MapPin size={14}/> {current.location || "Unspecified location"}</span>
          <span>{current.time_of_day || "Unspecified time"}</span>
        </div>
        <div className="tg-scene-review__description">
          <span className="tg-scene-review__label">Scene overview</span>
          <p>{current.description}</p>
        </div>
        {!!current.characters?.length && <div className="tg-scene-review__detail"><span className="tg-scene-review__label">Characters</span><p>{current.characters.join(", ")}</p></div>}
        {!!current.dialogue?.length && <div className="tg-scene-review__detail"><span className="tg-scene-review__label">Dialogue</span><p>{current.dialogue.join(" | ")}</p></div>}
        {current.source_excerpt && <details className="tg-scene-review__excerpt"><summary>View original story excerpt</summary><p style={{ whiteSpace: "pre-wrap" }}>{current.source_excerpt}</p></details>}
        {duplicate && <p role="status" className="tg-scene-review__duplicate">This scene appears to already be in your project. Skip to avoid adding it again.</p>}
        <div className="tg-scene-review__actions">
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
