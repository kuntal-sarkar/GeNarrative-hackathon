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
  { path: "/studio", element: <Studio /> },
  { path: "/projects/:projectId", element: <ProjectWorkspace /> },
  { path: "/projects/:projectId/:section", element: <ProjectWorkspace /> },
  { path: "/critics", element: <Critics /> },
  { path: "/memory", element: <Memory /> },
  { path: "/settings", element: <Settings /> },
  { path: "*", element: <NotFound /> }
]}]);

export default function App() { return <RouterProvider router={router} />; }
