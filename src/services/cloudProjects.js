import { supabase } from "./supabaseClient";

const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function request(path = "", options = {}) {
  if (!supabase) throw new Error("Supabase Auth not configured.");
  if (!BASE) throw new Error("Set VITE_API_BASE_URL to your Flask backend.");
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error("Sign in first.");
  const response = await fetch(`${BASE}/api/user/projects${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const issue = new Error(payload.error || `Cloud project request failed (${response.status}).`);
    issue.status = response.status;
    throw issue;
  }
  return payload;
}

export const listCloudProjects = () => request();
export const getCloudProject = (id) => request(`/${encodeURIComponent(id)}`);
export const createCloudProject = (project) => request("", { method: "POST", body: JSON.stringify(project) });
export const updateCloudProject = (project) => request(`/${encodeURIComponent(project.id)}`, { method: "PUT", body: JSON.stringify(project) });
export const deleteCloudProject = (id) => request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
