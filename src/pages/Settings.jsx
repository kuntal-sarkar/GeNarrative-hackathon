import { useMemo, useState } from "react";
import SearchField from "../components/ui/SearchField";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Search, X, ShieldCheck, ScrollText, Cookie, Building2, Copyright, FileWarning, Users, Shield, Scale, LockKeyhole, Flag, CircleHelp, Contact, Headset, HeartHandshake, Clapperboard, GitBranch, Package, Accessibility, SlidersHorizontal, Database, Settings2 } from "lucide-react";
import { SETTINGS_GROUPS, SETTINGS_ITEMS } from "./settings/settingsCatalog";
import { SETTINGS_SECTIONS } from "./settings/settingsSections";
import "./Settings.css";

const ICONS = { "shield-check": ShieldCheck, "scroll-text": ScrollText, cookie: Cookie, "building-2": Building2, copyright: Copyright, "file-warning": FileWarning, users: Users, shield: Shield, scale: Scale, "lock-keyhole": LockKeyhole, flag: Flag, "circle-help": CircleHelp, contact: Contact, headset: Headset, "heart-handshake": HeartHandshake, clapperboard: Clapperboard, "git-branch": GitBranch, package: Package, accessibility: Accessibility, "sliders-horizontal": SlidersHorizontal, database: Database };

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const requested = params.get("section");
  const selected = SETTINGS_ITEMS.find((item) => item.id === requested);
  const filtered = useMemo(() => SETTINGS_ITEMS.filter((item) => `${item.title} ${item.description} ${item.group}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const openSection = (id) => setParams({section:id});
  const backToSettings = () => setParams({});
  const SelectedComponent = selected ? SETTINGS_SECTIONS[selected.id] : null;

  return <main className="ff-settings-page">
    {selected ? <>
      <button type="button" className="ff-settings-back" onClick={backToSettings}><ArrowLeft size={18}/> All Settings</button>
      <div className="ff-settings-detail-heading"><span className="ff-settings-detail-kicker">FRAMEFORGE / SETTINGS</span><h1>{selected.title}</h1><p>{selected.description}</p></div>
      <section className="ff-settings-detail-surface">{SelectedComponent && <SelectedComponent/>}</section>
    </> : <>
      <header className="ff-settings-hero">
        <div className="ff-settings-hero-content"><div className="ff-settings-eyebrow"><Settings2 size={15}/> YOUR WORKSPACE, YOUR CONTROL</div><h1>Settings <span>& information.</span></h1><p>Everything about your FRAMEFORGE experience, policies, support and the people behind the product — organized in one place.</p></div>
        <div className="ff-settings-hero-art" aria-hidden="true"><div className="ff-settings-hero-art-ring"/><ShieldCheck size={54}/></div>
      </header>
      <div className="ff-settings-controls"><div><h2>Explore settings</h2><p>Choose a section to view its dedicated page.</p></div><SearchField className="ff-settings-search" label="Search settings" placeholder="Search settings and policies..." value={query} onChange={setQuery} /></div>
      {SETTINGS_GROUPS.map(group => { const items = filtered.filter(item=>item.group===group); if(!items.length) return null; return <section className="ff-settings-group" key={group}><div className="ff-settings-group-heading"><h3>{group}</h3><span>{items.length} {items.length===1?'section':'sections'}</span></div><div className="ff-settings-grid">{items.map(item=>{const Icon=ICONS[item.icon] || Settings2; return <button className="ff-settings-card" type="button" key={item.id} onClick={()=>openSection(item.id)}><span className="ff-settings-icon"><Icon size={20}/></span><span className="ff-settings-card-copy"><strong>{item.title}</strong><small>{item.description}</small></span><ArrowUpRight size={17} className="ff-settings-arrow"/></button>})}</div></section>; })}
      {filtered.length===0 && <div className="ff-settings-no-results">No settings found for “{query}”.</div>}
      <footer className="ff-settings-footer">
        <span className="ff-settings-footer-brand">FRAMEFORGE · Built by Team Runtime Error</span>
        <span className="ff-settings-footer-copyright">© {new Date().getFullYear()} Team Runtime Error. All rights reserved.</span>
        <span className="ff-settings-footer-note">Policy and contact details will be published once verified.</span>
        <span className="ff-settings-footer-version">{`Web app version: ${import.meta.env.VITE_APP_VERSION || "Not specified"}`}</span>
      </footer>
    </>}
  </main>;
}
