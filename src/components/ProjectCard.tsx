import type { Project } from "../data/projects";

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  const statusColor =
    project.status === "Active"
      ? "#22c55e"
      : project.status === "Planned"
      ? "#f59e0b"
      : "#6b7280";

  return (
    <div className="project-card" style={{ borderTop: `3px solid ${project.color}` }}>
      <div className="card-header">
        <span className="card-icon">{project.icon}</span>
        <div className="card-title-group">
          <h2 className="card-name">{project.name}</h2>
          <span className="card-lang">{project.language}</span>
        </div>
        <span className="card-status" style={{ color: statusColor }}>
          ● {project.status}
        </span>
      </div>

      <p className="card-desc">{project.description}</p>

      <div className="card-progress-row">
        <span className="card-progress-label">Progress</span>
        <span className="card-progress-pct">{project.progress}%</span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${project.progress}%`, background: project.color }}
        />
      </div>

      <div className="card-meta">
        <div className="card-meta-row">
          <span className="meta-label">Repo</span>
          <a
            href={`https://${project.repo}`}
            target="_blank"
            rel="noreferrer"
            className="meta-link"
          >
            {project.repo}
          </a>
        </div>
        <div className="card-meta-row">
          <span className="meta-label">Branch</span>
          <code className="meta-code">{project.branch}</code>
        </div>
        <div className="card-meta-row">
          <span className="meta-label">Bugs</span>
          <span className={project.bugs === 0 ? "bugs-clear" : "bugs-open"}>
            {project.bugs === 0 ? "✓ Clear" : `${project.bugs} open`}
          </span>
        </div>
      </div>

      <div className="card-footer">
        <a href={project.url} target="_blank" rel="noreferrer" className="launch-btn">
          Launch →
        </a>
      </div>
    </div>
  );
}
