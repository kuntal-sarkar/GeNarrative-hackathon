import IOSSelect from "../ui/IOSSelect";
import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { aiConfigured, requestProjectAI, requestStoryReimagination } from "../../services/workspaceApi";
import "./ProjectCriticsReimagine.css"; // TAKEGRID_CRITICS_UI_V3

// TAKEGRID_LARGE_REVIEW_V1
// UI-only cleanup; never changes the underlying scene heading or saved project data.

// The existing backend caps review material at 30,000 characters.
// For large inputs, preserve all TEXTUAL material across multiple real AI calls.
// Image/data URLs are excluded because they are not text that a text critic can review.
const REVIEW_CHUNK_SIZE = 19000;
// Keep headroom under the Flask 30,000-character limit (JSON encoding differs).
const REVIEW_DIRECT_LIMIT = 25000;
const NON_TEXT_FIELDS = new Set(["storyboardImage", "imageData", "dataUrl", "base64", "imageBlob"]);

function textOnlyReviewJson(value) {
  return JSON.stringify(value, (key, item) => {
    if (NON_TEXT_FIELDS.has(key)) return undefined;
    if (typeof item === "string" && /^data:image\//i.test(item)) return "[image asset]";
    return item;
  });
}

function splitReviewText(text, maxLength = REVIEW_CHUNK_SIZE) {
  const pieces = [];
  for (let offset = 0; offset < text.length; offset += maxLength) {
    pieces.push(text.slice(offset, offset + maxLength));
  }
  return pieces;
}

function buildReviewParts(data) {
  const entries = [];
  const add = (label, content) => {
    const stringValue = typeof content === "string" ? content : textOnlyReviewJson(content);
    if (!stringValue || stringValue === 'null') return;
    const chunkCapacity = REVIEW_CHUNK_SIZE - label.length - 48;
    splitReviewText(stringValue, chunkCapacity).forEach((piece, index, all) => {
      entries.push(`${label}${all.length > 1 ? ` (continued ${index + 1}/${all.length})` : ""}:\n${piece}`);
    });
  };
  add("Story", data.story || "");
  (data.scenes || []).forEach((scene, i) => add(`Scene ${i + 1}`, scene));
  (data.shots || []).forEach((shot, i) => add(`Shot ${i + 1}`, shot));
  (data.characters || []).forEach((character, i) => add(`Character ${i + 1}`, character));
  const parts = [];
  let current = "";
  for (const entry of entries) {
    if (current && current.length + entry.length + 2 > REVIEW_CHUNK_SIZE) {
      parts.push(current);
      current = "";
    }
    current = current ? `${current}\n\n${entry}` : entry;
  }
  if (current) parts.push(current);
  return parts;
}

// TAKEGRID_CRITICS_RESUME_V1: Cache only real completed AI responses for the current browser tab.
// The cache is content-addressed: edits to story, focus, language or memory start a new review.
async function reviewCheckpointKey(projectId, selectedData, requestContext) {
  const input = JSON.stringify({ projectId, selectedData, requestContext });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  // Chunk sizing changed in V6; do not reuse V5 checkpoints with different partitions.
  return `takegrid-critics-v6:${projectId}:${hex}`;
}

function loadReviewCheckpoint(key, count) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "null");
    if (value?.version !== 1 || !Array.isArray(value.reviews) || value.reviews.length > count) return [];
    return value.reviews.every(item => Array.isArray(item?.critics) && item.critics.length === 5)
      ? value.reviews : [];
  } catch { return []; }
}

function saveReviewCheckpoint(key, reviews) {
  try { sessionStorage.setItem(key, JSON.stringify({ version: 1, reviews })); }
  catch { /* Session storage can be disabled; reviewing still works without resume. */ }
}

function clearReviewCheckpoint(key) {
  try { sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
}

function truncateEvidence(value, max) {
  const text = typeof value === "string" ? value : "";
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

// This only condenses REAL generated findings to fit one Gemini synthesis request.
// It does not fabricate review text, votes, insights or consensus.
function compactReviewEvidence(reviews) {
  const perCritic = Math.max(110, Math.floor(11000 / (reviews.length * 5)) - 65);
  return reviews.map(review => ({
    summary: truncateEvidence(review.summary, Math.min(220, perCritic)),
    critics: review.critics.map(critic => ({
      critic: critic.name || critic.critic,
      observation: truncateEvidence(critic.observation || critic.summary, Math.floor(perCritic * 0.26)),
      reasoning: truncateEvidence(critic.reasoning || (critic.concerns || []).join(" "), Math.floor(perCritic * 0.30)),
      suggestion: truncateEvidence(critic.suggestion, Math.floor(perCritic * 0.44)),
      verdict: critic.verdict,
    })),
  }));
}

// TAKEGRID_SCENE_LABEL_V2 — display-only: original scene data is not changed.
function takegridSceneLabel(scene, index) {
  const raw = String(scene?.heading ?? scene?.name ?? "").trim();
  let heading = raw
    // Scene numbers/punctuation sometimes arrive as part of the stored heading.
    .replace(/^\s*(?:scene\s*)?[#№]?\s*\d+\s*(?:[,;:.\-–—|\s]+)*/i, "")
    .replace(/^[,;:.\-–—|\s]+/, "")
    // Keep meaningful screenplay punctuation (INT., EXT., apostrophes and hyphens).
    .replace(/\s*[,;]+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!heading) heading = "Untitled";
  return `Scene ${index + 1}: ${heading}`;
}

export default function ProjectCritics({ project, onSave, onDecision }) {
  const [context, setContext] = useState("project");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewProgress, setReviewProgress] = useState("");
  const [error, setError] = useState("");
  const [decisionMessage, setDecisionMessage] = useState("");
  // FRAMEFORGE_CRITICS_REIMAGINE_V1
  const [reimagineTarget, setReimagineTarget] = useState(null);
  const [reimagineInstructions, setReimagineInstructions] = useState("");
  const [reimagineResult, setReimagineResult] = useState(null);
  const [reimagineBusy, setReimagineBusy] = useState(false);
  // FRAMEFORGE_CRITICS_TARGETED_V2: only the chosen passage is sent for editing.
  const [passageMode, setPassageMode] = useState("paragraph");
  const [passageIndex, setPassageIndex] = useState(0);
  const [customExcerpt, setCustomExcerpt] = useState("");
  const review = project.latestCritique;
  const decisions = Array.isArray(project.creativeDecisions) ? project.creativeDecisions : [];

  async function runReview() {
    if (!aiConfigured || busy) return;
    setBusy(true);
    setError("");
    setDecisionMessage("");
    setReviewProgress("");
    setReimagineTarget(null);
    setReimagineResult(null);
    // Keep the existing critique/Reimagine flow and payload contract.
    try {
      const projectData = {
        name: project.name || project.title || "",
        genre: project.genre || "",
        story: project.story || "",
        scenes: project.scenes || [],
        shots: project.shots || [],
        characters: project.characters || [],
      };
      const selectedData = context === "project" ? projectData : {
        ...projectData,
        // A scene review must not accidentally submit the entire project.
        story: "",
        scenes: projectData.scenes.filter(scene => String(scene.id) === String(context)),
        shots: [],
      };
      // TAKEGRID_CREATIVE_MEMORY_V1: pass project decisions as separate context.
      // Server validates, bounds and treats them as reference data, never model instructions.
      const memoryPayload = { creativeDecisions: decisions };
      const basePayload = { context, notes: notes.trim(), language: project.language || "English", ...memoryPayload };
      const directSize = textOnlyReviewJson(selectedData).length;
      let result;
      if (directSize <= REVIEW_DIRECT_LIMIT) {
        setReviewProgress("Analyzing project in one AI review");
        result = await requestProjectAI(project.id, "critique", {
          ...basePayload,
          projectData: selectedData,
        });
        if (!Array.isArray(result?.critics)) throw new Error("Invalid critic response from backend.");
      } else {
        const sections = buildReviewParts(selectedData);
        if (!sections.length) throw new Error("No textual creative material found to review.");
        if (sections.length > 20) {
          throw new Error("This project exceeds the current 20-part review limit. Choose a smaller review scope.");
        }
        const cacheKey = await reviewCheckpointKey(project.id, selectedData, basePayload);
        const partialReviews = loadReviewCheckpoint(cacheKey, sections.length);
        for (let index = partialReviews.length; index < sections.length; index++) {
          setReviewProgress(`Analyzing project material ${index + 1} of ${sections.length}`);
          try {
            const part = await requestProjectAI(project.id, "critique", {
              ...basePayload,
              context: "project",
              notes: notes.trim().slice(0, 100),
              projectData: {
                name: selectedData.name,
                genre: selectedData.genre,
                story: sections[index],
                scenes: [],
                shots: [],
                characters: [],
              },
            });
            if (!Array.isArray(part?.critics) || part.critics.length !== 5) {
              throw new Error("Gemini returned an incomplete critics panel.");
            }
            partialReviews.push({ summary: part.summary || "", critics: part.critics });
            saveReviewCheckpoint(cacheKey, partialReviews);
          } catch (cause) {
            throw new Error(`Analysis ${index + 1}/${sections.length} failed: ${cause.message || "AI request failed"}. ${partialReviews.length} completed analyses saved for retry in this tab.`);
          }
        }
        // One genuine AI synthesis over bounded evidence, not 2+ rounds of
        // expensive synthesis requests. All five resulting verdicts come from Gemini.
        setReviewProgress(`Combining ${sections.length} analyses into one creative review`);
        try {
          const evidence = compactReviewEvidence(partialReviews);
          if (JSON.stringify(evidence).length > 17000) {
            throw new Error("Review evidence is too large to combine safely.");
          }
          result = await requestProjectAI(project.id, "critique/synthesize", {
            reviews: evidence,
            language: project.language || "English",
            focus: notes.trim().slice(0, 100),
            creativeDecisions: decisions,
          });
          if (!Array.isArray(result?.critics) || result.critics.length !== 5 || !result.consensus) {
            throw new Error("Gemini returned an incomplete unified review.");
          }
        } catch (cause) {
          throw new Error(`Final review synthesis failed: ${cause.message || "AI request failed"}. The ${partialReviews.length} completed analyses are saved in this tab; retry to resume from combining.`);
        }
        // Clear only after the unified review has actually been saved.
        // If project persistence throws, keep the checkpoint for a retry.
        const normalizedCritics = result.critics.map(item => ({
          ...item,
          name: item.name || item.critic || "Critic",
          summary: item.summary || item.observation || "",
          concerns: item.concerns || (item.reasoning ? [item.reasoning] : []),
        }));
        await onSave({ ...project, latestCritique: { ...result, critics: normalizedCritics } });
        clearReviewCheckpoint(cacheKey);
        return;
      }
      // The synthesis endpoint returns `critic`, whereas the regular review
      // returns `name`. Normalize for card headings, decisions and Reimagine.
      const normalizedCritics = result.critics.map(item => ({
        ...item,
        name: item.name || item.critic || "Critic",
        summary: item.summary || item.observation || "",
        concerns: item.concerns || (item.reasoning ? [item.reasoning] : []),
      }));
      await onSave({ ...project, latestCritique: { ...result, critics: normalizedCritics } });
    } catch (e) {
      setError(e.message || "Review failed.");
    } finally {
      setReviewProgress("");
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
      perspective: item.name || item.critic || "Critic",
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

  // Split on blank lines, retaining exact character offsets and preserving all separators.
  // This does not parse scenes or generate content locally: the AI edits only a selected passage.
  const storyText = typeof project.story === "string" ? project.story : "";
  const storyPassages = (() => {
    const parts = storyText.split(/(\n\s*\n)/);
    const result = [];
    let cursor = 0;
    parts.forEach((part, index) => {
      if (index % 2 === 0 && part.trim() && !/^\s{0,3}#{1,6}\s+[^\n]+\s*$/.test(part)) {
        result.push({ start: cursor, end: cursor + part.length, text: part });
      }
      cursor += part.length;
    });
    return result;
  })();

  function getSelectedPassage() {
    if (passageMode === "paragraph") {
      return storyPassages[passageIndex] || null;
    }
    const excerpt = customExcerpt.trim();
    if (!excerpt) throw new Error("Paste the exact passage you want to change.");
    const first = storyText.indexOf(excerpt);
    if (first === -1) throw new Error("That passage does not exactly match the story. Copy it directly from Story.");
    if (storyText.indexOf(excerpt, first + 1) !== -1) {
      throw new Error("This excerpt occurs more than once. Choose a larger unique excerpt.");
    }
    return { start: first, end: first + excerpt.length, text: excerpt };
  }

  function beginReimagine(item, index) {
    setError("");
    setDecisionMessage("");
    setReimagineTarget({ index, name: item.name || item.critic || "Critic", suggestion: item.suggestion });
    setReimagineInstructions("");
    setReimagineResult(null);
    setPassageMode("paragraph");
    setPassageIndex(0);
    setCustomExcerpt("");
  }

  async function generateReimagination() {
    if (!reimagineTarget || reimagineBusy) return;
    if (!storyText.trim()) {
      setError("Write a story before using Reimagine.");
      return;
    }
    setError("");
    setDecisionMessage("");
    let passage;
    try {
      passage = getSelectedPassage();
      if (!passage?.text?.trim()) throw new Error("Select a passage to reimagine.");
      if (passage.text.length > 30000) throw new Error("Selected passage exceeds the AI editor's 30,000 character limit.");
    } catch (e) {
      setError(e.message || "Select a valid passage.");
      return;
    }
    setReimagineResult(null);
    setReimagineBusy(true);
    try {
      const before = storyText.slice(Math.max(0, passage.start - 400), passage.start);
      const after = storyText.slice(passage.end, passage.end + 400);
      const instructions = [
        `Revise ONLY this selected passage according to the ${reimagineTarget.name} critic: ${reimagineTarget.suggestion}`,
        reimagineInstructions.trim() && `Creator guidance: ${reimagineInstructions.trim()}`,
        "Return ONLY the edited version of the selected passage as edited_story. Do not include surrounding passages, introductions or commentary inside edited_story. Preserve characters, facts, POV and unrelated events.",
      ].filter(Boolean).join("\n\n");
      if (instructions.length > 2000) throw new Error("Instructions exceed the backend's 2,000 character limit. Shorten them.");
      const result = await requestStoryReimagination({
        story: passage.text,
        mode: "rewrite",
        instructions,
        project_context: {
          name: project.name || project.title || "",
          genre: project.genre || "",
          language: project.language || "English",
          selected_critic: reimagineTarget.name,
          selected_suggestion: reimagineTarget.suggestion,
          creativeDecisions: decisions,
          surrounding_context_before: before,
          surrounding_context_after: after,
          constraint: "Only the provided passage may change; all other original story content remains untouched.",
        },
      });
      setReimagineResult({
        before: passage.text,
        after: result.edited_story,
        summary: result.summary,
        changes: result.changes,
        originalStory: storyText,
        start: passage.start,
        end: passage.end,
      });
    } catch (e) {
      setError(e.message || "Could not reimagine passage.");
    } finally {
      setReimagineBusy(false);
    }
  }

  function applyReimagination() {
    if (!reimagineResult) return;
    const { originalStory, start, end, before, after } = reimagineResult;
    if ((project.story || "") !== originalStory || originalStory.slice(start, end) !== before) {
      setError("Story changed since the preview. Please regenerate before applying.");
      return;
    }
    // Preserve everything outside the selected exact character range.
    const nextStory = originalStory.slice(0, start) + after + originalStory.slice(end);
    onSave({ ...project, story: nextStory }); // React draft only; Story tab Save is required.
    setReimagineResult(null);
    setReimagineTarget(null);
    setDecisionMessage("Only the selected passage was applied to an UNSAVED draft. Go to Story → Save Story Text to keep it.");
    setError("");
  }

  function latestDecisionFor(item) {
    return [...decisions].reverse().find(d =>
      d.perspective === (item.name || item.critic || "Critic") &&
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
              <option key={s.id} value={s.id}>{takegridSceneLabel(s, i)}</option>
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
      {busy && (
        <div className="tg-review-loading" role="status" aria-busy="true" aria-live="polite">
          <div className="tg-review-loading-head"><span className="ff-loading-pulse" />
            <div><strong>TakeGrid is reviewing your creative work</strong>
              <p>{reviewProgress || "Analyzing the story and creator intentions"}</p></div>
          </div>
          <div className="tg-review-loading-grid" aria-hidden="true">
            {[0, 1, 2].map(i => <div className="tg-review-loading-card" key={i}>
              <div className="ff-skeleton ff-skeleton-title" />
              <div className="ff-skeleton ff-skeleton-line" />
              <div className="ff-skeleton ff-skeleton-line ff-skeleton-short" />
            </div>)}
          </div>
        </div>
      )}
      {!busy && Array.isArray(review?.critics) && (
        <div className="ws-results">
          {review.critics.map((c, i) => {
            const savedDecision = latestDecisionFor(c);
            return (
              <article className="ws-review" key={`${c.name || c.critic || "critic"}-${i}`}>
                <h3>{c.name || c.critic || `Critic ${i + 1}`}</h3>
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
                      <button type="button" className="ws-ghost tg-review-reimagine-action" disabled={!aiConfigured || reimagineBusy || busy}
                        onClick={() => beginReimagine(c, i)}>Reimagine with AI</button>
                    </div>
                    {reimagineTarget?.index === i && (
                      <div className="ff-reimagine-panel">
                        <div className="ff-reimagine-heading">
                          <div><h4>Reimagine a selected passage</h4>
                            <p>Only the part you select will change. All other story text stays exactly as it is.</p></div>
                          <span className="ff-reimagine-tag">Targeted edit</span>
                        </div>
                        <label className="ws-field ff-reimagine-inline-field">
                          <span className="ff-reimagine-field-label">Select text to revise</span>
                          <IOSSelect className="ff-reimagine-select" value={passageMode}
                            disabled={reimagineBusy}
                            onChange={e => { setPassageMode(e.target.value); setReimagineResult(null); }}>
                            <option value="paragraph">Choose a paragraph</option>
                            <option value="excerpt">Paste an exact excerpt</option>
                          </IOSSelect>
                        </label>
                        {passageMode === "paragraph" ? (
                          <label className="ws-field ff-reimagine-inline-field">
                            <span className="ff-reimagine-field-label">Story paragraph</span>
                            <IOSSelect className="ff-reimagine-select" value={passageIndex}
                              disabled={reimagineBusy}
                              onChange={e => { setPassageIndex(Number(e.target.value)); setReimagineResult(null); }}>
                              {storyPassages.map((part, j) => (
                                <option key={`${part.start}-${j}`} value={j}>
                                  {`Paragraph ${j + 1}: ${part.text.trim().slice(0, 85)}${part.text.trim().length > 85 ? "…" : ""}`}
                                </option>
                              ))}
                            </IOSSelect>
                          </label>
                        ) : (
                          <label className="ws-field">
                            Exact text copied from the Story tab
                            <textarea rows={4} value={customExcerpt} disabled={reimagineBusy}
                              onChange={e => { setCustomExcerpt(e.target.value); setReimagineResult(null); }}
                              placeholder="Paste only the sentence(s) or passage you want changed" />
                          </label>
                        )}
                        <label className="ws-field">
                          Your instructions (optional)
                          <textarea rows={3} value={reimagineInstructions} disabled={reimagineBusy}
                            onChange={e => { setReimagineInstructions(e.target.value); setReimagineResult(null); }}
                            placeholder="e.g. Make the dialogue tenser, but keep the outcome unchanged" />
                        </label>
                        <div className="ws-review-actions">
                          <button type="button" className="ws-primary" onClick={generateReimagination}
                            disabled={reimagineBusy || !aiConfigured || !storyText.trim()}>
                            {reimagineBusy ? "Reimagining selected passage…" : "Generate targeted preview"}
                          </button>
                          <button type="button" className="ws-ghost" disabled={reimagineBusy}
                            onClick={() => { setReimagineTarget(null); setReimagineResult(null); }}>Cancel</button>
                        </div>
                        {reimagineBusy && (
                          <div className="ff-reimagine-loading" role="status" aria-label="TakeGrid is creating a revised passage" aria-live="polite" aria-busy="true">
                            <div className="ff-loading-header"><span className="ff-loading-pulse" /><div><strong>TakeGrid is reimagining your passage</strong><span>Preparing a focused revision without changing the rest of your story</span></div></div>
                            <div className="ff-loading-skeleton" aria-hidden="true">
                              <div className="ff-skeleton ff-skeleton-title" />
                              <div className="ff-skeleton ff-skeleton-line" />
                              <div className="ff-skeleton ff-skeleton-line ff-skeleton-short" />
                            </div>
                          </div>
                        )}
                        {reimagineResult && !reimagineBusy && (
                          <div className="ff-reimagine-preview">
                            <h4>Review this change</h4>
                            <p className="ff-reimagine-help">Only the selected text is shown below. Unselected story content is not modified.</p>
                            <div className="ff-reimagine-compare">
                              <section className="ff-reimagine-before" aria-label="Original selected passage">
                                <div className="ff-compare-head"><span className="ff-compare-step">01</span><span className="ff-compare-label">Original passage</span><span className="ff-compare-status">Before</span></div>
                                <div className="ff-compare-content">{reimagineResult.before}</div>
                              </section>
                              <div className="ff-compare-transition" aria-hidden="true"><span>↓</span> TakeGrid suggestion</div>
                              <section className="ff-reimagine-after" aria-label="Reimagined selected passage">
                                <div className="ff-compare-head"><span className="ff-compare-step">02</span><span className="ff-compare-label">Proposed revision</span><span className="ff-compare-status">After</span></div>
                                <div className="ff-compare-content">{reimagineResult.after}</div>
                              </section>
                            </div>
                            {(reimagineResult.summary || (Array.isArray(reimagineResult.changes) && reimagineResult.changes.length > 0)) && (
                              <section className="ff-reimagine-explanation" aria-label="Summary of proposed changes">
                                <h5>Changes explained</h5>
                                {reimagineResult.summary && <p className="ff-reimagine-summary">{reimagineResult.summary}</p>}
                                {Array.isArray(reimagineResult.changes) && reimagineResult.changes.length > 0 && (
                                  <ul className="ff-reimagine-changes">
                                    {reimagineResult.changes.map((change, j) => <li key={j}><span>{change}</span></li>)}
                                  </ul>
                                )}
                              </section>
                            )}
                            <div className="ws-review-actions">
                              <button type="button" className="ws-primary" onClick={applyReimagination}
                                disabled={reimagineResult.before === reimagineResult.after}>
                                Apply only this change to draft
                              </button>
                              <button type="button" className="ws-ghost" onClick={() => setReimagineResult(null)}>Discard preview</button>
                            </div>
                            <p className="ff-reimagine-help">Applying does not save automatically. Save Story Text in the Story tab afterward.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
      {!busy && review?.consensus && (
        <div className="ws-note">
          <h3>Consensus</h3>
          <p>{typeof review.consensus === "string" ? review.consensus : `${review.consensus.recommend_change} of ${review.consensus.total} critics recommend changes; ${review.consensus.recommend_keep} recommend keeping the current approach.`}</p>
        </div>
      )}
      {!busy && decisions.length > 0 && (
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
