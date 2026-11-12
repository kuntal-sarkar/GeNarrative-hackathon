import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Clapperboard, FolderOpen } from "lucide-react";
import { getProjects, createProject } from "../../services/projectService";
import "./RecentProjects.css";

export default function RecentProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(getProjects);
  useEffect(() => {
    const refresh = () => setProjects(getProjects());
    window.addEventListener("takegrid:projects-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("takegrid:projects-changed", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  function start() { try { const p = createProject("blank"); navigate("/studio", {state:{projectId:p.id}}); } catch { window.alert("Could not create project."); } }
  const sorted = [...projects].sort((a,b) => (b.updatedAt||"").localeCompare(a.updatedAt||""));
  return <section id="recent-projects" className="recent-projects">
    <div className="home-section-heading"><div><span className="section-eyebrow">YOUR WORKSPACE</span><h2>Your projects</h2></div></div>
    {sorted.length === 0 ? <div className="recent-projects-empty"><FolderOpen size={28}/><h3>No projects yet</h3><p>Your own saved stories will appear here.</p><button type="button" onClick={start}>Create First Project</button></div> :
    <div className="recent-projects-grid">{sorted.slice(0,6).map((project,i) =>
      <button className="recent-project-card" key={project.id} type="button" onClick={() => navigate("/studio", {state:{projectId:project.id}})}>
        <div className="project-card-cover"><span className="project-cover-index">{String(i+1).padStart(2,"0")}</span><Clapperboard size={42} strokeWidth={1.3}/><ArrowUpRight className="project-cover-arrow" size={19}/></div>
        <div className="project-card-details"><div className="project-card-meta"><span>{project.genre}</span><span>{project.language}</span></div>
          <h3>{project.title}</h3><p>{project.idea?.trim() || project.story?.trim().slice(0,130) || "No story content yet."}</p>
          <div className="project-card-footer"><span>{project.scenes?.length || 0} scenes</span><span>Open Studio ↗</span></div>
        </div>
      </button>
    )}</div>}
  </section>;
}
