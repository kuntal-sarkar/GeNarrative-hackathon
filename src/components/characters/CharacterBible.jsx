import { useEffect, useMemo, useState } from "react";
import { BookUser, Plus, Search, Save, Trash2, UserRound, UsersRound, WandSparkles, X, Check } from "lucide-react";
import { aiConfigured, requestCharacterBible } from "../../services/workspaceApi";
import "./CharacterBible.css";

// AI-generated detailed profiles are retained under aiProfile, while the manual
// editor continues to use its existing simple string fields.
const SIMPLE_FIELDS = [
  { key: "name", label: "Name", placeholder: "Give your character a name" },
  { key: "role", label: "Role", placeholder: "Write any role: hero, mentor, villain..." },
  { key: "personality", label: "About the character", multiline: true, placeholder: "Who are they? Their personality, background, or appearance..." },
  { key: "goals", label: "Goal", multiline: true, placeholder: "What does this character want?" },
  { key: "notes", label: "Notes (optional)", multiline: true, placeholder: "Anything else you want to remember" },
];

function newCharacter() {
  return { id: crypto.randomUUID(), name: "", role: "", personality: "", goals: "", notes: "" };
}

const asList = value => Array.isArray(value) ? value.filter(v => typeof v === "string" && v.trim()) : [];
const display = value => (typeof value === "string" && value.trim() ? value : "Unspecified");
const sameName = (a, b) => String(a || "").trim().toLocaleLowerCase() === String(b || "").trim().toLocaleLowerCase();

function profileToCharacter(profile) {
  return {
    ...newCharacter(),
    name: display(profile.name) === "Unspecified" ? "" : profile.name.trim(),
    role: display(profile.role) === "Unspecified" ? "" : profile.role,
    personality: asList(profile.personality_traits).join(", "),
    goals: asList(profile.goals).join("\n"),
    notes: [
      profile.motivation && profile.motivation !== "Unspecified" ? `Motivation: ${profile.motivation}` : "",
      profile.character_arc && profile.character_arc !== "Unspecified" ? `Character arc: ${profile.character_arc}` : "",
    ].filter(Boolean).join("\n"),
    // All original structured fields are preserved for future detailed UI.
    aiProfile: JSON.parse(JSON.stringify(profile)),
  };
}

export default function CharacterBible({ characters = [], onChange, onSave, saved, project }) {
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDrafts, setAiDrafts] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiNotes, setAiNotes] = useState([]);
  const [showReadyNotice, setShowReadyNotice] = useState(false);
  const items = Array.isArray(characters) ? characters : [];

  useEffect(() => {
    if (selectedId && !items.some(item => item.id === selectedId)) setSelectedId(null);
  }, [items, selectedId]);

  // A short success notice; suggested profiles remain until individually reviewed.
  useEffect(() => {
    if (!showReadyNotice) return;
    const timeout = window.setTimeout(() => setShowReadyNotice(false), 30000);
    return () => window.clearTimeout(timeout);
  }, [showReadyNotice]);

  const filtered = useMemo(() => items.filter(item =>
    [item.name, item.role, item.personality, item.goals, item.notes]
      .map(v => typeof v === "string" ? v : "")
      .join(" ").toLowerCase().includes(query.trim().toLowerCase())
  ), [items, query]);
  const selected = items.find(item => item.id === selectedId);

  function addCharacter() {
    const entry = newCharacter();
    onChange([...items, entry]);
    setSelectedId(entry.id);
    setQuery("");
    setAiOpen(false);
    setAiDrafts([]);
    setAiError("");
    setShowReadyNotice(false);
  }

  function changeField(field, value) {
    onChange(items.map(item => item.id === selectedId ? { ...item, [field]: value } : item));
  }

  function removeCharacter() {
    if (!selected || !window.confirm(`Delete ${selected.name?.trim() || "this character"}? This change will take effect when you save.`)) return;
    onChange(items.filter(item => item.id !== selectedId));
    setSelectedId(null);
  }

  function openAI() {
    if (aiBusy) return;
    if (aiOpen) {
      setAiOpen(false);
      setShowReadyNotice(false);
      return;
    }
    setAiOpen(true);
    // One click starts the analysis, while the opened panel shows progress.
    generateDrafts();
  }

  async function generateDrafts() {
    if (!aiConfigured || !project?.story?.trim() || aiBusy) return;
    setAiBusy(true);
    setAiError("");
    setAiDrafts([]);
    setAiNotes([]);
    setShowReadyNotice(false);
    try {
      const result = await requestCharacterBible({
        story: project.story,
        project_context: {
          title: project.title || "",
          genre: project.genre || "",
          language: project.language || "English",
          existing_characters: items.map(({ name, role }) => ({ name, role })),
        },
      });
      if (!Array.isArray(result?.characters) || !result.characters.length) {
        throw new Error("The backend did not return any identifiable characters.");
      }
      const profiles = result.characters.filter(p => p && typeof p.name === "string" && p.name.trim());
      if (!profiles.length) throw new Error("The backend returned no usable character profiles.");
      setAiDrafts(profiles);
      setAiNotes(asList(result.overall_notes));
      setShowReadyNotice(true);
    } catch (error) {
      setAiError(error?.message || "Could not analyze project characters.");
      setShowReadyNotice(false);
    } finally {
      setAiBusy(false);
    }
  }

  function applyDraft(index) {
    const profile = aiDrafts[index];
    if (!profile) return;
    if (items.some(item => sameName(item.name, profile.name))) {
      setAiError(`${profile.name} already exists. To protect your saved work, edit the existing character manually instead.`);
      return;
    }
    const entry = profileToCharacter(profile);
    onChange([...items, entry]); // Draft only: parent Save Characters controls persistence.
    setSelectedId(entry.id);
    setAiDrafts(prev => prev.filter((_, i) => i !== index));
    setAiError("");
  }

  return <section className="ff-char" aria-labelledby="ff-char-title">
    <header className="ff-char__head">
      <div><span className="ff-char__eyebrow">STORY REFERENCE</span><h2 id="ff-char-title">Character Bible</h2><p>Create your characters your way. AI can analyze the project's actual story, but you choose what to keep.</p></div>
      <div className="ff-char__head-actions" aria-label="Character creation options">
        <button type="button" className="ff-char__add" onClick={addCharacter}><Plus size={17}/> Add character manually</button>
        <button type="button" className={`ff-char__ai-top ${aiOpen ? "is-active" : ""}`} aria-expanded={aiOpen} aria-controls="ff-char-ai-panel" aria-busy={aiBusy} disabled={aiBusy} onClick={openAI}><WandSparkles size={16}/> {aiBusy ? "Analyzing story…" : aiOpen ? "Close AI review" : "Analyze story with AI"}</button>
      </div>
    </header>
    {aiOpen && <section id="ff-char-ai-panel" className="ff-char__analysis" aria-label="AI character analysis" aria-busy={aiBusy}>
      {aiBusy && <div className="ff-char__progress" role="status" aria-live="polite">
        <div className="ff-char__progress-head"><span className="ff-char__progress-icon"><WandSparkles size={18}/></span><div><strong>Discovering your characters</strong><p>TakeGrid AI is reading your story and building character profiles.</p></div></div>
        <div className="ff-char__progress-track" aria-label="AI analysis in progress"><span className="ff-char__progress-fill"/></div>
        <span className="ff-char__progress-hint">Analyzing story · Identifying characters · Preparing suggestions</span>
      </div>}
      {!aiBusy && showReadyNotice && aiDrafts.length > 0 && <div className="ff-char__ready" role="status" aria-live="polite"><Check size={17}/><span><strong>Character analysis ready</strong> — {aiDrafts.length} profile{aiDrafts.length === 1 ? "" : "s"} ready for review.</span><button type="button" aria-label="Dismiss analysis notification" onClick={()=>setShowReadyNotice(false)}><X size={16}/></button></div>}
      {!aiBusy && aiError && <p className="ff-char__analysis-error" role="alert">{aiError}</p>}
      {!aiBusy && !aiConfigured && <p className="ff-char__analysis-info">AI backend is not connected. Set VITE_API_BASE_URL.</p>}
      {!aiBusy && !project?.story?.trim() && <p className="ff-char__analysis-info">Write a story in the Story tab first.</p>}
      {!aiBusy && aiDrafts.length > 0 && <div className="ff-char__review">
        <div className="ff-char__review-heading"><div><span>AI CHARACTER ANALYSIS</span><h3>Review suggested characters</h3><p>These are drafts only. Review each profile and choose which ones to add to the editor.</p></div><span className="ff-char__review-count">{aiDrafts.length} pending</span></div>
        <div className="ff-char__review-grid">{aiDrafts.map((profile,index) => <article className="ff-char__review-card" key={`${profile.name}-${index}`}>
          <div className="ff-char__review-person"><span className="ff-char__review-avatar"><UserRound size={19}/></span><div><h4>{profile.name}</h4><p>{display(profile.role)}</p></div></div>
          <div className="ff-char__review-info">
            {!!asList(profile.established_facts).length && <p><strong>Story facts</strong>{asList(profile.established_facts).join(" · ")}</p>}
            {!!asList(profile.personality_traits).length && <p><strong>Personality</strong>{asList(profile.personality_traits).join(" · ")}</p>}
            {display(profile.motivation) !== "Unspecified" && <p><strong>Motivation</strong>{display(profile.motivation)}</p>}
            {!!asList(profile.goals).length && <p><strong>Goals</strong>{asList(profile.goals).join(" · ")}</p>}
            {!!asList(profile.relationships).length && <p><strong>Relationships</strong>{asList(profile.relationships).join(" · ")}</p>}
            {display(profile.character_arc) !== "Unspecified" && <p><strong>Character arc</strong>{display(profile.character_arc)}</p>}
            {!!asList(profile.unknown_details).length && <p><strong>Not established in story</strong>{asList(profile.unknown_details).join(" · ")}</p>}
          </div>
          {items.some(item => sameName(item.name,profile.name)) && <p className="ff-char__review-duplicate">Already in your character list. Existing characters won't be overwritten.</p>}
          <div className="ff-char__review-actions"><button type="button" className="ff-char__review-reject" onClick={()=>setAiDrafts(prev=>prev.filter((_,i)=>i!==index))}><X size={15}/> Dismiss</button><button type="button" className="ff-char__review-apply" disabled={items.some(item=>sameName(item.name,profile.name))} onClick={()=>applyDraft(index)}><Check size={15}/> Add to editor</button></div>
        </article>)}</div>
        {!!aiNotes.length && <details className="ff-char__review-notes"><summary>Additional analysis notes</summary>{aiNotes.map((note,i)=><p key={i}>{note}</p>)}</details>}
      </div>}
    </section>}
    <div className="ff-char__meta"><span><UsersRound size={15}/> {items.length} {items.length === 1 ? "character" : "characters"}</span><span className={!saved ? "ff-char__dirty" : ""}>{saved ? "All changes saved" : "Unsaved character changes"}</span></div>
    <div className="ff-char__body">
      <aside className="ff-char__sidebar" aria-label="Character list">
        <div className="ff-char__search"><Search size={17} aria-hidden="true"/><input type="search" aria-label="Search characters" placeholder="Search characters..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
        <div className="ff-char__list">
          {filtered.map(item => <button type="button" key={item.id} className={`ff-char__item ${selectedId === item.id ? "is-active" : ""}`} onClick={()=>setSelectedId(item.id)} aria-pressed={selectedId === item.id}>
            <span className="ff-char__avatar"><UserRound size={18}/></span><span className="ff-char__identity"><strong>{item.name?.trim() || "New character"}</strong><small>{item.role?.trim() || "Role not set"}</small></span>
          </button>)}
          {!filtered.length && <div className="ff-char__list-empty">{items.length ? "No matching characters." : "No characters yet. Add your first one."}</div>}
        </div>
      </aside>
      <div className="ff-char__editor">
        {selected ? <>
          <div className="ff-char__editor-head"><div><span>CHARACTER</span><h3>{selected.name?.trim() || "New character"}</h3></div><button type="button" className="ff-char__delete" onClick={removeCharacter}><Trash2 size={16}/> Delete</button></div>
          <div className="ff-char__form">
            {SIMPLE_FIELDS.map(field => <label key={field.key} className={`ff-char__field ${field.multiline ? "ff-char__field--wide" : ""}`}><span>{field.label}</span>{field.multiline ? <textarea rows={2} value={selected[field.key] || ""} onChange={e=>changeField(field.key,e.target.value)} placeholder={field.placeholder}/> : <input value={selected[field.key] || ""} onChange={e=>changeField(field.key,e.target.value)} placeholder={field.placeholder}/>}</label>)}
          </div>
          {selected.aiProfile && <details style={{ marginTop: 14 }}><summary>View AI's full suggested profile (reference)</summary><div style={{ padding: "10px 0", overflowWrap: "anywhere" }}>
            {[["Established facts",selected.aiProfile.established_facts],["Traits (interpretations)",selected.aiProfile.personality_traits],["Strengths",selected.aiProfile.strengths],["Flaws (interpretations)",selected.aiProfile.flaws],["Relationships",selected.aiProfile.relationships],["Development suggestions",selected.aiProfile.development_suggestions],["Unknown details",selected.aiProfile.unknown_details]].map(([title,values]) => <p key={title}><strong>{title}:</strong> {asList(values).join("; ") || "Unspecified"}</p>)}
          </div></details>}
        </> : <div className="ff-char__empty"><div className="ff-char__empty-icon"><BookUser size={32}/></div><h3>{items.length ? "Select a character" : "Every story starts with someone"}</h3><p>{items.length ? "Choose someone from the list, or create another character." : "Use the options above to create your first character."}</p></div>}
      </div>
    </div>
    <footer className="ff-char__footer"><span>AI-approved additions stay as drafts until you click Save Characters.</span><button className="ff-char__save" type="button" disabled={saved} onClick={onSave}><Save size={16}/>{saved ? "Saved" : "Save Characters"}</button></footer>
  </section>;
}
