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
  techTag: string;
  lastActivity: string;
  voiceIntro: string;
}

export const projectsData: Project[] = [
  {
    id: "balogun",
    name: "BALOGUN",
    language: "TypeScript",
    status: "Active",
    description:
      "Real-time threat detection & security suite across Mac, Windows, iOS, and Android.",
    url: "https://balogun-web.vercel.app",
    repo: "github.com/Jahdaful/balogun",
    branch: "main",
    bugs: 0,
    progress: 85,
    icon: "🛡️",
    color: "#ff3333",
    techTag: "TypeScript · Node.js",
    lastActivity: "2 hours ago",
    voiceIntro:
      "Balogun is your security commander. Real-time threat detection across Mac, Windows, iOS, and Android. Currently monitoring all systems. Status: active.",
  },
  {
    id: "veridex",
    name: "VERIDEX",
    language: "JavaScript",
    status: "Active",
    description:
      "Forensic AI media authenticity detection suite for deepfakes and voice clones.",
    url: "https://veridex-two.vercel.app",
    repo: "github.com/Jahdaful/veridex",
    branch: "main",
    bugs: 0,
    progress: 90,
    icon: "🔬",
    color: "#00d4ff",
    techTag: "React · Claude AI",
    lastActivity: "1 hour ago",
    voiceIntro:
      "Veridex is your forensic intelligence suite. AI-powered deepfake detection, voice clone analysis, and identity modification screening. Status: active.",
  },
  {
    id: "couture-crm",
    name: "COUTURE CRM",
    language: "TypeScript",
    status: "Active",
    description:
      "Fashion studio operations — clients, orders, invoices, and contracts management.",
    url: "https://couture-crm.vercel.app",
    repo: "github.com/Jahdaful/couture-crm",
    branch: "main",
    bugs: 0,
    progress: 72,
    icon: "👗",
    color: "#a855f7",
    techTag: "React · TypeScript",
    lastActivity: "3 hours ago",
    voiceIntro:
      "Couture CRM manages your fashion studio operations — clients, orders, invoices, and contracts. Status: active.",
  },
  {
    id: "jahda-the-helper",
    name: "JAHDA THE HELPER",
    language: "TypeScript",
    status: "Active",
    description: "Personal AI command center — always available, always learning.",
    url: "https://jahda-helper.vercel.app",
    repo: "github.com/Jahdaful/jahda-the-helper",
    branch: "main",
    bugs: 0,
    progress: 68,
    icon: "🤖",
    color: "#22c55e",
    techTag: "AI · TypeScript",
    lastActivity: "30 minutes ago",
    voiceIntro:
      "Jahda the Helper is your personal AI command center. Always available, always learning. Status: active.",
  },
];
