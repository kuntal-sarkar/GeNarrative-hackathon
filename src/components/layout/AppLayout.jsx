import { Outlet, useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import BottomNavbar from "./BottomNavbar";
import "./AppLayout.css";
import "../../pages/settings/LegalContent.css";

// TAKEGRID_ROUTE_SEO_V1: public route metadata only. Never expose private project content.
const PUBLIC_PAGE_METADATA = {
  "/": {
    title: "TAKEGRID | AI Creative Workspace for Filmmakers & Writers",
    description: "TAKEGRID is a human-first AI creative workspace for filmmakers and writers. Develop stories, plan scenes and shots, build storyboards, and refine ideas with AI."
  },
  "/privacy-policy": {title: "Privacy Policy | TakeGrid", description: "Learn how TakeGrid handles account and creative project information."},
  "/terms": {title: "Terms & Conditions | TakeGrid", description: "Read the terms for using TakeGrid, an AI-powered creative workspace."},
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
  const { pathname } = useLocation();
  const legalPage = pathname === "/privacy-policy" || pathname === "/terms";
  const hideRecoveryChrome = pathname === '/forgot-password' || pathname === '/reset-password' || legalPage;
  return (
    <div className="app-layout">
      <RouteSeo />
      {!hideRecoveryChrome && <Header />}
      <main className="app-content">
        <Outlet />
      </main>
      {pathname === "/" && <footer className="tg-public-legal-footer" style={{background:"#FFF4DC"}}><Link to="/privacy-policy">Privacy Policy</Link><Link to="/terms">Terms & Conditions</Link><a href="mailto:takegridai@gmail.com">Contact</a></footer>}
      {!hideRecoveryChrome && <BottomNavbar />}
    </div>
  );
}