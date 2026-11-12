import { APP_NAME } from "../../config/branding"; // TAKEGRID_BRANDING_V1
import { useEffect, useMemo, useRef, useState } from "react";
import { Images, LayoutGrid, List, X, Maximize2, WandSparkles, RefreshCw, Save, LoaderCircle } from "lucide-react";
import IOSSelect from "../ui/IOSSelect";
import { formatDuration } from "../../utils/formatDuration";
import { aiConfigured, requestStoryboardImage, uploadStoryboardFrame, storyboardFrameUrl } from "../../services/workspaceApi";
import "./Storyboard.css";
import "./StoryboardCompact.css";
import "./StoryboardAI.css";

const keyOf = (shot) => `${shot.sceneId}:${shot.id}`;

export default function Storyboard({ scenes = [], onSaveFrame }) {
  const [view, setView] = useState("grid");
  const [expandedId, setExpandedId] = useState(null);
  const [styles, setStyles] = useState({});
  const [qualities, setQualities] = useState({});
  const [orientationNotes, setOrientationNotes] = useState({});
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const draftsRef = useRef({});
  const busyRef = useRef(false);

  useEffect(() => { draftsRef.current = drafts; }, [drafts]);
  useEffect(() => () => {
    Object.values(draftsRef.current).forEach(d => { if (d?.previewUrl) URL.revokeObjectURL(d.previewUrl); });
  }, []);

  const frames = useMemo(() => scenes.flatMap((scene, sceneIndex) =>
    (Array.isArray(scene.shots) ? scene.shots : []).map((shot, index) => ({
      ...shot, sceneId: scene.id,
      sceneName: scene.name || scene.heading || `Scene ${sceneIndex + 1}`,
      shotIndex: index + 1,
    }))
  ), [scenes]);
  const active = frames.find(f => keyOf(f) === expandedId);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = e => { if (e.key === "Escape") setExpandedId(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  function buildPrompt(shot) {
    const parts = [
      shot.description && `Visible scene and action: ${shot.description}`,
      shot.type && `Shot size: ${shot.type}`,
      shot.angle && `Camera angle: ${shot.angle}`,
      shot.movement && `Camera movement: ${shot.movement}`,
      shot.characterName && `Character: ${shot.characterName}`,
      shot.characterRole && `Character role: ${shot.characterRole}`,
      shot.expression && `Expression: ${shot.expression}`,
      shot.lighting && `Lighting: ${shot.lighting}`,
      shot.mood && `Mood: ${shot.mood}`,
      shot.dialogueCue && `Performance moment: ${shot.dialogueCue}`,
      shot.notes && `Director guidance: ${shot.notes}`,
    ].filter(Boolean);
    const extra = orientationNotes[keyOf(shot)]?.trim();
    if (extra) parts.push(`Physical layout and prop orientation to preserve: ${extra}`);
    // Keep a single consistent view, visible faces of props, plausible anatomy.
    parts.push("Make a physically coherent film storyboard: correct anatomical hands, realistic object orientation, hinges and handles on a plausible door side, consistent spatial layout. Show a phone screen only on the FRONT display-facing side, never on its back. Keep important props visible and legible by pose (no actual letters or readable UI text). Do not mirror the scene or reverse object fronts and backs. Respect the specified camera viewpoint. No captions or text overlays.");
    return parts.join("\n").slice(0, 1700);
  }

  async function generate(shot) {
    if (busyRef.current) return;
    const key = keyOf(shot);
    const prompt = buildPrompt(shot);
    if (!shot.description?.trim()) { setError("Add a shot description first, then generate the frame."); return; }
    busyRef.current = true;
    setBusyId(key);
    setError("");
    try {
      const style = styles[key] || "black_white";
      const quality = qualities[key] || "standard";
      const blob = await requestStoryboardImage(prompt, style, quality);
      const previewUrl = URL.createObjectURL(blob);
      setDrafts(old => {
        if (old[key]?.previewUrl) URL.revokeObjectURL(old[key].previewUrl);
        return { ...old, [key]: { blob, previewUrl, style, quality } };
      });
    } catch (err) { setError(err?.message || "Unable to generate frame."); }
    finally { busyRef.current = false; setBusyId(null); }
  }

  async function approve(shot) {
    if (busyRef.current) return;
    const key = keyOf(shot);
    const draft = draftsRef.current[key];
    if (!draft || !onSaveFrame) return;
    busyRef.current = true;
    setBusyId(key);
    setError("");
    try {
      // Persist actual bytes on Flask; only a short frame id is stored in browser project data.
      const uploaded = await uploadStoryboardFrame(draft.blob);
      const saved = await onSaveFrame(shot.sceneId, shot.id, {
        frameId: uploaded.frameId,
        style: draft.style,
        quality: draft.quality,
        approved: true,
        source: "ai",
        generatedAt: new Date().toISOString(),
      });
      if (saved === false) throw new Error("Image uploaded, but project metadata could not be saved. Your existing approved image was not changed.");
      setDrafts(old => {
        if (old[key]?.previewUrl) URL.revokeObjectURL(old[key].previewUrl);
        const next = { ...old }; delete next[key]; return next;
      });
    } catch (err) { setError(err?.message || "Unable to save frame."); }
    finally { busyRef.current = false; setBusyId(null); }
  }

  function media(shot) {
    const draft = drafts[keyOf(shot)];
    const url = draft?.previewUrl || (shot.storyboardImage?.frameId ? storyboardFrameUrl(shot.storyboardImage.frameId) : "");
    return url ? <img className="storyboard-frame-image" src={url} alt={`Storyboard frame for ${shot.name || `shot ${shot.shotIndex}`}`} />
      : <><Images size={24}/><span>No frame generated yet</span></>;
  }

  return <section className="storyboard-workspace ff-storyboard-compact">
    <div className="storyboard-heading">
      <div><span className="studio-eyebrow">VISUAL SEQUENCE</span><h2>Storyboard</h2><p>Generate a frame, preview it, then approve and save. Saved shots stay unchanged.</p></div>
      <div className="storyboard-view-controls" aria-label="Storyboard layout">
        <button type="button" className={view === "grid" ? "selected" : ""} onClick={() => setView("grid")} aria-pressed={view === "grid"}><LayoutGrid size={16}/> Grid</button>
        <button type="button" className={view === "sequence" ? "selected" : ""} onClick={() => setView("sequence")} aria-pressed={view === "sequence"}><List size={16}/> Sequence</button>
      </div>
    </div>
    {!aiConfigured && <p className="ws-connection">{`${APP_NAME} AI backend is not connected. Set VITE_API_BASE_URL.`}</p>}
    {!!error && <p className="ff-storyboard-ai-alert" role="alert">{error}</p>}
    {!frames.length ? <div className="storyboard-empty"><Images size={28}/><h3>No storyboard frames yet</h3><p>Save a scene and its shots in Shot Planner first.</p></div>
      : <div className={`storyboard-frames ${view}`}>
        {frames.map(shot => {
          const key = keyOf(shot);
          const hasDraft = Boolean(drafts[key]);
          const approved = Boolean(shot.storyboardImage?.approved && shot.storyboardImage?.frameId);
          const loading = busyId === key;
          return <div className="storyboard-frame ff-frame-button" key={key}>
            <button type="button" className="storyboard-frame-main" onClick={() => setExpandedId(key)} aria-label={`Open ${shot.name || `shot ${shot.shotIndex}`}`}>
              <div className="storyboard-frame-media">{media(shot)}</div>
              <div className="storyboard-frame-details">
                <span className="storyboard-frame-number">{shot.sceneName} · SHOT {String(shot.shotIndex).padStart(2, "0")}</span>
                <h3>{shot.name || shot.type || "Untitled shot"}</h3>
                <p>{shot.description || "No description yet."}</p>
                <div className="storyboard-frame-bottom"><span className="storyboard-frame-meta">{[shot.type,shot.angle].filter(Boolean).join(" · ") || "Shot details"}</span><Maximize2 size={15}/></div>
              </div>
            </button>
            <div className="ff-storyboard-ai-actions">
              <div className="ff-storyboard-selector"><label htmlFor={`ff-style-${key}`}>Style</label>
                <IOSSelect id={`ff-style-${key}`} value={styles[key] || "black_white"} onChange={e => setStyles(old => ({...old,[key]:e.target.value}))}>
                  <option value="black_white">Black &amp; white</option>
                  <option value="colored">Colored sketch</option>
                </IOSSelect>
              </div>
              <div className="ff-storyboard-selector"><label htmlFor={`ff-quality-${key}`}>Quality</label>
                <IOSSelect id={`ff-quality-${key}`} value={qualities[key] || "standard"} onChange={e => setQualities(old => ({...old,[key]:e.target.value}))}>
                  <option value="standard">Standard</option>
                  <option value="high">High detail</option>
                </IOSSelect>
              </div>
              <button type="button" className="ff-storyboard-generate" disabled={!aiConfigured || Boolean(busyId)} onClick={() => generate(shot)}>
                {loading ? <><LoaderCircle size={14} className="ff-storyboard-spinner"/> Generating...</> : approved || hasDraft ? <><RefreshCw size={14}/> Regenerate</> : <><WandSparkles size={14}/> Generate</>}
              </button>
              {hasDraft && <button type="button" className="ff-storyboard-approve" disabled={Boolean(busyId)} onClick={() => approve(shot)}><Save size={14}/> Approve &amp; Save</button>}
            </div>
            <details className="ff-storyboard-precision"><summary>Fix object placement / orientation (optional)</summary><label htmlFor={`ff-orientation-${key}`}>Add precise visual direction for this frame</label><input id={`ff-orientation-${key}`} value={orientationNotes[key] || ""} onChange={e => setOrientationNotes(old => ({...old,[key]:e.target.value}))} placeholder="e.g. phone screen faces the viewer; door handle on right" maxLength={350}/><p>Applied on the next Generate/Regenerate. AI can still make visual mistakes.</p></details>
            {(approved || hasDraft) && <div className="ff-storyboard-frame-state">{hasDraft ? (approved ? "New preview — existing approved frame remains saved" : "Unsaved preview") : "Approved & saved"}</div>}
          </div>;
        })}
      </div>}
    {active && <div className="ff-storyboard-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setExpandedId(null); }}>
      <section role="dialog" aria-modal="true" aria-label={`Shot details: ${active.name || "Untitled shot"}`} className="ff-storyboard-dialog">
        <header><div><span className="storyboard-frame-number">{active.sceneName} · SHOT {String(active.shotIndex).padStart(2, "0")}</span><h2>{active.name || active.type || "Untitled shot"}</h2></div><button type="button" autoFocus aria-label="Close shot details" onClick={() => setExpandedId(null)}><X size={20}/></button></header>
        <div className="ff-storyboard-dialog-media">{media(active)}</div>
        <dl>{[["Description",active.description],["Shot type",active.type],["Camera angle",active.angle],["Movement",active.movement],["Lighting",active.lighting],["Mood",active.mood],["Character",active.characterName],["Expression",active.expression],["Dialogue",active.dialogue],["Dialogue timing",active.dialogueCue],["Duration",formatDuration(active.duration)],["Director's notes",active.notes]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not specified"}</dd></div>)}</dl>
      </section>
    </div>}
  </section>;
}
