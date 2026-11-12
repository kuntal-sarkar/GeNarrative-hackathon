import { Brain, Trash2, Pencil, Check, X, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import IOSSelect from "../ui/IOSSelect";
import "./ProjectMemoryPolish.css";

const validRecords = (project) => Array.isArray(project?.creativeDecisions)
  ? project.creativeDecisions.filter(m => m && typeof m === "object") : [];

const isInactive = (m, records) => m.status === "archived" || m.status === "superseded" ||
  Boolean(m.supersededBy) || records.some(other => other !== m && other.type === "intent" &&
    other.supersedes && other.supersedes === m.id && other.status !== "archived" && !other.supersededBy);

export default function ProjectMemory({ project, onSave }) {
  const [reason, setReason] = useState("");
  const [replaces, setReplaces] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const memories = validRecords(project);
  const activeIntentions = memories.filter(m => m.type === "intent" && m.id && !isInactive(m, memories));

  useEffect(() => {
    setEditingId(null);
    setEditValue("");
    setReason("");
    setReplaces("");
    setFeedback("");
  }, [project?.id]);

  function commit(records, message) {
    onSave({ ...project, creativeDecisions: records });
    setFeedback(`${message} — click Save This Section to keep it.`);
  }

  function add(e) {
    e.preventDefault();
    const content = reason.trim();
    if (!content || content.length > 2000) return;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const updated = memories.map(m => replaces && m.id === replaces
      ? { ...m, status: "superseded", supersededBy: id, updatedAt: now } : m);
    updated.push({
      id, createdAt: now, type: "intent", suggestion: "", perspective: "Creator", reason: content,
      ...(replaces ? { supersedes: replaces } : {}),
    });
    commit(updated, replaces ? "Replacement intention drafted" : "Intention drafted");
    setReason("");
    setReplaces("");
  }

  function edit(m) {
    if (m.type !== "intent") return;
    setEditingId(m.id);
    setEditValue(m.reason || "");
    setFeedback("");
  }

  function update(id) {
    const content = editValue.trim();
    if (!content || content.length > 2000) return;
    commit(memories.map(m => m.id === id ? { ...m, reason: content, updatedAt: new Date().toISOString() } : m), "Edit drafted");
    setEditingId(null);
  }

  function archive(id) {
    if (!window.confirm("Archive this decision? It stays in history but will not guide future AI responses.")) return;
    const now = new Date().toISOString();
    commit(memories.map(m => m.id === id ? { ...m, status: "archived", updatedAt: now } : m), "Decision archived");
  }

  function reactivate(id) {
    const target = memories.find(m => m.id === id);
    if (!target) return;
    // Archive any descendant replacements so a revived intention cannot coexist
    // with its contrary replacements as an active AI instruction.
    const descendants = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      memories.forEach(m => {
        if (m.supersedes && (m.supersedes === id || descendants.has(m.supersedes)) && !descendants.has(m.id)) {
          descendants.add(m.id);
          changed = true;
        }
      });
    }
    const now = new Date().toISOString();
    const updated = memories.map(m => {
      if (m.id === id) {
        const { status, supersededBy, ...rest } = m;
        return { ...rest, updatedAt: now };
      }
      if (descendants.has(m.id)) return { ...m, status: "archived", updatedAt: now };
      return m;
    });
    commit(updated, "Decision restored to active memory");
  }

  function remove(id) {
    if (!window.confirm("Permanently delete this decision from current project data? Earlier version-history snapshots may retain it.")) return;
    commit(memories.filter(m => m.id !== id), "Decision deletion drafted");
    if (editingId === id) setEditingId(null);
  }

  return <section className="ws-panel tg-memory-panel">
    <div className="ws-panel-heading"><div><span className="ws-eyebrow">CREATIVE INTENT</span><h2>Project Memory</h2>
      <p>Preserve creative choices for Chat, Critics and Reimagine. Newer intentions can explicitly replace older ones; previous choices remain visible for review.</p>
    </div><Brain size={25}/></div>
    <form className="ws-memory-add" onSubmit={add}>
      <label className="ws-field">Record a creative intention
        <textarea rows={3} maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain an artistic decision you want to preserve..." />
      </label>
      <div className="ws-field tg-memory-select-field">
        <label id="tg-memory-conflict-label">Conflicting with an earlier intention? (optional)</label>
        <IOSSelect className="tg-memory-ios-select" aria-label="Conflicting with an earlier intention" value={replaces} onChange={e => setReplaces(e.target.value)}>
          <option value="">No — add a separate intention</option>
          {activeIntentions.map(m => <option key={m.id} value={m.id}>{(m.reason || "Untitled intention").slice(0, 95)}</option>)}
        </IOSSelect>
      </div>
      <button className="ws-primary" type="submit" disabled={!reason.trim()}>Record intention</button>
    </form>
    {feedback && <p role="status">{feedback}</p>}
    {memories.length ? <div className="ws-results">{[...memories].reverse().map((m, reverseIndex) => {
      const index = memories.length - 1 - reverseIndex;
      const inactive = isInactive(m, memories);
      return <article className="ws-review" key={m.id || `legacy-${index}`}>
        <div className="ws-memory-row tg-memory-row"><strong>{m.type === "intent" ? "Creator intention" : `${m.type} · ${m.perspective || "AI critique"}`} {inactive ? "· Archived / replaced" : "· Active"}</strong>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {m.type === "intent" && !inactive && m.id && <button className="ws-icon-btn" type="button" title="Edit intention" aria-label="Edit intention" onClick={() => edit(m)}><Pencil size={16}/></button>}
            {m.id && (inactive
              ? <button className="ws-icon-btn" type="button" title="Reactivate decision" aria-label="Reactivate decision" onClick={() => reactivate(m.id)}><RotateCcw size={16}/></button>
              : <button className="ws-icon-btn" type="button" title="Archive decision" aria-label="Archive decision" onClick={() => archive(m.id)}><X size={16}/></button>)}
            {m.id && <button className="ws-icon-btn" type="button" title="Delete decision" aria-label="Delete decision" onClick={() => remove(m.id)}><Trash2 size={16}/></button>}
          </div>
        </div>
        {m.suggestion && <p><strong>Suggestion: </strong>{m.suggestion}</p>}
        {editingId === m.id
          ? <div className="tg-memory-editor">
              <label className="tg-memory-editor-label" htmlFor={`tg-memory-edit-${index}`}>Edit creator intention</label>
              <textarea id={`tg-memory-edit-${index}`} className="tg-memory-editor-input" rows={4} maxLength={2000} value={editValue} onChange={e => setEditValue(e.target.value)} />
              <div className="tg-memory-editor-actions">
                <button className="ws-primary" type="button" disabled={!editValue.trim() || editValue.trim() === (m.reason || "").trim()} onClick={() => update(m.id)}><Check size={15}/> Update intention</button>
                <button className="ws-ghost" type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          : <p className="tg-memory-reason">{m.reason || "No reason recorded"}</p>}
        {m.supersedes && <small>Explicitly replaces an earlier intention</small>}
      </article>;
    })}</div> : <div className="ws-empty"><Brain size={27}/><h3>No saved intentions</h3><p>Your creative decisions will appear here.</p></div>}
    <p>Changes are drafts until you use <strong>Save This Section</strong>. The project and its version history are stored in this browser; use Export &amp; Backup for portability.</p>
  </section>;
}
