import { useState } from "react";
import { ScanSearch } from "lucide-react";
import { aiConfigured, requestProjectAI } from "../../services/workspaceApi";

const newId = () => crypto.randomUUID();
const validHistory = (value) => Array.isArray(value) ? value.filter(entry => entry && Array.isArray(entry.issues)) : [];

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

function prettyLabel(value) {
  return String(value || "unknown").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function ProjectContinuity({ project, onSave }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  const history = validHistory(project.continuityChecks);
  const latestReview = history.length ? history[history.length - 1] : null;
  const selectedReview = history.find(entry => entry.id === selectedReviewId) || latestReview;
  const issues = selectedReview
    ? selectedReview.issues
    : (Array.isArray(project.continuityIssues) ? project.continuityIssues : []);

  // Support saved continuityIssues from older versions without fabricating a review.
  const hasResults = Boolean(selectedReview) || issues.length > 0;
  const overallSummary = selectedReview?.summary || (!selectedReview && typeof project.continuity?.summary === "string" ? project.continuity.summary : "");
  const observations = Array.isArray(selectedReview?.observations) ? selectedReview.observations : [];

  async function check() {
    if (!aiConfigured || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await requestProjectAI(project.id, "continuity", {
        language: project.language || "English",
        projectData: {
          story: project.story || "",
          scenes: project.scenes || [],
          characters: project.characters || [],
        },
      });

      if (!Array.isArray(result?.issues)) throw new Error("Invalid continuity response from backend.");

      const review = {
        id: newId(),
        createdAt: new Date().toISOString(),
        summary: typeof result.summary === "string" ? result.summary : "",
        observations: Array.isArray(result.observations) ? result.observations : [],
        model: result.model || "",
        issues: result.issues.map(issue => ({
          ...issue,
          id: issue.id || newId(),
          state: "open",
        })),
      };

      // Keep earlier reviews; append this new run instead of overwriting it.
      const nextHistory = [...history, review];
      onSave({
        ...project,
        continuityChecks: nextHistory,
        continuityIssues: review.issues,
        continuity: {
          summary: review.summary,
          observations: review.observations,
          lastCheckedAt: review.createdAt,
          reviewId: review.id,
        },
      });
      setSelectedReviewId(review.id);
    } catch (e) {
      setError(e?.message || "Continuity check failed.");
    } finally {
      setBusy(false);
    }
  }

  function mark(issueId, state) {
    if (!selectedReview) {
      onSave({
        ...project,
        continuityIssues: issues.map(issue => issue.id === issueId ? { ...issue, state } : issue),
      });
      return;
    }

    const updatedHistory = history.map(review => review.id === selectedReview.id ? {
      ...review,
      issues: review.issues.map(issue => issue.id === issueId ? { ...issue, state } : issue),
    } : review);

    const updatedLatest = updatedHistory[updatedHistory.length - 1];
    onSave({
      ...project,
      continuityChecks: updatedHistory,
      // Only sync the current issues when editing the latest review.
      continuityIssues: updatedLatest.issues,
    });
  }

  return (
    <section className="ws-panel">
      <div className="ws-panel-heading">
        <div>
          <span className="ws-eyebrow">CONSISTENCY REVIEW</span>
          <h2>Continuity Checker</h2>
          <p>Review potential story, character, prop and timeline inconsistencies.</p>
        </div>
        <ScanSearch size={26} />
      </div>

      <button type="button" className="ws-primary" disabled={!aiConfigured || busy} onClick={check}>
        {busy ? "Checking..." : "Check continuity"}
      </button>
      {!aiConfigured && <p className="ws-connection">Requires the Flask backend. No invented continuity issues are displayed.</p>}
      {error && <p className="ws-error" role="alert">{error}</p>}
      <p className="ws-connection">Reviews and status changes are drafts until you click <strong>Save This Section</strong> below.</p>

      {history.length > 0 && (
        <label className="ws-field">
          Review history ({history.length})
          <select
            value={selectedReview?.id || ""}
            onChange={event => setSelectedReviewId(event.target.value)}
          >
            {[...history].reverse().map((review, index) => (
              <option key={review.id} value={review.id}>
                {index === 0 ? "Latest — " : ""}{formatDate(review.createdAt)} · {review.issues.length} issue(s)
              </option>
            ))}
          </select>
        </label>
      )}

      {hasResults && (
        <div className="ws-results">
          {overallSummary && (
            <article className="ws-review">
              <h3>Analysis summary</h3>
              <p>{overallSummary}</p>
              {selectedReview && <small>Checked: {formatDate(selectedReview.createdAt)}</small>}
            </article>
          )}

          {issues.length === 0 ? (
            <article className="ws-review">
              <h3>No evidence-supported continuity issues found</h3>
              <p>This review did not identify supported contradictions. That does not guarantee the story is error-free.</p>
            </article>
          ) : issues.map(issue => (
            <article className="ws-review" key={issue.id}>
              <h3>{issue.title || "Potential continuity issue"}</h3>
              <p>
                <strong>Category:</strong> {prettyLabel(issue.category)} · <strong>Severity:</strong> {prettyLabel(issue.severity)} · <strong>Confidence:</strong> {prettyLabel(issue.confidence)}
              </p>
              <p>{issue.description || ""}</p>
              {Array.isArray(issue.evidence) && issue.evidence.length > 0 && (
                <div>
                  <strong>Evidence from project</strong>
                  <ul>{issue.evidence.map((excerpt, index) => <li key={index}><q>{excerpt}</q></li>)}</ul>
                </div>
              )}
              {issue.suggested_fix && <p><strong>Suggested fix:</strong> {issue.suggested_fix}</p>}
              <p><strong>Status:</strong> {prettyLabel(issue.state || "open")}</p>
              <div className="ws-review-actions">
                <button type="button" className="ws-ghost" disabled={issue.state === "resolved"} onClick={() => mark(issue.id, "resolved")}>Resolve</button>
                <button type="button" className="ws-ghost" disabled={issue.state === "intentional"} onClick={() => mark(issue.id, "intentional")}>Intentional</button>
                <button type="button" className="ws-ghost" disabled={issue.state === "dismissed"} onClick={() => mark(issue.id, "dismissed")}>Dismiss</button>
                {issue.state !== "open" && <button type="button" className="ws-ghost" onClick={() => mark(issue.id, "open")}>Reopen</button>}
              </div>
            </article>
          ))}

          {observations.length > 0 && (
            <article className="ws-review">
              <h3>Additional observations</h3>
              <ul>{observations.map((observation, index) => <li key={index}>{observation}</li>)}</ul>
            </article>
          )}
        </div>
      )}

      {!hasResults && (
        <div className="ws-empty">
          <ScanSearch size={27} />
          <h3>No continuity results</h3>
          <p>Run a review to analyze real project material.</p>
        </div>
      )}
    </section>
  );
}
