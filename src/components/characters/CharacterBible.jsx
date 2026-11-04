import { useEffect, useMemo, useState } from "react";
import { BookUser, Plus, Search, Save, Trash2, UserRound, UsersRound, WandSparkles, X, Check, LoaderCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { aiConfigured, requestProjectAI } from "../../services/workspaceApi";
import "./CharacterBible.css";

// Keep previously saved extended character fields intact; the editor only exposes essentials.
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

export default function CharacterBible({ characters = [], onChange, onSave, saved }) {
  const { projectId } = useParams();
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDraft, setAiDraft] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const items = Array.isArray(characters) ? characters : [];

  useEffect(() => {
    if (selectedId && !items.some(item => item.id === selectedId)) setSelectedId(null);
  }, [items, selectedId]);

  const filtered = useMemo(() => items.filter(item =>
    [item.name, item.role, item.personality, item.goals, item.notes].join(" ").toLowerCase().includes(query.trim().toLowerCase())
  ), [items, query]);
  const selected = items.find(item => item.id === selectedId);

  function addCharacter() {
    const entry = newCharacter();
    onChange([...items, entry]);
    setSelectedId(entry.id);
    setQuery("");
    setAiOpen(false);
    setAiDraft(null);
    setAiError("");
  }
  function changeField(field, value) {
    onChange(items.map(item => item.id === selectedId ? { ...item, [field]: value } : item));
  }
  function removeCharacter() {
    if (!selected || !window.confirm(`Delete ${selected.name?.trim() || "this character"}? This change will take effect when you save.`)) return;
    onChange(items.filter(item => item.id !== selectedId));
    setSelectedId(null);
    setAiOpen(false);
    setAiDraft(null);
  }
  function openAI() {
    setAiOpen(value => !value);
    setAiError("");
    setAiDraft(null);
  }
  async function generateDraft() {
    if (!projectId || !aiPrompt.trim() || aiBusy) return;
    setAiBusy(true);
    setAiError("");
    setAiDraft(null);
    try {
      // Backend contract: POST /api/projects/:id/ai/character
      // { prompt, character } -> { character: { name, role, personality, goals, notes } }
      const response = await requestProjectAI(projectId, "character", {
        prompt: aiPrompt.trim(),
        character: selected ? Object.fromEntries(SIMPLE_FIELDS.map(f => [f.key, selected[f.key] || ""])) : null,
      });
      const draft = response?.character;
      if (!draft || typeof draft !== "object" || Array.isArray(draft)) throw new Error("The AI backend did not return a character draft.");
      const fields = Object.fromEntries(SIMPLE_FIELDS.filter(f => typeof draft[f.key] === "string").map(f => [f.key, draft[f.key]]));
      if (!Object.keys(fields).length) throw new Error("The AI response did not include usable character fields.");
      setAiDraft(fields);
    } catch (error) {
      setAiError(error?.message || "Could not generate a character draft.");
    } finally {
      setAiBusy(false);
    }
  }
  function applyDraft() {
    if (!aiDraft) return;
    if (selected) {
      onChange(items.map(item => item.id === selected.id ? { ...item, ...aiDraft } : item));
    } else {
      const entry = { ...newCharacter(), ...aiDraft };
      onChange([...items, entry]);
      setSelectedId(entry.id);
    }
    setAiOpen(false);
    setAiDraft(null);
    setAiPrompt("");
  }

  return <section className="ff-char" aria-labelledby="ff-char-title">
    <header className="ff-char__head">
      <div><span className="ff-char__eyebrow">STORY REFERENCE</span><h2 id="ff-char-title">Character Bible</h2><p>Create your characters your way. You can add more details whenever you want.</p></div>
      <div className="ff-char__head-actions" aria-label="Character creation options">
        <button type="button" className="ff-char__add" onClick={addCharacter}><Plus size={17}/> Add character manually</button>
        <button type="button" className={`ff-char__ai-top ${aiOpen ? "is-active" : ""}`} aria-expanded={aiOpen} aria-controls="ff-char-ai-panel" onClick={openAI}><WandSparkles size={16}/> Generate with AI</button>
      </div>
    </header>
    <div className="ff-char__meta"><span><UsersRound size={15}/> {items.length} {items.length === 1 ? "character" : "characters"}</span><span className={!saved ? "ff-char__dirty" : ""}>{saved ? "All changes saved" : "Unsaved character changes"}</span></div>
    <div className="ff-char__body">
      <aside className="ff-char__sidebar" aria-label="Character list">
        <div className="ff-char__search"><Search size={17} aria-hidden="true"/><input type="search" aria-label="Search characters" placeholder="Search characters..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
        <div className="ff-char__list">
          {filtered.map(item => <button type="button" key={item.id} className={`ff-char__item ${selectedId === item.id ? "is-active" : ""}`} onClick={()=>{setSelectedId(item.id);setAiDraft(null);setAiOpen(false);}} aria-pressed={selectedId === item.id}>
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
        </> : <div className="ff-char__empty"><div className="ff-char__empty-icon"><BookUser size={32}/></div><h3>{items.length ? "Select a character" : "Every story starts with someone"}</h3><p>{items.length ? "Choose someone from the list, or create another character." : "Use the options above to create your first character."}</p></div>}
        {aiOpen && <div id="ff-char-ai-panel" className="ff-char__ai" aria-label="AI character drafting">
          <div className="ff-char__ai-panel">
            <p>Describe the character you want. AI can suggest a name, role and profile; you decide what to keep.</p>
            <label className="ff-char__field"><span>Your idea</span><textarea rows={2} value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="For example: a mysterious detective with a secret past"/></label>
            {!aiConfigured && <p className="ff-char__ai-notice">AI backend is not connected yet. Manual editing works normally.</p>}
            {aiError && <p className="ff-char__ai-error" role="alert">{aiError}</p>}
            <button type="button" className="ff-char__ai-generate" disabled={!aiConfigured || !aiPrompt.trim() || aiBusy} onClick={generateDraft}>{aiBusy ? <LoaderCircle size={15} className="ff-char__spin"/> : <WandSparkles size={15}/>} {aiBusy ? "Generating..." : "Generate draft"}</button>
            {aiDraft && <div className="ff-char__ai-preview"><strong>AI suggestion (not saved)</strong>{SIMPLE_FIELDS.filter(f=>aiDraft[f.key]).map(f=><p key={f.key}><b>{f.label}:</b> {aiDraft[f.key]}</p>)}<div className="ff-char__ai-actions"><button type="button" onClick={()=>setAiDraft(null)}><X size={15}/> Discard</button><button type="button" onClick={applyDraft}><Check size={15}/> Apply to editor</button></div></div>}
          </div>
        </div>}
      </div>
    </div>
    <footer className="ff-char__footer"><span>Click Save to keep changes in this project.</span><button className="ff-char__save" type="button" disabled={saved} onClick={onSave}><Save size={16}/>{saved ? "Saved" : "Save Characters"}</button></footer>
  </section>;
}
