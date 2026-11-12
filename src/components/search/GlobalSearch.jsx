import { APP_NAME } from "../../config/branding"; // TAKEGRID_BRANDING_V1
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, FolderOpen, BookOpen, Clapperboard, Camera, UsersRound, Brain, CornerDownLeft } from "lucide-react";
import { searchSavedProjects } from "../../services/globalSearch";
import "./GlobalSearch.css";

const icons = { Projects: FolderOpen, Stories: BookOpen, Scenes: Clapperboard, Shots: Camera, Characters: UsersRound, Memory: Brain };
const order = ["Projects", "Stories", "Scenes", "Shots", "Characters", "Memory"];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [revision, setRevision] = useState(0);
  const input = useRef(null);
  const trigger = useRef(null);
  const dialog = useRef(null);
  const closeTimer = useRef(null);
  const navigate = useNavigate();
  const results = useMemo(() => searchSavedProjects(query).sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category)), [query, revision]);
  const grouped = useMemo(() => order.map(category => ({ category, items: results.filter(item => item.category === category) })).filter(group => group.items.length), [results]);

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setQuery(""); setSelected(0); setRevision(n => n + 1);
    setMounted(true); setOpen(true);
  }
  function close() {
    setOpen(false);
    trigger.current?.focus();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setMounted(false);
      setQuery("");
      closeTimer.current = null;
    }, 190);
  }
  function go(result) {
    if (!result) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setOpen(false);
    setMounted(false);
    navigate(result.path);
  }

  useEffect(() => {
    function shortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else show();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [open]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const changed = () => setRevision(n => n + 1);
    window.addEventListener("takegrid:projects-changed", changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("takegrid:projects-changed", changed);
      window.removeEventListener("storage", changed);
    };
  }, [open]);
  useEffect(() => { setSelected(0); }, [query]);
  useEffect(() => {
    if (!open || !query.trim() || !results.length) return;
    const row = dialog.current?.querySelector(`[data-ff-result-index="${selected}"]`);
    const list = dialog.current?.querySelector(".ff-global-search-results");
    if (!row || !list) return;
    // Scroll only the results list, not the page or the dialog itself.
    const rowBox = row.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    if (rowBox.bottom > listBox.bottom) list.scrollTop += rowBox.bottom - listBox.bottom + 8;
    else if (rowBox.top < listBox.top) list.scrollTop -= listBox.top - rowBox.top + 8;
  }, [selected, open, query, results]);

  function keydown(event) {
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key === "ArrowDown") { event.preventDefault(); setSelected(n => Math.min(results.length - 1, n + 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setSelected(n => Math.max(0, n - 1)); }
    if (event.key === "Enter" && results.length) { event.preventDefault(); go(results[selected] || results[0]); }
    if (event.key === "Tab") {
      const nodes = dialog.current?.querySelectorAll('button:not([disabled]),input:not([disabled])');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  let resultIndex = -1;
  return <>
    <button ref={trigger} type="button" className="ff-global-search-launch" onClick={show} aria-label="Search all projects" title="Search all projects (Ctrl+K)"><Search size={19}/><span className="ff-global-search-hint">Ctrl K</span></button>
    {mounted && createPortal(<div className={`ff-global-search-overlay ${open ? "is-open" : "is-closing"}`} onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <section ref={dialog} className="ff-global-search-dialog" role="dialog" aria-modal="true" aria-label={`Search across ${APP_NAME}`} onKeyDown={keydown}>
        <div className="ff-global-search-input-row"><Search size={21}/><input ref={input} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects, stories, scenes, characters..." aria-label="Search saved projects"/><button type="button" className="ff-global-search-close" onClick={close} aria-label="Close search"><X size={19}/></button></div>
        <div className="ff-global-search-results" aria-live="polite">
          {!query.trim() ? <div className="ff-global-search-empty">Search your saved projects, stories, scenes, shots, characters and creative memories.</div> : !results.length ? <div className="ff-global-search-empty">No saved content matches “{query}”.</div> : grouped.map(group => <div className="ff-global-search-group" key={group.category}><h3>{group.category} <span>{group.items.length}</span></h3>{group.items.map(item => {
            resultIndex += 1;
            const itemIndex = resultIndex;
            const Icon = icons[item.category] || Search;
            return <button type="button" key={item.id} data-ff-result-index={itemIndex} className={`ff-global-search-result ${selected === itemIndex ? "is-selected" : ""}`} onMouseEnter={() => setSelected(itemIndex)} onClick={() => go(item)}><span className="ff-global-search-result-icon"><Icon size={18}/></span><span className="ff-global-search-result-copy"><strong>{item.title}</strong><small>{item.project} · {item.category}</small><span>{item.preview}</span></span><CornerDownLeft size={16} className="ff-global-search-enter"/></button>;
          })}</div>)}
        </div>
        <footer className="ff-global-search-footer"><span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span><span><kbd>Enter</kbd> Open</span><span><kbd>Esc</kbd> Close</span></footer>
      </section>
    </div>, document.body)}
  </>;
}
