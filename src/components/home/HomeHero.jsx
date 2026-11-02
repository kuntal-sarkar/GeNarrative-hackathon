import { ArrowUpRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../../config/app.config";
import "./HomeHero.css";

export default function HomeHero() {
  const navigate = useNavigate();
  function handleCreate() { navigate("/studio", { state: { newMode: "ai" } }); }
  return <section className="home-hero">
    <div className="home-hero-content">
      <div className="home-hero-label">YOUR CREATIVE WORKSPACE</div>
      <h1>Your next great<br/>story <span>starts here.</span></h1>
      <p>From the first idea to the final frame. Create, direct, and refine your stories with the tools you control.</p>
      <div className="home-hero-actions">
        <button type="button" className="hero-primary-btn" onClick={handleCreate}><Plus size={19}/> Create New Story <ArrowUpRight size={18}/></button>
        <a href="#recent-projects" className="hero-secondary-btn">Explore Projects <ArrowUpRight size={17}/></a>
      </div>
      <span className="home-hero-tagline">{APP_CONFIG.tagline}</span>
    </div>
    <div className="home-hero-art" aria-hidden="true"><div className="hero-art-ring ring-one"/><div className="hero-art-ring ring-two"/><div className="hero-art-center"><span>YOUR</span><strong>VISION.</strong><span>YOUR STORY.</span></div><div className="hero-art-dot dot-blue"/><div className="hero-art-dot dot-orange"/></div>
  </section>;
}
