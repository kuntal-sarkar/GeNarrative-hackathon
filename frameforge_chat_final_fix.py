"""FRAMEFORGE: focused, reversible chat layout + save fix.
Run from the frontend repository root: python frameforge_chat_final_fix.py
Only updates existing ProjectAIChat.jsx, ProjectAIChatPolish.css and ProjectWorkspace.jsx.
"""
from pathlib import Path
from datetime import datetime
import shutil
import re
import sys

ROOT = Path.cwd()
CHAT = ROOT / 'src/components/workspace/ProjectAIChat.jsx'
STYLE = ROOT / 'src/components/workspace/ProjectAIChatPolish.css'
WORKSPACE = ROOT / 'src/pages/ProjectWorkspace.jsx'
paths = [CHAT, STYLE, WORKSPACE]
missing = [p for p in paths if not p.is_file()]
if missing:
    sys.exit('Missing required files:\n' + '\n'.join(str(p) for p in missing) + '\nRun from FRAMEFORGE frontend root.')
source = {p: p.read_text(encoding='utf-8-sig') for p in paths}
chat = source[CHAT]
css = source[STYLE]
ws = source[WORKSPACE]
if 'ff-chat-header-actions' in chat or 'ff-chat-final-layout' in css:
    sys.exit('This patch appears to be installed already. No changes made.')

def replace_exact(data, old, new, title):
    hits = data.count(old)
    if hits != 1:
        raise RuntimeError(f'{title}: expected exactly one match, found {hits}. No changes made.')
    return data.replace(old, new, 1)

try:
    chat = replace_exact(chat,
        'export default function ProjectAIChat({ project, onSave, onOpenStory }) {',
        'export default function ProjectAIChat({ project, onSave, onOpenStory, onSaveConversation, canSaveConversation }) {',
        'Chat component signature')
    # Only for UI display: never overwrite scene text or IDs.
    helper = '''const cleanSceneLabel = (scene, index) => {
  const raw = scene?.name || scene?.heading || scene?.title || "Untitled";
  const text = (Array.isArray(raw) ? raw.join(" ") : String(raw))
    .replace(/[*#`]+/g, "")
    .replace(/^[\\s,;•·\\-\\d.)]+/, "")
    .replace(/\\s*[,;•·]\\s*/g, " · ")
    .replace(/\\s+/g, " ")
    .trim();
  return `Scene ${index + 1} — ${(text || "Untitled").slice(0, 52)}`;
};

// A safe, lightweight Markdown display for Gemini output (no HTML injection).
const renderInlineChatText = (value) => String(value || "").split(/(\\*\\*[^*]+\\*\\*)/g).map((part, i) =>
  part.startsWith("**") && part.endsWith("**")
    ? <strong key={i}>{part.slice(2, -2)}</strong>
    : <span key={i}>{part}</span>
);
const renderChatText = (value) => {
  const lines = String(value || "").split(/\\r?\\n/);
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
    const bullet = line.match(/^\\s*[-*•]\\s+(.+)$/);
    const numbered = line.match(/^\\s*\\d+[.)]\\s+(.+)$/);
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

'''
    chat = replace_exact(chat, 'export default function ProjectAIChat(', helper + 'export default function ProjectAIChat(', 'Insert display helpers')

    old_header = '<header className="ff-chat-header"><button className="ff-chat-menu" onClick={()=>setSidebarOpen(true)} aria-label="Open conversations"><Menu size={19}/></button><div><span>PROJECT WRITING ROOM</span><strong>{thread?.title||"New conversation"}</strong></div><button className="ff-chat-storylink" type="button" onClick={onOpenStory}><BookOpen size={16}/> Story editor</button></header>'
    new_header = '''<header className="ff-chat-header">
        <button className="ff-chat-menu" type="button" onClick={()=>setSidebarOpen(true)} aria-label="Open conversations"><Menu size={19}/></button>
        <div className="ff-chat-heading"><span>PROJECT WRITING ROOM</span><strong title={thread?.title || "New conversation"}>{thread?.title || "New conversation"}</strong></div>
        <div className="ff-chat-header-actions">
          <label className="ff-chat-context-header">
            <span className="ff-sr-only">AI context</span>
            <IOSSelect aria-label="AI context" value={target} onChange={e=>setTarget(e.target.value)}>
              <option value="project">Entire project</option>
              <option value="story">Full story</option>
              {(project.scenes || []).map((scene, i) => <option key={scene.id} value={`scene:${scene.id}`}>{cleanSceneLabel(scene, i)}</option>)}
            </IOSSelect>
          </label>
          <button className="ff-chat-storylink" type="button" onClick={onOpenStory}><BookOpen size={16}/><span>Story editor</span></button>
          <button className="ff-chat-header-save" type="button" onClick={onSaveConversation} disabled={!canSaveConversation} title="Save this conversation to your project"><Save size={16}/><span>{canSaveConversation ? "Save" : "Saved"}</span></button>
        </div>
      </header>'''
    chat = replace_exact(chat, old_header, new_header, 'Move context and Save into header')
    old_target = '<div className="ff-chat-target"><label>AI context<IOSSelect value={target} onChange={e=>setTarget(e.target.value)}><option value="project">Entire project</option><option value="story">Full story / rewrite</option>{(project.scenes||[]).map((s,i)=><option key={s.id} value={`scene:${s.id}`}>Scene {i+1}: {s.name||s.heading||"Untitled"}</option>)}</IOSSelect></label><span>{aiConfigured?"Backend configured":"AI backend not connected"}</span></div>'
    chat = replace_exact(chat, old_target, '', 'Remove extra context/status row')

    old_msg = '<div className="ff-chat-who">{m.role==="user"?"You":"AI Co-Director"}<button type="button" className={`ff-copy-action ${copiedId === m.id ? "is-copied" : ""}`} title={copiedId === m.id ? "Copied" : "Copy message"} aria-label={copiedId === m.id ? "Copied to clipboard" : "Copy message"} onClick={() => copyMessage(m.id, m.content)}>{copiedId === m.id ? <Check size={15}/> : <Copy size={15}/>}</button></div><p>{m.content}</p>'
    new_msg = '<div className="ff-chat-bubble-controls"><button type="button" className={`ff-copy-action ${copiedId === m.id ? "is-copied" : ""}`} title={copiedId === m.id ? "Copied" : "Copy message"} aria-label={copiedId === m.id ? "Copied to clipboard" : "Copy message"} onClick={() => copyMessage(m.id, m.content)}>{copiedId === m.id ? <Check size={15}/> : <Copy size={15}/>}</button></div><div className="ff-chat-message-body">{renderChatText(m.content)}</div>'
    chat = replace_exact(chat, old_msg, new_msg, 'Remove speaker labels, format message text')
    chat = replace_exact(chat, 'Plus, Send, ArrowUp, LoaderCircle', 'Plus, Save, Send, ArrowUp, LoaderCircle', 'Add Save icon')

    ws = replace_exact(ws,
        'chat: ["conversations", "chats", "chatSessions", "chatHistory"]',
        'chat: ["conversations", "chats", "chatSessions", "chatHistory", "chatThreads", "activeChatThreadId", "chatMessages"]',
        'Track draft chat fields')

    add_save_function = '''  function saveChatConversation() {
    savePartial(latest => {
      // Save the actual chatThreads used by ProjectAIChat, not just legacy chat keys.
      const keys = ["chatThreads", "activeChatThreadId", "chatMessages", "conversations", "chats", "chatSessions", "chatHistory"];
      const delta = Object.fromEntries(keys.filter(k => Object.prototype.hasOwnProperty.call(project, k)).map(k => [k, project[k]]));
      return { ...latest, ...delta };
    }, "Conversation saved");
  }

'''
    ws = replace_exact(ws, '  if (!project) return <div className="ws-empty ws-missing">', add_save_function + '  if (!project) return <div className="ws-empty ws-missing">', 'Add safe chat save handler')
    old_render = '{section === "chat" && <ProjectAIChat project={project} onSave={persist} onOpenStory={()=>navigate(`${base}/story`)}/>}'
    new_render = '{section === "chat" && <ProjectAIChat project={project} onSave={persist} onSaveConversation={saveChatConversation} canSaveConversation={draftSections.includes("chat")} onOpenStory={()=>navigate(`${base}/story`)}/>}'
    ws = replace_exact(ws, old_render, new_render, 'Pass Save button handler')
    ws = replace_exact(ws, '{["critics", "continuity", "memory", "chat"].includes(section) && dirty && <div className="ff-other-save">', '{["critics", "continuity", "memory"].includes(section) && dirty && <div className="ff-other-save">', 'Remove duplicate lower Save button for chat')

    css += '''
/* ff-chat-final-layout: one deliberate override, no additional height clamps. */
.ff-chatroom {
  height: max(680px, calc(100dvh - 105px)) !important;
  max-height: none !important;
  min-height: 0 !important;
  width: 100%;
  display: flex;
}
.ff-chatroom .ff-chat-sidebar { flex: 0 0 252px; min-width: 0; }
.ff-chatroom .ff-chat-center { flex: 1 1 0; min-width: 0; min-height: 0; }
.ff-chatroom .ff-chat-header {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  min-height: 82px;
  padding: 13px 19px;
}
.ff-chatroom .ff-chat-heading { flex: 1 1 auto; min-width: 0; }
.ff-chatroom .ff-chat-header-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex: 0 0 auto; }
.ff-chatroom .ff-chat-context-header { min-width: 0; display: block; }
.ff-chatroom .ff-chat-context-header select {
  min-width: 130px;
  width: clamp(130px, 15vw, 195px);
  max-width: 195px;
  padding: 10px 11px;
  border: 1px solid #dde4ec;
  background: #f9fafc;
  color: #172a46;
  border-radius: 12px;
  font: inherit;
  font-size: 12px;
  text-overflow: ellipsis;
}
.ff-chatroom .ff-chat-header-save {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  padding: 10px 15px;
  border: 0;
  border-radius: 12px;
  color: #172a46;
  background: #ff6b5b;
  font-weight: 750;
  font-size: 12px;
  cursor: pointer;
}
.ff-chatroom .ff-chat-header-save:disabled { opacity: .55; cursor: default; }
.ff-chatroom .ff-chat-transcript {
  flex: 1 1 0 !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow-y: auto;
  padding: 22px 24px 26px;
}
.ff-chatroom .ff-chat-bubble-controls { display: flex; justify-content: flex-end; min-height: 23px; }
.ff-chatroom .ff-chat-message-body { overflow-wrap: anywhere; font-size: 14px; line-height: 1.72; }
.ff-chatroom .ff-chat-message-body p { margin: 0 0 9px; white-space: pre-wrap; font-size: inherit; line-height: inherit; }
.ff-chatroom .ff-chat-message-body p:last-child { margin-bottom: 0; }
.ff-chatroom .ff-chat-message-body ul,
.ff-chatroom .ff-chat-message-body ol { margin: 5px 0 12px; padding-left: 22px; }
.ff-chatroom .ff-chat-message-body li { margin: 3px 0; }
.ff-chatroom .ff-chat-bubble { max-width: min(93%, 930px); }
.ff-chatroom .ff-chat-bubble.is-user { max-width: min(85%, 730px); }
.ff-chatroom .ff-chat-composer { flex: 0 0 auto; margin-top: 0; }
.ff-chatroom .ff-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
@media (max-width: 850px) {
  .ff-chatroom { height: max(560px, calc(100dvh - 105px)) !important; }
  .ff-chatroom .ff-chat-sidebar { display: none; position: absolute; flex: none; }
  .ff-chatroom .ff-chat-sidebar.open { display: flex; }
  .ff-chatroom .ff-chat-header { flex-wrap: wrap; min-height: 0; padding: 12px; gap: 8px; }
  .ff-chatroom .ff-chat-header-actions { max-width: 100%; gap: 6px; }
  .ff-chatroom .ff-chat-context-header select { width: 137px; min-width: 0; }
  .ff-chatroom .ff-chat-storylink { font-size: 12px; gap: 5px; }
  .ff-chatroom .ff-chat-storylink span { display: none; }
  .ff-chatroom .ff-chat-header-save { padding: 10px; }
  .ff-chatroom .ff-chat-header-save span { display: none; }
  .ff-chatroom .ff-chat-transcript { padding: 15px 12px 22px; }
}
@media (max-width: 500px) {
  .ff-chatroom .ff-chat-heading { flex-basis: calc(100% - 44px); }
  .ff-chatroom .ff-chat-header-actions { margin-left: auto; }
  .ff-chatroom .ff-chat-bubble { max-width: 96%; }
}
'''
except RuntimeError as e:
    sys.exit('Patch aborted safely: ' + str(e))

# Do all validation first, THEN commit, and keep a timestamped copy of every original.
backup = ROOT / f'.frameforge-chat-backup-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
backup.mkdir(exist_ok=False)
for path in paths:
    original = backup / path.relative_to(ROOT)
    original.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, original)
for path, value in [(CHAT, chat), (STYLE, css), (WORKSPACE, ws)]:
    path.write_text(value, encoding='utf-8')
print('FRAMEFORGE chat final layout updated.')
print('Backup:', backup)
print('Updated:', CHAT.relative_to(ROOT), STYLE.relative_to(ROOT), WORKSPACE.relative_to(ROOT))
print('Next: npm run build')
