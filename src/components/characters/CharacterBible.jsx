import { useEffect, useMemo, useRef, useState } from "react";
import { BookUser, Plus, Search, Save, Trash2, UserRound, UsersRound, WandSparkles, X, Check, LoaderCircle } from "lucide-react";
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
  const aiPanelRef = useRef(null);
  const items = Array.isArray(characters) ? characters : [];

  useEffect(() => {
    if (selectedId && !items.some(item => item.id === selectedId)) setSelectedId(null);
  }, [items, selectedId]);

  // Make the generated analysis visible when opened from the top action.
  useEffect(() => {
    if (aiOpen) {
      aiPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [aiOpen]);

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
    } catch (error) {
      setAiError(error?.message || "Could not analyze project characters.");
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
        <button type="button" className={`ff-char__ai-top ${aiOpen ? "is-active" : ""}`} aria-expanded={aiOpen} aria-controls="ff-char-ai-panel" aria-busy={aiBusy} disabled={aiBusy} onClick={openAI}>{aiBusy ? <LoaderCircle size={16} className="ff-char__spin"/> : <WandSparkles size={16}/>} {aiBusy ? "Analyzing story..." : "Analyze story with AI"}</button>
      </div>
    </header>
    {aiOpen && <div role="status" aria-live="polite" style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 12, background: "var(--ff-surface, #fff)", border: "1px solid var(--border-color, #ddd)" }}>
      {aiBusy ? "Analyzing your story with AI… See the analysis panel below." : aiError ? `Character analysis failed: ${aiError}` : aiDrafts.length ? `Character analysis ready — ${aiDrafts.length} profile${aiDrafts.length === 1 ? "" : "s"} to review below.` : !project?.story?.trim() ? "No story found. Write your story in the Story tab first." : "AI analysis panel is open below."}
    </div>}
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
        {aiOpen && <div ref={aiPanelRef} id="ff-char-ai-panel" className="ff-char__ai" aria-label="AI story character analysis" aria-busy={aiBusy} style={{ scrollMarginTop: 100 }}>
          <div className="ff-char__ai-panel">
            <p>Analyze the saved or currently edited project story. Suggestions are not added automatically. Check facts and interpretations before applying.</p>
            {!project?.story?.trim() && <p className="ff-char__ai-notice">Write a story in the Story tab first.</p>}
            {!aiConfigured && <p className="ff-char__ai-notice">AI backend is not connected. Set VITE_API_BASE_URL.</p>}
            {aiBusy && <p role="status" aria-live="polite" className="ff-char__ai-notice"><LoaderCircle size={15} className="ff-char__spin"/> Analyzing story and extracting character profiles…</p>}
            {aiError && <p className="ff-char__ai-error" role="alert">{aiError}</p>}
            <button type="button" className="ff-char__ai-generate" disabled={!aiConfigured || !project?.story?.trim() || aiBusy} onClick={generateDrafts}>{aiBusy ? <LoaderCircle size={15} className="ff-char__spin"/> : <WandSparkles size={15}/>} {aiBusy ? "Analyzing story..." : "Analyze project story"}</button>
            {aiDrafts.length > 0 && <div className="ff-char__ai-preview">
              <strong>AI suggestions — review individually (not saved)</strong>
              {aiDrafts.map((profile,index) => <div key={`${profile.name}-${index}`} style={{ borderTop: "1px solid var(--border-color, #ddd)", padding: "12px 0" }}>
                <h4>{profile.name} — {display(profile.role)}</h4>
                <p><b>Established facts:</b> {asList(profile.established_facts).join("; ") || "Unspecified"}</p>
                <p><b>Personality (inferences):</b> {asList(profile.personality_traits).join("; ") || "Unspecified"}</p>
                <p><b>Motivation:</b> {display(profile.motivation)}</p>
                <p><b>Goals:</b> {asList(profile.goals).join("; ") || "Unspecified"}</p>
                <p><b>Relationships:</b> {asList(profile.relationships).join("; ") || "Unspecified"}</p>
                <p><b>Arc:</b> {display(profile.character_arc)}</p>
                <p><b>Unknown details:</b> {asList(profile.unknown_details).join("; ") || "None stated"}</p>
                {items.some(item => sameName(item.name, profile.name)) && <p className="ff-char__ai-notice">Character with this name already exists. Automatic overwrite is disabled.</p>}
                <div className="ff-char__ai-actions"><button type="button" onClick={()=>setAiDrafts(prev=>prev.filter((_,i)=>i!==index))}><X size={15}/> Reject</button><button type="button" disabled={items.some(item=>sameName(item.name,profile.name))} onClick={()=>applyDraft(index)}><Check size={15}/> Add to editor</button></div>
              </div>)}
              {!!aiNotes.length && <details><summary>Overall AI notes</summary>{aiNotes.map((note,i)=><p key={i}>{note}</p>)}</details>}
            </div>}
          </div>
        </div>}
      </div>
    </div>
    <footer className="ff-char__footer"><span>AI-approved additions stay as drafts until you click Save Characters.</span><button className="ff-char__save" type="button" disabled={saved} onClick={onSave}><Save size={16}/>{saved ? "Saved" : "Save Characters"}</button></footer>
  </section>;
}
