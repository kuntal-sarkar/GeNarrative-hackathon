import { BRAND } from "../../config/branding"; // TAKEGRID_BRAND_BOLD_V2
import IOSSelect from "../ui/IOSSelect";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { aiConfigured, requestProjectAI, requestProjectAIWithAttachments } from "../../services/workspaceApi";
import { BookOpen, Check, Copy, Menu, MessageCircle, MoreHorizontal, Paperclip, Pencil, Plus, Save, Send, ArrowUp, LoaderCircle, ThumbsUp, Trash2, X, FileText, ArrowLeft } from "lucide-react";
import "./ProjectAIChat.css";
import "./ProjectAIChatPolish.css";

const EDIT_WITH_AI_PREFILL = "I want to edit a part of my saved story. The scene or paragraph I want to change is: [describe the part]. I want it to become: [describe your change]. First help me explore options that preserve character continuity and saved creative intentions. Do not change my saved Story automatically.";
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

// TAKEGRID V8
// Render AI chat as structured, safe Markdown without injecting HTML.
const highlightBrandNames = (text) => String(text).split(/(TAKEGRID|Team Runtime Error|Kuntal Sarkar|Aditi Singh|Diya Shree|Swati Singh)/gi).map((chunk, i) => /^(TAKEGRID|Team Runtime Error|Kuntal Sarkar|Aditi Singh|Diya Shree|Swati Singh)$/i.test(chunk) ? <strong key={i}>{chunk}</strong> : chunk);
// This affects presentation only; raw chat text is retained unchanged for story selection.
const renderInlineChatText = (value) => {
  const source = String(value ?? "");
  const chunks = source.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g);
  return chunks.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    return <span key={i}>{highlightBrandNames(part)}</span>;
  });
};
const renderChatText = (value) => {
  const lines = String(value ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let list = [];
  let listKind = "";
  let code = null;
  let quote = [];
  const flushList = () => {
    if (!list.length) return;
    const Tag = listKind === "ol" ? "ol" : "ul";
    blocks.push(<Tag key={`list-${blocks.length}`}>{list.map((entry, i) => <li key={i}>{renderInlineChatText(entry)}</li>)}</Tag>);
    list = []; listKind = "";
  };
  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(<blockquote key={`quote-${blocks.length}`}>{quote.map((x,i)=><p key={i}>{renderInlineChatText(x)}</p>)}</blockquote>);
    quote = [];
  };
  lines.forEach((line, i) => {
    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
    if (fence) {
      flushList(); flushQuote();
      if (code !== null) { blocks.push(<pre key={`code-${i}`}><code>{code.join("\n")}</code></pre>); code = null; }
      else code = [];
      return;
    }
    if (code !== null) { code.push(line); return; }
    if (!line.trim()) { flushList(); flushQuote(); return; }
    const heading = line.match(/^\s{0,3}(#{1,4})\s+(.+)$/);
    if (heading) {
      flushList(); flushQuote();
      const Head = `h${Math.min(heading[1].length + 2, 6)}`;
      blocks.push(<Head key={`head-${i}`}>{renderInlineChatText(heading[2])}</Head>);
      return;
    }
    if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) { flushList(); flushQuote(); blocks.push(<hr key={`hr-${i}`}/>); return; }
    const quoted = line.match(/^\s*>\s?(.*)$/);
    if (quoted) { flushList(); quote.push(quoted[1]); return; }
    flushQuote();
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      const kind = numbered ? "ol" : "ul";
      if (listKind && listKind !== kind) flushList();
      listKind = kind; list.push((bullet || numbered)[1]);
      return;
    }
    flushList();
    blocks.push(<p key={`p-${i}`}>{renderInlineChatText(line.trim())}</p>);
  });
  flushList(); flushQuote();
  if (code !== null) blocks.push(<pre key="code-tail"><code>{code.join("\n")}</code></pre>);
  return blocks;
};

export default function ProjectAIChat({ project, onSave, onOpenStory, onPushStory }) {
  const location = useLocation();
  const navigate = useNavigate();
  const threads = normalize(project);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState(() => new URLSearchParams(location.search).has("editStory") ? EDIT_WITH_AI_PREFILL : "");
  const [target, setTarget] = useState("project");
  const [busy, setBusy] = useState(false);
  const thinkingMessages = ["Thinking through your idea...", "Checking the story context...", "Connecting the plot dots...", "Reviewing character motivations...", "Asking the plot gods for permission...", "Exploring possible scenes...", "Keeping continuity in check...", "Polishing the dialogue...", "Sorting out the twists...", "Building a clearer response...", "Checking the dramatic stakes...", "The aliens suggest a plot twist...", "Making each scene count...", "Tracing the character arcs...", "Finding the strongest opening...", "Making the ending land...", "Revisiting the key details...", "Putting the pieces together...", "Almost ready for the next take...", "Final story check..."];
  const [thinkingIndex, setThinkingIndex] = useState(0);
  useEffect(() => {
    if (!busy) { setThinkingIndex(0); return; }
    const id = window.setInterval(() => setThinkingIndex(i => Math.min(i + 1, thinkingMessages.length - 1)), 3800);
    return () => window.clearInterval(id);
  }, [busy]);

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

  const [proposalMode, setProposalMode] = useState("append");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [extractingStory, setExtractingStory] = useState(false);
  const extractionRef = useRef(0);
  const extractionControllerRef = useRef(null);
  const [storyStarted, setStoryStarted] = useState(false);

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
  useEffect(()=>{ extractionControllerRef.current?.abort(); setActiveId(null); setTarget("project"); setProposal(null); setReviewOpen(false); setExtractingStory(false); extractionRef.current += 1; setStoryStarted(false); if (!new URLSearchParams(location.search).has("editStory")) setInput(""); clearAttachments(); },[project.id]);
  // TAKEGRID_V10_STORY_CHAT_POLISH: stable URL handoff, no intermediate editor panel.
  const consumedEditRequestRef = useRef(null);
  useEffect(() => {
    const requestId = new URLSearchParams(location.search).get("editStory");
    if (!requestId || consumedEditRequestRef.current === requestId) return;
    consumedEditRequestRef.current = requestId;
    const fresh = makeThread("Story editing", "story");
    commit(all => [fresh, ...all], fresh.id);
    setTarget("story");
    setInput(EDIT_WITH_AI_PREFILL);
    setError("");
    setProposal(null);
    setReviewOpen(false);
    setStoryStarted(true);
    setSidebarOpen(false);
    window.requestAnimationFrame(() => {
      resizeInput(textareaRef.current);
      textareaRef.current?.focus();
    });
  }, [location.search, project.id]);
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
  function create() { extractionControllerRef.current?.abort(); extractionRef.current += 1; setExtractingStory(false); setReviewOpen(false); const t=makeThread("New conversation",target); commit(all => [t,...all],t.id); setInput("");setProposal(null);setSidebarOpen(false); }
  function rename(id) { const old=threads.find(t=>t.id===id); const title=window.prompt("Conversation name",old?.title||"")?.trim(); if(title)commit(all => all.map(t=>t.id===id?{...t,title:title.slice(0,90)}:t), id); }
  function remove(id) {if(!window.confirm("Delete this conversation from the project draft? Save Changes to confirm."))return;const remaining=threads.filter(t=>t.id!==id);commit(all => all.filter(t=>t.id!==id),remaining[0]?.id||null);setActiveId(remaining[0]?.id||null);}
  function switchTo(id){extractionControllerRef.current?.abort(); extractionRef.current += 1;setExtractingStory(false);setActiveId(id);setProposal(null);setReviewOpen(false);setError("");setSidebarOpen(false);}
  // The Start First Story pill submits a real, saved user message through
  // the same project chat endpoint as a manually typed prompt.
  const REVIEW_SAVED_STORY_PROMPT = "Review my CURRENT SAVED STORY (not just our chat). In clear Markdown with headings and bullet points, give me: 1) a concise story summary; 2) the main character, their goal and conflict; 3) the villain/antagonist and their motivation, or say if not yet established; 4) supporting characters and their roles; 5) important plot beats and twists; 6) unresolved mysteries, continuity issues and weaknesses; 7) specific improvements and interesting next steps. Respect saved creator intentions. Do not invent facts or rewrite/save the story. End by asking me whether you should help make those improvements.";
  const FIRST_STORY_PROMPT = "Let's create the first story for this project. Use the project title, genre, language and story idea already provided. Write an engaging original opening in narrative prose, introduce the main character and central conflict, then briefly propose where the plot could go next. Respect any saved creator intentions. If essential story details are missing, ask up to two focused questions instead. We'll develop the story together in this chat; do not save anything to the Story page yet.";
  function send(e) {
    e.preventDefault();
    void submitMessage(input, false);
  }
  async function submitMessage(rawContent, storyKickoff = false) {
    const content = String(rawContent || "").trim();
    if (!content || busy) return;
    if(!aiConfigured){setError("Flask AI backend isn't connected yet. No simulated replies are generated.");return;}
    const selectedFiles = attachmentsRef.current.map(item => item.file);
    const selectedMetadata = selectedFiles.map(file => ({ name: file.name, size: file.size, type: file.type || "application/octet-stream" }));
    const effectiveTarget = storyKickoff ? "story" : target;
    if (storyKickoff) setTarget("story");
    const current=thread||makeThread(content.slice(0,55),effectiveTarget);
    const history=Array.isArray(current.messages)?current.messages:[];
    const userMessage={id:uid(),role:"user",content,...(selectedMetadata.length ? {attachments:selectedMetadata} : {}),sceneId:effectiveTarget.startsWith("scene:")?effectiveTarget.slice(6):null,at:new Date().toISOString()};
    const waiting=[...history,userMessage];
    // Append to the latest draft, not to the project snapshot captured before the request.
    commit(all => {
      const exists = all.some(t => t.id === current.id);
      const base = exists ? all : [current, ...all];
      return base.map(t => t.id === current.id ? {
        ...t, title: history.length ? t.title : content.slice(0, 60),
        messages: [...(t.messages || []), userMessage], target: effectiveTarget
      } : t);
    }, current.id);
    if (!storyKickoff) setInput("");
    setError("");setBusy(true);
    // Preserve an existing review draft while chatting; the user decides when to discard it.
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      const payload={
        message:content, target:effectiveTarget, sceneId:effectiveTarget.startsWith("scene:")?effectiveTarget.slice(6):null,
        language:project.language||"English", history:history.slice(-10).map(m=>({role:m.role,content:String(m.content || "").slice(-3500)})),
        context:{title:project.title,idea:String(project.idea || "").slice(0,8000),story:String(project.story || "").slice(-12000),scenes:(project.scenes || []).slice(-8).map(s=>({id:s.id,name:s.name,heading:s.heading})),creativeDecisions:(project.creativeDecisions || []).slice(-20)}
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
        setProposal(data.proposedRevision); setRevision(data.proposedRevision.text); setReviewOpen(true); setStoryStarted(true);
      }
    } catch(err) {
      // A failed generation is NOT a successful story conversation.
      // Keep the creator's typed text and selected files available to retry.
      onSave(latest => ({ ...latest, chatThreads: normalize(latest).map(t =>
        t.id === current.id ? { ...t, messages: (t.messages || []).filter(m => m.id !== userMessage.id) } : t
      ) }));
      if (!storyKickoff) setInput(content);
      setError(err.message || "AI could not respond. Retry when the backend is available.");
    }
    finally {setBusy(false);}
  }
  const userHasChatted = storyStarted || Boolean(project.story?.trim()) || threads.some(t => (t.messages || []).some(m => m.role === "user"));
  const chatHistoryForStory = (thread?.messages || []).filter(m => ["user", "assistant"].includes(m.role)).slice(-36);
  function closeStoryReview() {
    extractionControllerRef.current?.abort();
    extractionControllerRef.current = null;
    extractionRef.current += 1; // Ignore any stale in-flight extraction response.
    setExtractingStory(false);
    setBusy(false);
    setReviewOpen(false);
    setError("");
  }
  async function composeFromChat() {
    if (busy || extractingStory) return;
    if (!chatHistoryForStory.length) { setError("Discuss the story in chat first, or select Start First Story."); return; }
    // Open a focused modal immediately. Cancel/timeout never touch the saved Story.
    const requestId = ++extractionRef.current;
    const historySnapshot = chatHistoryForStory.map(m => ({role:m.role, content:m.content}));
    const controller = new AbortController();
    extractionControllerRef.current = controller;
    setProposal(null);
    setRevision("");
    setReviewOpen(true);
    setExtractingStory(true);
    setBusy(true);
    setError("");
    try {
      const data = await requestProjectAI(project.id, "story/compose", {
        context: { title: project.title, genre: project.genre, language: project.language,
          idea: project.idea, story: project.story, creativeDecisions: project.creativeDecisions },
        history: historySnapshot,
      }, {signal: controller.signal, timeoutMs: 75_000});
      if (requestId !== extractionRef.current) return;
      const draft = data?.proposedRevision?.text;
      if (!draft?.trim()) throw new Error("AI found no usable story content. Discuss story scenes first, then retry.");
      setProposal(data.proposedRevision);
      setRevision(draft);
      setStoryStarted(true);
    } catch (e) {
      if (requestId === extractionRef.current) setError(e.message || "Unable to extract story from this conversation.");
    } finally {
      if (requestId === extractionRef.current) { setExtractingStory(false); setBusy(false); extractionControllerRef.current = null; }
    }
  }
  function pushReviewedStory() {
    if (!proposal || !revision.trim()) { setError("Review draft is empty."); return; }
    if (proposal.target !== "story") { setError("Only story drafts can be pushed to Story."); return; }
    try {
      onPushStory(revision.trim(), "append");
      setReviewOpen(false); setProposal(null); setRevision(""); setError("");
    } catch (e) { setError(e.message || "Story could not be saved."); }
  }
  return <section className="ff-chatroom" aria-label="Project AI writing room">
    <aside className={`ff-chat-sidebar ${sidebarOpen?"open":""}`}>
      <div className="ff-chat-sidebar-head"><div><small className="ff-chat-sidebar-eyebrow">PROJECT WRITING ROOM</small><strong>Conversations</strong></div><button type="button" title="Close chat list" className="ff-chat-mobile-close" onClick={()=>setSidebarOpen(false)}><X size={17}/></button></div>
      <button className="ff-chat-new" onClick={create}><Plus size={17}/> New chat</button>
      <div className="ff-thread-list">{threads.length?threads.map(t=><div key={t.id} className={`ff-thread-row ${t.id===thread?.id?"selected":""}`}><button className="ff-thread-open" type="button" onClick={()=>switchTo(t.id)}><MessageCircle size={15}/><span>{t.title}</span></button><button title="Rename" onClick={()=>rename(t.id)}><Pencil size={14}/></button><button title="Delete" onClick={()=>remove(t.id)}><Trash2 size={14}/></button></div>):<p className="ff-chat-muted">No conversations yet. Start one whenever you're ready.</p>}</div>
      <div className="ff-chat-sidebar-foot">Enter to send · Shift+Enter for a new line. Conversations auto-save.</div>
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

        </div>
      </header>

      {reviewOpen && <div className="tg-story-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !extractingStory) closeStoryReview(); }}>
        <section className="tg-story-modal" role="dialog" aria-modal="true" aria-labelledby="tg-story-modal-title">
          <header className="tg-story-modal-header">
            <div><span className="tg-story-modal-eyebrow">TAKEGRID · AI STORY STUDIO</span><h2 id="tg-story-modal-title">{extractingStory ? "Building your story" : proposal ? "Review extracted story" : "Story extraction"}</h2></div>
            <button type="button" className="tg-story-modal-close" onClick={closeStoryReview} aria-label={extractingStory ? "Cancel extraction" : "Close story review"}><X size={19}/></button>
          </header>
          {extractingStory ? <div className="tg-story-modal-loading" role="status" aria-live="polite">
            <div className="tg-story-modal-mark"><BookOpen size={29}/></div>
            <h3>Extracting / building your story</h3>
            <p>Reviewing your conversation and turning its story ideas into clean narrative prose.</p>
            <div className="tg-story-modal-progress" role="progressbar" aria-label="Extracting story" aria-valuetext="AI is composing a draft; completion time unknown"><span /></div>
            <small>Your original story stays unchanged. You can cancel this request.</small>
            <button type="button" className="tg-story-modal-cancel" onClick={closeStoryReview}>Cancel</button>
          </div> : proposal ? <div className="tg-story-modal-editor">
            <p className="tg-story-modal-desc">Edit or remove any part of the AI-selected draft before adding it to your story.</p>
            <label htmlFor="tg-story-reviewed-text">Extracted story</label>
            <textarea id="tg-story-reviewed-text" value={revision} onChange={e=>setRevision(e.target.value)} rows={13} autoFocus />
            {error && <p className="tg-story-modal-error" role="alert">{error}</p>}
            <footer><span><Plus size={15}/> Adds to the end of your existing Story</span><button type="button" disabled={!revision.trim()} onClick={pushReviewedStory}><Check size={16}/> Push to Story</button></footer>
          </div> : <div className="tg-story-modal-failure" role="alert">
            <h3>Story extraction couldn't finish</h3>
            <p>{error || "The AI did not return a usable story draft."}</p>
            <div><button type="button" onClick={closeStoryReview}>Back to Chat</button><button type="button" onClick={composeFromChat}>Try again</button></div>
          </div>}
        </section>
      </div>}
      <div className="ff-chat-transcript" ref={scrollRef} role="log" aria-live="polite">{thread?.messages?.length?thread.messages.map(m=><div key={m.id} className={`ff-chat-message-item ${m.role==="user"?"is-user":"is-ai"}`}><article className={`ff-chat-bubble ${m.role==="user"?"is-user":"is-ai"}`}><div className="ff-chat-message-body">{renderChatText(m.content)}</div>{Array.isArray(m.attachments) && m.attachments.length > 0 && <div className="ff-chat-attachment-history" aria-label="Files sent with this message">{m.attachments.map((item,i)=><span key={`${item.name}-${i}`}><Paperclip size={12}/>{item.name}</span>)}</div>}</article><div className="ff-chat-message-actions">
          <button type="button" className={`ff-copy-action ${copiedId === m.id ? "is-copied" : ""}`} title={copiedId === m.id ? "Copied" : "Copy message"} aria-label={copiedId === m.id ? "Copied to clipboard" : "Copy message"} onClick={() => copyMessage(m.id, m.content)}>{copiedId === m.id ? <Check size={15}/> : <Copy size={15}/>}</button>
          {m.role !== "user" && <button type="button" className={`ff-like-action ${m.liked ? "is-liked" : ""}`} aria-pressed={Boolean(m.liked)} aria-label={m.liked ? "Remove like" : "Like response"} title={m.liked ? "Liked â€” click to undo" : "Like response"} onClick={() => toggleLike(m.id)}><ThumbsUp size={15}/></button>}
        </div></div>):<div className="ff-chat-welcome"><div className="ff-chat-welcome-icon"><MessageCircle size={27}/></div><h2>Your creative thinking partner</h2><p>Discuss plot, character motives, screenplay rewrites or any specific scene. Create multiple chats, continue past discussions and approve proposed edits before they reach your story.</p>{!aiConfigured&&<p className="ff-chat-offline">Connect the Flask + Gemini backend to send messages. No fake AI content is generated.</p>}</div>}{busy && <article className="ff-chat-thinking" role="status" aria-live="polite"><span className="ff-thinking-dots" aria-hidden="true"><i/><i/><i/></span><span>{thinkingMessages[thinkingIndex]}</span></article>}</div>
      {error && !reviewOpen && <p className="ff-chat-error" role="status">{error}</p>}
      <form onSubmit={send} className="ff-chat-composer">
      <div className="tg-chat-floating-actions" aria-label="Story workspace actions">
        {!userHasChatted ? <button type="button" className="tg-chat-floating-pill" disabled={busy || !aiConfigured} onClick={()=>submitMessage(FIRST_STORY_PROMPT, true)}><BookOpen size={16}/> Start First Story</button>
          : <><button type="button" className="tg-chat-floating-pill" disabled={busy || !aiConfigured} onClick={composeFromChat}><Plus size={16}/> Add to Story</button><button type="button" className="tg-chat-floating-pill tg-chat-floating-secondary" disabled={busy || !project.story?.trim()} onClick={() => submitMessage(REVIEW_SAVED_STORY_PROMPT, true)}><FileText size={16}/> Review Current Story</button></>}
      </div>
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
