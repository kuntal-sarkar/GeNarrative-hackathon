import IOSSelect from "../ui/IOSSelect";
import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { aiConfigured, requestProjectAI } from "../../services/workspaceApi";

export default function ProjectCritics({ project, onSave, onDecision }) {
  const [context, setContext] = useState("project");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");
  const review = project.latestCritique;
  const decisions = Array.isArray(project.creativeDecisions) ? project.creativeDecisions : [];

  async function runReview() {
    if (!aiConfigured || busy) return;
    setBusy(true);
    setError("");
    setDecisionMessage("");
    try {
      const result = await requestProjectAI(project.id, "critique", {
        context,
        notes: notes.trim(),
        language: project.language || "English",
        projectData: {
          name: project.name || project.title || "",
          genre: project.genre || "",
          story: project.story || "",
          scenes: project.scenes || [],
          shots: project.shots || [],
          characters: project.characters || [],
        },
      });
      if (!Array.isArray(result?.critics)) {
        throw new Error("Invalid critic response from backend.");
      }
      onSave({ ...project, latestCritique: result });
    } catch (e) {
      setError(e.message || "Review failed.");
    } finally {
      setBusy(false);
    }
  }

  function decide(item, decision) {
    const explanation = window.prompt(
      decision === "reject"
        ? "Why are you rejecting this recommendation?"
        : decision === "modify"
          ? "How would you modify this recommendation?"
          : "Optional reason for accepting this recommendation:"
    );
    if (explanation === null) return;
    if (decision !== "accept" && !explanation.trim()) {
      setError("Please provide a reason to reject or modify a recommendation.");
      return;
    }

    const record = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      type: decision,
      suggestion: item.suggestion || "",
      perspective: item.name || "Critic",
      reason: explanation.trim(),
      context,
    };
    setError("");
    const saved = onDecision?.(record);
    if (saved === true) {
      setDecisionMessage(`${record.perspective}: ${decision} decision saved.`);
    } else {
      setError("Decision could not be saved. Check the project status message above.");
    }
  }

  function latestDecisionFor(item) {
    return [...decisions].reverse().find(d =>
      d.perspective === (item.name || "Critic") &&
      d.suggestion === (item.suggestion || "")
    );
  }

  return (
    <section className="ws-panel">
      <div className="ws-panel-heading">
        <div>
          <span className="ws-eyebrow">CREATIVE REVIEW</span>
          <h2>Creative Critics</h2>
          <p>Request project-specific feedback and keep control of every recommendation.</p>
        </div>
        <MessageSquareText size={26} />
      </div>
      <div className="ws-fields-grid">
        <label className="ws-field">
          Review
          <IOSSelect value={context} onChange={e => setContext(e.target.value)}>
            <option value="project">Entire project</option>
            {(project.scenes || []).map((s, i) => (
              <option key={s.id} value={s.id}>Scene {i + 1}: {s.heading || "Untitled"}</option>
            ))}
          </IOSSelect>
        </label>
        <label className="ws-field">
          Review instructions
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional focus for the review" />
        </label>
      </div>
      <button type="button" className="ws-primary" onClick={runReview} disabled={!aiConfigured || busy}>
        {busy ? "Reviewing..." : "Request creative critique"}
      </button>
      {!aiConfigured && <p className="ws-connection">Critique needs the Flask + Gemini backend. No hardcoded critic opinions.</p>}
      {error && <p role="alert" className="ws-error">{error}</p>}
      {decisionMessage && <p role="status" className="ws-note">{decisionMessage}</p>}
      {Array.isArray(review?.critics) && (
        <div className="ws-results">
          {review.critics.map((c, i) => {
            const savedDecision = latestDecisionFor(c);
            return (
              <article className="ws-review" key={`${c.name || "critic"}-${i}`}>
                <h3>{c.name || `Critic ${i + 1}`}</h3>
                {c.summary && <p>{c.summary}</p>}
                {c.strengths && (!Array.isArray(c.strengths) || c.strengths.length > 0) && (
                  <p><strong>Strengths: </strong>{Array.isArray(c.strengths) ? c.strengths.join("; ") : c.strengths}</p>
                )}
                {c.concerns && (!Array.isArray(c.concerns) || c.concerns.length > 0) && (
                  <p><strong>Concerns: </strong>{Array.isArray(c.concerns) ? c.concerns.join("; ") : c.concerns}</p>
                )}
                {c.suggestion && (
                  <>
                    <p><strong>Suggestion: </strong>{c.suggestion}</p>
                    {savedDecision && (
                      <p role="status">
                        <strong>Last decision: </strong>
                        {savedDecision.type[0].toUpperCase() + savedDecision.type.slice(1)}
                        {savedDecision.reason ? ` — ${savedDecision.reason}` : ""}
                      </p>
                    )}
                    <div className="ws-review-actions">
                      {["accept", "reject", "modify"].map(d => (
                        <button type="button" key={d} className="ws-ghost" onClick={() => decide(c, d)}>
                          {d[0].toUpperCase() + d.slice(1)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
      {review?.consensus && (
        <div className="ws-note">
          <h3>Consensus</h3>
          <p>{typeof review.consensus === "string" ? review.consensus : `${review.consensus.recommend_change} of ${review.consensus.total} critics recommend changes; ${review.consensus.recommend_keep} recommend keeping the current approach.`}</p>
        </div>
      )}
      {decisions.length > 0 && (
        <div className="ws-note">
          <h3>Saved creative decisions ({decisions.length})</h3>
          <ul>
            {[...decisions].reverse().map(record => (
              <li key={record.id}>
                <strong>{record.perspective} — {record.type}</strong>
                {record.reason ? `: ${record.reason}` : ""}
                {record.createdAt ? ` (${new Date(record.createdAt).toLocaleString()})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
