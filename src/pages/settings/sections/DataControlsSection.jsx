import { useEffect, useState } from "react";
import { getProjects, cloudSyncStatus, flushCloudProjects } from "../../../services/projectService";
import { createCloudProject, listCloudProjects } from "../../../services/cloudProjects";

const LEGACY_KEY = "frameforge_projects_v1";

export default function DataControlsSection() {
  const [status, setStatus] = useState(cloudSyncStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const refresh = () => setStatus(cloudSyncStatus());
    window.addEventListener("takegrid:projects-changed", refresh);
    return () => window.removeEventListener("takegrid:projects-changed", refresh);
  }, []);

  async function retry() {
    setBusy(true);
    setMessage("");
    try {
      await flushCloudProjects();
      const state = cloudSyncStatus();
      setFailed(Boolean(state.error));
      setMessage(state.error || (state.queued ? `${state.queued} project changes waiting to sync.` : "All queued project changes are synced."));
    } finally { setBusy(false); setStatus(cloudSyncStatus()); }
  }


  function exportProjects() {
    if (!status.signedIn) { setFailed(true); setMessage("Sign in to export your projects."); return; }
    const projects = getProjects();
    const payload = { format: "takegrid-projects-json", exportedAt: new Date().toISOString(), note: "Storyboard image binary files and authentication data are not included.", projects };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `takegrid-projects-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setFailed(false);
    setMessage("Export downloaded. It includes the projects currently loaded in this browser, not standalone storyboard images. Check pending sync status before relying on it as a complete backup.");
  }

  async function importLegacy() {
    if (busy) return;
    let projects = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
      projects = Array.isArray(parsed) ? parsed.filter((p) => p && typeof p.id === "string") : [];
    } catch { setFailed(true); setMessage("Existing browser backup is not valid JSON."); return; }
    if (!projects.length) { setMessage("No older browser projects to import."); return; }
    if (!window.confirm(`Import ${projects.length} older browser project(s) into this signed-in cloud account? Cloud duplicates will be skipped; older browser copies remain unchanged.`)) return;
    setBusy(true); setFailed(false); setMessage("Importing browser projects...");
    let copied = 0, skipped = 0, failures = 0;
    try {
      const cloud = await listCloudProjects();
      const ids = new Set((cloud.projects || []).map((p) => p.id));
      for (const project of projects) {
        if (ids.has(project.id)) { skipped++; continue; }
        try { await createCloudProject(project); copied++; ids.add(project.id); }
        catch (error) { if (error.status === 409) skipped++; else failures++; }
      }
      setFailed(failures > 0);
      setMessage(`Legacy import complete: ${copied} copied, ${skipped} already present, ${failures} failed. Reload to fetch imported projects. Browser copies unchanged.`);
    } catch (error) { setFailed(true); setMessage(error.message || "Import failed."); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 720, display: "grid", gap: 16, color: "#172A46" }}>
      <h2 style={{ margin: 0 }}>Cloud Project Sync</h2>
      <p style={{ margin: 0, lineHeight: 1.6 }}>
        Signed-in projects load from Supabase. TakeGrid saves your changes to a local account-specific cache immediately and then uploads them to your account. Unsynced changes are retried rather than discarded.
      </p>
      <p style={{ margin: 0 }} role="status">
        <strong>{status.signedIn ? (status.ready ? "Connected" : "Connecting") : "Signed out"}</strong>
        {` · ${getProjects().length} project(s) visible · ${status.queued} pending change(s)`}
        {status.syncing ? " · Syncing..." : ""}
      </p>
      {status.error && <p role="alert" style={{ color: "#ad263a", margin: 0 }}>{status.error}</p>}
      <button type="button" onClick={retry} disabled={busy || !status.signedIn || !status.ready}
        style={{width:"fit-content", border:0, borderRadius:999, padding:"13px 22px", background:"#1B93F5", color:"white", fontWeight:750}}>
        {busy ? "Please wait..." : "Retry pending cloud saves"}
      </button>
      <hr style={{ width: "100%", border: 0, borderTop: "1px solid #ddd" }} />
      <h3 style={{ margin: 0 }}>Older browser projects</h3>
      <p style={{ margin: 0, lineHeight: 1.6 }}>Older localStorage projects remain untouched. If they were not previously backed up, import them explicitly. Existing cloud projects will not be overwritten.</p>
      <button type="button" onClick={importLegacy} disabled={busy || !status.signedIn}
        style={{width:"fit-content", border: "1px solid #d5dfea", borderRadius:999, padding:"12px 20px", background:"white", color:"#172A46", fontWeight:750}}>
        Import older browser projects
      </button>

      <hr style={{ width: "100%", border: 0, borderTop: "1px solid #ddd" }} />
      <h3 style={{ margin: 0 }}>Export project data</h3>
      <p style={{ margin: 0, lineHeight: 1.6 }}>Download a JSON copy of the project records currently loaded in this signed-in browser. This is not a complete account export: authentication details and storyboard image files are not included.</p>
      <button type="button" onClick={exportProjects} disabled={!status.signedIn || busy}
        style={{width:"fit-content", border:0, borderRadius:999, padding:"12px 20px", background:"#172A46", color:"white", fontWeight:750}}>
        Export visible projects (JSON)
      </button>
      <hr style={{ width: "100%", border: 0, borderTop: "1px solid #ddd" }} />
      <h3 style={{ margin: 0 }}>Delete and manage your information</h3>
      <p style={{ margin: 0, lineHeight: 1.6 }}>Use the Projects workspace to delete individual projects. For account deletion, access, correction or other privacy requests, contact <a href="mailto:takegridai@gmail.com">takegridai@gmail.com</a>. We may request proof of account ownership. Self-service account deletion is not available in this MVP; deleting a project does not automatically delete every technical log or backup.</p>
      <p style={{ margin: 0, lineHeight: 1.6 }}>AI requests may include relevant project text sent to configured AI providers. Do not submit information you are not permitted to share. See <a href="/privacy-policy">Privacy Policy</a> and <a href="/terms">Terms &amp; Conditions</a>.</p>

      {message && <p role={failed ? "alert" : "status"} style={{margin:0, lineHeight:1.6}}>{message}</p>}
      <p style={{ margin: 0, fontSize: 13, color: "#63738C", lineHeight: 1.6 }}>
        Do not clear browser storage while any changes are pending. Concurrent editing on multiple devices is not conflict-protected yet. Storyboard images stored only on the Flask server are not transferred by project JSON sync.
      </p>
    </div>
  );
}
