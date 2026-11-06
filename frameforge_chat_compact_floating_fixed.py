"""FRAMEFORGE chat UI: compact floating toolbar, full chat space, safe feedback.
Run in frontend root: python frameforge_chat_compact_floating.py
Matches the prior frameforge_chat_final_fix.py patch, makes backups.
"""
from pathlib import Path
from datetime import datetime
import shutil, sys, re
root=Path.cwd()
chatpath=root/'src/components/workspace/ProjectAIChat.jsx'
csspath=root/'src/components/workspace/ProjectAIChatPolish.css'
for p in (chatpath,csspath):
    if not p.exists(): sys.exit(f'Missing {p}. Run from frontend root.')
chat=chatpath.read_text(encoding='utf-8-sig')
css=csspath.read_text(encoding='utf-8-sig')
if 'ff-floating-chat-v2' in css: sys.exit('Already installed; no changes made.')

def replace(old,new,label):
    global chat
    hits=chat.count(old)
    if hits!=1: raise ValueError(f'{label}: expected 1 match, found {hits}. No files changed.')
    chat=chat.replace(old,new,1)
try:
    replace('Plus, Save, Send, ArrowUp, LoaderCircle', 'Plus, Save, Send, ArrowUp, LoaderCircle, ThumbsUp', 'icon import')
    replace('  const [copiedId, setCopiedId] = useState(null);', '''  const [copiedId, setCopiedId] = useState(null);
  function toggleLike(messageId) {
    // Feedback lives in the existing chat draft, persisted only via explicit Save.
    onSave(latest => ({...latest, chatThreads: normalize(latest).map(t => ({...t,
      messages: (t.messages || []).map(m => m.id === messageId
        ? {...m, liked: !Boolean(m.liked)} : m)
    }))}));
  }''', 'feedback handler')
    replace('<div className="ff-chat-sidebar-head"><strong>Conversations</strong>', '<div className="ff-chat-sidebar-head"><div><small className="ff-chat-sidebar-eyebrow">PROJECT WRITING ROOM</small><strong>Conversations</strong></div>', 'heading to sidebar')
    replace('<div className="ff-chat-sidebar-foot">Conversations are stored with this project after Save Changes.</div>', '<div className="ff-chat-sidebar-foot">Enter to send · Shift+Enter for a new line. Save to keep conversations.</div>', 'move input hint')
    replace('<div className="ff-chat-heading"><span>PROJECT WRITING ROOM</span><strong title={thread?.title || "New conversation"}>{thread?.title || "New conversation"}</strong></div>', '<div className="ff-chat-heading"><strong title={thread?.title || "New conversation"}>{thread?.title || "New conversation"}</strong></div>', 'compact heading')
    replace('<div className="ff-chat-header-actions">', '<div className="ff-chat-header-actions" aria-label="Chat toolbar">', 'toolbar accessibility')
    replace('<button className="ff-chat-header-save" type="button" onClick={onSaveConversation} disabled={!canSaveConversation} title="Save this conversation to your project"><Save size={16}/><span>{canSaveConversation ? "Save" : "Saved"}</span></button>', '<button className="ff-chat-header-save" type="button" onClick={onSaveConversation} disabled={!canSaveConversation} title={canSaveConversation ? "Save conversation" : "Conversation saved"} aria-label={canSaveConversation ? "Save conversation" : "Conversation saved"}><Save size={16}/><span>{canSaveConversation ? "Save" : "Saved"}</span></button>', 'save button label')
    # Move actions below each bubble while retaining same copied-state feedback.
    old_start='thread.messages.map(m=><article key={m.id} className={`ff-chat-bubble ${m.role==="user"?"is-user":"is-ai"}`}>'
    new_start='thread.messages.map(m=><div key={m.id} className={`ff-chat-message-item ${m.role==="user"?"is-user":"is-ai"}`}><article className={`ff-chat-bubble ${m.role==="user"?"is-user":"is-ai"}`}>'
    replace(old_start,new_start,'message wrapper')
    old_control='<div className="ff-chat-bubble-controls"><button type="button" className={`ff-copy-action ${copiedId === m.id ? "is-copied" : ""}`} title={copiedId === m.id ? "Copied" : "Copy message"} aria-label={copiedId === m.id ? "Copied to clipboard" : "Copy message"} onClick={() => copyMessage(m.id, m.content)}>{copiedId === m.id ? <Check size={15}/> : <Copy size={15}/>}</button></div>'
    replace(old_control,'', 'remove inner copy')
    old_end='</div>}</article>):<div className="ff-chat-welcome">'
    new_end='''</div>}</article><div className="ff-chat-message-actions">
          <button type="button" className={`ff-copy-action ${copiedId === m.id ? "is-copied" : ""}`} title={copiedId === m.id ? "Copied" : "Copy message"} aria-label={copiedId === m.id ? "Copied to clipboard" : "Copy message"} onClick={() => copyMessage(m.id, m.content)}>{copiedId === m.id ? <Check size={15}/> : <Copy size={15}/>}</button>
          {m.role !== "user" && <button type="button" className={`ff-like-action ${m.liked ? "is-liked" : ""}`} aria-pressed={Boolean(m.liked)} aria-label={m.liked ? "Remove like" : "Like response"} title={m.liked ? "Liked — click to undo" : "Like response"} onClick={() => toggleLike(m.id)}><ThumbsUp size={15}/></button>}
        </div></div>):<div className="ff-chat-welcome">'''
    replace(old_end,new_end,'below-bubble action bar')
    replace('rows={1} placeholder="Ask your AI Co-Director anything..." aria-label="Write a message"', 'rows={1} placeholder="Message AI Co-Director..." title="Enter to send · Shift+Enter for a new line" aria-label="Write a message"', 'composer placeholder')
    # Prior releases may encode the middle dot differently or omit the hint.
    # Remove only this dedicated, one-line JSX element when it is present.
    chat, hint_matches = re.subn(r'(?m)^[ \t]*<div className="ff-chat-compose-hint">[^\n]*</div>\r?\n', '', chat)
    if hint_matches > 1:
        raise ValueError(f'remove composer hint: expected at most 1 match, found {hint_matches}. No files changed.')
except ValueError as e:
    sys.exit(f'Patch not applied: {e}')
# Replace only the previously appended final-layout section, retaining earlier styles.
marker='/* ff-chat-final-layout: one deliberate override, no additional height clamps. */'
if css.count(marker)!=1: sys.exit('Expected previous final layout not found. No changes made.')
css=css.split(marker,1)[0].rstrip()+'''\n\n/* ff-floating-chat-v2: compact viewport-safe chat layout */
.ff-chatroom {
  display: flex !important;
  width: 100%;
  height: clamp(450px, calc(100dvh - 265px), 710px) !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: hidden;
  position: relative;
  border-radius: 22px;
}
.ff-chatroom .ff-chat-sidebar { flex: 0 0 240px; min-height: 0; overflow: hidden; }
.ff-chatroom .ff-chat-sidebar-head { padding: 15px 16px 7px; }
.ff-chatroom .ff-chat-sidebar-head > div { display: grid; gap: 4px; }
.ff-chatroom .ff-chat-sidebar-eyebrow { font-size: 9px; font-weight: 750; letter-spacing: .12em; color: #ff6b5b; }
.ff-chatroom .ff-chat-center { flex: 1 1 0; height: 100%; min-width: 0; min-height: 0; overflow: hidden; }
.ff-chatroom .ff-chat-header {
  min-height: 0;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  padding: 10px 17px;
  background: rgba(255,255,255,.92);
  border-bottom: 1px solid rgba(221,228,236,.55);
}
.ff-chatroom .ff-chat-heading { flex: 1 1 auto; min-width: 80px; }
.ff-chatroom .ff-chat-heading strong { font-size: 14px; font-weight: 720; }
.ff-chatroom .ff-chat-header-actions { display: flex; flex: 0 0 auto; gap: 8px; align-items: center; min-width: 0; }
.ff-chatroom .ff-chat-context-header { display: block; flex: 0 1 auto; min-width: 0; }
.ff-chatroom .ff-chat-context-header select {
  width: clamp(128px, 14vw, 183px);
  max-width: 183px;
  min-width: 0;
  font-size: 12px;
  color: #172a46;
  background: rgba(245,248,252,.85);
  border: 1px solid rgba(198,210,224,.8);
  border-radius: 999px;
  padding: 10px 12px;
  text-overflow: ellipsis;
  box-shadow: 0 4px 16px rgba(23,42,70,.035);
}
.ff-chatroom .ff-chat-storylink,
.ff-chatroom .ff-chat-header-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 39px;
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  border: 1px solid rgba(198,210,224,.75);
  background: rgba(249,250,252,.86);
  color: #172a46;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(23,42,70,.035);
  cursor: pointer;
}
.ff-chatroom .ff-chat-header-save { background: rgba(255,107,91,.92); border-color: rgba(255,107,91,.6); }
.ff-chatroom .ff-chat-header-save:disabled { background: rgba(244,246,249,.9); color: #83909d; opacity: 1; cursor: default; }
.ff-chatroom .ff-chat-transcript {
  position: relative;
  display: flex;
  flex: 1 1 0 !important;
  flex-direction: column;
  gap: 16px;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 20px 24px 32px;
  background-color: #fff;
  background-image:
    radial-gradient(circle at 8% 18%, rgba(27,147,245,.045), transparent 28%),
    radial-gradient(circle at 92% 80%, rgba(255,107,91,.052), transparent 32%),
    linear-gradient(transparent 98%, rgba(23,42,70,.018) 100%);
  background-size: auto, auto, 100% 46px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
.ff-chatroom .ff-chat-message-item { display: flex; flex-direction: column; gap: 5px; flex: 0 0 auto; max-width: min(94%, 950px); align-self: flex-start; min-width: 0; }
.ff-chatroom .ff-chat-message-item.is-user { align-self: flex-end; max-width: min(83%, 730px); align-items: flex-end; }
.ff-chatroom .ff-chat-bubble { max-width: 100%; width: fit-content; padding: 13px 17px; border-radius: 19px; }
.ff-chatroom .ff-chat-bubble.is-ai { background: rgba(244,246,250,.91); }
.ff-chatroom .ff-chat-bubble.is-user { background: rgba(233,244,253,.92); }
.ff-chatroom .ff-chat-message-body { font-size: 14px; line-height: 1.72; overflow-wrap: anywhere; }
.ff-chatroom .ff-chat-message-body p { margin: 0 0 9px; white-space: pre-wrap; font-size: inherit; line-height: inherit; }
.ff-chatroom .ff-chat-message-body p:last-child { margin-bottom: 0; }
.ff-chatroom .ff-chat-message-body ul,
.ff-chatroom .ff-chat-message-body ol { margin: 5px 0 10px; padding-left: 22px; }
.ff-chatroom .ff-chat-message-body li { margin: 3px 0; }
.ff-chatroom .ff-chat-message-actions { display: flex; align-items: center; gap: 2px; padding: 0 6px; }
.ff-chatroom .ff-chat-message-actions button { display: inline-flex; justify-content: center; align-items: center; width: 28px; height: 28px; padding: 0; background: transparent; border: 0; color: #8190a4; border-radius: 9px; cursor: pointer; transition: color 150ms, background 150ms, transform 150ms; }
.ff-chatroom .ff-chat-message-actions button:hover { color: #172a46; background: #eaf0f7; transform: translateY(-2px); }
.ff-chatroom .ff-chat-message-actions button.is-liked { color: #1b93f5; background: #e7f3ff; }
.ff-chatroom .ff-chat-message-actions button.is-copied { color: #21866b; background: #e0f6ec; animation: ff-chat-pop 220ms ease-out; }
.ff-chatroom .ff-chat-composer {
  flex: 0 0 auto;
  margin: 0;
  padding: 12px 18px 15px;
  background: rgba(255,255,255,.85);
  border-top: 1px solid rgba(227,233,241,.65);
  backdrop-filter: blur(14px);
}
.ff-chatroom .ff-chat-compose-shell {
  margin-top: 0;
  border-radius: 30px;
  border-color: rgba(204,215,228,.74);
  background: rgba(247,249,252,.74);
  box-shadow: 0 9px 28px rgba(23,42,70,.085);
  backdrop-filter: blur(12px);
}
.ff-chatroom .ff-chat-compose-shell:focus-within { background: rgba(255,255,255,.94); }
.ff-chatroom .ff-chat-compose-hint { display: none !important; }
.ff-chatroom .ff-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
@media (max-width: 850px) {
  .ff-chatroom { height: clamp(430px, calc(100dvh - 195px), 690px) !important; }
  .ff-chatroom .ff-chat-sidebar { display: none; position: absolute; flex: none; z-index: 5; width: min(270px,85%); }
  .ff-chatroom .ff-chat-sidebar.open { display: flex; }
  .ff-chatroom .ff-chat-header { flex-wrap: wrap; padding: 10px; }
  .ff-chatroom .ff-chat-header-actions { margin-left: auto; gap: 5px; }
  .ff-chatroom .ff-chat-context-header select { width: 130px; }
  .ff-chatroom .ff-chat-storylink span, .ff-chatroom .ff-chat-header-save span { display: none; }
  .ff-chatroom .ff-chat-storylink, .ff-chatroom .ff-chat-header-save { padding: 8px 10px; min-height: 36px; }
  .ff-chatroom .ff-chat-transcript { padding: 13px 12px 24px; }
  .ff-chatroom .ff-chat-bubble { max-width: 100%; }
  .ff-chatroom .ff-chat-composer { padding: 10px 11px 13px; }
}
@media (max-width: 480px) {
  .ff-chatroom .ff-chat-heading { flex-basis: calc(100% - 50px); }
  .ff-chatroom .ff-chat-header-actions { width: 100%; justify-content: flex-end; }
  .ff-chatroom .ff-chat-message-item { max-width: 96%; }
  .ff-chatroom .ff-chat-message-item.is-user { max-width: 91%; }
}
@media (prefers-reduced-motion: reduce) {
  .ff-chatroom .ff-chat-message-actions button { transition: none; }
  .ff-chatroom .ff-chat-message-actions button.is-copied { animation: none; }
}
'''
backup=root/f'.frameforge-chat-backup-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
backup.mkdir(exist_ok=False)
for p in (chatpath,csspath):
    dst=backup/p.relative_to(root)
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(p,dst)
try:
    chatpath.write_text(chat,encoding='utf-8')
    csspath.write_text(css,encoding='utf-8')
except Exception:
    for p in (chatpath,csspath): shutil.copy2(backup/p.relative_to(root),p)
    raise
print('FRAMEFORGE compact floating chat patch applied.')
print('Backup:',backup)
print('Updated:',chatpath.relative_to(root),csspath.relative_to(root))
print('Run: npm run build')
