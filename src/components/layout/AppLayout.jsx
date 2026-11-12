import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import BottomNavbar from "./BottomNavbar";
import "./AppLayout.css";

// TAKEGRID_ROUTE_SEO_V1: public route metadata only. Never expose private project content.
const PUBLIC_PAGE_METADATA = {
  "/": {
    title: "TAKEGRID | AI Creative Workspace for Filmmakers & Writers",
    description: "TAKEGRID is a human-first AI creative workspace for filmmakers and writers. Develop stories, plan scenes and shots, build storyboards, and refine ideas with AI."
  },
  "/studio": {
    title: "Projects & Studio | TAKEGRID",
    description: "Manage your creative projects in TAKEGRID. Write stories, organize scenes and shots, plan storyboards, and review AI-assisted creative suggestions."
  }
};

function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = PUBLIC_PAGE_METADATA[pathname];
    // Project pages are user-private workspace views, not public SEO landing pages.
    const title = page?.title || "TAKEGRID | Creative Workspace";
    const description = page?.description || "TAKEGRID helps creators plan stories, scenes, shots and storyboards with human-first AI assistance.";
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [pathname]);
  return null;
}
export default function AppLayout() {
  return (
    <div className="app-layout">
      <RouteSeo />
      <Header />
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNavbar />
    </div>
  );
}