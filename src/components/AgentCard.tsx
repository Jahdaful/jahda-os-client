import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "../data/projects";

interface Props {
  project: Project;
  index: number;
  highlighted: boolean;
  onVoiceIntro: (project: Project) => void;
}

export default function AgentCard({ project, index, highlighted, onVoiceIntro }: Props) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;

    const delay = index * 120 + 400;
    const duration = 1400;

    const timer = setTimeout(() => {
      const start = performance.now();
      function step(now: number) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplayProgress(Math.round(eased * project.progress));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timer);
  }, [project.progress, index]);

  return (
    <motion.article
      className={`agent-card${highlighted ? " agent-card--highlighted" : ""}`}
      style={{ "--card-color": project.color } as React.CSSProperties}
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="agent-card__stripe" />
      <div className="agent-card__glow" />

      {/* Header */}
      <div className="agent-card__header">
        <motion.span
          className="agent-card__status-dot"
          animate={{
            opacity: [1, 0.4, 1],
            boxShadow: [
              `0 0 6px ${project.color}`,
              `0 0 2px ${project.color}`,
              `0 0 6px ${project.color}`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: project.color }}
        />
        <span className="agent-card__icon" aria-hidden="true">
          {project.icon}
        </span>
        <div className="agent-card__title-group">
          <h2 className="agent-card__name">{project.name}</h2>
          <span className="agent-card__tech">{project.techTag}</span>
        </div>
      </div>

      {/* Description */}
      <p className="agent-card__desc">{project.description}</p>

      {/* Progress */}
      <div className="agent-card__progress-row">
        <span className="agent-card__progress-label">PROGRESS</span>
        <span className="agent-card__progress-pct">{displayProgress}%</span>
      </div>
      <div className="agent-card__track">
        <motion.div
          className="agent-card__fill"
          style={{ background: project.color }}
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 1.4, delay: index * 0.12 + 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Repo + Branch metadata (restored from original) */}
      <div className="agent-card__data-rows">
        <div className="agent-card__data-row">
          <span className="agent-card__data-label">REPO</span>
          <a
            href={`https://${project.repo}`}
            target="_blank"
            rel="noreferrer"
            className="agent-card__data-link"
            onClick={(e) => e.stopPropagation()}
          >
            {project.repo}
          </a>
        </div>
        <div className="agent-card__data-row">
          <span className="agent-card__data-label">BRANCH</span>
          <code className="agent-card__data-code">{project.branch}</code>
        </div>
        <div className="agent-card__data-row">
          <span className="agent-card__data-label">BUGS</span>
          <span className={project.bugs === 0 ? "bugs-clear" : "bugs-open"}>
            {project.bugs === 0 ? "✓ Clear" : `${project.bugs} open`}
          </span>
        </div>
      </div>

      {/* Footer: last activity + actions */}
      <div className="agent-card__footer">
        <span className="agent-card__activity">⏱ {project.lastActivity}</span>
        <div className="agent-card__actions">
          <motion.a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="agent-card__launch"
            whileHover={{ x: 3 }}
            onClick={(e) => e.stopPropagation()}
          >
            Launch →
          </motion.a>
          <motion.button
            className="agent-card__voice-btn"
            onClick={() => onVoiceIntro(project)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={`Voice intro: ${project.name}`}
          >
            🎙️
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
