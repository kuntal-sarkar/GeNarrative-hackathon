import { NavLink, useLocation } from "react-router-dom";
import { Home, Clapperboard, MessagesSquare, Brain, Settings } from "lucide-react";
import "./BottomNavbar.css";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/studio", label: "Studio", icon: Clapperboard },
  { to: "/critics", label: "Critics", icon: MessagesSquare },
  { to: "/memory", label: "Memory", icon: Brain },
];

export default function BottomNavbar() {
  const { pathname } = useLocation();
  const isActive = (path) => path === "/studio"
    ? pathname === "/studio" || pathname.startsWith("/projects/")
    : path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
  const item = ({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} end={to === "/"}
      aria-label={label} aria-current={isActive(to) ? "page" : undefined}
      className={`nav-item${isActive(to) ? " nav-item-active" : ""}`}>
      <Icon size={21} strokeWidth={2} aria-hidden="true" />
      <span className="nav-label">{label}</span>
    </NavLink>
  );
  return (
    <nav className="bottom-navbar" aria-label="Main navigation">
      {links.map(item)}
      <div className="nav-settings">{item({ to: "/settings", label: "Settings", icon: Settings })}</div>
    </nav>
  );
}
