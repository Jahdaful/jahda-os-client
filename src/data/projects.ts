export interface Project {
  id: string;
  name: string;
  language: string;
  status: "Active" | "Inactive" | "Archived" | "Planned";
  description: string;
  url: string;
  repo: string;
  branch: string;
  bugs: number;
  progress: number;
  icon: string;
  color: string;
}

export const projectsData: Project[] = [
  {
    id: "balogun",
    name: "BALOGUN",
    language: "TypeScript",
    status: "Active",
    description: "Real-time threat detection & security suite",
    url: "https://balogun-web.vercel.app",
    repo: "github.com/Jahdaful/balogun",
    branch: "main",
    bugs: 0,
    progress: 85,
    icon: "🛡️",
    color: "#ef4444",
  },
  {
    id: "veridex",
    name: "VERIDEX",
    language: "JavaScript",
    status: "Active",
    description: "Forensic AI media authenticity detection suite",
    url: "https://veridex-two.vercel.app",
    repo: "github.com/Jahdaful/veridex",
    branch: "main",
    bugs: 0,
    progress: 90,
    icon: "🔬",
    color: "#6366f1",
  },
];
