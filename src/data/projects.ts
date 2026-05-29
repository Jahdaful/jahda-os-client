export interface Project {
  id: string;
  name: string;
  title: string;
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
    id: "ministry-hub",
    name: "MINISTRY HUB",
    title: "CPO · Chief Pastoral Officer",
    language: "TypeScript",
    status: "Active",
    description:
      "Pastoral command center — sermons, congregation management, events and outreach coordination.",
    url: "https://ministry-hub.vercel.app",
    repo: "github.com/Pwal/ministry-hub",
    branch: "main",
    bugs: 0,
    progress: 85,
    icon: "✝️",
    color: "#ff3333",
    techTag: "TypeScript · Node.js",
    lastActivity: "2 hours ago",
    voiceIntro:
      "Ministry Hub is your pastoral command center. Sermons, congregation management, events and outreach. All systems active.",
  },
  {
    id: "chef-studio",
    name: "CHEF STUDIO",
    title: "CCO · Chief Culinary Officer",
    language: "JavaScript",
    status: "Active",
    description:
      "Culinary brand platform — recipes, menu engineering, food business management and client bookings.",
    url: "https://chef-studio.vercel.app",
    repo: "github.com/Pwal/chef-studio",
    branch: "main",
    bugs: 0,
    progress: 90,
    icon: "👨‍🍳",
    color: "#00d4ff",
    techTag: "React · Claude AI",
    lastActivity: "1 hour ago",
    voiceIntro:
      "Chef Studio is your culinary command center. Recipe management, menu engineering, and client bookings. Status: active.",
  },
  {
    id: "design-atelier",
    name: "DESIGN ATELIER",
    title: "CDO · Chief Design Officer",
    language: "TypeScript",
    status: "Active",
    description:
      "Luxury menswear atelier — bespoke suits, agbada, kaftan and senator native wear. Tailored for kings, executives and men of distinction.",
    url: "https://pwal-os.vercel.app?design",
    repo: "github.com/Pwal/design-atelier",
    branch: "main",
    bugs: 0,
    progress: 72,
    icon: "🤵",
    color: "#a855f7",
    techTag: "React · TypeScript",
    lastActivity: "3 hours ago",
    voiceIntro:
      "Design Atelier is your luxury menswear house. Bespoke suits, agbada, kaftan, and senator native wear — crafted for kings and executives. Status: active.",
  },
  {
    id: "pwal-planner",
    name: "PWAL PLANNER",
    title: "COS · Chief of Staff",
    language: "TypeScript",
    status: "Active",
    description:
      "Smart life scheduler — balances 9-to-5 employment with ministry, culinary, design, and family commitments.",
    url: "https://pwal-os.vercel.app?planner",
    repo: "github.com/Pwal/pwal-planner",
    branch: "main",
    bugs: 0,
    progress: 60,
    icon: "📅",
    color: "#22c55e",
    techTag: "AI · TypeScript",
    lastActivity: "30 minutes ago",
    voiceIntro:
      "Pwal Planner is your life scheduler. It balances your 9-to-5 job with your ministry duties, culinary work, design projects, and family time — all in one intelligent calendar. Status: active.",
  },
];

// Work schedule constants — used by the planner
export const WORK_SCHEDULE = {
  workStart: 9,   // 9 AM
  workEnd: 17,    // 5 PM
  workDays: [1, 2, 3, 4, 5], // Mon–Fri
  zones: [
    { label: "Ministry", color: "#ff3333", icon: "✝️", hours: "Evenings & Weekends" },
    { label: "Chef", color: "#00d4ff", icon: "👨‍🍳", hours: "Weekends & After 6PM" },
    { label: "Design Atelier", color: "#a855f7", icon: "🤵", hours: "Evenings & Weekends" },
    { label: "Family", color: "#f59e0b", icon: "🏡", hours: "Evenings & Weekends" },
  ],
};
