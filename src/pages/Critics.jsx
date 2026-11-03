import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ClipboardCheck,
  FilePenLine,
  MessageSquareText,
  RefreshCw,
  Save,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import IOSSelect from "../components/ui/IOSSelect";
import SearchField from "../components/ui/SearchField";
import { getProjects, getProject, saveProject } from "../services/projectService";
import { aiConfigured, requestProjectAI } from "../services/workspaceApi";
import "./Critics.css";
import "../styles/ControlRefine.css";
import "./CriticsLayoutFix.css";

const ROLES = ["Visual Director", "Story Editor", "Dialogue & Copy", "Audience Perspective", "Creative Strategist"];
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const text = (v) => (typeof v === "string" ? v : "");
const getCritics = (p) => (Array.isArray(p?.latestCritique?.critics) ? p.latestCritique.critics : []);
const getSceneLabel = (s, i) => s.name?.trim() || s.heading?.trim() || `Scene ${i + 1}`;
const snippet = (value, max = 180) => {
  const s = text(value);
  return s.length > max ? `${s.slice(0, max)}…` : s;
};

export default function Critics() {
  const [projects, setProjects] = useState(() => getProjects());
  const [projectId, setProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [reviewTarget, setReviewTarget] = useState("project");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const sync = () => setProjects(getProjects());
    window.addEventListener("frameforge:projects-changed", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("frameforge:projects-changed", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const selected = projects.find((p) => p.id === projectId) || null;
  const visibleProjects = useMemo(
    () => projects.filter((p) => `${p.title || ""} ${p.genre || ""}`.toLowerCase().includes(search.trim().toLowerCase())),
    [projects, search],
  );
  const review = selected?.latestCritique;
  const critics = getCritics(selected);
  const decisions = Array.isArray(selected?.creativeDecisions) ? selected.creativeDecisions : [];
  const suggestions = critics.map((c, index) => ({ ...c, key: `${index}`, index })).filter((c) => text(c.suggestion).trim());
  const reviewId = review?.reviewId || review?.id || "legacy";
  const shown = suggestions.filter((c) => filter === "all" || (filter === "decided"
    ? decisions.some((d) => d.reviewId === reviewId && d.suggestionIndex === c.index)
    : !decisions.some((d) => d.reviewId === reviewId && d.suggestionIndex === c.index)));

  const overviewStats = [
    { label: "Projects", value: projects.length },
    { label: "Reviews saved", value: projects.filter((p) => getCritics(p).length).length },
    { label: "Decisions", value: projects.reduce((sum, p) => sum + (Array.isArray(p.creativeDecisions) ? p.creativeDecisions.length : 0), 0) },
  ];

  function choose(id) {
    setProjectId(id);
    setReviewTarget("project");
    setEditing(null);
    setError("");
    setNotice("");
    setFilter("all");
  }

  function persistPatch(updater) {
    const latest = getProject(projectId);
    if (!latest) throw new Error("Project unavailable. Reload and try again.");
    const next = updater(latest);
    const saved = saveProject(next);
    setProjects(getProjects());
    return saved;
  }

  async function requestReview() {
    if (!selected || busy || !aiConfigured) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestProjectAI(selected.id, "critique", {
        context: reviewTarget,
        notes: instructions,
        language: selected.language || "English",
        project: {
          title: selected.title,
          genre: selected.genre,
          idea: selected.idea,
          story: selected.story,
          scenes: selected.scenes,
          creativeDecisions: selected.creativeDecisions || [],
        },
      });
      if (!Array.isArray(result?.critics)) throw new Error("Backend must return a critics array.");
      persistPatch((p) => ({
        ...p,
        latestCritique: { ...result, reviewId: uid(), scope: reviewTarget, createdAt: new Date().toISOString() },
      }));
      setNotice("New critique received and saved to this project.");
    } catch (e) {
      setError(e.message || "Review failed.");
    } finally {
      setBusy(false);
    }
  }

  function recordDecision(critic, type, reason, changes = {}) {
    persistPatch((p) => {
      const records = Array.isArray(p.creativeDecisions) ? [...p.creativeDecisions] : [];
      const record = {
        id: uid(),
        createdAt: new Date().toISOString(),
        type,
        perspective: critic.name || `Critic ${critic.index + 1}`,
        suggestion: critic.suggestion,
        suggestionIndex: critic.index,
        reviewId,
        reason: reason.trim(),
        context: review?.scope || "project",
        ...changes,
      };
      return { ...p, creativeDecisions: [...records, record] };
    });
  }

  function reject(critic) {
    const reason = window.prompt("Reason for rejecting this suggestion (optional):", "");
    if (reason === null) return;
    try {
      recordDecision(critic, "reject", reason);
      setNotice("Suggestion rejected. Your story was not changed.");
    } catch (e) {
      setError(e.message);
    }
  }

  function startApply(critic, mode) {
    const structured = critic.revision && typeof critic.revision === "object" ? critic.revision : null;
    const sceneId = structured?.sceneId && (selected.scenes || []).some((s) => s.id === structured.sceneId) ? structured.sceneId : "story";
    const scene = (selected.scenes || []).find((s) => s.id === sceneId);
    const original = scene ? text(scene.description) : text(selected.story);
    const proposed = text(structured?.replacementText || structured?.revisedText || structured?.proposedText);
    setEditing({ critic, mode, sceneId, original, proposed });
    setDraftText(proposed || original);
    setDecisionReason("");
    setError("");
    setNotice("");
  }

  function applyEdit() {
    if (!editing || !selected) return;
    if (!draftText.trim()) {
      setError("Revised content cannot be empty.");
      return;
    }
    if (draftText === editing.original) {
      setError("Edit the content before applying. A suggestion alone cannot rewrite your story.");
      return;
    }
    try {
      const { sceneId, critic, mode, original } = editing;
      persistPatch((p) => {
        const currentScene = sceneId === "story" ? null : (p.scenes || []).find((s) => s.id === sceneId);
        const current = currentScene ? text(currentScene.description) : text(p.story);
        if (current !== original) throw new Error("This content changed since you opened the editor. Close and reopen before applying.");
        const updated = sceneId === "story" ? { ...p, story: draftText } : {
          ...p,
          scenes: (p.scenes || []).map((s) => (s.id === sceneId ? { ...s, description: draftText } : s)),
        };
        const records = Array.isArray(p.creativeDecisions) ? [...p.creativeDecisions] : [];
        return {
          ...updated,
          creativeDecisions: [...records, {
            id: uid(),
            createdAt: new Date().toISOString(),
            type: mode,
            perspective: critic.name || `Critic ${critic.index + 1}`,
            suggestion: critic.suggestion,
            suggestionIndex: critic.index,
            reviewId,
            reason: decisionReason.trim(),
            context: review?.scope || "project",
            target: sceneId === "story" ? "story" : "scene",
            targetId: sceneId,
            before: original,
            after: draftText,
          }],
        };
      });
      setEditing(null);
      setNotice("Project content updated and creative decision saved. Open Story or Scenes to see the change.");
    } catch (e) {
      setError(e.message || "Could not apply edit.");
    }
  }

  return (
    <div className="cc-page cc-review-room">
      <header className="cc-room-hero cc-room-hero--refined">
        <div className="cc-room-hero__copy">
          <span className="cc-kicker"><span className="cc-kicker-dot" /> CREATIVE CRITICS</span>
          <h1>Review. Decide. <em>Refine.</em></h1>
          <p>Five different perspectives. One final decision: yours.</p>
        </div>
        <div className="cc-room-hero__status">
          <span className={`cc-backend-state ${aiConfigured ? "ready" : "offline"}`}><span />{aiConfigured ? "AI endpoint configured" : "AI backend not connected"}</span>
          <div className="cc-room-hero__panel" aria-label="Five creative perspectives">
            {ROLES.map((role, index) => <span className="cc-perspective" key={role}><small>{String(index + 1).padStart(2, "0")}</small><strong>{role}</strong></span>)}
          </div>
        </div>
      </header>

      <section className="cc-room-layout cc-room-layout--refined">
        <aside className="cc-room-sidebar cc-room-sidebar--refined">
          <div className="cc-room-sidebar-top">
            <span className="cc-overline">PROJECT LIBRARY</span>
            <strong>{projects.length} project{projects.length === 1 ? "" : "s"}</strong>
          </div>
          <SearchField id="critic-project-search" label="Find a project" value={search} onChange={setSearch} placeholder="Find a project..." />
          <div className="cc-room-project-list">
            {visibleProjects.map((p) => (
              <button type="button" className={`cc-room-project ${selected?.id === p.id ? "active" : ""}`} key={p.id} onClick={() => choose(p.id)}>
                <span className="cc-room-project__icon"><BookOpen size={18} /></span>
                <span>
                  <strong>{p.title || "Untitled Story"}</strong>
                  <small>{(p.scenes || []).length} scenes · {getCritics(p).length ? "Review available" : "Not reviewed"}</small>
                </span>
              </button>
            ))}
            {!projects.length && <p className="cc-muted">No projects yet. <Link to="/studio">Create one in Studio.</Link></p>}
            {!!projects.length && !visibleProjects.length && <p className="cc-muted">No matching projects.</p>}
          </div>
          <div className="cc-room-sidebar-help"><ShieldCheck size={19} /><p>AI suggestions never silently change your story. Every applied revision is stored as a creative decision.</p></div>
        </aside>

        <main className="cc-room-main cc-room-main--refined">
          {!selected ? (
            <>
              <section className="cc-room-empty cc-room-empty--showcase">
                <div className="cc-empty-copy">
                  <span className="cc-overline">REVIEW WORKFLOW</span>
                  <h2>Select a project to begin critique</h2>
                  <p>Pick a project from the library to request a new critique, compare AI perspectives and save only the revisions you approve.</p>
                  {!projects.length && <Link className="cc-primary" to="/studio">Create a project</Link>}
                </div>
                <div className="cc-empty-grid">
                  {overviewStats.map((item) => (
                    <article key={item.label} className="cc-empty-stat">
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="cc-room-placeholder-grid">
                <article className="cc-placeholder-card">
                  <span className="cc-placeholder-icon"><MessageSquareText size={18} /></span>
                  <h3>Request focused feedback</h3>
                  <p>Critique the full project or target one specific scene when your backend is connected.</p>
                </article>
                <article className="cc-placeholder-card">
                  <span className="cc-placeholder-icon"><ClipboardCheck size={18} /></span>
                  <h3>Record creative decisions</h3>
                  <p>Accept, modify or reject every recommendation. Nothing changes automatically behind your back.</p>
                </article>
                <article className="cc-placeholder-card">
                  <span className="cc-placeholder-icon"><ShieldCheck size={18} /></span>
                  <h3>Keep creative control</h3>
                  <p>Review decisions stay connected to your project without silently changing the story.</p>
                </article>
              </section>
            </>
          ) : (
            <>
              <section className="cc-project-summary">
                <div className="cc-project-summary__info">
                  <span className="cc-overline">CURRENT REVIEW</span>
                  <h2>{selected.title || "Untitled Story"}</h2>
                  <p>{selected.genre || "Story"} · {selected.language || "English"} · {(selected.scenes || []).length} scenes · {decisions.length} recorded decisions</p>
                </div>
                <div className="cc-project-summary__actions">
                  <div className="cc-project-summary__chips">
                    <span>{selected.genre || "Story"}</span>
                    <span>{selected.language || "English"}</span>
                  </div>
                  <Link className="cc-secondary" to={`/projects/${encodeURIComponent(selected.id)}`}><ArrowLeft size={16} /> Project overview</Link>
                </div>
              </section>

              <section className="cc-room-stats">
                <article><strong>{(selected.scenes || []).length}</strong><span>Scenes</span></article>
                <article><strong>{suggestions.length}</strong><span>Suggestions</span></article>
                <article><strong>{decisions.length}</strong><span>Decisions</span></article>
                <article><strong>{critics.length || 0}</strong><span>Perspectives</span></article>
              </section>

              {error && <div className="cc-room-alert error" role="alert">{error}</div>}
              {notice && <div className="cc-room-alert success" role="status"><Check size={16} />{notice}</div>}

              <section className="cc-room-card cc-request cc-request--refined">
                <div className="cc-room-card-head">
                  <div>
                    <span className="cc-overline">NEW CRITIQUE</span>
                    <h3>Get creative feedback</h3>
                    <p>Run a critique on the full project or target a specific scene.</p>
                  </div>
                  <div className="cc-request-badge"><Target size={16} /> Critique request</div>
                </div>
                <div className="cc-request-fields">
                  <label>Review scope
                    <IOSSelect aria-label="Review scope" value={reviewTarget} onChange={(e) => setReviewTarget(e.target.value)}>
                      <option value="project">Complete project</option>
                      {(selected.scenes || []).map((s, i) => <option key={s.id} value={s.id}>{getSceneLabel(s, i)}</option>)}
                    </IOSSelect>
                  </label>
                  <label>Focus (optional)
                    <textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. pacing, character arc, stronger scene transitions" />
                  </label>
                </div>
                <div className="cc-request-bottom">
                  <span>{aiConfigured ? "Reviews come from your configured API." : "Connect Flask + Gemini to enable real AI review. No mock critiques."}</span>
                  <button type="button" className="cc-primary" onClick={requestReview} disabled={!aiConfigured || busy}>
                    {busy ? <RefreshCw size={16} /> : <MessageSquareText size={16} />} {busy ? "Reviewing..." : "Run critique"}
                  </button>
                </div>
              </section>

              <section className="cc-room-card cc-results-card">
                <div className="cc-room-card-head cc-room-card-head--stack">
                  <div>
                    <span className="cc-overline">LATEST CRITIQUE</span>
                    <h3>Review results</h3>
                    <p>{critics.length ? `${critics.length} perspective${critics.length !== 1 ? "s" : ""} from your most recent review` : "No saved critique for this project yet"}</p>
                  </div>
                  {critics.length > 0 && (
                    <div className="cc-results-topbar">
                      <span className="cc-room-count">{suggestions.length} suggestions</span>
                      <div className="cc-filters" role="group" aria-label="Filter suggestions">
                        {[{ id: "all", label: "All" }, { id: "pending", label: "Not decided" }, { id: "decided", label: "Decided" }].map((f) => (
                          <button type="button" key={f.id} onClick={() => setFilter(f.id)} className={filter === f.id ? "active" : ""}>{f.label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {!critics.length ? (
                  <div className="cc-no-review"><MessageSquareText size={26} /><strong>Feedback will appear here</strong><p>Once a real critique is returned, you can review each recommendation and apply it to your project.</p></div>
                ) : (
                  <>
                    {review?.consensus && <div className="cc-consensus"><strong>Team consensus</strong><p>{typeof review.consensus === "string" ? review.consensus : JSON.stringify(review.consensus)}</p></div>}
                    <div className="cc-feedback-list cc-feedback-list--grid">
                      {shown.map((c) => {
                        const past = decisions.filter((d) => d.reviewId === reviewId && d.suggestionIndex === c.index);
                        return (
                          <article className="cc-feedback" key={c.key}>
                            <div className="cc-feedback-head">
                              <span className="cc-feedback-avatar"><MessageSquareText size={18} /></span>
                              <div>
                                <h4>{c.name || `Critic ${c.index + 1}`}</h4>
                                <small>{past.length ? `${past.length} decision(s) recorded` : "Awaiting your decision"}</small>
                              </div>
                            </div>
                            {c.summary && <p>{c.summary}</p>}
                            {c.strengths && <p><b>Strengths:</b> {Array.isArray(c.strengths) ? c.strengths.join(" · ") : String(c.strengths)}</p>}
                            {c.concerns && <p><b>Concerns:</b> {Array.isArray(c.concerns) ? c.concerns.join(" · ") : String(c.concerns)}</p>}
                            <div className="cc-suggestion"><strong>Suggested change</strong><p>{c.suggestion}</p></div>
                            <div className="cc-feedback-actions">
                              <button type="button" className="cc-accept" onClick={() => startApply(c, "accept")}><Check size={15} /> Accept & apply</button>
                              <button type="button" onClick={() => startApply(c, "modify")}><FilePenLine size={15} /> Modify & apply</button>
                              <button type="button" onClick={() => reject(c)}><X size={15} /> Reject</button>
                            </div>
                          </article>
                        );
                      })}
                      {!shown.length && <p className="cc-muted">No suggestions in this filter.</p>}
                    </div>
                  </>
                )}
              </section>

              <section className="cc-room-card cc-history-card">
                <div className="cc-room-card-head">
                  <div>
                    <span className="cc-overline">YOUR DECISIONS</span>
                    <h3>Creative decision history</h3>
                    <p>Stored with the selected project, not as sample data.</p>
                  </div>
                  <ClipboardCheck size={22} />
                </div>
                {decisions.length ? (
                  <div className="cc-history cc-history--compact">
                    {[...decisions].reverse().slice(0, 30).map((d, i) => (
                      <div className="cc-history-item" key={d.id || i}>
                        <span className={`cc-history-type ${d.type}`}>{d.type || "decision"}</span>
                        <div>
                          <strong>{d.perspective || "Creative decision"}</strong>
                          <p>{snippet(d.suggestion || d.reason, 140)}</p>
                          {d.target && <small>Applied to {d.target === "story" ? "story" : "scene"}</small>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="cc-muted">No decisions yet. Accept, modify or reject a recommendation to record one.</p>}
              </section>
            </>
          )}
        </main>
      </section>

      {editing && (
        <div className="cc-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <section className="cc-edit-modal" role="dialog" aria-modal="true" aria-label="Apply critic suggestion">
            <header>
              <div><span className="cc-overline">{editing.mode.toUpperCase()} SUGGESTION</span><h2>Review the change before applying</h2></div>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close"><X size={20} /></button>
            </header>
            <p className="cc-edit-intro"><strong>{editing.critic.name || "Critic"} suggests:</strong> {editing.critic.suggestion}</p>
            <label>Apply to
              <IOSSelect aria-label="Apply to" value={editing.sceneId} onChange={(e) => {
                const scene = (selected.scenes || []).find((s) => s.id === e.target.value);
                const original = scene ? text(scene.description) : text(selected.story);
                setEditing((v) => ({ ...v, sceneId: e.target.value, original, proposed: "" }));
                setDraftText(original);
              }}>
                <option value="story">Full story</option>
                {(selected.scenes || []).map((s, i) => <option key={s.id} value={s.id}>{getSceneLabel(s, i)} (description)</option>)}
              </IOSSelect>
            </label>
            {editing.proposed && <p className="cc-proposal-note">Backend supplied a proposed revision. Review it carefully before confirming.</p>}
            {!editing.proposed && <p className="cc-proposal-note">This suggestion contains no structured replacement. Make your own edit below; we will not overwrite the story with commentary.</p>}
            <label>Revised {editing.sceneId === "story" ? "story" : "scene description"}
              <textarea className="cc-edit-textarea" rows={11} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
            </label>
            <label>Why this decision? (optional)<input value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} placeholder="Your creative intention" /></label>
            {error && <p className="cc-room-alert error">{error}</p>}
            <footer><button type="button" className="cc-secondary" onClick={() => setEditing(null)}>Cancel</button><button type="button" className="cc-primary" onClick={applyEdit}><Save size={16} /> Apply to project & save</button></footer>
          </section>
        </div>
      )}
    </div>
  );
}
