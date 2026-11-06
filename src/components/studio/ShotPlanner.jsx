import { useEffect, useRef, useState } from "react";
import IOSSelect from "../ui/IOSSelect";
import { formatDuration } from "../../utils/formatDuration";
import { ArrowDown, ArrowUp, Plus, Trash2, Camera, Save, Wand2, LoaderCircle, ChevronLeft, ChevronRight, X, UserRound, Clapperboard, Lightbulb, MessageSquareText } from "lucide-react";
import "./ShotPlanner.css";
import "./WorkspaceCards.css";
import "./ShotPlannerUpgrade.css";

const SHOT_TYPES = ["Wide Shot", "Medium Shot", "Close-up", "Extreme Close-up", "Over-the-Shoulder", "POV", "Other"];
const ANGLES = ["Eye Level", "High Angle", "Low Angle", "Bird's-eye", "Dutch Angle", "Other"];
const MOVEMENTS = ["Static", "Pan", "Tilt", "Dolly In", "Dolly Out", "Tracking", "Handheld", "Other"];
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
const buttonStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 };
const panelStyle = { background: "#fff", padding: 18, border: "1px solid #e4e6ed", borderRadius: 14, margin: "16px 0" };

function cleanScenePart(value) {
  return String(value || "").replace(/^[\s,·•—–-]+|[\s,·•—–-]+$/g, "").replace(/\s+/g, " ").trim();
}

function sceneLabel(scene, index) {
  const name = cleanScenePart(scene.name);
  const heading = cleanScenePart(scene.heading);
  const title = heading || name || "Untitled scene";
  return `Scene ${index + 1} — ${title}`;
}

function optionsWithCurrent(options, value) {
  return value && !options.includes(value) ? [value, ...options] : options;
}

function mapAIShot(shot) {
  const dialogueStatus = ["existing", "suggested"].includes(shot.dialogue_status) && shot.dialogue ? shot.dialogue_status : "none";
  return {
    name: `${shot.shot_type || "Shot"} ${shot.shot_number || ""}`.trim(),
    type: shot.shot_type || "",
    angle: shot.camera_angle || "",
    movement: shot.camera_movement || "",
    lighting: shot.lighting || "",
    mood: shot.mood || "",
    duration: String(shot.duration_seconds ?? ""),
    description: shot.visual_description || shot.action || "",
    characterName: shot.character_name === "Unspecified" ? "" : (shot.character_name || ""),
    characterRole: shot.character_role === "Unspecified" ? "" : (shot.character_role || ""),
    expression: shot.expression === "Not applicable" ? "" : (shot.expression || ""),
    dialogue: shot.dialogue || "",
    dialogueStatus,
    dialogueCue: shot.dialogue_cue || "",
    audioNotes: shot.audio_notes || "",
    notes: [
      shot.action ? `Action: ${shot.action}` : "",
      shot.director_notes ? `Direction: ${shot.director_notes}` : "",
    ].filter(Boolean).join("\n\n"),
  };
}

export default function ShotPlanner({ scenes = [], project, onChange, onSaveShot, isShotSaved }) {
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const selectedScene = scenes.find(s => s.id === selectedSceneId) || scenes[0];
  const shots = Array.isArray(selectedScene?.shots) ? selectedScene.shots : [];

  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [notes, setNotes] = useState([]);
  const [maxShots, setMaxShots] = useState(6);
  const panelRef = useRef(null);
  const requestRef = useRef(0);

  // Never show suggestions for a different scene; invalidate any in-flight response.
  useEffect(() => {
    requestRef.current += 1;
    setAiOpen(false);
    setAiBusy(false);
    setAiError("");
    setSuggestions([]);
    setSuggestionIndex(0);
    setNotes([]);
  }, [selectedScene?.id]);

  useEffect(() => () => { requestRef.current += 1; }, []);

  async function generate() {
    if (!selectedScene) return;
    if (!selectedScene.description?.trim()) {
      setAiOpen(true);
      setAiError("Add a scene description first, then generate shots.");
      setSuggestions([]);
      return;
    }
    if (!API_BASE) {
      setAiOpen(true);
      setAiError("Backend URL missing. Add VITE_API_BASE_URL=http://127.0.0.1:5000 to frontend .env.local and restart Vite.");
      setSuggestions([]);
      return;
    }
    const requestId = ++requestRef.current;
    const sourceId = selectedScene.id;
    setAiOpen(true);
    setAiBusy(true);
    setAiError("");
    setSuggestions([]);
    setSuggestionIndex(0);
    setNotes([]);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    try {
      const response = await fetch(`${API_BASE}/api/ai/shots/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: {
            scene_number: selectedScene.number || scenes.findIndex(s => s.id === sourceId) + 1,
            heading: selectedScene.heading || selectedScene.name || "Unspecified",
            location: selectedScene.location || "Unspecified",
            time_of_day: selectedScene.time_of_day || "Unspecified",
            description: selectedScene.description,
            characters: selectedScene.characters || [],
            dialogue: selectedScene.dialogue || [],
          },
          project_context: {
            title: project?.title || "",
            genre: project?.genre || "",
            language: project?.language || "English",
            characters: (Array.isArray(project?.characters) ? project.characters : []).slice(0, 40).map(char => ({
              name: String(char?.name || "").slice(0, 150),
              role: String(char?.role || "").slice(0, 250),
              personality_traits: (Array.isArray(char?.personality_traits) ? char.personality_traits : []).slice(0, 5),
            })),
          },
          max_shots: maxShots,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (requestId !== requestRef.current) return;
      if (!response.ok || !data.success) throw new Error(data.error || `Shot generation failed (HTTP ${response.status})`);
      if (!Array.isArray(data.shots) || !data.shots.length) throw new Error("AI returned no shot suggestions.");
      setSuggestions(data.shots);
      setNotes(Array.isArray(data.creative_notes) ? data.creative_notes : []);
    } catch (error) {
      if (requestId === requestRef.current) setAiError(error?.message || "Could not generate shots.");
    } finally {
      if (requestId === requestRef.current) setAiBusy(false);
    }
  }

  function nextSuggestion() {
    setSuggestionIndex(index => Math.min(index + 1, suggestions.length - 1));
  }

  function skipSuggestion() {
    setSuggestions(old => old.filter((_, index) => index !== suggestionIndex));
    setSuggestionIndex(old => Math.max(0, Math.min(old, suggestions.length - 2)));
  }

  function addSuggestion() {
    const suggestion = suggestions[suggestionIndex];
    if (!suggestion || !selectedScene) return;
    onChange(selectedScene.id, "addAI", { shot: mapAIShot(suggestion) });
    // Remove the accepted suggestion, so it cannot be added twice by mistake.
    skipSuggestion();
  }

  if (!scenes.length) return <section className="shot-workspace shot-empty"><Camera size={28}/><h2>No scenes yet</h2><p>Add and save a scene first, then plan its camera shots.</p></section>;

  const currentSuggestion = suggestions[suggestionIndex];
  return <section className="shot-workspace ff-section">
    <div className="shot-topline">
      <div><span className="studio-eyebrow">CINEMATIC PLANNING</span><h2>Shot Planner</h2><p>Select a scene, create shots manually or get AI suggestions. Each shot saves separately.</p></div>
    </div>
    <label className="shot-scene-select">Choose scene
      <IOSSelect value={selectedScene?.id || ""} onChange={e => setSelectedSceneId(e.target.value)}>
        {scenes.map((scene, i) => <option key={scene.id} value={scene.id}>{sceneLabel(scene, i)}</option>)}
      </IOSSelect>
    </label>
    <div className="ff-shot-toolbar">
      <button className="shot-primary" type="button" style={buttonStyle} onClick={() => onChange(selectedScene.id, "add")}><Plus size={17}/> Add Manually</button>
      <button className="shot-primary" type="button" style={buttonStyle} disabled={aiBusy} onClick={generate}>
        {aiBusy ? <LoaderCircle size={17} /> : <Wand2 size={17} />}{aiBusy ? "Generating..." : "Generate with AI"}
      </button>
      <label className="ff-shot-count-field">
        Maximum AI suggestions
        <IOSSelect aria-label="Maximum shots in this analysis" value={String(maxShots)} disabled={aiBusy} onChange={e => setMaxShots(Number(e.target.value))}>
          {[3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map(n => <option key={n} value={n}>{n}</option>)}
        </IOSSelect>
        <small>Upper limit per request, not a total shot limit. AI may suggest fewer shots if the scene is short.</small>
      </label>
    </div>

    {aiOpen && <div ref={panelRef} style={{ ...panelStyle, scrollMarginTop: 95 }} aria-busy={aiBusy}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <strong>{aiBusy ? "FRAMEFORGE AI is planning shots..." : "AI shot suggestions"}</strong>
        <button type="button" onClick={() => { requestRef.current++; setAiOpen(false); setAiBusy(false); setSuggestions([]); }} aria-label="Close AI suggestions" style={buttonStyle}><X size={15}/> Close</button>
      </div>
      <p className="ff-shot-ai-hint">Suggestions are temporary. Add a shot as a draft, review its performance and optional dialogue, then Save Shot. Existing shots are never overwritten.</p>
      {aiBusy && <p role="status">Analyzing the selected scene...</p>}
      {aiError && <p role="alert" style={{ color: "#b42318" }}>{aiError}</p>}
      {!aiBusy && currentSuggestion && <article className="ff-shot-review" aria-label="Shot suggestion">
        <div className="ff-shot-review-head">
          <span className="ff-shot-progress">Shot suggestion {suggestionIndex + 1} / {suggestions.length}</span>
          <h3>{currentSuggestion.shot_type || "Camera shot"}</h3>
          <p>{[currentSuggestion.camera_angle, currentSuggestion.camera_movement, currentSuggestion.duration_seconds ? `${currentSuggestion.duration_seconds}s` : ""].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="ff-shot-review-grid">
          <div className="ff-shot-info"><span>Visual & action</span><p>{currentSuggestion.visual_description || "No visual description"}</p>{currentSuggestion.action && <p className="ff-shot-muted">Action: {currentSuggestion.action}</p>}</div>
          <div className="ff-shot-info"><span>Character & performance</span><p>{currentSuggestion.character_name && currentSuggestion.character_name !== "Unspecified" ? currentSuggestion.character_name : "Environment shot"}{currentSuggestion.character_role && currentSuggestion.character_role !== "Unspecified" ? ` · ${currentSuggestion.character_role}` : ""}</p><p className="ff-shot-muted">{currentSuggestion.expression && currentSuggestion.expression !== "Not applicable" ? currentSuggestion.expression : "No specific expression"}</p></div>
          <div className="ff-shot-info"><span>Lighting & mood</span><p>{currentSuggestion.lighting || "Not specified"}</p><p className="ff-shot-muted">{currentSuggestion.mood || "Not specified"}</p></div>
          <div className="ff-shot-info"><span>Sound</span><p>{currentSuggestion.audio_notes || "No specific sound notes"}</p></div>
        </div>
        {currentSuggestion.dialogue && <div className="ff-shot-dialogue-preview">
          <span>{currentSuggestion.dialogue_status === "existing" ? "Dialogue from story" : "Optional AI dialogue suggestion"}</span>
          <blockquote>“{currentSuggestion.dialogue}”</blockquote>
          <p><strong>When / how:</strong> {currentSuggestion.dialogue_cue || "Timing not specified — adjust after adding"}</p>
        </div>}
        <div className="ff-shot-review-nav">
          <button type="button" className="ff-shot-nav-btn" disabled={suggestionIndex === 0} onClick={() => setSuggestionIndex(i => i - 1)}><ChevronLeft size={16}/> Previous</button>
          <button type="button" className="ff-shot-nav-btn" onClick={skipSuggestion}>Skip <X size={15}/></button>
          <button type="button" className="ff-shot-nav-btn" disabled={suggestionIndex >= suggestions.length - 1} onClick={nextSuggestion}>Next <ChevronRight size={16}/></button>
          <button type="button" className="shot-primary ff-shot-accept" onClick={addSuggestion}><Plus size={16}/> Add Shot (unsaved)</button>
        </div>
      </article>}
      {!aiBusy && !currentSuggestion && !aiError && <p>No remaining suggestions. Generate again to start a new analysis.</p>}
      {!!notes.length && <details style={{ marginTop: 14 }}><summary>FRAMEFORGE AI creative notes</summary><ul>{notes.map((note, i) => <li key={i}>{note}</li>)}</ul></details>}
    </div>}

    {!shots.length ? <div className="shot-blank">No shots planned for this scene yet.</div> : <div className="ff-shot-list">
      {shots.map((shot, index) => <article className="ff-shot-card" key={shot.id}>
        <header className="ff-entry-head">
          <span className="ff-entry-index">SHOT {String(index + 1).padStart(2, "0")}</span>
          <div className="ff-entry-name"><strong>{shot.name?.trim() || shot.type || "Unnamed shot"}</strong><span>{shot.type || "No shot type"}{shot.duration ? ` · ${shot.duration}s` : ""}</span></div>
          <div className="shot-card-actions">
            <button type="button" disabled={index === 0} onClick={() => onChange(selectedScene.id, "move", { id: shot.id, direction: -1 })} aria-label={`Move ${shot.name || "shot"} up`}><ArrowUp size={16}/></button>
            <button type="button" disabled={index === shots.length - 1} onClick={() => onChange(selectedScene.id, "move", { id: shot.id, direction: 1 })} aria-label={`Move ${shot.name || "shot"} down`}><ArrowDown size={16}/></button>
            <button type="button" onClick={() => { if (window.confirm("Delete this shot?")) onChange(selectedScene.id, "delete", { id: shot.id }); }} aria-label="Delete shot"><Trash2 size={16}/></button>
          </div>
        </header>
        <div className="ff-entry-body"><div className="shot-fields ff-shot-fields-compact">
          <label className="shot-wide">Shot name<input value={shot.name || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "name", value: e.target.value })} placeholder="e.g. The camera reveal"/></label>
          <label>Shot type<IOSSelect value={shot.type || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "type", value: e.target.value })}><option value="">Select type</option>{optionsWithCurrent(SHOT_TYPES, shot.type).map(t => <option key={t} value={t}>{t}</option>)}</IOSSelect></label>
          <label>Camera angle<IOSSelect value={shot.angle || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "angle", value: e.target.value })}><option value="">Select angle</option>{optionsWithCurrent(ANGLES, shot.angle).map(t => <option key={t} value={t}>{t}</option>)}</IOSSelect></label>
          <label>Camera movement<IOSSelect value={shot.movement || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "movement", value: e.target.value })}><option value="">Select movement</option>{optionsWithCurrent(MOVEMENTS, shot.movement).map(t => <option key={t} value={t}>{t}</option>)}</IOSSelect></label>
          <label>Duration (seconds)<input type="number" min="0" max="3600" value={shot.duration ?? ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "duration", value: e.target.value })}/><small className="ff-duration-display">{formatDuration(shot.duration) || "Enter seconds (e.g. 90 = 1min 30 sec)"}</small></label>
          <label>Lighting<input value={shot.lighting || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "lighting", value: e.target.value })} placeholder="Describe lighting"/></label>
          <label>Mood<input value={shot.mood || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "mood", value: e.target.value })} placeholder="Describe mood"/></label>
          <label>Featured character<input value={shot.characterName || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "characterName", value: e.target.value })} placeholder="Character name, if featured"/></label>
          <label>Character role<input value={shot.characterRole || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "characterRole", value: e.target.value })} placeholder="Role from story / character bible"/></label>
          <label className="shot-wide">Expression / performance<input value={shot.expression || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "expression", value: e.target.value })} placeholder="e.g. restrained suspicion, avoid invented plot facts"/></label>
          <label className="shot-wide">Dialogue<textarea rows={2} value={shot.dialogue || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "dialogue", value: e.target.value })} placeholder="Existing dialogue or optional suggestion"/></label>
          <label>Dialogue type<IOSSelect value={shot.dialogueStatus || "none"} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "dialogueStatus", value: e.target.value })}><option value="none">No dialogue / not set</option><option value="existing">Existing in source</option><option value="suggested">Optional new suggestion</option></IOSSelect></label>
          <label className="shot-wide">When / how dialogue is spoken<input value={shot.dialogueCue || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "dialogueCue", value: e.target.value })} placeholder="e.g. After a pause, as Meera turns toward the door"/></label>
          <label className="shot-wide">Audio / sound notes<textarea rows={2} value={shot.audioNotes || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "audioNotes", value: e.target.value })} placeholder="Ambient sound, spoken tone, sound effects"/></label>
          <label className="shot-wide">Description<textarea rows={3} value={shot.description || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "description", value: e.target.value })} placeholder="What happens in this shot?"/></label>
          <label className="shot-wide">Director's notes<textarea rows={2} value={shot.notes || ""} onChange={e => onChange(selectedScene.id, "edit", { id: shot.id, field: "notes", value: e.target.value })} placeholder="Optional notes"/></label>
        </div></div>
        <footer className="ff-card-footer"><span>{isShotSaved?.(selectedScene.id, shot) ? "Saved" : "Unsaved shot"}</span><button type="button" className="ws-small-primary" disabled={isShotSaved?.(selectedScene.id, shot)} onClick={() => onSaveShot(selectedScene.id, shot.id)}><Save size={15}/> {isShotSaved?.(selectedScene.id, shot) ? "Saved" : "Save Shot"}</button></footer>
      </article>)}
    </div>}
    <p className="ff-unsaved-note">Performance, lighting and suggested dialogue are creative options, not established story facts. Save each new shot explicitly. Moving saved shots may save the new order immediately, as in the existing Shot Planner.</p>
  </section>;
}
