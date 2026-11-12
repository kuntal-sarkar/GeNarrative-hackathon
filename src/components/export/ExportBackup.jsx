import { APP_NAME } from "../../config/branding"; // TAKEGRID_BRANDING_V1
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import IOSSelect from "../ui/IOSSelect";
import { FileText, FileDown, Printer, DatabaseBackup, Upload, ShieldCheck, AlertCircle, CheckCircle2, FileJson, ArrowRight } from "lucide-react";
import { exportTxt, exportPdf, exportJsonBackup, inspectBackup, restoreAsNewProject } from "../../services/projectTransfer";
import "./ExportBackup.css";

const OPTIONS = [
  { value: "story", label: "Story", help: "Synopsis and full story text" },
  { value: "scenes", label: "Scenes", help: "Scene titles and descriptions" },
  { value: "shots", label: "Shots", help: "Scene-by-scene shot plans" },
  { value: "all", label: "Story + Scenes + Shots", help: "Combined production document" },
];

export default function ExportBackup({ projectId, hasUnsaved }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [selection, setSelection] = useState("all");
  const [inspected, setInspected] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  const saved = Boolean(projectId);
  function doExport(action) {
    setError(""); setMessage("");
    try {
      if (action === "txt") exportTxt(projectId, selection);
      else if (action === "pdf") exportPdf(projectId, selection);
      else exportJsonBackup(projectId);
      setMessage(action === "pdf" ? "Print preview opened. Select Save as PDF in the print dialog." : "Saved-project export prepared.");
    } catch (err) { setError(err?.message || "Export failed."); }
  }
  async function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setInspected(null); setError(""); setMessage("");
    if (!file) return;
    setWorking(true);
    try { setInspected(await inspectBackup(file)); }
    catch (err) { setError(err?.message || "Could not read the backup file."); }
    finally { setWorking(false); }
  }
  function importProject() {
    if (!inspected || hasUnsaved || working) return;
    const ok = window.confirm(`Restore "${inspected.preview.title}" as a NEW project?\n\nExisting projects will not be overwritten. This will create a separate copy in your library.`);
    if (!ok) return;
    setWorking(true); setError("");
    try {
      const newId = restoreAsNewProject(inspected.payload);
      setInspected(null);
      navigate(`/projects/${encodeURIComponent(newId)}`);
    } catch (err) { setError(err?.message || "Restore failed."); }
    finally { setWorking(false); }
  }

  return <section className="ff-eb" aria-label="Export and backup tools">
    <header className="ff-eb__intro">
      <span className="ff-eb__eyebrow">PROJECT PORTABILITY</span>
      <h2>Export &amp; Backup</h2>
      <p>Take your saved work with you. Export a readable document, or keep a complete project backup you can restore later.</p>
      {hasUnsaved && <div className="ff-eb__warning"><AlertCircle size={17}/> Unsaved edits are not included. Save them in their sections first.</div>}
    </header>

    <div className="ff-eb__grid">
      <section className="ff-eb__card" aria-labelledby="ff-eb-document">
        <div className="ff-eb__cardtitle"><span className="ff-eb__icon"><FileText size={21}/></span><div><h3 id="ff-eb-document">Export a document</h3><p>Readable text, not raw JSON.</p></div></div>
        <div className="ff-eb__label" id="ff-eb-include-label">What to include</div>
        <IOSSelect value={selection} onChange={e=>setSelection(e.target.value)} aria-label="What to include">
          {OPTIONS.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </IOSSelect>
        <p className="ff-eb__help">{OPTIONS.find(opt=>opt.value===selection)?.help}</p>
        <div className="ff-eb__actions">
          <button type="button" onClick={()=>doExport("txt")} disabled={!saved}><FileDown size={17}/> Download TXT</button>
          <button type="button" onClick={()=>doExport("pdf")} disabled={!saved}><Printer size={17}/> Save as PDF</button>
        </div>
        <p className="ff-eb__muted">PDF uses your browser's print dialog. Select “Save as PDF” as the destination.</p>
      </section>

      <section className="ff-eb__card" aria-labelledby="ff-eb-backup">
        <div className="ff-eb__cardtitle"><span className="ff-eb__icon"><DatabaseBackup size={21}/></span><div><h3 id="ff-eb-backup">Full project backup</h3><p>Keep a portable copy of your saved project.</p></div></div>
        <div className="ff-eb__backuptext"><ShieldCheck size={18}/> Includes project metadata, story, characters, scenes, shots, creative memory, chat data saved in the project, and available version history.</div>
        <button type="button" className="ff-eb__primary" onClick={()=>doExport("json")} disabled={!saved}><FileJson size={17}/> Download JSON backup</button>
        <p className="ff-eb__muted">Backup contains data currently stored in this browser. It does not include unsaved edits or files held outside project storage.</p>
      </section>
    </div>

    <section className="ff-eb__restore" aria-labelledby="ff-eb-restore">
      <div className="ff-eb__cardtitle"><span className="ff-eb__icon"><Upload size={20}/></span><div><h3 id="ff-eb-restore">Restore from backup</h3><p>Import a JSON backup as a separate project—no overwriting.</p></div></div>
      <input ref={fileRef} type="file" accept=".json,application/json" className="ff-eb__hidden" onChange={chooseFile} aria-label={`Choose ${APP_NAME} backup JSON file`}/>
      <button type="button" className="ff-eb__choose" onClick={()=>fileRef.current?.click()} disabled={working}><Upload size={17}/> Choose backup file</button>
      {working && <p className="ff-eb__muted" role="status">Validating backup...</p>}
      {inspected && <div className="ff-eb__preview">
        <div><span className="ff-eb__preview-kicker"><CheckCircle2 size={16}/>{` Valid ${APP_NAME} backup`}</span><h4>{inspected.preview.title}</h4><p>{[inspected.preview.genre,inspected.preview.language].filter(Boolean).join(" · ") || "Saved creative project"}</p><div className="ff-eb__stats"><span>{inspected.preview.scenes} scenes</span><span>{inspected.preview.shots} shots</span><span>{inspected.preview.characters} characters</span><span>{inspected.preview.versions} versions</span></div></div>
        <button type="button" className="ff-eb__primary" onClick={importProject} disabled={working || hasUnsaved}>Restore as new project <ArrowRight size={17}/></button>
      </div>}
      {inspected && hasUnsaved && <p className="ff-eb__muted">Save or discard current edits before restoring a project.</p>}
    </section>
    {error && <p className="ff-eb__error" role="alert">{error}</p>}
    {message && <p className="ff-eb__success" role="status"><CheckCircle2 size={17}/>{message}</p>}
  </section>;
}
