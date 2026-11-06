"""FRAMEFORGE chat v5: scoped layout and scrolling refinement.
Run in the frontend root. Creates backup, edits only ProjectAIChatPolish.css.
Requires v4 CSS, and refuses unsafe/mismatched files.
"""
from pathlib import Path
from datetime import datetime
import shutil, sys
root = Path.cwd()
css_file = root / 'src/components/workspace/ProjectAIChatPolish.css'
jsx_file = root / 'src/components/workspace/ProjectAIChat.jsx'
if not css_file.is_file() or not jsx_file.is_file():
    sys.exit('Missing chat files. Run from the frontend root. No changes made.')
css = css_file.read_text(encoding='utf-8-sig')
jsx = jsx_file.read_text(encoding='utf-8-sig')
marker = '/* ff-floating-chat-v5: precise header / scroll / decoration fixes */'
if marker in css:
    sys.exit('v5 already applied. No changes made.')
if '/* ff-floating-chat-v4:' not in css or 'ff-chat-header-actions' not in jsx:
    sys.exit('Expected v4 chat files not found. No changes made. Upload current files for matching patch.')

addition = r'''

/* ff-floating-chat-v5: precise header / scroll / decoration fixes */
/* 1. Radius belongs to the outer card, inner panels and content clipping. */
.ws-main-panel:has(> .ff-chatroom) { min-width: 0; }
.ws-main-panel > .ff-chatroom {
  border-radius: 24px !important;
  overflow: hidden !important;
  isolation: isolate;
  background: #fff;
}
.ff-chatroom .ff-chat-sidebar {
  border-radius: 23px 0 0 23px !important;
  overflow: hidden !important;
}
.ff-chatroom .ff-chat-center {
  border-radius: 0 23px 23px 0 !important;
  overflow: hidden !important;
}

/* 2. Translucent, separate floating controls; do not cover message text. */
.ff-chatroom .ff-chat-header {
  top: 14px !important;
  left: 16px !important;
  right: 16px !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  pointer-events: none;
}
.ff-chatroom .ff-chat-header > *,
.ff-chatroom .ff-chat-header-actions > * { pointer-events: auto; }
.ff-chatroom .ff-chat-header-actions {
  margin-left: auto;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 9px;
}
.ff-chatroom .ff-chat-context-header select,
.ff-chatroom .ff-chat-storylink,
.ff-chatroom .ff-chat-header-save,
.ff-chatroom .ff-chat-menu {
  background: rgba(255,255,255,.73) !important;
  border: 1px solid rgba(197,210,228,.75) !important;
  border-radius: 999px !important;
  color: #172a46 !important;
  box-shadow: 0 5px 18px rgba(23,42,70,.07) !important;
  -webkit-backdrop-filter: blur(15px);
  backdrop-filter: blur(15px);
  transition: background .18s ease, transform .18s ease;
}
.ff-chatroom .ff-chat-context-header select:hover,
.ff-chatroom .ff-chat-storylink:hover,
.ff-chatroom .ff-chat-header-save:hover:not(:disabled) {
  background: rgba(255,255,255,.95) !important;
}
/* Save button stays accessible but displays the icon only. */
.ff-chatroom .ff-chat-header-save {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  flex: 0 0 42px !important;
  width: 42px !important;
  height: 42px !important;
  min-height: 42px !important;
  padding: 0 !important;
}
.ff-chatroom .ff-chat-header-save span { display: none !important; }
.ff-chatroom .ff-chat-header-save:disabled {
  opacity: .65 !important;
  cursor: default;
}

/* 3. Only transcript handles chat-wheel scrolling; outer page remains scrollable. */
html:has(.ff-chatroom),
body:has(.ff-chatroom) {
  overflow-y: auto !important;
  height: auto !important;
}
.project-workspace:has(.ff-chatroom),
.ws-workspace-grid:has(.ff-chatroom),
.ws-main-panel:has(.ff-chatroom) {
  overflow-y: visible !important;
  max-height: none !important;
}
.ff-chatroom .ff-chat-transcript {
  position: relative;
  flex: 1 1 0 !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overscroll-behavior-y: contain !important;
  /* Subtle cinematic scene/frame motif: CSS only, no image/network. */
  background-color: #fffdfb !important;
  background-image:
    radial-gradient(ellipse at 16% 17%, rgba(27,147,245,.075), transparent 38%),
    radial-gradient(ellipse at 84% 77%, rgba(255,107,91,.057), transparent 42%),
    linear-gradient(90deg, transparent 0 36px, rgba(23,42,70,.018) 36px 37px, transparent 37px),
    repeating-linear-gradient(0deg, transparent 0 74px, rgba(23,42,70,.012) 74px 75px) !important;
  background-attachment: local !important;
}
/* Keep floating controls legible; first messages stay below them. */
.ff-chatroom .ff-chat-transcript { padding-top: 88px !important; }

/* 4. Compact phone header: controls wrap instead of bunching at one edge. */
@media (max-width: 850px) {
  .ws-main-panel > .ff-chatroom { border-radius: 20px !important; }
  .ff-chatroom .ff-chat-center { border-radius: 19px !important; }
  .ff-chatroom .ff-chat-header {
    top: 10px !important;
    left: 10px !important;
    right: 10px !important;
    min-height: 38px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ff-chatroom .ff-chat-header-actions {
    flex: 1 1 auto;
    min-width: 0;
    width: auto;
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    justify-content: flex-end;
    gap: 5px;
  }
  .ff-chatroom .ff-chat-context-header { min-width: 0; flex: 0 1 136px; }
  .ff-chatroom .ff-chat-context-header select { width: 100% !important; max-width: 136px; }
  .ff-chatroom .ff-chat-storylink,
  .ff-chatroom .ff-chat-header-save { flex: 0 0 38px !important; width: 38px !important; height: 38px !important; min-height: 38px !important; }
  .ff-chatroom .ff-chat-transcript { padding-top: 79px !important; }
}
@media (max-width: 380px) {
  .ff-chatroom .ff-chat-context-header { flex-basis: 108px; }
  .ff-chatroom .ff-chat-context-header select { max-width: 108px; font-size: 10px; }
  .ff-chatroom .ff-chat-storylink,
  .ff-chatroom .ff-chat-header-save { flex-basis: 35px !important; width: 35px !important; height: 35px !important; min-height: 35px !important; }
}
'''
new_css = css.rstrip() + '\n' + addition
backup = root / ('.frameforge-chat-v5-backup-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
backup.mkdir(parents=True, exist_ok=False)
shutil.copy2(css_file, backup / css_file.name)
try:
    css_file.write_text(new_css, encoding='utf-8')
except Exception:
    shutil.copy2(backup / css_file.name, css_file)
    raise
print('FRAMEFORGE Chat v5 CSS patch applied.')
print('Backup:', backup)
print('Updated:', css_file.relative_to(root))
print('Next: npm run build')
