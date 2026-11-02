import { Brain, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ProjectMemory({ project, onSave }) {
  const [reason, setReason] = useState("");
  const memories = Array.isArray(project.creativeDecisions) ? project.creativeDecisions : [];
  function add(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    onSave({ ...project, creativeDecisions: [...memories, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), type: "intent", suggestion: "", perspective: "Creator", reason: reason.trim() }] });
    setReason("");
  }
  function remove(id) {
    if (!window.confirm("Delete this creative decision?")) return;
    onSave({ ...project, creativeDecisions: memories.filter(m => m.id !== id) });
  }
  return <section className="ws-panel"><div className="ws-panel-heading"><div><span className="ws-eyebrow">CREATIVE INTENT</span><h2>Project Memory</h2><p>Store intentional choices. Future AI requests can use these project-scoped decisions once the backend supports memory retrieval.</p></div><Brain size={25}/></div>
    <form className="ws-memory-add" onSubmit={add}><label className="ws-field">Record a creative intention<textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain an artistic decision you want to preserve..." /></label><button className="ws-primary" type="submit" disabled={!reason.trim()}>Save intention</button></form>
    {memories.length ? <div className="ws-results">{[...memories].reverse().map(m=><article className="ws-review" key={m.id}><div className="ws-memory-row"><strong>{m.type === "intent" ? "Creator intention" : `${m.type} · ${m.perspective || "AI critique"}`}</strong><button className="ws-icon-btn" type="button" aria-label="Delete memory" onClick={()=>remove(m.id)}><Trash2 size={17}/></button></div>{m.suggestion && <p><strong>Suggestion: </strong>{m.suggestion}</p>}<p>{m.reason}</p></article>)}</div> : <div className="ws-empty"><Brain size={27}/><h3>No saved intentions</h3><p>Your creative decisions will appear here.</p></div>}
  </section>;
}
