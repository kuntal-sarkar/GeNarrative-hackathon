import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Brain, Check, CheckCircle2, ChevronDown, Clock3, FileDiff, Filter, Lightbulb, MessageSquareText, Pencil, Plus, Search, ShieldCheck, Trash2, X, XCircle } from "lucide-react";
import { getProject, getProjects, saveProject } from "../services/projectService";
import "./Memory.css";

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const recordsOf = project => Array.isArray(project?.creativeDecisions) ? project.creativeDecisions : [];
const kindOf = record => String(record?.type || "intent").toLowerCase();
const pretty = value => ({ intent: "Creator intention", accept: "Accepted", modify: "Modified", reject: "Rejected" })[kindOf({type:value})] || String(value || "Decision");
const dateText = date => { if (!date) return "Date unavailable"; const d = new Date(date); return Number.isNaN(d.getTime()) ? "Date unavailable" : d.toLocaleString(undefined, { year:"numeric", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }); };
const trim = (s,n=150) => { const t = typeof s === "string" ? s : ""; return t.length > n ? `${t.slice(0,n).trim()}…` : t; };

export default function Memory() {
  const [projects, setProjects] = useState(() => getProjects());
  const [projectId, setProjectId] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [newIntention, setNewIntention] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const refresh = () => setProjects(getProjects());
    window.addEventListener("frameforge:projects-changed", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("frameforge:projects-changed", refresh); window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);

  const selected = projects.find(p => p.id === projectId) || null;
  const available = useMemo(() => projects.filter(p => `${p.title || ""} ${p.genre || ""}`.toLowerCase().includes(projectSearch.toLowerCase())), [projects,projectSearch]);
  const records = useMemo(() => [...recordsOf(selected)].map((r,i) => ({...r, _key:r.id || `record-${i}`})).reverse(), [selected]);
  const counts = useMemo(() => ({ total:records.length, intent:records.filter(r=>kindOf(r)==="intent").length, accept:records.filter(r=>kindOf(r)==="accept").length, modify:records.filter(r=>kindOf(r)==="modify").length, reject:records.filter(r=>kindOf(r)==="reject").length }), [records]);
  const filtered = records.filter(r => {
    if (typeFilter !== "all" && kindOf(r) !== typeFilter) return false;
    if (targetFilter !== "all" && (r.target || "other") !== targetFilter) return false;
    const haystack = [r.reason,r.suggestion,r.perspective,r.context,r.before,r.after,r.target].filter(v=>typeof v==="object" ? false : Boolean(v)).join(" ").toLowerCase();
    return haystack.includes(recordSearch.trim().toLowerCase());
  });

  function choose(id) { setProjectId(id); setExpanded(null); setRecordSearch(""); setTypeFilter("all"); setTargetFilter("all"); setNewIntention(""); setNotice(""); setError(""); }
  function updateProject(edit) {
    const live = getProject(projectId);
    if (!live) throw new Error("Project no longer exists. Refresh and try again.");
    const saved = saveProject(edit(live));
    setProjects(getProjects());
    return saved;
  }
  function addIntention(e) {
    e.preventDefault();
    if (!selected || !newIntention.trim()) return;
    setError(""); setNotice("");
    try {
      updateProject(project => ({...project, creativeDecisions: [...recordsOf(project), {id:uid(), type:"intent", perspective:"Creator", suggestion:"", reason:newIntention.trim(), createdAt:new Date().toISOString()}]}));
      setNewIntention(""); setNotice("Creative intention saved to this project.");
    } catch (err) { setError(err.message || "Unable to save intention."); }
  }
  function removeIntention(record) {
    if (kindOf(record) !== "intent") return;
    if (!window.confirm("Delete this creator intention? This cannot be undone.")) return;
    setError(""); setNotice("");
    try {
      updateProject(project => ({...project, creativeDecisions: recordsOf(project).filter(r => r.id !== record.id)}));
      setNotice("Intention deleted.");
    } catch (err) { setError(err.message || "Unable to delete intention."); }
  }
  const statCards = [ ["Saved memories",counts.total,Brain],["Accepted",counts.accept,CheckCircle2],["Modified",counts.modify,Pencil],["Rejected",counts.reject,XCircle] ];
  return <div className="mm-page">
    <header className="mm-hero"><div><span className="mm-eyebrow"><span/> CREATIVE MEMORY</span><h1>Every decision has <em>a story.</em></h1><p>Keep your creative intentions and review decisions in one place. Nothing is invented—everything comes from your saved projects.</p></div><div className="mm-hero-mark" aria-hidden="true"><Brain size={48}/><span>Remember the why.</span></div></header>
    <div className="mm-layout">
      <aside className="mm-sidebar"><div className="mm-sidebar-heading"><span className="mm-overline">PROJECT LIBRARY</span><strong>{projects.length} project{projects.length === 1 ? "" : "s"}</strong></div><label className="mm-search"><Search size={17}/><input aria-label="Search projects" placeholder="Find a project..." value={projectSearch} onChange={e=>setProjectSearch(e.target.value)}/></label><div className="mm-projects">{available.map(p => <button key={p.id} className={`mm-project ${projectId===p.id ? "active" : ""}`} onClick={()=>choose(p.id)}><span className="mm-project-icon"><BookOpen size={18}/></span><span><strong>{p.title || "Untitled Story"}</strong><small>{recordsOf(p).length} memories · {(p.scenes || []).length} scenes</small></span><ArrowRight className="mm-project-arrow" size={15}/></button>)}{!projects.length && <p className="mm-empty-small">No projects yet. <Link to="/studio">Create a project</Link>.</p>}{projects.length>0 && !available.length && <p className="mm-empty-small">No matching projects.</p>}</div><div className="mm-sidebar-note"><ShieldCheck size={20}/><p>Memory stays connected to the original project. Your story is never changed by browsing this page.</p></div></aside>
      <main className="mm-main">{!selected ? <section className="mm-empty"><div className="mm-empty-icon"><Brain size={33}/></div><h2>Your creative history lives here</h2><p>Select a project to view critique decisions, compare saved revisions and record new creative intentions.</p>{!projects.length && <Link className="mm-button primary" to="/studio"><Plus size={16}/> Create a project</Link>}</section> : <>
        <div className="mm-main-header"><div><span className="mm-overline">PROJECT MEMORY</span><h2>{selected.title || "Untitled Story"}</h2><p>{selected.genre || "Story"} · {selected.language || "English"} · Updated {dateText(selected.updatedAt)}</p></div><Link className="mm-button outline" to={`/projects/${encodeURIComponent(selected.id)}`}><BookOpen size={16}/> Open story</Link></div>
        <div className="mm-stats">{statCards.map(([label,value,Icon])=><div className="mm-stat" key={label}><span className="mm-stat-icon"><Icon size={19}/></span><strong>{value}</strong><small>{label}</small></div>)}</div>
        {error && <div className="mm-alert error" role="alert">{error}</div>}{notice && <div className="mm-alert success" role="status"><Check size={16}/>{notice}</div>}
        <section className="mm-panel mm-intention"><div className="mm-panel-heading"><div><span className="mm-overline">HUMAN CREATIVE CONTROL</span><h3>Record an intention</h3><p>Capture a direction you want the AI and your team to respect in future revisions.</p></div><Lightbulb size={23}/></div><form onSubmit={addIntention}><label htmlFor="mm-intention-input">Your creative intention</label><textarea id="mm-intention-input" rows={3} value={newIntention} onChange={e=>setNewIntention(e.target.value)} placeholder="Why does this artistic choice matter to your story?"/><div className="mm-form-bottom"><span>Saved only when you click the button.</span><button className="mm-button primary" type="submit" disabled={!newIntention.trim()}><Plus size={16}/> Save intention</button></div></form></section>
        <section className="mm-panel mm-timeline"><div className="mm-panel-heading"><div><span className="mm-overline">PROJECT DECISION LOG</span><h3>Creative timeline</h3><p>Actual choices recorded by you and the Creative Critics workflow.</p></div><Clock3 size={23}/></div><div className="mm-filters"><label className="mm-search mm-record-search"><Search size={16}/><input value={recordSearch} onChange={e=>setRecordSearch(e.target.value)} aria-label="Search decisions" placeholder="Search memories..."/></label><label className="mm-select-wrap"><Filter size={16}/><select aria-label="Filter by decision" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="all">All decisions</option><option value="intent">Intentions</option><option value="accept">Accepted</option><option value="modify">Modified</option><option value="reject">Rejected</option></select><ChevronDown size={14}/></label><label className="mm-select-wrap"><select aria-label="Filter by target" value={targetFilter} onChange={e=>setTargetFilter(e.target.value)}><option value="all">All targets</option><option value="story">Story</option><option value="scene">Scenes</option><option value="other">Other / unspecified</option></select><ChevronDown size={14}/></label></div>
          {filtered.length ? <div className="mm-events">{filtered.map(r => { const isOpen=expanded===r._key; const hasDiff=typeof r.before==="string" && typeof r.after==="string"; const type=kindOf(r);return <article className="mm-event" key={r._key}><div className={`mm-event-symbol ${type}`}>{type==="accept"?<Check size={18}/>:type==="modify"?<Pencil size={17}/>:type==="reject"?<X size={18}/>:<Lightbulb size={18}/>}</div><div className="mm-event-body"><div className="mm-event-meta"><span className={`mm-kind ${type}`}>{pretty(type)}</span><time>{dateText(r.createdAt)}</time></div><h4>{r.perspective || (type==="intent" ? "Creator intention" : "Creative decision")}</h4>{r.suggestion && <p className="mm-suggestion"><strong>Suggestion:</strong> {trim(r.suggestion,360)}</p>}{r.reason && <p className="mm-reason">{r.reason}</p>}{r.target && <span className="mm-target">Target: {r.target}{r.targetId ? " · Specific scene" : ""}</span>}<div className="mm-event-actions">{hasDiff && <button type="button" onClick={()=>setExpanded(isOpen?null:r._key)}><FileDiff size={16}/>{isOpen?"Hide saved revision":"Compare before & after"}</button>}{type==="intent" && r.id && <button className="danger" type="button" onClick={()=>removeIntention(r)}><Trash2 size={15}/> Delete intention</button>}</div>{isOpen && hasDiff && <div className="mm-diff"><div><span>BEFORE</span><pre>{r.before}</pre></div><div><span>AFTER</span><pre>{r.after}</pre></div></div>}</div></article>; })}</div> : <div className="mm-no-records"><Brain size={25}/><h4>{records.length ? "No matching memories" : "No creative decisions yet"}</h4><p>{records.length ? "Try clearing a search or filter." : "Save your first intention above, or make a decision in Creative Critics."}</p>{!records.length && <Link to="/critics">Go to Creative Critics <ArrowRight size={14}/></Link>}</div>}</section>
        <div className="mm-footer-note"><MessageSquareText size={18}/><span>Accept, Modify and Reject decisions originate in <Link to="/critics">Creative Critics</Link>. Only decisions with stored revisions can show before/after comparisons. Full story version history requires a separate versioning feature.</span></div>
      </>}</main>
    </div>
  </div>;
}
