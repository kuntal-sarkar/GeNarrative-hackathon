import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, BookOpen, Check, ChevronDown, ChevronUp, Copy, FilePlus2, FolderOpen, LoaderCircle, MessageCircle, Paperclip, Pin, Plus, Search, ThumbsDown, ThumbsUp, Trash2, Square, Mic, X, Bot } from 'lucide-react';
import { getProjects, createProject, saveProject, deleteProject } from '../../services/projectService';
import { requestGlobalAI } from '../../services/globalAI';
import { APP_NAME } from '../../config/branding';
import './HomeAssistant.css';

const CHAT_KEY = 'takegrid_global_assistant_threads_v1';
const CURRENT_KEY = 'takegrid_global_assistant_current_v1';
const makeId = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = new Set(['txt','md','pdf','png','jpg','jpeg','webp']);
const loadingRegular = [
  'Thinking through the possibilities...', 'Reading the creative context...',
  'Connecting story worlds...', 'Reviewing character motivations...',
  'Checking the plot logic...', 'Looking for the missing clue...',
  'Building a stronger creative direction...', 'Comparing the story arcs...',
  'Considering the audience perspective...', 'Refining the idea...',
  'Checking continuity across projects...', 'Putting the narrative pieces together...',
  'Looking for that cinematic spark...', 'Balancing the twists...',
  'Exploring a fresh angle...', 'Sketching out the next take...',
  'One last look at the details...', 'Preparing your response...'
];
const loadingPlayful = [
  'Consulting the plot gods... they want a sequel.',
  'The aliens reviewed this idea. They demand producer credits.',
  'Asking my ex for plot twists. Bad idea, great drama.',
  'Convincing the villain to read the script for once.',
  'Negotiating with the multiverse for a better ending.',
  'Checking whether the ghostwriter is actually a ghost.'
];
function makeLoadingSequence() {
  const normal = [...loadingRegular].sort(() => Math.random() - .5).slice(0, 13);
  const funny = [...loadingPlayful].sort(() => Math.random() - .5).slice(0, 3);
  // A maximum of three playful captions per request; never loop endlessly.
  normal.splice(2, 0, funny[0]); normal.splice(7, 0, funny[1]); normal.splice(12, 0, funny[2]);
  return normal;
}
const humanSize = n => n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;
function loadThreads() {
  try {
    const v = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    return Array.isArray(v) ? v.filter(t => t && typeof t.id === 'string' && Array.isArray(t.messages)).slice(0, 30) : [];
  } catch { return []; }
}
function newThread() { return { id: makeId(), title: 'New conversation', createdAt: now(), messages: [] }; }
function buildContext(projects, selected) {
  return projects.filter(p => selected.includes(p.id)).slice(0, 12).map(p => ({
    id: p.id, title: p.title, genre: p.genre, language: p.language, idea: p.idea,
    story: String(p.story || '').slice(0, 10000), scenes: (p.scenes || []).slice(0, 20).map(s => ({ title: s.title, name: s.name })), creativeDecisions: (p.creativeDecisions || []).slice(-40),
  }));
}
// Render AI Markdown as React nodes: never use dangerouslySetInnerHTML.
// Supports GFM-style tables, lists, headings and inline emphasis, including
// incorrectly backslash-escaped Markdown returned by some Gemini models.
function cleanAIText(value) {
  return String(value || '')
    .replace(/&#(?:x([0-9a-fA-F]+)|([0-9]+));/g, (all, hex, dec) => {
      const point = parseInt(hex || dec, hex ? 16 : 10);
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
        ? String.fromCodePoint(point) : all;
    })
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (all, name) => ({
      amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    }[name.toLowerCase()] || all))
    .replace(/\\([|*#_`>+~\-])/g, '$1')
    .replace(/\r\n?/g, '\n');
}

function inlineAI(text, prefix) {
  const pattern = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g;
  const output = [];
  let last = 0; let match; let count = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) output.push(text.slice(last, match.index));
    const token = match[0]; const key = `${prefix}-${count++}`;
    if (token.startsWith('**')) output.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('*')) output.push(<em key={key}>{token.slice(1, -1)}</em>);
    else if (token.startsWith('`')) output.push(<code key={key}>{token.slice(1, -1)}</code>);
    else {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      output.push(link ? <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a> : token);
    }
    last = match.index + token.length;
  }
  if (last < text.length) output.push(text.slice(last));
  return output;
}
function markdownCells(line) {
  const clean = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return clean.split('|').map(cell => cell.trim());
}
function isTableDivider(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}
function isMarkdownBlock(line) {
  return /^\s*(?:#{1,6}\s|[-*+]\s|\d+[.)]\s|â€¢\s|>\s|```|(?:-{3,}|\*{3,}|_{3,})\s*$)/.test(line);
}
function InlineFormatted({ text }) {
  const lines = cleanAIText(text).split('\n').map(line =>
    line.replace(/^\s*\*\*â€¢\*\*\s*/, '- '));
  const rendered = [];
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const key = `m-${i}`;
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim(); const code = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      if (i < lines.length) i++;
      rendered.push(<pre key={key} className="tg-ai-code"><code data-language={lang || undefined}>{code.join('\n')}</code></pre>);
      continue;
    }
    if (i + 1 < lines.length && line.includes('|') && isTableDivider(lines[i + 1])) {
      const heads = markdownCells(line); i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(markdownCells(lines[i++]));
      rendered.push(<div key={key} className="tg-ai-table-scroll"><table className="tg-ai-table">
        <thead><tr>{heads.map((h, j) => <th key={j}>{inlineAI(h, `${key}-h${j}`)}</th>)}</tr></thead>
        <tbody>{rows.map((cells, r) => <tr key={r}>{heads.map((_, c) => <td key={c}>{inlineAI(cells[c] || '', `${key}-r${r}c${c}`)}</td>)}</tr>)}</tbody>
      </table></div>);
      continue;
    }
    const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
    if (heading) {
      const Heading = `h${Math.min(heading[1].length + 2, 6)}`;
      rendered.push(<Heading key={key} className="tg-ai-heading">{inlineAI(heading[2], key)}</Heading>); i++; continue;
    }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      rendered.push(<hr key={key} className="tg-ai-rule"/>); i++; continue;
    }
    const list = line.match(/^\s*([-*+â€¢]|\d+[.)])\s+(.+)$/);
    if (list) {
      const ordered = /^\d/.test(list[1]); const entries = [];
      while (i < lines.length) {
        const next = lines[i].match(/^\s*([-*+â€¢]|\d+[.)])\s+(.+)$/);
        if (!next || /^\d/.test(next[1]) !== ordered) break;
        entries.push(next[2]); i++;
      }
      const Items = entries.map((entry, n) => <li key={n}>{inlineAI(entry, `${key}-${n}`)}</li>);
      rendered.push(ordered ? <ol key={key} className="tg-ai-list">{Items}</ol> : <ul key={key} className="tg-ai-list">{Items}</ul>);
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      const quotes = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) quotes.push(lines[i++].replace(/^\s*>\s?/, ''));
      rendered.push(<blockquote key={key} className="tg-ai-quote">{inlineAI(quotes.join(' '), key)}</blockquote>);
      continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !isMarkdownBlock(lines[i]) &&
      !(i + 1 < lines.length && lines[i].includes('|') && isTableDivider(lines[i + 1]))) {
      paragraph.push(lines[i++]);
    }
    rendered.push(<p key={key} className="tg-ai-paragraph">{inlineAI(paragraph.join(' '), key)}</p>);
  }
  return <div className="tg-ai-markdown">{rendered}</div>;
}

export default function HomeAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState(getProjects);
  const [selected, setSelected] = useState(() => getProjects().slice(0, 12).map(p => p.id));
  const [threads, setThreads] = useState(loadThreads);
  const [activeId, setActiveId] = useState(() => localStorage.getItem(CURRENT_KEY) || '');
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState('');
  const [showProjects, setShowProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [voiceToast, setVoiceToast] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [thinkingSequence, setThinkingSequence] = useState(() => makeLoadingSequence());
  const [proposal, setProposal] = useState(null);
  const [buildFormOpen, setBuildFormOpen] = useState(false);
  const [buildFields, setBuildFields] = useState({ title: '', type: '', language: '', direction: '' });
  const [actionToast, setActionToast] = useState('');
  const [createdId, setCreatedId] = useState('');
  const fileInput = useRef(null);
  const composerInputRef = useRef(null);
  const transcriptRef = useRef(null);
  const workspaceRef = useRef(null);
  const requestedOpenScrollRef = useRef(false);
  const controller = useRef(null);
  const requestEpoch = useRef(0);
  const activeRequestEpoch = useRef(0);
  function stopGeneration() {
    if (!controller.current) return;
    // Cancel browser transport immediately; ignore any late server result.
    requestEpoch.current += 1;
    controller.current.abort();
    controller.current = null;
    setBusy('');
    setError('');
    flashActionToast('Request cancelled');
  }
  const projectPicker = useRef(null);
  const copyReset = useRef(null);
  const voiceToastTimer = useRef(null);
  const actionToastTimer = useRef(null);
  const buildFormTitleRef = useRef(null);
  function flashActionToast(text) {
    window.clearTimeout(actionToastTimer.current);
    setActionToast(text);
    actionToastTimer.current = window.setTimeout(() => setActionToast(''), 2000);
  }
  useEffect(() => () => { window.clearTimeout(copyReset.current); window.clearTimeout(voiceToastTimer.current); window.clearTimeout(actionToastTimer.current); }, []);
  // On a fresh Home mount (including refresh), do not let browser scroll
  // restoration jump the DOCUMENT down to Global AI. The chat's own scroll
  // handling below remains independent and still opens at the latest reply.
  useLayoutEffect(() => {
    const prior = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    const delayed = window.setTimeout(() => window.scrollTo(0, 0), 75);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(delayed);
      window.history.scrollRestoration = prior;
    };
  }, []);
  // Only an explicit Open AI click should scroll the HOME document to the
  // expanded dashboard. Refresh/mount continues to stay at the page top.
  useLayoutEffect(() => {
    if (!open || !requestedOpenScrollRef.current) return;
    requestedOpenScrollRef.current = false;
    const raf = window.requestAnimationFrame(() => {
      const workspace = workspaceRef.current;
      if (!workspace) return;
      const top = workspace.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open]);
  function toggleGlobalDashboard() {
    if (!open) requestedOpenScrollRef.current = true;
    setOpen(value => !value);
  }
  function openGlobalAI() {
  if (!open) requestedOpenScrollRef.current = true;
  setOpen(true);
  }
  // Match Project AI Chat: expand the composer upward as the draft grows.
  // The conversation stays underneath the floating composer; beyond the cap,
  // only the textarea itself becomes scrollable.
  useLayoutEffect(() => {
    const input = composerInputRef.current;
    if (!input || !open) return;
    input.style.height = 'auto';
    const maxHeight = 156;
    input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [draft, open]);
  function showVoiceComingSoon() {
    window.clearTimeout(voiceToastTimer.current);
    setVoiceToast(true);
    voiceToastTimer.current = window.setTimeout(() => setVoiceToast(false), 3600);
  }
  useEffect(() => {
    if (!busy) { setThinkingIndex(0); return; }
    const interval = window.setInterval(() => setThinkingIndex(i => Math.min(i + 1, thinkingSequence.length - 1)), 2800);
    return () => window.clearInterval(interval);
  }, [busy, thinkingSequence]);
  useEffect(() => {
    if (!showProjects) return;
    const closeOnOutside = e => { if (!projectPicker.current?.contains(e.target)) setShowProjects(false); };
    const closeOnEscape = e => { if (e.key === 'Escape') setShowProjects(false); };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [showProjects]);

  useEffect(() => {
    const update = () => setProjects(getProjects());
    window.addEventListener('takegrid:projects-changed', update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener('takegrid:projects-changed', update); window.removeEventListener('storage', update); };
  }, []);
  useEffect(() => {
    const valid = new Set(projects.map(p => p.id));
    setSelected(ids => ids.filter(id => valid.has(id)));
  }, [projects]);
  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(threads.slice(0, 30))); setStorageError(''); }
    catch { setStorageError('Chat could not be saved. Browser storage may be full.'); }
  }, [threads]);
  useEffect(() => { try { localStorage.setItem(CURRENT_KEY, activeId); } catch { /* optional UI preference */ } }, [activeId]);
  // Scroll INSIDE the chat panel, never scroll the Home document.
  // useLayoutEffect handles both opening a saved conversation and new replies.
  const visibleCount = threads.find(t => t.id === activeId)?.messages?.length || 0;
  useLayoutEffect(() => {
    if (!open) return;
    const el = transcriptRef.current;
    if (!el) return;
    const jumpToLatest = () => { el.scrollTop = el.scrollHeight; };
    jumpToLatest();
    const raf = window.requestAnimationFrame(jumpToLatest);
    return () => window.cancelAnimationFrame(raf);
  }, [open, activeId, visibleCount, busy === 'chat']);
  const active = threads.find(t => t.id === activeId) || null;
  const selectedContext = useMemo(() => buildContext(projects, selected), [projects, selected]);
  const filteredProjects = useMemo(() => projects.filter(p => String(p.title || '').toLowerCase().includes(projectSearch.trim().toLowerCase())), [projects, projectSearch]);
  const pinnedThreads = threads.filter(t => t.pinned);
  const recentThreads = threads.filter(t => !t.pinned);
  function togglePinThread(id) {
    if (busy) return;
    setThreads(old => old.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
  }

  function toggleReaction(threadId, messageId, rating) {
    setThreads(old => old.map(t => t.id === threadId ? { ...t,
      messages: t.messages.map(m => m.id === messageId ? { ...m, reaction: m.reaction === rating ? null : rating } : m)
    } : t));
  }
  async function copyReply(messageId, content) {
    try {
      await navigator.clipboard.writeText(String(content || ''));
      setCopiedId(messageId);
      window.clearTimeout(copyReset.current);
      copyReset.current = window.setTimeout(() => setCopiedId(''), 1800);
    } catch { setError('Clipboard permission denied. Please copy the reply manually.'); }
  }
  function addFiles(newFiles) {
    if (!newFiles?.length) return;
    let errorMessage = '';
    setAttachments(old => {
      const next = [...old];
      let total = next.reduce((sum, f) => sum + f.size, 0);
      for (const file of newFiles) {
        const ext = String(file.name).split('.').pop().toLowerCase();
        if (!ALLOWED_FILE_EXTENSIONS.has(ext)) { errorMessage = `Unsupported file: ${file.name}`; continue; }
        if (file.size > MAX_FILE_SIZE) { errorMessage = `${file.name} exceeds the 10 MB limit.`; continue; }
        if (next.length >= MAX_ATTACHMENTS) { errorMessage = 'Maximum 5 attachments per message.'; break; }
        if (total + file.size > MAX_TOTAL_SIZE) { errorMessage = 'Total attachment size must be under 25 MB.'; break; }
        next.push(file); total += file.size;
      }
      return next;
    });
    if (errorMessage) setError(errorMessage);
  }

  function startNew() {
    if (busy) return;
    const t = newThread();
    setThreads(old => [t, ...old].slice(0, 30));
    setActiveId(t.id); setProposal(null); setBuildFormOpen(false); setCreatedId(''); setError(''); setNotice(''); setDraft('');
  }
  function currentThread() {
    if (active) return active;
    const t = newThread();
    setThreads(old => [t, ...old].slice(0, 30)); setActiveId(t.id);
    return t;
  }
  function append(id, m) {
    setThreads(old => old.map(t => t.id === id ? { ...t,
      title: t.messages.length === 0 && m.role === 'user' ? m.content.slice(0, 55) : t.title,
      messages: [...t.messages, m].slice(-100) } : t));
  }
  async function send(e, preset) {
    e?.preventDefault?.();
    const message = (preset || draft).trim();
    if (busy || !message) return;
    const t = currentThread();
    const files = [...attachments];
    const oldHistory = t.messages.map(m => ({ role: m.role, content: m.content }));
    append(t.id, { id: makeId(), role: 'user', content: message,
      attachments: files.map(f => f.name), at: now() });
    setDraft(''); setAttachments([]); setError(''); setNotice(''); setThinkingSequence(makeLoadingSequence()); setThinkingIndex(0); setBusy('chat');
    controller.current = new AbortController();
    const epoch = ++requestEpoch.current;
    activeRequestEpoch.current = epoch;
    try {
      const data = await requestGlobalAI('chat', {
        message, history: oldHistory, projects: selectedContext
      }, files, controller.current.signal);
      if (epoch !== requestEpoch.current) return;
      append(t.id, { id: makeId(), role: 'assistant', content: data.answer, at: now() });
    } catch (err) {
      if (epoch !== requestEpoch.current) return;
      if (err?.name === 'AbortError') flashActionToast('Request cancelled');
      else setError('Something went wrong. Please try again.');
      setDraft(message); setAttachments(files);
    } finally {
      if (epoch === requestEpoch.current) { setBusy(''); controller.current = null; }
    }
  }
  function openBuildForm() {
    if (busy) return;
    setError(''); setNotice(''); setShowProjects(false);
    setBuildFormOpen(true);
    window.requestAnimationFrame(() => buildFormTitleRef.current?.focus());
  }
  function closeBuildForm() { if (!busy) setBuildFormOpen(false); }
  // Clicking Build Project in the form is explicit consent to create a
  // NEW project. No generated draft is saved unless AI returns valid fields.
  async function buildProposal(e) {
    e?.preventDefault?.();
    if (busy || !buildFields.type.trim()) return;
    const t = currentThread();
    const chosen = { ...buildFields };
    const creationPrompt = [
      'Create one original film project based only on these requirements. Return concise structured fields.',
      `Project type or genre: ${chosen.type.trim()}`,
      chosen.title.trim() ? `Required project title: ${chosen.title.trim()}` : 'Invent a memorable original project title (title is optional from the user).',
      chosen.language.trim() ? `Preferred language: ${chosen.language.trim()}` : 'Choose a suitable language.',
      chosen.direction.trim() ? `Creative direction and requirements: ${chosen.direction.trim()}` : 'Develop an original compelling concept and story.',
      'Return title, genre, language, idea and a short opening story. Do not modify existing projects.'
    ].join('\n');
    // Standalone creation needs the user's form, not entire old conversations.
    // Selected project stories are only relevant when the user explicitly asks to combine them.
    const needsSources = /\b(merge|blend|combine|crossover|existing project|selected project|compare)\b/i.test([chosen.type, chosen.direction].join(' '));
    const oldHistory = [];
    const builderContext = needsSources ? selectedContext.map(p => ({ id: p.id, title: p.title, genre: p.genre, language: p.language, idea: String(p.idea || '').slice(0, 650) })) : [];
    setBuildFormOpen(false); setError(''); setNotice(''); setProposal(null); setCreatedId('');
    append(t.id, { id: makeId(), role: 'user', content: creationPrompt, at: now() });
    setThinkingSequence(makeLoadingSequence()); setThinkingIndex(0); setBusy('proposal');
    controller.current = new AbortController();
    const epoch = ++requestEpoch.current;
    activeRequestEpoch.current = epoch;
    try {
      const data = await requestGlobalAI('proposal', {
        message: creationPrompt, history: oldHistory, projects: builderContext
      }, [], controller.current.signal);
      if (epoch !== requestEpoch.current) return;
      const generated = data?.proposal;
      const title = chosen.title.trim() || String(generated?.title || '').trim();
      const idea = String(generated?.idea || '').trim();
      if (!title || !idea) throw new Error('AI returned an incomplete project. Nothing was created. Please retry.');
      // Record an actual AI result in the conversation before creating the project.
      append(t.id, { id: makeId(), role: 'assistant', content: `Project proposal ready: **${title}**\n\n${idea}`, at: now() });
      let created = null;
      try {
        created = createProject('ai');
        const result = saveProject({ ...created,
          title, genre: String(generated?.genre || chosen.type).trim() || 'Drama',
          language: String(generated?.language || chosen.language).trim() || 'English',
          idea, story: String(generated?.story || ''), chatThreads: [], activeChatThreadId: null,
          sourceProjectIds: selectedContext.map(item => item.id) });
        setCreatedId(result.id);
        setBuildFields({ title: '', type: '', language: '', direction: '' });
        navigate(`/projects/${encodeURIComponent(result.id)}/story`);
      } catch (saveErr) {
        if (created?.id) { try { deleteProject(created.id); } catch { /* leave error visible */ } }
        throw new Error(`Project could not be saved: ${saveErr?.message || 'Unknown error'}`);
      }
    } catch (err) {
      if (epoch !== requestEpoch.current) return;
      if (err?.name === 'AbortError') flashActionToast('Request cancelled');
      else setError('Something went wrong. Project was not created. Please try again.');
    } finally {
      if (epoch === requestEpoch.current) { setBusy(''); controller.current = null; }
    }
  }
  const hasSelection = selectedContext.length > 0;
  return <section className="home-assistant-section" id="global-ai-assistant">
    <button
      type="button"
      className="tg-floating-ai"
      onClick={openGlobalAI}
      aria-label="Open TAKEGRID AI"
      title="Talk to TAKEGRID AI"
    >
      <Bot size={25} />
    </button>
    <div className="assistant-panel tg-global-panel">
      <div className="assistant-panel-header">
        <div className="assistant-title-group"><span className="assistant-icon"><MessageCircle size={24}/></span>
          <div><span className="assistant-kicker">GLOBAL AI ASSISTANT</span><h2>Discuss all your projects.</h2></div></div>
        <button type="button" className="tg-global-toggle" onClick={toggleGlobalDashboard}>
          {open ? <><ChevronUp size={17}/> Close</> : <><MessageCircle size={17}/> Open AI</>}
        </button>
      </div>
      <p className="assistant-intro">Explore ideas, compare selected projects, connect story worlds and create new projectsâ€”always with your approval.</p>
      {open && <div className="tg-global-workspace" ref={workspaceRef}>
        <aside className="tg-global-sidebar">
          <div className="tg-global-history-head"><span>Chat history</span><span className="tg-global-history-count" title={`${threads.length} saved conversations`}>{threads.length}</span></div>
          <div className="tg-global-threads" aria-label="Global conversations">
            {threads.length === 0 && <div className="tg-global-history-empty">Your conversations will show up here.</div>}
            {[['Pinned', pinnedThreads], ['Recent', recentThreads]].map(([section, items]) => items.length ?
              <div className="tg-global-history-group" key={section}>
                <div className="tg-global-history-label">{section === 'Pinned' && <Pin size={12} aria-hidden="true"/>}{section}</div>
                {items.map(t => <div className={`tg-global-thread${t.pinned ? ' is-pinned' : ''}${t.id === activeId ? ' is-current' : ''}`} key={t.id}>
                  <button type="button" className={`tg-global-thread-open${t.id === activeId ? ' active' : ''}`} onClick={() => { setActiveId(t.id); setProposal(null); setError(''); }} disabled={!!busy} title={t.title}>{t.title}</button>
                  <div className="tg-global-thread-controls">
                    <button type="button" className={`tg-global-pin${t.pinned ? ' is-pinned' : ''}`} title={t.pinned ? 'Unpin conversation' : 'Pin conversation'} aria-label={`${t.pinned ? 'Unpin' : 'Pin'} ${t.title}`} aria-pressed={!!t.pinned} onClick={() => togglePinThread(t.id)} disabled={!!busy}><Pin size={14} fill={t.pinned ? 'currentColor' : 'none'}/></button>
                    <button type="button" className="tg-global-delete" title="Delete conversation" aria-label={`Delete ${t.title}`} onClick={() => {
                      if (!window.confirm('Delete this conversation?')) return;
                      setThreads(old => old.filter(x => x.id !== t.id));
                      if (activeId === t.id) { setActiveId(''); setProposal(null); }
                    }} disabled={!!busy}><Trash2 size={14}/></button>
                  </div>
                </div>)}
              </div> : null)}
          </div>
          <button type="button" className="tg-global-new tg-global-new-floating" onClick={startNew} disabled={!!busy}><Plus size={16}/> New chat</button>
          <div className="tg-global-sidebar-footer">
            <div>Chat autosaves Â· Shift+Enter for newline Â· Files aren't stored</div>
            <div className="tg-global-scroll-help"><strong>Scroll guide</strong><span>Chat replies: scroll inside chat.</span><span>History: scroll inside sidebar.</span><span>Outside dashboard: page scrolls normally.</span></div>
          </div>
        </aside>
        <div className="tg-global-main">
          <div className="tg-global-scope">
            <span><BookOpen size={16}/> {APP_NAME} Global AI</span>
            <div className="tg-global-header-actions">
              <div className="tg-global-picker-wrap" ref={projectPicker}>
                <button type="button" className="tg-global-picker-trigger" aria-expanded={showProjects} aria-haspopup="dialog" onClick={() => setShowProjects(v => !v)} title="Choose project context">
                  <FolderOpen size={16}/><span>Projects</span><b>{selectedContext.length}</b><ChevronDown size={15}/>
                </button>
                {showProjects && <div className="tg-global-project-popover" role="dialog" aria-label="Select project context">
                  <div className="tg-global-picker-title"><strong>Project context</strong><button type="button" onClick={() => setShowProjects(false)} aria-label="Close project selector"><X size={16}/></button></div>
                  <label className="tg-global-project-search"><Search size={16}/><input type="search" value={projectSearch} onChange={e => setProjectSearch(e.target.value)} placeholder="Search projects..." aria-label="Search projects"/></label>
                  <div className="tg-global-project-quick">
                    <button type="button" className="tg-global-select-all" disabled={!!busy || projects.length === 0} onClick={() => setSelected(projects.slice(0,12).map(p => p.id))}><Check size={14}/> Select all</button>
                    <button type="button" className="tg-global-clear-all" disabled={!!busy || selected.length === 0} onClick={() => setSelected([])}><X size={14}/> Clear</button>
                    <span className="tg-global-selection-count">{selected.length}/12</span>
                  </div>
                  <div className="tg-global-project-list">{filteredProjects.length ? filteredProjects.map(p => {
                    const chosen = selected.includes(p.id);
                    return <button type="button" key={p.id} title={p.title} className={`tg-global-project-choice${chosen ? ' is-selected' : ''}`}
                      aria-pressed={chosen} disabled={!!busy || (selected.length >= 12 && !chosen)}
                      onClick={() => setSelected(old => old.includes(p.id) ? old.filter(id => id !== p.id) : old.length < 12 ? [...old, p.id] : old)}>
                      <span className="tg-global-project-choice-title">{p.title}</span>
                      <span className="tg-global-project-choice-indicator" aria-hidden="true"><Check size={15} strokeWidth={3}/></span>
                    </button>;
                  }) : <p className="tg-global-empty-projects">No matching projects</p>}</div>
                  <small>Only selected projects are included in AI context. Max 12.</small>
                </div>}
              </div>
              <button type="button" className="tg-global-propose tg-global-header-create" onClick={openBuildForm} disabled={!!busy}><FilePlus2 size={16}/><span>Build New Project</span></button>
            </div>
          </div>
          <div className="tg-global-messages" ref={transcriptRef} role="log" aria-live="polite">
            {!active?.messages?.length && <div className="tg-global-welcome"><strong>What are we creating today?</strong><p>Ask about your existing projects, compare storylines or explore a completely new idea.</p>
              <div className="tg-global-suggestions">
                <button type="button" onClick={() => setDraft('Compare my selected projects: themes, characters, strengths and weaknesses.')} >Compare selected projects</button>
                <button type="button" onClick={() => setDraft('Suggest a new story concept combining the strongest ideas from my selected projects. Do not modify the originals.')} >Combine story ideas</button>
                <button type="button" onClick={() => setDraft('Help me brainstorm a new film project from scratch. Ask me only essential creative questions.')} >Brainstorm a new project</button>
              </div></div>}
            {active?.messages?.map(m => <div key={m.id} className={`tg-global-message ${m.role}`}>
              <div className="tg-global-message-stack">
                <div className="tg-global-bubble"><InlineFormatted text={m.content}/>{m.attachments?.length > 0 && <small>Attached: {m.attachments.join(', ')}</small>}</div>
                <div className="tg-global-message-actions">
                  <button type="button" onClick={() => copyReply(m.id, m.content)} title="Copy message" aria-label={copiedId === m.id ? 'Copied' : 'Copy message'}>{copiedId === m.id ? <span className="tg-global-copy-confirm"><Check size={15} strokeWidth={3}/></span> : <Copy size={15}/>}</button>
                  {m.role !== 'user' && <>
                    <button type="button" className={m.reaction === 'like' ? 'is-active' : ''} aria-pressed={m.reaction === 'like'} aria-label="Like response" title="Like response" onClick={() => toggleReaction(active.id, m.id, 'like')}><ThumbsUp size={15}/></button>
                    <button type="button" className={m.reaction === 'dislike' ? 'is-active' : ''} aria-pressed={m.reaction === 'dislike'} aria-label="Dislike response" title="Dislike response" onClick={() => toggleReaction(active.id, m.id, 'dislike')}><ThumbsDown size={15}/></button>
                  </>}
                </div>
              </div>
            </div>)}
            {busy === 'chat' && <div className="tg-global-pending" role="status"><span className="tg-global-thinking-dots" aria-hidden="true"><i/><i/><i/></span><span>{thinkingSequence[thinkingIndex]}</span></div>}

          </div>
          {busy === 'proposal' && <div className="tg-global-proposal-progress" role="status" aria-live="polite"><span className="tg-global-proposal-spinner" aria-hidden="true"/><div><strong>Building your new project</strong><span>{thinkingSequence[thinkingIndex]}</span></div></div>}
          {buildFormOpen && <div className="tg-global-proposal-overlay tg-v14-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) closeBuildForm(); }}>
            <form className="tg-global-proposal tg-global-build-form tg-v14-build" role="dialog" aria-modal="true" aria-labelledby="tg-v14-build-title" onSubmit={buildProposal}>
              <div className="tg-v14-build-head">
                <div><span className="tg-v14-eyebrow">NEW PROJECT</span><h3 id="tg-v14-build-title">What are you making?</h3><p>Share the idea. We'll handle the first draft.</p></div>
                <button type="button" className="tg-v14-close" onClick={closeBuildForm} aria-label="Close project form"><X size={17}/></button>
              </div>
              <div className="tg-v14-build-body">
                <label className="tg-v14-field"><span>Project name <small>Optional</small></span><input ref={buildFormTitleRef} value={buildFields.title} maxLength={160} placeholder="We'll suggest one if left empty" onChange={e => setBuildFields(p => ({ ...p, title: e.target.value }))}/></label>
                <label className="tg-v14-field"><span>What kind of project? <small className="tg-v14-required">Required</small></span><textarea required rows={3} minLength={3} maxLength={1200} placeholder="A mystery thriller set in rainy Kolkata..." value={buildFields.type} onChange={e => setBuildFields(p => ({ ...p, type: e.target.value }))}/></label>
                <label className="tg-v14-field"><span>Language <small>Optional</small></span><input maxLength={70} placeholder="English, Hindi, Bengali..." value={buildFields.language} onChange={e => setBuildFields(p => ({ ...p, language: e.target.value }))}/></label>
                <label className="tg-v14-field"><span>Anything else? <small>Optional</small></span><textarea rows={2} maxLength={2500} placeholder="Tone, characters, setting, creative boundaries..." value={buildFields.direction} onChange={e => setBuildFields(p => ({ ...p, direction: e.target.value }))}/></label>
              </div>
              <div className="tg-v14-build-foot"><p>Creates a new project using TAKEGRID AI. Your existing projects stay unchanged.</p><button className="tg-global-approve tg-v14-submit" type="submit" disabled={!buildFields.type.trim()}><FilePlus2 size={17}/> Create project</button></div>
            </form>
          </div>}
          {error && <div role="alert" className="tg-global-error">{error}</div>}
          {storageError && <div role="alert" className="tg-global-error">{storageError}</div>}
          {notice && <div className="tg-global-notice">{notice}</div>}
          {actionToast && <div className="tg-global-action-toast" role="status">{actionToast}</div>}
          {voiceToast && <div className="tg-global-voice-toast" role="status"><Mic size={15}/> Voice input is coming to TAKEGRID soon!</div>}
          <div className="tg-global-compose">
            <p className="tg-global-disclaimer">TAKEGRID can make mistakes. Verify important details and review AI suggestions before using them.</p>
            {!!attachments.length && <div className="tg-global-files">{attachments.map((f,i) => <span key={i}><Paperclip size={12}/>{f.name} Â· {humanSize(f.size)}<button onClick={() => setAttachments(a => a.filter((_, j) => i !== j))} aria-label={`Remove ${f.name}`}><X size={14}/></button></span>)}</div>}
            <form onSubmit={send} className="tg-global-form">
              <input ref={fileInput} type="file" hidden multiple accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.webp" onChange={e => { addFiles([...e.target.files]); e.target.value=''; }}/>
              <button type="button" className="tg-global-add-file" title="Add reference files" aria-label="Attach files" onClick={() => fileInput.current?.click()} disabled={!!busy}><Plus size={21}/></button>
              <textarea ref={composerInputRef} rows={1} value={draft} disabled={!!busy} onChange={e => setDraft(e.target.value)} placeholder="Ask TAKEGRID AI about your projects..." onKeyDown={e => {if(e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing){e.preventDefault();send(e);}}}/>
              <div className="tg-global-composer-controls">
                <button type="button" className="tg-global-mic" onClick={showVoiceComingSoon} aria-label="Voice input coming soon" title="Voice input coming soon"><Mic size={19}/></button>
                {busy ? <button type="button" className="tg-global-send tg-global-stop" onClick={stopGeneration} title="Stop generation" aria-label="Stop generation"><span className="tg-global-stop-ring" aria-hidden="true"/><Square size={13} fill="currentColor"/></button> : <button type="submit" className="tg-global-send" disabled={!draft.trim()} title="Send message" aria-label="Send message"><ArrowUp size={19}/></button>}
              </div>
            </form>

          </div>
        </div>
      </div>}
    </div>
  </section>;
}
