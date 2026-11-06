"""FRAMEFORGE Chat v4: make workspace chat/sidebar equal height, responsive pills,
restore document scrolling, and remove redundant title chip. Safe, scoped patch.
Run from the frameforge-frontend root using Python.
"""
from pathlib import Path
from datetime import datetime
import shutil
import sys

root = Path.cwd()
jsx_path = root / 'src/components/workspace/ProjectAIChat.jsx'
css_path = root / 'src/components/workspace/ProjectAIChatPolish.css'
for path in (jsx_path, css_path):
    if not path.exists():
        sys.exit(f'Missing file: {path}. Run inside frameforge-frontend.')
jsx = jsx_path.read_text(encoding='utf-8-sig')
css = css_path.read_text(encoding='utf-8-sig')
if 'ff-floating-chat-v4' in css:
    sys.exit('v4 patch already applied. No files changed.')
if '/* ff-floating-chat-v3:' not in css:
    sys.exit('Expected v3 chat CSS not found. No files changed; upload current CSS for an exact patch.')
heading = '<div className="ff-chat-heading"><strong title={thread?.title || "New conversation"}>{thread?.title || "New conversation"}</strong></div>'
if jsx.count(heading) != 1:
    sys.exit(f'Expected exactly one title pill; found {jsx.count(heading)}. No files changed.')

# Remove previous v3 overrides instead of piling up more conflicting rules.
css = css.split('/* ff-floating-chat-v3:', 1)[0].rstrip()
jsx = jsx.replace(heading, '', 1)
css += r'''

/* ff-floating-chat-v4: scoped responsive chat layout; overrides v2. */
/* Match the actual project-tools column through CSS Grid, not viewport guessing. */
.ws-workspace-grid:has(.ff-chatroom) {
  align-items: stretch;
}
.ws-workspace-grid:has(.ff-chatroom) > .ws-local-nav {
  align-self: stretch;
}
.ws-main-panel:has(> .ff-chatroom) {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.ws-main-panel > .ff-chatroom {
  flex: 1 1 auto;
}
.ff-chatroom {
  position: relative;
  display: flex !important;
  height: 100% !important;
  min-height: 665px !important;
  max-height: none !important;
  overflow: hidden;
  border-radius: 23px !important;
  isolation: isolate;
}
.ff-chatroom .ff-chat-sidebar {
  flex: 0 0 240px;
  overflow: hidden;
  border-radius: 22px 0 0 22px;
}
.ff-chatroom .ff-chat-center {
  flex: 1 1 0;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-radius: 0 22px 22px 0;
  isolation: isolate;
}
/* Three separate translucent floating buttons. No fourth title chip. */
.ff-chatroom .ff-chat-header {
  position: absolute;
  top: 14px;
  left: 15px;
  right: 15px;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: auto;
  min-height: 42px;
  padding: 0;
  margin: 0;
  gap: 8px;
  background: transparent;
  border: 0;
  box-shadow: none;
  pointer-events: none;
}
.ff-chatroom .ff-chat-header > * { pointer-events: auto; }
.ff-chatroom .ff-chat-header-actions {
  display: flex;
  width: auto;
  min-width: 0;
  flex: 0 1 auto;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
  gap: 9px;
}
.ff-chatroom .ff-chat-context-header { min-width: 0; flex: 0 1 auto; }
.ff-chatroom .ff-chat-context-header select,
.ff-chatroom .ff-chat-storylink,
.ff-chatroom .ff-chat-header-save {
  border-radius: 999px;
  border: 1px solid rgba(196,210,225,.75);
  background: rgba(250,252,255,.79);
  color: #172a46;
  box-shadow: 0 5px 20px rgba(23,42,70,.06);
  -webkit-backdrop-filter: blur(13px);
  backdrop-filter: blur(13px);
  min-height: 42px;
}
.ff-chatroom .ff-chat-context-header select {
  width: clamp(125px, 13vw, 185px);
  height: 42px;
  padding: 8px 12px;
  font-size: 12px;
  text-overflow: ellipsis;
}
.ff-chatroom .ff-chat-storylink,
.ff-chatroom .ff-chat-header-save { padding: 9px 13px; }
.ff-chatroom .ff-chat-header-save:not(:disabled) {
  background: rgba(255,107,91,.85);
  border-color: rgba(255,107,91,.55);
}
.ff-chatroom .ff-chat-header-save:disabled {
  background: rgba(250,252,255,.79);
  color: #64748b;
  opacity: 1;
}
/* Keep the header and composer over the transcript without clipping messages. */
.ff-chatroom .ff-chat-transcript {
  display: flex;
  flex: 1 1 0 !important;
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: auto !important;
  padding: 78px 24px 116px !important;
  background-color: #fff;
  background-image:
    radial-gradient(circle at 7% 18%,rgba(27,147,245,.045),transparent 29%),
    radial-gradient(circle at 91% 76%,rgba(255,107,91,.045),transparent 30%);
}
.ff-chatroom .ff-thread-list { overscroll-behavior-y: auto !important; }
.ff-chatroom .ff-chat-composer {
  position: absolute;
  z-index: 7;
  bottom: 15px;
  left: 18px;
  right: 18px;
  width: auto;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}
.ff-chatroom .ff-chat-compose-shell {
  margin: 0;
  border-radius: 32px;
  border-color: rgba(196,211,228,.75);
  background: rgba(249,252,255,.84);
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 28px rgba(23,42,70,.11);
}
/* A chat-specific page must not lock outer document scrolling. */
html:has(.ff-chatroom), body:has(.ff-chatroom) { overflow-y: auto !important; }
@media (max-width: 850px) {
  .ws-workspace-grid:has(.ff-chatroom) { align-items: start; }
  .ws-main-panel:has(> .ff-chatroom) { display: block; }
  .ff-chatroom {
    height: min(72dvh, 660px) !important;
    min-height: 420px !important;
    max-height: none !important;
    border-radius: 19px !important;
  }
  .ff-chatroom .ff-chat-sidebar { display: none; position: absolute; width: min(270px,85%); z-index: 9; border-radius: 18px 0 0 18px; }
  .ff-chatroom .ff-chat-sidebar.open { display: flex; }
  .ff-chatroom .ff-chat-center { border-radius: 18px; }
  .ff-chatroom .ff-chat-header {
    top: 10px; left: 10px; right: 10px;
    display: flex; flex-wrap: nowrap;
    min-height: 40px; gap: 6px;
  }
  .ff-chatroom .ff-chat-menu {
    display: inline-flex; flex: 0 0 36px;
    align-items: center; justify-content: center;
    width: 36px; height: 36px;
    border: 1px solid rgba(196,210,225,.75);
    border-radius: 50%; background: rgba(250,252,255,.85);
    backdrop-filter: blur(12px);
  }
  .ff-chatroom .ff-chat-header-actions {
    display: flex; justify-content: flex-end;
    flex: 1 1 auto; gap: 6px; min-width: 0;
    margin-left: 0; width: auto;
  }
  .ff-chatroom .ff-chat-context-header select { width: 126px; max-width: 100%; height: 38px; min-height: 38px; font-size: 11px; padding: 6px 10px; }
  .ff-chatroom .ff-chat-storylink, .ff-chatroom .ff-chat-header-save {
    display: inline-flex; flex: 0 0 38px; width: 38px; height: 38px;
    min-height: 38px; padding: 0; border-radius: 50%;
  }
  .ff-chatroom .ff-chat-storylink span, .ff-chatroom .ff-chat-header-save span { display: none; }
  .ff-chatroom .ff-chat-transcript { padding: 76px 13px 110px !important; }
  .ff-chatroom .ff-chat-composer { bottom: 10px; left: 10px; right: 10px; }
}
@media (max-width: 380px) {
  .ff-chatroom .ff-chat-header { left: 7px; right: 7px; gap: 4px; }
  .ff-chatroom .ff-chat-header-actions { gap: 4px; }
  .ff-chatroom .ff-chat-context-header select { width: 112px; font-size: 10px; }
  .ff-chatroom .ff-chat-storylink, .ff-chatroom .ff-chat-header-save { flex-basis: 34px; width: 34px; height: 34px; min-height: 34px; }
  .ff-chatroom .ff-chat-transcript { padding-top: 71px !important; }
}
'''

backup = root / ('.frameforge-chat-v4-backup-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
if backup.exists():
    sys.exit('Backup folder collision. No files changed.')
try:
    for p in (jsx_path, css_path):
        dst = backup / p.relative_to(root)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, dst)
    jsx_path.write_text(jsx, encoding='utf-8')
    css_path.write_text(css, encoding='utf-8')
except Exception:
    for p in (jsx_path, css_path):
        saved = backup / p.relative_to(root)
        if saved.exists():
            shutil.copy2(saved, p)
    raise
print('FRAMEFORGE v4 responsive chat patch applied.')
print('Backup:', backup)
print('Updated:', jsx_path.relative_to(root), css_path.relative_to(root))
print('Next: npm run build')
