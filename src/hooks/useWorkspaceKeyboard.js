import { useEffect, useRef } from "react";

/**
 * Keyboard-only improvements for the current project workspace.
 * Ctrl/Cmd+S targets the editor containing keyboard focus; unrelated drafts
 * are never saved by this shortcut. Existing Save buttons remain the source
 * of truth (including their disabled and validation state).
 */
export default function useWorkspaceKeyboard({ workspaceRef, leaveDialogRef, showLeaveDialog, stayInProject }) {
  const restoreFocusRef = useRef(null);
  const stayRef = useRef(stayInProject);
  stayRef.current = stayInProject;

  useEffect(() => {
    function onKeyDown(event) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== "s") return;
      if (showLeaveDialog || event.repeat) return;
      const root = workspaceRef.current;
      const active = document.activeElement;
      if (!root || !active || !root.contains(active)) return;
      if (active.closest('[role="dialog"], [role="alertdialog"], .ff-char__ai')) return;

      const path = window.location.pathname;
      let saveButton = null;
      if (/\/story\/?$/.test(path)) {
        // Match the focused field to the same individual Save already used by the UI.
        const field = active.closest(".ws-field");
        if (field?.querySelector("textarea.ff-story-text") || active.matches("textarea.ff-story-text")) {
          saveButton = root.querySelector(".ff-story-footer .ws-small-primary");
        } else if (field || active.closest(".ff-locked-details")) {
          saveButton = root.querySelector(".ff-inline-save .ws-small-primary");
        }
      } else if (/\/characters\/?$/.test(path)) {
        if (active.closest(".ff-char__form")) saveButton = root.querySelector(".ff-char__footer .ff-char__save");
      } else if (/\/scenes\/?$/.test(path)) {
        saveButton = active.closest(".ff-scene-card")?.querySelector(".ff-card-footer .ws-small-primary");
      } else if (/\/shots\/?$/.test(path)) {
        saveButton = active.closest(".ff-shot-card")?.querySelector(".ff-card-footer .ws-small-primary");
      } else if (/\/(critics|continuity|memory|chat)\/?$/.test(path)) {
        // One existing section-level Save, only while the section editor has focus.
        if (active.closest(".ws-main-panel")) saveButton = root.querySelector(".ff-other-save .ws-small-primary");
      }
      if (!saveButton || saveButton.disabled) return;
      event.preventDefault();
      saveButton.click();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [workspaceRef, showLeaveDialog]);

  useEffect(() => {
    if (!showLeaveDialog) return undefined;
    const dialog = leaveDialogRef.current;
    if (!dialog) return undefined;
    restoreFocusRef.current = document.activeElement;
    const focusable = () => [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(el => el.getClientRects().length > 0);
    const first = focusable()[0];
    (first || dialog).focus();
    function keydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        stayRef.current();
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) { event.preventDefault(); dialog.focus(); return; }
      const start = nodes[0], end = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === start || !dialog.contains(document.activeElement))) {
        event.preventDefault(); end.focus();
      } else if (!event.shiftKey && (document.activeElement === end || !dialog.contains(document.activeElement))) {
        event.preventDefault(); start.focus();
      }
    }
    document.addEventListener("keydown", keydown, true);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      const previous = restoreFocusRef.current;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [showLeaveDialog, leaveDialogRef]);
}
