import { useEffect, useState } from "react";
import { Images, LayoutGrid, List, X, Maximize2 } from "lucide-react";
import { formatDuration } from "../../utils/formatDuration";
import "./Storyboard.css";
import "./StoryboardCompact.css";

export default function Storyboard({ scenes = [] }) {
  const [view, setView] = useState("grid");
  const [expandedId, setExpandedId] = useState(null);
  const frames = scenes.flatMap((scene, sceneIndex) =>
    (Array.isArray(scene.shots) ? scene.shots : []).map((shot, index) => ({
      ...shot, sceneId: scene.id, sceneName: scene.name || scene.heading || `Scene ${sceneIndex + 1}`,
      sceneIndex: sceneIndex + 1, shotIndex: index + 1,
    }))
  );
  const active = frames.find(f => `${f.sceneId}:${f.id}` === expandedId);
  useEffect(() => {
    if (!active) return;
    const onKeyDown = event => { if (event.key === "Escape") setExpandedId(null); };
    window.addEventListener("keydown",onKeyDown);
    return () => window.removeEventListener("keydown",onKeyDown);
  },[active]);
  return <section className="storyboard-workspace ff-storyboard-compact">
    <div className="storyboard-heading">
      <div><span className="studio-eyebrow">VISUAL SEQUENCE</span><h2>Storyboard</h2><p>Compact preview of your shot plan. Open a frame to read everything.</p></div>
      <div className="storyboard-view-controls" aria-label="Storyboard layout">
        <button type="button" className={view === "grid" ? "selected" : ""} onClick={() => setView("grid")} aria-pressed={view === "grid"}><LayoutGrid size={16}/> Grid</button>
        <button type="button" className={view === "sequence" ? "selected" : ""} onClick={() => setView("sequence")} aria-pressed={view === "sequence"}><List size={16}/> Sequence</button>
      </div>
    </div>
    {!frames.length ? <div className="storyboard-empty"><Images size={28}/><h3>No storyboard frames yet</h3><p>Create shots in the Shot Planner to build the storyboard.</p></div> :
      <div className={`storyboard-frames ${view}`}>
        {frames.map(shot => <button type="button" className="storyboard-frame ff-frame-button" key={`${shot.sceneId}:${shot.id}`} onClick={() => setExpandedId(`${shot.sceneId}:${shot.id}`)} aria-label={`View ${shot.name || `shot ${shot.shotIndex}`} details`}>
          <div className="storyboard-frame-media"><Images size={24}/><span>No reference image</span></div>
          <div className="storyboard-frame-details">
            <span className="storyboard-frame-number">{shot.sceneName} · SHOT {String(shot.shotIndex).padStart(2,"0")}</span>
            <h3>{shot.name || shot.type || "Untitled shot"}</h3>
            <p>{shot.description || "No description yet."}</p>
            <div className="storyboard-frame-bottom"><span className="storyboard-frame-meta">{[shot.type,shot.angle].filter(Boolean).join(" · ") || "Shot details"}</span><Maximize2 size={15}/></div>
          </div>
        </button>)}
      </div>}
    {active && <div className="ff-storyboard-overlay" onMouseDown={event => {if(event.target === event.currentTarget)setExpandedId(null);}}>
      <section role="dialog" aria-modal="true" aria-label={`Shot details: ${active.name || "Untitled shot"}`} className="ff-storyboard-dialog">
        <header><div><span className="storyboard-frame-number">{active.sceneName} · SHOT {String(active.shotIndex).padStart(2,"0")}</span><h2>{active.name || active.type || "Untitled shot"}</h2></div><button type="button" autoFocus aria-label="Close shot details" onClick={() => setExpandedId(null)}><X size={20}/></button></header>
        <div className="ff-storyboard-dialog-media"><Images size={28}/><span>No reference image added</span></div>
        <dl>
          {[["Description",active.description],["Shot type",active.type],["Camera angle",active.angle],["Movement",active.movement],["Lighting",active.lighting],["Mood",active.mood],["Duration",formatDuration(active.duration)],["Director's notes",active.notes]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value || "Not specified"}</dd></div>)}
        </dl>
      </section>
    </div>}
  </section>;
}
