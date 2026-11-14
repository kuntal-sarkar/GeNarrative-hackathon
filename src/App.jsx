// TAKEGRID_PASSWORD_RECOVERY_V1
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, useState } from "react";
import { activateCloudProjects, deactivateCloudProjects } from "./services/projectService";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import Critics from "./pages/Critics";
import Memory from "./pages/Memory";
import Settings from "./pages/Settings";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import NotFound from "./pages/NotFound";

// Data router supports useBlocker for protecting unsaved workspace edits.
const router = createBrowserRouter([{ element: <AppLayout />, children: [
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Login signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/studio", element: <ProtectedRoute><Studio /></ProtectedRoute> },
  { path: "/projects/:projectId", element: <ProtectedRoute><ProjectWorkspace /></ProtectedRoute> },
  { path: "/projects/:projectId/:section", element: <ProtectedRoute><ProjectWorkspace /></ProtectedRoute> },
  { path: "/critics", element: <ProtectedRoute><Critics /></ProtectedRoute> },
  { path: "/memory", element: <ProtectedRoute><Memory /></ProtectedRoute> },
  { path: "/settings", element: <ProtectedRoute><Settings /></ProtectedRoute> },
  { path: "*", element: <NotFound /> }
]}]);

function ReadyRouter() {
  const { user, loading } = useAuth();
  const [state, setState] = useState({ owner: null, ready: false, error: "" });
  const [retry, setRetry] = useState(0);
  const owner = user?.id || null;

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    setState({ owner, ready: false, error: "" });
    if (!owner) {
      deactivateCloudProjects();
      setState({ owner: null, ready: true, error: "" });
      return;
    }
    activateCloudProjects(owner)
      .then(() => { if (!cancelled) setState({ owner, ready: true, error: "" }); })
      .catch((error) => {
        if (!cancelled) setState({ owner, ready: false, error: error.message || "Could not load projects." });
      });
    return () => { cancelled = true; };
  }, [owner, loading, retry]);

  if (loading || state.owner !== owner || !state.ready) {
    return <main role="status" className="tg-auth-loading" style={{display:"grid", gap:16, padding:24}}>
      {state.owner === owner && state.error ? (
        <div style={{maxWidth:500, textAlign:"center"}}>
          <p>Cloud projects couldn't be loaded. Your browser data has not been deleted.</p>
          <p role="alert">{state.error}</p>
          <button type="button" onClick={() => setRetry((v) => v + 1)}>Retry cloud connection</button>
        </div>
      ) : "Loading your workspace..."}
    </main>;
  }
  return <RouterProvider router={router} />;
}
export default function App() { return <AuthProvider><ReadyRouter /></AuthProvider>; }
