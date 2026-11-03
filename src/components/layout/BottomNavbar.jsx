import { NavLink, useLocation } from "react-router-dom";
import { Home, Clapperboard, MessagesSquare, Brain } from "lucide-react";
import "./BottomNavbar.css";
import "./NavigationMotion.css";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/studio", label: "Studio", icon: Clapperboard },
  { to: "/critics", label: "Critics", icon: MessagesSquare },
  { to: "/memory", label: "Memory", icon: Brain },
  { to: "/settings", label: "Settings", icon: null },
];
function SettingsSymbol(){
  return <svg className="ff-sliders-symbol" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M5 3v18M12 3v18M19 3v18"/><circle cx="5" cy="8" r="3" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="3" fill="currentColor" stroke="none"/><circle cx="19" cy="9" r="3" fill="currentColor" stroke="none"/>
  </svg>;
}
export default function BottomNavbar(){
  const { pathname } = useLocation();
  const active = (path) => path === "/studio"
    ? pathname === "/studio" || pathname.startsWith("/projects/")
    : path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
  const index = Math.max(0, links.findIndex(link => active(link.to)));
  const item = ({to,label,icon:Icon}) => (
    <NavLink key={to} to={to} end={to === "/"} aria-label={label} title={label}
      aria-current={active(to) ? "page" : undefined}
      className={`nav-item${active(to) ? " nav-item-active" : ""}`}>
      {Icon ? <Icon size={21} strokeWidth={2} aria-hidden="true"/> : <SettingsSymbol/>}
      <span className="nav-label">{label}</span>
    </NavLink>
  );
  return <nav className="bottom-navbar" aria-label="Main navigation" style={{ "--ff-nav-index": index }}>
    {links.slice(0,4).map(item)}
    <div className="nav-settings">{item(links[4])}</div>
  </nav>;
}
