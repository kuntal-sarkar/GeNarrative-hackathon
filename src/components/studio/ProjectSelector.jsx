
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import "./ProjectSelector.css";

export default function ProjectSelector({
  projects,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}) {
  return (
    <section className="project-selector">
      <div className="project-selector-heading">
        <div>
          <span className="studio-eyebrow">YOUR WORKSPACE</span>
          <h2>My Projects</h2>
        </div>

        <button
          type="button"
          className="project-new-btn"
          onClick={onCreate}
        >
          <Plus size={17} />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="project-empty">
          <FolderOpen size={28} />
          <p>No projects yet. Create your first story.</p>
        </div>
      ) : (
        <div className="project-selector-list">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`project-selector-item ${
                activeId === project.id ? "project-selected" : ""
              }`}
            >
              <button
                type="button"
                className="project-open-btn"
                onClick={() => onSelect(project.id)}
              >
                <FolderOpen size={19} />
                <span>
                  <strong>{project.title}</strong>
                  <small>
                    {project.genre} · {project.scenes?.length || 0} scenes
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="project-delete-btn"
                onClick={() => onDelete(project.id)}
                aria-label={`Delete ${project.title}`}
                title="Delete project"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
