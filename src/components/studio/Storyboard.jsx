import { useState } from "react";
import { Images, LayoutGrid, List } from "lucide-react";
import "./Storyboard.css";

export default function Storyboard({ scenes }) {
  const [view, setView] = useState("grid");
  const frames = scenes.flatMap((scene, sceneIndex) =>
    (Array.isArray(scene.shots) ? scene.shots : []).map((shot, index) => ({
      ...shot,
      sceneId: scene.id,
      sceneIndex: sceneIndex + 1,
      sceneHeading: scene.heading,
      shotIndex: index + 1,
    }))
  );

  return (
    <section className="storyboard-workspace">
      <div className="storyboard-heading">
        <div><span className="studio-eyebrow">VISUAL SEQUENCE</span><h2>Storyboard</h2><p>Automatically reflects your saved shot plan. No AI images are generated.</p></div>
        <div className="storyboard-view-controls" aria-label="Storyboard layout">
          <button type="button" className={view === "grid" ? "selected" : ""} onClick={() => setView("grid")} aria-pressed={view === "grid"}><LayoutGrid size={16}/> Grid</button>
          <button type="button" className={view === "sequence" ? "selected" : ""} onClick={() => setView("sequence")} aria-pressed={view === "sequence"}><List size={16}/> Sequence</button>
        </div>
      </div>
      {frames.length === 0 ? (
        <div className="storyboard-empty"><Images size={28}/><h3>No storyboard frames yet</h3><p>Create shots in the Shot Planner to build a storyboard sequence.</p></div>
      ) : (
        <div className={`storyboard-frames ${view === "sequence" ? "sequence" : ""}`}>
          {frames.map((shot) => (
            <article className="storyboard-frame" key={shot.id}>
              <div className="storyboard-frame-media" aria-label="Visual reference not added"><Images size={30}/><span>Reference image not added</span></div>
              <div className="storyboard-frame-details">
                <span className="storyboard-frame-number">{shot.sceneHeading || `Scene ${shot.sceneIndex}`} · SHOT {String(shot.shotIndex).padStart(2,"0")}</span>
                <h3>{shot.name || shot.type || "Unnamed shot"}</h3>
                <p>{shot.description || "No shot description yet."}</p>
                <div className="storyboard-frame-meta">{[shot.angle,shot.movement,shot.lighting].filter(Boolean).join(" · ") || "Shot details not specified"}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
