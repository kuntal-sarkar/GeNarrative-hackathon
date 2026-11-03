import IOSSelect from "../components/ui/IOSSelect";
import SearchField from "../components/ui/SearchField";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, BookOpenText, Clapperboard, Clock3,
  Film, FolderOpen, LayoutGrid, Plus, Search, Trash2, X, UploadCloud, FileText,
} from "lucide-react";
import { deleteProject, getProjects, saveProject } from "../services/projectService";
import { readScript } from "../services/scriptImport";
import "./StudioIndex.css";
import "./ProjectWorkspace.css";
import "./StudioPolish.css";
import "./StudioRefresh.css";
import "../styles/WorkspaceRefresh.css";
import "../styles/FrameforgePolish.css";

const MODES = [
  { id: "ai", label: "Create story with AI" },
  { id: "script", label: "Use my script" },
  { id: "blank", label: "Start from scratch" },
];
const EMPTY_FORM = { title: "", genre: "Drama", language: "English", mode: "blank", idea: "" };
const plural = (n, noun) => `${n} ${noun}${n === 1 ? "" : "s"}`;
const shotCount = (project) => (project.scenes || []).reduce((total, scene) => total + (scene.shots || []).length, 0);
const readableDate = (value) => {
  if (!value) return "Not updated yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not updated yet" : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

export default function Studio() {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState(getProjects);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [form, setForm] = useState(EMPTY_FORM);
  const [newOpen, setNewOpen] = useState(false);
  const [error, setError] = useState("");
  const [scriptFile, setScriptFile] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const sync = () => setProjects(getProjects());
    window.addEventListener("frameforge:projects-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("frameforge:projects-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    if (location.state?.projectId) {
      navigate(`/projects/${encodeURIComponent(location.state.projectId)}`, { replace: true, state: null });
      return;
    }
    const requested = location.state?.newMode ?? location.state?.startMode;
    if (requested) {
      setForm({ ...EMPTY_FORM, mode: MODES.some((m) => m.id === requested) ? requested : "blank" });
      setNewOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.key, location.pathname, location.state, navigate]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = projects.filter((p) => `${p.title || ""} ${p.genre || ""}`.toLowerCase().includes(q));
    result.sort((a, b) => sort === "name"
      ? (a.title || "").localeCompare(b.title || "")
      : (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    return result;
  }, [projects, search, sort]);
  const totalScenes = projects.reduce((n, p) => n + (p.scenes || []).length, 0);
  const totalShots = projects.reduce((n, p) => n + shotCount(p), 0);

  function openCreate(mode = "blank") {
    setForm({ ...EMPTY_FORM, mode });
    setScriptFile(null);
    setError("");
    setNewOpen(true);
  }
  async function create(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Enter a project name before creating."); return; }
    if (creating) return;
    setCreating(true);
    try {
      // Read first. Failed imports must never leave behind an empty project.
      const imported = form.mode === "script" && scriptFile ? await readScript(scriptFile) : null;
      if (form.mode === "script" && !imported) throw new Error("Choose a PDF, TXT or MD script before creating.");
      const now = new Date().toISOString();
      const p = saveProject({ id: crypto.randomUUID(), title: form.title.trim(),
        genre: form.genre, language: form.language, mode: form.mode,
        idea: form.idea.trim(), story: imported?.text || "", sourceFilename: imported?.filename || "",
        scenes: [], chatThreads: [], activeChatThreadId: null,
        createdAt: now, updatedAt: now });
      setNewOpen(false);
      navigate(`/projects/${encodeURIComponent(p.id)}/${form.mode === "ai" ? "chat" : "story"}`);
    } catch (err) {
      setError(err?.message || "Could not create project. Check browser storage.");
    } finally { setCreating(false); }
  }
  function remove(id) {
    if (!window.confirm("Delete this project and all its scenes, shots and decisions?")) return;
    try { deleteProject(id); setProjects(getProjects()); }
    catch { setError("Could not delete project."); }
  }

  return <div className="project-index ff-library">
    <section className="ff-library-hero" aria-labelledby="ff-projects-heading">
      <div className="ff-library-hero-copy">
        <div className="ff-library-kicker"><span className="ff-library-kicker-dot"/> YOUR CREATIVE SPACE</div>
        <h1 id="ff-projects-heading">Bring your <em>stories</em> to life.</h1>
        <p>Your projects, creative decisions and next frames — all in one place.</p>
        <button type="button" className="ff-library-create" onClick={() => openCreate()}><Plus size={18}/> Create new project <ArrowUpRight size={16}/></button>
      </div>
      <div className="ff-library-hero-art" aria-hidden="true">
        <div className="ff-art-label"><Clapperboard size={16}/> YOUR PRODUCTION DESK</div>
        <div className="ff-art-frame ff-art-frame-back"><Film size={24}/></div>
        <div className="ff-art-frame ff-art-frame-front"><BookOpenText size={26}/><span>CREATE.</span><span>DIRECT.</span><span>REFINE.</span></div>
        <span className="ff-art-orbit"/>
      </div>
    </section>

    <section className="ff-library-summary" aria-label="Project statistics">
      <div><span className="ff-summary-icon blue"><FolderOpen size={19}/></span><strong>{projects.length}</strong><small>Total projects</small></div>
      <div><span className="ff-summary-icon coral"><Clapperboard size={19}/></span><strong>{totalScenes}</strong><small>Planned scenes</small></div>
      <div><span className="ff-summary-icon peach"><Film size={19}/></span><strong>{totalShots}</strong><small>Planned shots</small></div>
    </section>

    <section className="ff-library-section" aria-labelledby="ff-library-title">
      <div className="ff-library-heading"><div><span className="ff-library-overline">YOUR LIBRARY</span><h2 id="ff-library-title">All projects <span>{projects.length}</span></h2><p>Pick up where you left off, or start something new.</p></div><div className="ff-view-label"><LayoutGrid size={17}/> Project library</div></div>
      <div className="ff-library-controls">
        <SearchField id="project-search" className="ff-search" label="Search projects" placeholder="Search projects or genres..." value={search} onChange={setSearch} />
        <label className="ff-sort">Sort by <IOSSelect value={sort} onChange={(e) => setSort(e.target.value)}><option value="recent">Recently updated</option><option value="name">Project name</option></IOSSelect></label>
      </div>
      {error && !newOpen && <p className="ws-error" role="alert">{error}</p>}
      {visible.length ? <div className="ff-library-grid">
        {visible.map((p, index) => {
          const scenes = (p.scenes || []).length;
          const shots = shotCount(p);
          const title = p.title?.trim() || "Untitled Story";
          return <article key={p.id} className="ff-project-card">
            <button type="button" className="ff-project-card-link" onClick={() => navigate(`/projects/${encodeURIComponent(p.id)}`)} aria-label={`Open ${title}`}>
              <div className={`ff-project-art art-${index % 4}`}><div className="ff-project-art-inner"><Clapperboard size={28}/><span>{String(index + 1).padStart(2, "0")}</span></div><span className="ff-project-art-caption">FRAMEFORGE / PROJECT</span></div>
              <div className="ff-project-main"><div className="ff-project-title-line"><h3>{title}</h3><ArrowUpRight size={19}/></div>
                <div className="ff-project-tags"><span>{p.genre || "Story"}</span><span>{p.language || "Language not set"}</span></div>
                <p className="ff-project-excerpt">{p.story?.trim() || p.idea?.trim() || "Your story is ready to take shape. Open this project to begin."}</p>
                <div className="ff-project-facts"><span><Clapperboard size={15}/>{plural(scenes, "scene")}</span><span><Film size={15}/>{plural(shots, "shot")}</span></div>
                <div className="ff-project-bottom"><span><Clock3 size={14}/> {readableDate(p.updatedAt)}</span><span className="ff-project-enter">Continue <ArrowRight size={16}/></span></div>
              </div>
            </button>
            <button className="ff-project-delete" type="button" title={`Delete ${title}`} aria-label={`Delete ${title}`} onClick={() => remove(p.id)}><Trash2 size={16}/></button>
          </article>;
        })}
      </div> : <div className="ff-library-empty"><FolderOpen size={30}/><h3>{search ? "No matching projects" : "Your library starts here"}</h3><p>{search ? "Try another title or genre." : "Create a project and start shaping your first story."}</p>{!search && <button className="ws-primary" onClick={() => openCreate()}>Create project <Plus size={16}/></button>}</div>}
    </section>

    {newOpen && <div className="ff-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setNewOpen(false); }}><div className="ff-modal" role="dialog" aria-modal="true" aria-labelledby="ff-create-title"><div className="ff-modal-header"><div><span className="ws-eyebrow">START A PROJECT</span><h2 id="ff-create-title">Create a project</h2><p>Nothing is created until you click Create Project.</p></div><button type="button" className="ws-icon-btn" onClick={() => setNewOpen(false)} aria-label="Close"><X size={19}/></button></div><form onSubmit={create} className="ff-create-form"><label>Project name<input autoFocus value={form.title} maxLength={120} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} placeholder="Enter a project name" required/></label><label>How would you like to start?<IOSSelect value={form.mode} onChange={(e) => setForm((v) => ({ ...v, mode: e.target.value }))}>{MODES.map((m) => <option value={m.id} key={m.id}>{m.label}</option>)}</IOSSelect></label><div className="ff-form-pair"><label>Genre<IOSSelect value={form.genre} onChange={(e) => setForm((v) => ({ ...v, genre: e.target.value }))}>{["Drama", "Thriller", "Mystery", "Horror", "Romance", "RomCom", "Sci-Fi", "Comedy", "Other"].map((x) => <option key={x}>{x}</option>)}</IOSSelect></label><label>Language<IOSSelect value={form.language} onChange={(e) => setForm((v) => ({ ...v, language: e.target.value }))}>{["English", "Hindi", "Bengali", "Hinglish"].map((x) => <option key={x}>{x}</option>)}</IOSSelect></label></div>{form.mode === "script" && <label><span className="ff-upload-heading"><UploadCloud size={20}/> Import screenplay (PDF / TXT / MD, max 25 MB)</span><span className="ff-upload-hint">Click below to browse a PDF or text file</span><input className="ff-create-file" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" onChange={e=>setScriptFile(e.target.files?.[0] || null)}/><small>{scriptFile && <span className="ff-file-selected"><FileText size={14}/> {scriptFile.name} · {(scriptFile.size/1048576).toFixed(1)} MB</span>}Selectable PDF text is extracted locally; scanned PDFs need OCR. No file is uploaded to a server.</small></label>}{form.mode === "ai" && <label>Story idea (optional)<textarea rows={3} value={form.idea} onChange={(e) => setForm((v) => ({ ...v, idea: e.target.value }))} placeholder="Describe your original story idea"/></label>}{error && <p className="ws-error" role="alert">{error}</p>}<div className="ff-modal-actions"><button type="button" className="ws-ghost" onClick={() => setNewOpen(false)}>Cancel</button><button type="submit" className="ws-primary" disabled={!form.title.trim() || creating}>{creating ? "Preparing..." : "Create Project"}</button></div></form></div></div>}
  </div>;
}
