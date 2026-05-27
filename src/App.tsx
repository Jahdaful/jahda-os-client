import { projectsData } from "./data/projects";
import ProjectCard from "./components/ProjectCard";
import "./App.css";

function App() {
  const active = projectsData.filter((p) => p.status === "Active").length;
  const totalProgress = Math.round(
    projectsData.reduce((sum, p) => sum + p.progress, 0) / projectsData.length
  );

  return (
    <div className="os-shell">
      <header className="os-header">
        <div className="os-logo">
          <span className="os-logo-mark">J</span>
          <span className="os-logo-text">JAHDA OS</span>
        </div>
        <div className="os-stats">
          <div className="stat-chip">
            <span className="stat-val">{projectsData.length}</span>
            <span className="stat-label">Projects</span>
          </div>
          <div className="stat-chip">
            <span className="stat-val">{active}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-chip">
            <span className="stat-val">{totalProgress}%</span>
            <span className="stat-label">Avg Progress</span>
          </div>
        </div>
      </header>

      <main className="os-main">
        <h1 className="section-title">Tracked Projects</h1>
        <div className="projects-grid">
          {projectsData.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>

      <footer className="os-footer">
        <span>Jahda OS · Built by Jahdaful</span>
      </footer>
    </div>
  );
}

export default App;
