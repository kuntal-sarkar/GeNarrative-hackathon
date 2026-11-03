import IOSSelect from "../ui/IOSSelect";
import { BookOpen, FileText, PenLine, Upload } from "lucide-react";
import "./StorySetup.css";

const modes = [
  { id: "ai", label: "Create with AI", icon: BookOpen },
  { id: "script", label: "My Script", icon: FileText },
  { id: "blank", label: "Start from Scratch", icon: PenLine },
];

export default function StorySetup({ mode, onModeChange, genre, onGenreChange, language, onLanguageChange, idea, onIdeaChange, onUpload }) {
  return <section className="story-setup">
    <div className="story-setup-heading"><span className="studio-eyebrow">YOUR CREATIVE STARTING POINT</span><h2>How do you want to create?</h2><p>Choose how you'll work on this project.</p></div>
    <div className="story-mode-grid">{modes.map(({id,label,icon:Icon}) =>
      <button key={id} type="button" className={`story-mode-card ${mode === id ? "story-mode-active" : ""}`} aria-pressed={mode === id} onClick={() => onModeChange(id)}><Icon size={22}/><span>{label}</span></button>
    )}</div>
    <div className="story-config-panel">
      <h3>Story Details</h3>
      <div className="story-config-grid">
        <label className="studio-field"><span>Genre</span><IOSSelect value={genre} onChange={e => onGenreChange(e.target.value)}>
          {['Thriller','Drama','Mystery','Horror','Romance','Sci-Fi','Comedy','Other'].map(x => <option key={x}>{x}</option>)}
        </IOSSelect></label>
        <label className="studio-field"><span>Preferred Language</span><IOSSelect value={language} onChange={e => onLanguageChange(e.target.value)}>
          {['English','Hindi','Bengali','Hinglish'].map(x => <option key={x}>{x}</option>)}
        </IOSSelect></label>
      </div>
      {mode === "ai" && <div className="story-mode-extra">
        <label className="studio-field"><span>Story idea</span><textarea rows={4} value={idea} onChange={e => onIdeaChange(e.target.value)} placeholder="Describe your original story idea..." /></label>
        <p className="studio-help">AI generation requires the Flask + Gemini backend. You can write your story in the editor now; your idea is saved for future generation.</p>
        <button type="button" className="studio-outline-button" disabled title="Connect the backend to enable generation">Generate Story · Backend not connected</button>
      </div>}
      {mode === "script" && <div className="story-mode-extra">
        <label className="studio-upload"><Upload size={22}/><strong>Upload a TXT script</strong><span>Maximum 1 MB · PDF import requires backend integration</span>
          <input type="file" accept=".txt,text/plain" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}/>
        </label><p className="studio-help">You can also paste your script directly into the editor below.</p>
      </div>}
      {mode === "blank" && <div className="story-mode-extra"><p className="studio-help">Start writing below. Nothing will be generated automatically.</p></div>}
    </div>
  </section>;
}
