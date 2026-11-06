import IOSSelect from "../ui/IOSSelect";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { aiConfigured, requestProjectAI, requestProjectAIWithAttachments } from "../../services/workspaceApi";
import { BookOpen, Check, Copy, Menu, MessageCircle, MoreHorizontal, Paperclip, Pencil, Plus, Save, Send, ArrowUp, LoaderCircle, ThumbsUp, Trash2, X } from "lucide-react";
import "./ProjectAIChat.css";
import "./ProjectAIChatPolish.css";

const uid = () => crypto.randomUUID();
const ATTACHMENT_LIMIT = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "txt", "md", "png", "jpg", "jpeg", "webp"]);
const formatSize = bytes => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const makeThread = (title = "New conversation", target = "project") => ({ id: uid(), title, target, messages: [], createdAt: new Date().toISOString() });
const normalize = (project) => {
  if (Array.isArray(project.chatThreads)) return project.chatThreads;
  const legacy = Array.isArray(project.chatMessages) ? project.chatMessages : [];
  return legacy.length ? [{ id: "legacy-chat", title: "Previous conversation", target: "project", messages: legacy }] : [];
};
const cleanSceneLabel = (scene, index) => {
  const raw = scene?.name || scene?.heading || scene?.title || "Untitled";
  const text = (Array.isArray(raw) ? raw.join(" ") : String(raw))
    .replace(/[*#`]+/g, "")
    .replace(/^[\s,;â€¢Â·\-\d.)]+/, "")
    .replace(/\s*[,;â€¢Â·]\s*/g, " Â· ")
    .replace(/\s+/g, " ")
    .trim();
  return `Scene ${index + 1} â€” ${(text || "Untitled").slice(0, 52)}`;
};

// A safe, lightweight Markdown display for Gemini output (no HTML injection).
const renderInlineChatText = (value) => String(value || "").split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
  part.startsWith("**") && part.endsWith("**")
    ? <strong key={i}>{part.slice(2, -2)}</strong>
    : <span key={i}>{part}</span>
);
const renderChatText = (value) => {
  const lines = String(value || "").split(/\r?\n/);
  const blocks = [];
  let list = [];
  let listKind = null;
  const flush = () => {
    if (!list.length) return;
    const Tag = listKind === "ol" ? "ol" : "ul";
    blocks.push(<Tag key={`list-${blocks.length}`}>{list.map((entry, i) => <li key={i}>{renderInlineChatText(entry)}</li>)}</Tag>);
    list = [];
    listKind = null;
  };
  lines.forEach((line, i) => {
    const bullet = line.match(/^\s*[-*â€¢]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      const kind = numbered ? "ol" : "ul";
      if (listKind && listKind !== kind) flush();
      listKind = kind;
      list.push((bullet || numbered)[1]);
    } else {
      flush();
      if (line.trim()) blocks.push(<p key={`line-${i}`}>{renderInlineChatText(line)}</p>);
    }
  });
  flush();
  return blocks;
};

export default function ProjectAIChat({ project, onSave, onOpenStory, onSaveConversation, canSaveConversation }) {
  const location = useLocation();
  const threads = normalize(project);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState("project");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  function toggleLike(messageId) {
    // Feedback lives in the existing chat draft, persisted only via explicit Save.
    onSave(latest => ({...latest, chatThreads: normalize(latest).map(t => ({...t,
      messages: (t.messages || []).map(m => m.id === messageId
        ? {...m, liked: !Boolean(m.liked)} : m)
    }))}));
  }
  const copyTimerRef = useRef(null);
  const textareaRef = useRef(null);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [revision, setRevision] = useState("");
  const [attachments, setAttachments] = useState([]);
  const attachmentsRef = useRef([]);
  const fileInputRef = useRef(null);
  const addFiles = fileList => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const current = attachmentsRef.current;
    const next = [...current];
    for (const file of incoming) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) { setError(`Unsupported file: ${file.name}. Use PDF, TXT, MD, PNG, JPG or WebP.`); continue; }
      if (!file.size || file.size > MAX_FILE_BYTES) { setError(`${file.name}: files must be non-empty and no larger than 10 MB.`); continue; }
      if (next.length >= ATTACHMENT_LIMIT) { setError(`You can attach up to ${ATTACHMENT_LIMIT} files per message.`); break; }
      if (next.reduce((total, item) => total + item.file.size, 0) + file.size > MAX_TOTAL_BYTES) { setError("Total attachment size cannot exceed 25 MB."); break; }
      if (next.some(item => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified)) continue;
      next.push({ id: uid(), file, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null });
    }
    attachmentsRef.current = next;
    setAttachments(next);
  };
  const clearAttachments = () => {
    attachmentsRef.current.forEach(item => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); });
    attachmentsRef.current = [];
    setAttachments([]);
  };
  const removeAttachment = id => {
    const item = attachmentsRef.current.find(item => item.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    const next = attachmentsRef.current.filter(item => item.id !== id);
    attachmentsRef.current = next;
    setAttachments(next);
  };
  useEffect(() => () => { attachmentsRef.current.forEach(item => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); }); }, []);

  const copyMessage = async (id, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("Couldn't copy message. Check browser clipboard permissions.");
    }
  };
  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);
  const resizeInput = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 156)}px`;
  };
  const scrollRef = useRef(null);
  const thread = threads.find(t=>t.id===activeId) || threads.find(t=>t.id===project.activeChatThreadId) || threads[0] || null;
  useEffect(()=>{ setActiveId(null); setTarget("project"); setProposal(null); setInput(""); clearAttachments(); },[project.id]);
  useEffect(()=>{ if (location.state?.chatIntent === "story") setTarget("story"); },[location.state]);
  useEffect(()=>{scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight,behavior:"smooth"});},[thread?.messages?.length]);
  function commit(nextOrUpdater, id) {
    onSave(latest => {
      if (!latest) return latest;
      const all = normalize(latest);
      const next = typeof nextOrUpdater === "function" ? nextOrUpdater(all) : nextOrUpdater;
      return { ...latest, chatThreads: next, activeChatThreadId: id };
    });
    setActiveId(id || null);
  }
  function create() { const t=makeThread("New conversation",target); commit(all => [t,...all],t.id); setInput("");setProposal(null);setSidebarOpen(false); }
  function rename(id) { const old=threads.find(t=>t.id===id); const title=window.prompt("Conversation name",old?.title||"")?.trim(); if(title)commit(all => all.map(t=>t.id===id?{...t,title:title.slice(0,90)}:t), id); }
  function remove(id) {if(!window.confirm("Delete this conversation from the project draft? Save Changes to confirm."))return;const remaining=threads.filter(t=>t.id!==id);commit(all => all.filter(t=>t.id!==id),remaining[0]?.id||null);setActiveId(remaining[0]?.id||null);}
  function switchTo(id){setActiveId(id);setProposal(null);setError("");setSidebarOpen(false);}
  async function send(e) {
    e.preventDefault(); const content=input.trim(); if(!content||busy)return;
    if(!aiConfigured){setError("Flask AI backend isn't connected yet. No simulated replies are generated.");return;}
    const selectedFiles = attachmentsRef.current.map(item => item.file);
    const selectedMetadata = selectedFiles.map(file => ({ name: file.name, size: file.size, type: file.type || "application/octet-stream" }));
    const current=thread||makeThread(content.slice(0,55),target);
    const history=Array.isArray(current.messages)?current.messages:[];
    const userMessage={id:uid(),role:"user",content,...(selectedMetadata.length ? {attachments:selectedMetadata} : {}),sceneId:target.startsWith("scene:")?target.slice(6):null,at:new Date().toISOString()};
    const waiting=[...history,userMessage];
    // Append to the latest draft, not to the project snapshot captured before the request.
    commit(all => {
      const exists = all.some(t => t.id === current.id);
      const base = exists ? all : [current, ...all];
      return base.map(t => t.id === current.id ? {
        ...t, title: history.length ? t.title : content.slice(0, 60),
        messages: [...(t.messages || []), userMessage], target
      } : t);
    }, current.id);
    setInput("");setError("");setBusy(true);setProposal(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      const payload={
        message:content, target, sceneId:target.startsWith("scene:")?target.slice(6):null,
        language:project.language||"English", history:history.map(m=>({role:m.role,content:m.content})).slice(-24),
        context:{title:project.title,idea:project.idea,story:project.story,scenes:project.scenes,creativeDecisions:project.creativeDecisions}
      };
      const data=selectedFiles.length
        ? await requestProjectAIWithAttachments(project.id,"chat",payload,selectedFiles)
        : await requestProjectAI(project.id,"chat",payload);
      const answer=typeof data?.answer==="string"?data.answer.trim():"";
      if(!answer)throw new Error("Backend returned no answer.");
      const response={id:uid(),role:"assistant",content:answer,at:new Date().toISOString()};
      // Functional update preserves edits, other chats, renames and scene changes
      // made while the backend request was in flight.
      onSave(latest => ({ ...latest, chatThreads: normalize(latest).map(t =>
        t.id === current.id ? { ...t, messages: [...(t.messages || []), response] } : t
      ) }));
      clearAttachments();
      if(data?.proposedRevision && typeof data.proposedRevision.text==="string" && ["story","scene"].includes(data.proposedRevision.target)) {
        setProposal(data.proposedRevision); setRevision(data.proposedRevision.text);
      }
    } catch(err) {
      // A failed attachment upload must never be represented as a successfully sent file.
      if (selectedFiles.length) {
        onSave(latest => ({ ...latest, chatThreads: normalize(latest).map(t =>
          t.id === current.id ? { ...t, messages: (t.messages || []).filter(m => m.id !== userMessage.id) } : t
        ) }));
        setInput(content);
      }
      setError(err.message || "Request failed. Files remain attached so you can retry.");
    }
    finally {setBusy(false);}
  }
  function applyProposal(){
    if(!proposal||!revision.trim())return;
    if(proposal.target==="story") onSave(latest => ({ ...latest, story:revision }));
    else if(proposal.target==="scene" && proposal.sceneId) {
      const match=(project.scenes||[]).some(s=>s.id===proposal.sceneId);
      if(!match){setError("The referenced scene no longer exists.");return;}
      onSave(latest => ({ ...latest, scenes:(latest.scenes||[]).map(s=>s.id===proposal.sceneId?{...s,description:revision}:s) }));
    } else return;
    setProposal(null);setRevision("");setError("Revision added to unsaved project draft. Click Save Changes at the top to keep it.");
  }
  return <section className="ff-chatroom" aria-label="Project AI writing room">
    <aside className={`ff-chat-sidebar ${sidebarOpen?"open":""}`}>
      <div className="ff-chat-sidebar-head"><div><small className="ff-chat-sidebar-eyebrow">PROJECT WRITING ROOM</small><strong>Conversations</strong></div><button type="button" title="Close chat list" className="ff-chat-mobile-close" onClick={()=>setSidebarOpen(false)}><X size={17}/></button></div>
      <button className="ff-chat-new" onClick={create}><Plus size={17}/> New chat</button>
      <div className="ff-thread-list">{threads.length?threads.map(t=><div key={t.id} className={`ff-thread-row ${t.id===thread?.id?"selected":""}`}><button className="ff-thread-open" type="button" onClick={()=>switchTo(t.id)}><MessageCircle size={15}/><span>{t.title}</span></button><button title="Rename" onClick={()=>rename(t.id)}><Pencil size={14}/></button><button title="Delete" onClick={()=>remove(t.id)}><Trash2 size={14}/></button></div>):<p className="ff-chat-muted">No conversations yet. Start one whenever you're ready.</p>}</div>
      <div className="ff-chat-sidebar-foot">Enter to send Â· Shift+Enter for a new line. Save to keep conversations.</div>
    </aside>
    <div className="ff-chat-center">
      <header className="ff-chat-header">
        <button className="ff-chat-menu" type="button" onClick={()=>setSidebarOpen(true)} aria-label="Open conversations"><Menu size={19}/></button>

        <div className="ff-chat-header-actions" aria-label="Chat toolbar">
          <label className="ff-chat-context-header">
            <span className="ff-sr-only">AI context</span>
            <IOSSelect aria-label="AI context" value={target} onChange={e=>setTarget(e.target.value)}>
              <option value="project">Entire project</option>
              <option value="story">Full story</option>
              {(project.scenes || []).map((scene, i) => <option key={scene.id} value={`scene:${scene.id}`}>{cleanSceneLabel(scene, i)}</option>)}
            </IOSSelect>
          </label>
          <button className="ff-chat-storylink" type="button" onClick={onOpenStory}><BookOpen size={16}/><span>Story editor</span></button>
          <button className="ff-chat-header-save" type="button" onClick={onSaveConversation} disabled={!canSaveConversation} title={canSaveConversation ? "Save conversation" : "Conversation saved"} aria-label={canSaveConversation ? "Save conversation" : "Conversation saved"}><Save size={16}/><span>{canSaveConversation ? "Save" : "Saved"}</span></button>
        </div>
      </header>

      <div className="ff-chat-transcript" ref={scrollRef} role="log" aria-live="polite">{thread?.messages?.length?thread.messages.map(m=><div key={m.id} className={`ff-chat-message-item ${m.role==="user"?"is-user":"is-ai"}`}><article className={`ff-chat-bubble ${m.role==="user"?"is-user":"is-ai"}`}><div className="ff-chat-message-body">{renderChatText(m.content)}</div>{Array.isArray(m.attachments) && m.attachments.length > 0 && <div className="ff-chat-attachment-history" aria-label="Files sent with this message">{m.attachments.map((item,i)=><span key={`${item.name}-${i}`}><Paperclip size={12}/>{item.name}</span>)}</div>}</article><div className="ff-chat-message-actions">
          <button type="button" className={`ff-copy-action ${copiedId === m.id ? "is-copied" : ""}`} title={copiedId === m.id ? "Copied" : "Copy message"} aria-label={copiedId === m.id ? "Copied to clipboard" : "Copy message"} onClick={() => copyMessage(m.id, m.content)}>{copiedId === m.id ? <Check size={15}/> : <Copy size={15}/>}</button>
          {m.role !== "user" && <button type="button" className={`ff-like-action ${m.liked ? "is-liked" : ""}`} aria-pressed={Boolean(m.liked)} aria-label={m.liked ? "Remove like" : "Like response"} title={m.liked ? "Liked â€” click to undo" : "Like response"} onClick={() => toggleLike(m.id)}><ThumbsUp size={15}/></button>}
        </div></div>):<div className="ff-chat-welcome"><div className="ff-chat-welcome-icon"><MessageCircle size={27}/></div><h2>Your creative thinking partner</h2><p>Discuss plot, character motives, screenplay rewrites or any specific scene. Create multiple chats, continue past discussions and approve proposed edits before they reach your story.</p>{!aiConfigured&&<p className="ff-chat-offline">Connect the Flask + Gemini backend to send messages. No fake AI content is generated.</p>}</div>}{busy && <article className="ff-chat-thinking" role="status" aria-live="polite"><span className="ff-thinking-dots" aria-hidden="true"><i/><i/><i/></span><span>AI Co-Director is shaping a response...</span></article>}</div>
      {proposal&&<div className="ff-chat-proposal"><div className="ff-chat-proposal-head"><strong>Proposed {proposal.target} revision â€” review before applying</strong><button onClick={()=>setProposal(null)}><X size={16}/></button></div><textarea value={revision} onChange={e=>setRevision(e.target.value)} rows={7} aria-label="Edit proposed story text"/><div><button className="ff-chat-apply" onClick={applyProposal}><Check size={17}/> Apply to draft</button><small>Not saved until you click Save Changes above.</small></div></div>}
      {error&&<p className="ff-chat-error" role="status">{error}</p>}
      <form onSubmit={send} className="ff-chat-composer">
        <input ref={fileInputRef} className="ff-chat-file-input" type="file" accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp" multiple onChange={e => { addFiles(e.target.files); e.target.value=""; }} aria-label="Attach files" />
        {attachments.length > 0 && <div className="ff-chat-attachments" aria-label="Selected attachments">{attachments.map(item => <div className="ff-chat-attachment" key={item.id}>{item.previewUrl ? <img src={item.previewUrl} alt="" /> : <Paperclip size={17}/>}<span title={item.file.name}>{item.file.name}<small>{formatSize(item.file.size)}</small></span><button type="button" aria-label={`Remove ${item.file.name}`} title="Remove attachment" onClick={() => removeAttachment(item.id)} disabled={busy}><X size={15}/></button></div>)}</div>}
        <div className="ff-chat-compose-shell">
          <button className="ff-chat-plus" type="button" title="Attach a file" aria-label="Attach a file" onClick={() => fileInputRef.current?.click()} disabled={busy}><Plus size={21}/></button>
          <textarea ref={textareaRef} rows={1} placeholder="Message AI Co-Director..." title="Enter to send Â· Shift+Enter for a new line" aria-label="Write a message" value={input} onChange={e => { setInput(e.target.value); resizeInput(e.currentTarget); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(e); } }}/>
          <button className={`ff-chat-send-arrow ${busy ? "is-thinking" : ""}`} type="submit" aria-label={busy ? "AI is thinking" : "Send message"} title={busy ? "AI is thinking" : "Send message"} disabled={!input.trim() || busy || !aiConfigured}>{busy ? <LoaderCircle size={19}/> : <ArrowUp size={20}/>}</button>
        </div>
      </form>
    </div>
  </section>;
}
