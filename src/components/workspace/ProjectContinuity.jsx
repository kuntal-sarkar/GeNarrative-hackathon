import { useState } from "react";
import { ScanSearch } from "lucide-react";
import { aiConfigured, requestProjectAI } from "../../services/workspaceApi";

export default function ProjectContinuity({ project, onSave }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function check() {
    if (!aiConfigured || busy) return;
    setBusy(true); setError("");
    try {
      const result = await requestProjectAI(project.id, "continuity", { language: project.language || "English" });
      if (!Array.isArray(result?.issues)) throw new Error("Invalid continuity response.");
      onSave({ ...project, continuityIssues: result.issues.map(issue => ({ ...issue, id: issue.id || crypto.randomUUID(), state: "open" })) });
    } catch (e) { setError(e.message || "Check failed."); }
    finally { setBusy(false); }
  }
  function mark(id, state) { onSave({ ...project, continuityIssues: (project.continuityIssues || []).map(i => i.id === id ? { ...i, state } : i) }); }
  const issues = project.continuityIssues || [];
  return <section className="ws-panel"><div className="ws-panel-heading"><div><span className="ws-eyebrow">CONSISTENCY REVIEW</span><h2>Continuity Checker</h2><p>Review potential story, character, prop and timeline inconsistencies.</p></div><ScanSearch size={26}/></div><button className="ws-primary" disabled={!aiConfigured || busy} onClick={check}>{busy ? "Checking..." : "Check continuity"}</button>{!aiConfigured && <p className="ws-connection">Requires the Flask backend. No invented continuity issues are displayed.</p>}{error && <p className="ws-error" role="alert">{error}</p>}{issues.length ? <div className="ws-results">{issues.map(i=><article className="ws-review" key={i.id}><strong>{i.title || "Potential continuity issue"}</strong><p>{i.description || ""}</p><small>Status: {i.state || "open"}</small><div className="ws-review-actions"><button className="ws-ghost" onClick={()=>mark(i.id,"resolved")}>Resolve</button><button className="ws-ghost" onClick={()=>mark(i.id,"intentional")}>Intentional</button><button className="ws-ghost" onClick={()=>mark(i.id,"dismissed")}>Dismiss</button></div></article>)}</div> : <div className="ws-empty"><ScanSearch size={27}/><h3>No continuity results</h3><p>When you run a real review, issues will be displayed here.</p></div>}</section>;
}
