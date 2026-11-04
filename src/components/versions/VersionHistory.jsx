import { useEffect, useMemo, useState } from "react";
import { Clock3, RotateCcw, GitCompareArrows, ShieldCheck, ChevronRight, Search } from "lucide-react";
import { readVersions } from "../../services/versionHistory";
import "./VersionHistory.css";

const displayName = value => String(value || "Content")
  .replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ")
  .replace(/\b\w/g, letter => letter.toUpperCase());
const blank = value => value === null || value === undefined || value === "";
const textValue = value => blank(value) ? "Not set" : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const itemName = (item, index) => {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const name = [item.name, item.title, item.heading, item.slug, item.sceneNumber, item.number]
      .find(x => x !== null && x !== undefined && String(x).trim());
    if (name !== undefined) return String(name);
  }
  return `Item ${index + 1}`;
};
const itemKey = (item, index) => item && typeof item === "object" && (item.id || item._id) ? String(item.id || item._id) : `index-${index}`;

// Human-readable leaves preserve every data value; no raw JSON is shown to users.
function flatten(value, path, result = [], depth = 0) {
  if (depth > 12) { result.push({ path, value: "Nested content" }); return result; }
  if (Array.isArray(value)) {
    result.push({ path: `${path} · Total`, value: `${value.length} item${value.length === 1 ? "" : "s"}` });
    value.forEach((item, index) => flatten(item, `${path} / ${itemName(item, index)}`, result, depth + 1));
  } else if (value && typeof value === "object") {
    const keys = Object.keys(value).filter(k => k !== "id" && k !== "_id");
    if (value.id && !keys.length) result.push({ path, value: String(value.id) });
    else keys.forEach(key => flatten(value[key], `${path} / ${displayName(key)}`, result, depth + 1));
  } else {
    result.push({ path, value: textValue(value) });
  }
  return result;
}

// For arrays, align saved entities by stable IDs first so insertions do not make all later items appear changed.
function alignedFlatten(before, after, field) {
  const beforeMap = new Map();
  const afterMap = new Map();
  const visit = (a, b, path, depth = 0) => {
    if (depth > 12) { beforeMap.set(path, "Nested content"); afterMap.set(path, "Nested content"); return; }
    if (Array.isArray(a) || Array.isArray(b)) {
      const left = Array.isArray(a) ? a : [];
      const right = Array.isArray(b) ? b : [];
      beforeMap.set(`${path} · Total`, `${left.length} item${left.length === 1 ? "" : "s"}`);
      afterMap.set(`${path} · Total`, `${right.length} item${right.length === 1 ? "" : "s"}`);
      const leftById = new Map(left.map((v,i) => [itemKey(v,i),v]));
      const rightById = new Map(right.map((v,i) => [itemKey(v,i),v]));
      [...new Set([...leftById.keys(),...rightById.keys()])].forEach((key,i) => {
        const l = leftById.get(key), r = rightById.get(key);
        const label = itemName(r ?? l, i);
        visit(l, r, `${path} / ${label}`, depth + 1);
      });
    } else if ((a && typeof a === "object") || (b && typeof b === "object")) {
      const l = a && typeof a === "object" ? a : {};
      const r = b && typeof b === "object" ? b : {};
      [...new Set([...Object.keys(l), ...Object.keys(r)])].filter(k => k !== "id" && k !== "_id").forEach(k => {
        visit(l[k],r[k],`${path} / ${displayName(k)}`,depth+1);
      });
    } else {
      beforeMap.set(path,textValue(a));afterMap.set(path,textValue(b));
    }
  };
  visit(before, after, displayName(field));
  return [...new Set([...beforeMap.keys(), ...afterMap.keys()])].map(path => ({
    path, before: beforeMap.get(path) ?? "Not set", after: afterMap.get(path) ?? "Not set",
    changed: beforeMap.get(path) !== afterMap.get(path)
  }));
}

const dateLabel = iso => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Saved version" : date.toLocaleString();
};

// Diff text as words/punctuation/whitespace. A small typo should highlight only the word,
// rather than an entire sentence or the full story. Long texts use bounded work.
const tokenize = text => String(text).match(/(\s+|[\p{L}\p{N}_]+|[^\p{L}\p{N}_\s]+)/gu) || [];
const tokenEqual = (a, b) => a === b;
function wordDiff(before, after) {
  const left = tokenize(before), right = tokenize(after);
  let prefix = 0;
  while (prefix < left.length && prefix < right.length && tokenEqual(left[prefix],right[prefix])) prefix++;
  let suffix = 0;
  while (suffix < left.length-prefix && suffix < right.length-prefix &&
    tokenEqual(left[left.length-1-suffix],right[right.length-1-suffix])) suffix++;
  const a = left.slice(prefix,left.length-suffix), b = right.slice(prefix,right.length-suffix);
  const edits = [];
  if (a.length * b.length > 100000) {
    // Keep unchanged surrounding text intact, and only mark the changed middle.
    if (a.length) edits.push({type:"removed",text:a.join("")});
    if (b.length) edits.push({type:"added",text:b.join("")});
  } else {
    const dp = Array.from({length:a.length+1},()=>new Uint32Array(b.length+1));
    for(let i=a.length-1;i>=0;i--) for(let j=b.length-1;j>=0;j--)
      dp[i][j] = a[i]===b[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j],dp[i][j+1]);
    let i=0,j=0;
    while(i<a.length || j<b.length) {
      if(i<a.length && j<b.length && a[i]===b[j]) { edits.push({type:"same",text:a[i]});i++;j++; }
      else if(j<b.length && (i===a.length || dp[i][j+1]>dp[i+1][j])) {edits.push({type:"added",text:b[j++]});}
      else {edits.push({type:"removed",text:a[i++]});}
    }
  }
  const raw = [...left.slice(0,prefix).map(text=>({type:"same",text})),...edits,
    ...left.slice(left.length-suffix).map(text=>({type:"same",text}))];
  return raw.reduce((acc,part)=>{
    if(acc.length && acc[acc.length-1].type===part.type) acc[acc.length-1].text+=part.text;
    else acc.push({...part});
    return acc;
  },[]);
}

function TextDiff({parts,side}) {
  return <span className="vh-diff-text">{parts.filter(part=>part.type==="same" || part.type===(side==="before"?"removed":"added"))
    .map((part,i)=>part.type==="same" ? <span key={i}>{part.text}</span> :
      <mark className="vh-word-mark" key={i}>{part.text}</mark>)}</span>;
}

// Show the complete sentence around a change, but highlight only edited words.
// This keeps Key Changes concise while showing enough context to understand the edit.
function sentenceBounds(text, offsetStart, offsetEnd) {
  const source = String(text);
  let start = 0;
  const boundaries = /[.!?](?=\s|$)\s*|\n+/g;
  let match;
  while ((match = boundaries.exec(source)) && match.index + match[0].length <= offsetStart) {
    start = match.index + match[0].length;
  }
  boundaries.lastIndex = Math.max(start, offsetEnd);
  const next = boundaries.exec(source);
  const end = next ? next.index + (/[.!?]/.test(next[0][0]) ? 1 : 0) : source.length;
  return [start, Math.max(offsetEnd, end)];
}
function sentenceChanges(before, after) {
  const parts = wordDiff(before, after);
  const changes = [];
  let leftPos = 0, rightPos = 0, group = null;
  const flush = () => { if (group) { changes.push(group); group = null; } };
  parts.forEach(part => {
    const leftSize = part.type === "added" ? 0 : part.text.length;
    const rightSize = part.type === "removed" ? 0 : part.text.length;
    if (part.type === "same") flush();
    else {
      if (!group) group = { beforeStart: leftPos, beforeEnd: leftPos, afterStart: rightPos, afterEnd: rightPos };
      group.beforeEnd = leftPos + leftSize;
      group.afterEnd = rightPos + rightSize;
    }
    leftPos += leftSize;
    rightPos += rightSize;
  });
  flush();
  const unique = new Map();
  changes.forEach(change => {
    const lb = sentenceBounds(before, change.beforeStart, change.beforeEnd);
    const rb = sentenceBounds(after, change.afterStart, change.afterEnd);
    const key = `${lb[0]}:${lb[1]}|${rb[0]}:${rb[1]}`;
    if (!unique.has(key)) unique.set(key, {
      before: String(before).slice(...lb).trim(),
      after: String(after).slice(...rb).trim()
    });
  });
  return [...unique.values()].filter(item => item.before !== item.after);
}
function Value({value,comparedTo,side}) {
  const current = String(value);
  if(comparedTo === undefined || current===String(comparedTo)) return <div className="vh-value">{current}</div>;
  const parts = side==="before" ? wordDiff(current,comparedTo) : wordDiff(comparedTo,current);
  return <div className="vh-value"><TextDiff parts={parts} side={side}/></div>;
}

export default function VersionHistory({ projectId, revision, onRestore, hasUnsaved }) {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("key");
  const [search, setSearch] = useState("");
  const versions = readVersions(projectId);
  useEffect(() => { setSelected(null); setView("key"); setSearch(""); }, [projectId]);
  const current = versions.find(item => item.id === selected) || versions[0] || null;
  const rows = useMemo(() => current ? current.fields.flatMap(field => alignedFlatten(current.before?.[field],current.after?.[field],field)) : [], [current]);
  const changedRows = rows.filter(item => item.changed);
  const filteredVersions = versions.filter(version => [version.label,version.fields.map(displayName).join(" "),dateLabel(version.createdAt)]
    .some(value => value.toLowerCase().includes(search.trim().toLowerCase())));
  const keyItems = changedRows.flatMap(row =>
    sentenceChanges(row.before, row.after).map((snippet, i) => ({
      ...snippet, path: row.path, id: `${row.path}-${i}`
    }))
  );

  function restore() {
    if (!current || hasUnsaved || view === "key") return;
    const choice = view === "before" ? "before this save" : "after this save";
    const confirmed = window.confirm(
      `Restore the selected fields to their state ${choice}?\n\n` +
      "Only the fields shown in this history entry will change. " +
      "Your current saved values will be recorded in history first."
    );
    if (confirmed) onRestore(current, view);
  }

  return <section className="vh-root" aria-label="Version history" data-revision={revision}>
    <header className="vh-heading">
      <div><span className="vh-eyebrow">PROJECT HISTORY</span><h2>Version history</h2>
        <p>Browse real saved changes and restore a previous state. Nothing is saved while you type.</p></div>
      <span className="vh-count"><Clock3 size={16}/> {versions.length} saved change{versions.length === 1 ? "" : "s"}</span>
    </header>
    {!versions.length ? <div className="vh-empty"><Clock3 size={28}/><h3>No versions yet</h3>
      <p>Make an edit and use an existing Save button in your project. Your next saved change will appear here.</p></div> :
      <div className="vh-grid">
        <aside className="vh-list" aria-label="Saved versions">
          <div className="vh-list-heading"><span>SAVED VERSIONS</span><span>{versions.length}</span></div>
          <label className="vh-search"><Search size={16} aria-hidden="true"/><input type="search" aria-label="Search saved versions" placeholder="Search versions..." value={search} onChange={event=>setSearch(event.target.value)} /></label>
          <div className="vh-list-entries">
          {filteredVersions.map(version => <button type="button" key={version.id}
            className={`vh-entry ${current?.id === version.id ? "selected" : ""}`}
            onClick={() => { setSelected(version.id); setView("key"); }}>
            <span className="vh-entry-title">{version.label}</span>
            <span className="vh-entry-date">{dateLabel(version.createdAt)}</span>
            <span className="vh-entry-fields">{version.fields.map(displayName).join(" · ")}</span>
            <ChevronRight className="vh-entry-chevron" size={15} aria-hidden="true"/>
          </button>)}
          {!filteredVersions.length && <p className="vh-list-empty">No matching saved versions.</p>}
          </div>
        </aside>
        {current && <div className="vh-detail">
          <div className="vh-detail-top">
            <div className="vh-detail-title"><span className="vh-eyebrow">SAVED CHANGE</span><h3>{current.label}</h3>
              <p>{dateLabel(current.createdAt)}</p></div>
            <div className="vh-switch" role="tablist" aria-label="Version preview">
              <span className="vh-switch-indicator" style={{ transform: `translateX(${["key","before","after"].indexOf(view) * 100}%)` }} aria-hidden="true"/>
              <button type="button" role="tab" aria-selected={view === "key"} className={view === "key" ? "active" : ""} onClick={()=>setView("key")}>Key Changes</button>
              <button type="button" role="tab" aria-selected={view === "before"} className={view === "before" ? "active" : ""} onClick={()=>setView("before")}>Before Save</button>
              <button type="button" role="tab" aria-selected={view === "after"} className={view === "after" ? "active" : ""} onClick={()=>setView("after")}>After Save</button>
            </div>
          </div>
          <div className="vh-preview" key={`${current.id}-${view}`} role="tabpanel">
            {view === "key" ? <>
              <div className="vh-preview-heading"><GitCompareArrows size={16}/><strong>{keyItems.length} key change{keyItems.length === 1 ? "" : "s"}</strong><span>Only edited content</span></div>
              {keyItems.length ? keyItems.map((item) => <section className="vh-change" key={item.id}>
                <h4>{item.path}</h4>
                <div className="vh-change-comparison">
                  <div><span className="vh-side-label">BEFORE</span><div className="vh-value"><TextDiff parts={wordDiff(item.before, item.after)} side="before"/></div></div>
                  <div><span className="vh-side-label">AFTER</span><div className="vh-value"><TextDiff parts={wordDiff(item.before, item.after)} side="after"/></div></div>
                </div>
              </section>) : <p className="vh-no-diff">No visible content differences in this save.</p>}
            </> : <>
              <div className="vh-preview-heading"><strong>{view === "before" ? "Before save" : "After save"}</strong><span>Full saved content · Only changed words are highlighted</span></div>
              {current.fields.map(field => {
                const fieldRows = rows.filter(row => row.path === displayName(field) || row.path.startsWith(`${displayName(field)} /`) || row.path.startsWith(`${displayName(field)} ·`));
                return <section className="vh-field" key={field}>
                  <h4>{displayName(field)}</h4>
                  <div className="vh-field-content">{fieldRows.map((row,i) => <div key={`${row.path}-${i}`} className="vh-data-row">
                    <span className="vh-data-label">{row.path}</span>
                    <Value value={view === "before" ? row.before : row.after} comparedTo={row.changed ? (view === "before" ? row.after : row.before) : undefined} side={view}/>
                  </div>)}</div>
                </section>;
              })}
            </>}
          </div>
          <div className="vh-footer"><p><ShieldCheck size={16}/> Only the listed saved fields will be restored. Other project sections stay unchanged.</p>
            {view === "key" ? <span className="vh-restore-note">Choose Before or After Save to restore.</span> :
              <button type="button" className="vh-restore" onClick={restore} disabled={hasUnsaved}><RotateCcw size={16}/> Restore this state</button>}
          </div>
          {hasUnsaved && <p className="vh-warning" role="status">Save or discard your unsaved project edits before restoring a version.</p>}
        </div>}
      </div>}
  </section>;
}
