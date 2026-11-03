import IOSSelect from "../ui/IOSSelect";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { aiConfigured, requestProjectAI } from "../../services/workspaceApi";
import { BookOpen, Check, Copy, Menu, MessageCircle, MoreHorizontal, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import "./ProjectAIChat.css";

const uid = () => crypto.randomUUID();
const makeThread = (title = "New conversation", target = "project") => ({ id: uid(), title, target, messages: [], createdAt: new Date().toISOString() });
const normalize = (project) => {
  if (Array.isArray(project.chatThreads)) return project.chatThreads;
  const legacy = Array.isArray(project.chatMessages) ? project.chatMessages : [];
  return legacy.length ? [{ id: "legacy-chat", title: "Previous conversation", target: "project", messages: legacy }] : [];
};
export default function ProjectAIChat({ project, onSave, onOpenStory }) {
  const location = useLocation();
  const threads = normalize(project);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState("project");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [revision, setRevision] = useState("");
  const scrollRef = useRef(null);
  const thread = threads.find(t=>t.id===activeId) || threads.find(t=>t.id===project.activeChatThreadId) || threads[0] || null;
  useEffect(()=>{ setActiveId(null); setTarget("project"); setProposal(null); setInput(""); },[project.id]);
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
    const current=thread||makeThread(content.slice(0,55),target);
    const history=Array.isArray(current.messages)?current.messages:[];
    const userMessage={id:uid(),role:"user",content,sceneId:target.startsWith("scene:")?target.slice(6):null,at:new Date().toISOString()};
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
    try {
      const data=await requestProjectAI(project.id,"chat",{
        message:content, target, sceneId:target.startsWith("scene:")?target.slice(6):null,
        language:project.language||"English", history:history.map(m=>({role:m.role,content:m.content})).slice(-24),
        context:{title:project.title,idea:project.idea,story:project.story,scenes:project.scenes,creativeDecisions:project.creativeDecisions}
      });
      const answer=typeof data?.answer==="string"?data.answer.trim():"";
      if(!answer)throw new Error("Backend returned no answer.");
      const response={id:uid(),role:"assistant",content:answer,at:new Date().toISOString()};
      // Functional update preserves edits, other chats, renames and scene changes
      // made while the backend request was in flight.
      onSave(latest => ({ ...latest, chatThreads: normalize(latest).map(t =>
        t.id === current.id ? { ...t, messages: [...(t.messages || []), response] } : t
      ) }));
      if(data?.proposedRevision && typeof data.proposedRevision.text==="string" && ["story","scene"].includes(data.proposedRevision.target)) {
        setProposal(data.proposedRevision); setRevision(data.proposedRevision.text);
      }
    } catch(err) {setError(err.message||"Request failed. Message remains in draft; retry by sending again.");}
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
      <div className="ff-chat-sidebar-head"><strong>Conversations</strong><button type="button" title="Close chat list" className="ff-chat-mobile-close" onClick={()=>setSidebarOpen(false)}><X size={17}/></button></div>
      <button className="ff-chat-new" onClick={create}><Plus size={17}/> New chat</button>
      <div className="ff-thread-list">{threads.length?threads.map(t=><div key={t.id} className={`ff-thread-row ${t.id===thread?.id?"selected":""}`}><button className="ff-thread-open" type="button" onClick={()=>switchTo(t.id)}><MessageCircle size={15}/><span>{t.title}</span></button><button title="Rename" onClick={()=>rename(t.id)}><Pencil size={14}/></button><button title="Delete" onClick={()=>remove(t.id)}><Trash2 size={14}/></button></div>):<p className="ff-chat-muted">No conversations yet. Start one whenever you're ready.</p>}</div>
      <div className="ff-chat-sidebar-foot">Conversations are stored with this project after Save Changes.</div>
    </aside>
    <div className="ff-chat-center">
      <header className="ff-chat-header"><button className="ff-chat-menu" onClick={()=>setSidebarOpen(true)} aria-label="Open conversations"><Menu size={19}/></button><div><span>PROJECT WRITING ROOM</span><strong>{thread?.title||"New conversation"}</strong></div><button className="ff-chat-storylink" type="button" onClick={onOpenStory}><BookOpen size={16}/> Story editor</button></header>
      <div className="ff-chat-target"><label>AI context<IOSSelect value={target} onChange={e=>setTarget(e.target.value)}><option value="project">Entire project</option><option value="story">Full story / rewrite</option>{(project.scenes||[]).map((s,i)=><option key={s.id} value={`scene:${s.id}`}>Scene {i+1}: {s.name||s.heading||"Untitled"}</option>)}</IOSSelect></label><span>{aiConfigured?"Backend configured":"AI backend not connected"}</span></div>
      <div className="ff-chat-transcript" ref={scrollRef} role="log" aria-live="polite">{thread?.messages?.length?thread.messages.map(m=><article key={m.id} className={`ff-chat-bubble ${m.role==="user"?"is-user":"is-ai"}`}><div className="ff-chat-who">{m.role==="user"?"You":"AI Co-Director"}<button title="Copy message" onClick={()=>navigator.clipboard?.writeText(m.content)}><Copy size={14}/></button></div><p>{m.content}</p></article>):<div className="ff-chat-welcome"><div className="ff-chat-welcome-icon"><MessageCircle size={27}/></div><h2>Your creative thinking partner</h2><p>Discuss plot, character motives, screenplay rewrites or any specific scene. Create multiple chats, continue past discussions and approve proposed edits before they reach your story.</p>{!aiConfigured&&<p className="ff-chat-offline">Connect the Flask + Gemini backend to send messages. No fake AI content is generated.</p>}</div>}</div>
      {proposal&&<div className="ff-chat-proposal"><div className="ff-chat-proposal-head"><strong>Proposed {proposal.target} revision — review before applying</strong><button onClick={()=>setProposal(null)}><X size={16}/></button></div><textarea value={revision} onChange={e=>setRevision(e.target.value)} rows={7} aria-label="Edit proposed story text"/><div><button className="ff-chat-apply" onClick={applyProposal}><Check size={17}/> Apply to draft</button><small>Not saved until you click Save Changes above.</small></div></div>}
      {error&&<p className="ff-chat-error" role="status">{error}</p>}
      <form onSubmit={send} className="ff-chat-composer"><textarea rows={3} placeholder="Ask about your story, request a rewrite, or continue the conversation..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(e);}}}/><div><span>Enter to send · Shift+Enter for a new line</span><button type="submit" disabled={!input.trim()||busy||!aiConfigured}><Send size={17}/>{busy?"Thinking...":"Send"}</button></div></form>
    </div>
  </section>;
}
