import type { Project } from './data/projects';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ConversationTurn {
  role: 'user' | 'jarvis';
  text: string;
  timestamp: number;
}

export type ConversationHistory = ConversationTurn[];

export interface EngineAction {
  type: 'open-url' | 'highlight-project' | 'introduce-all';
  url?: string;
  projectId?: string;
  durationMs?: number;
}

export interface EngineResult {
  response: string;
  followUp?: string;      // spoken after a short pause when set
  action?: EngineAction;
  confidence: 'high' | 'low'; // low → caller falls back to Claude
}

// ── Internal utilities ────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function has(t: string, ...words: string[]): boolean {
  return words.some((w) => t.includes(w));
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

export function getTimeString(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Scripture pool (rotates daily) ────────────────────────────────────────────

const VERSES = [
  "Psalm 118, verse 24 — This is the day the Lord has made; let us rejoice and be glad in it.",
  "Proverbs 3, verse 5 — Trust in the Lord with all your heart and lean not on your own understanding.",
  "Philippians 4, verse 13 — I can do all things through Christ who strengthens me.",
  "Joshua 1, verse 9 — Be strong and courageous. The Lord your God is with you wherever you go.",
  "Jeremiah 29, verse 11 — For I know the plans I have for you, plans to prosper you.",
  "Isaiah 41, verse 10 — Do not fear, for I am with you. Be not dismayed, for I am your God.",
  "Romans 8, verse 28 — All things work together for good to those who love God.",
  "Matthew 6, verse 33 — Seek first the kingdom of God, and all these things will be added to you.",
  "Proverbs 16, verse 3 — Commit your works to the Lord and your plans will succeed.",
  "Psalm 23, verse 1 — The Lord is my shepherd; I shall not want.",
];

export function getDailyVerse(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return VERSES[dayOfYear % VERSES.length];
}

// ── Project fuzzy matching ────────────────────────────────────────────────────

// Aliases beyond the project name/id — kept narrow to avoid false positives
const ALIASES: Record<string, string[]> = {
  balogun: [
    'balogun', 'security', 'security suite', 'threat detection', 'the security one',
    'perimeter', 'defender', 'my security', 'check security',
  ],
  veridex: [
    'veridex', 'forensics', 'forensic', 'deepfake', 'deep fake', 'voice clone',
    'the forensics thing', 'media authenticity', 'fake detection', 'open the forensics',
    'ai detection', 'authenticity',
  ],
  'couture-crm': [
    'couture', 'crm', 'fashion', 'my store', 'the store', 'fashion studio',
    'the studio', 'client manager',
  ],
  'jahda-the-helper': [
    'helper', 'the helper', 'jahda helper', 'personal ai', 'my helper',
    'jahda the helper', 'ai assistant',
  ],
};

export function findProject(t: string, projects: Project[]): Project | null {
  // Direct name / id / meaningful word match
  const direct = projects.find((p) => {
    const name = p.name.toLowerCase();
    const id = p.id.toLowerCase();
    const idSpaced = p.id.replace(/-/g, ' ').toLowerCase();
    const words = name.split(' ').filter((w) => w.length > 3);
    return (
      t.includes(name) ||
      t.includes(id) ||
      t.includes(idSpaced) ||
      words.some((w) => t.includes(w))
    );
  });
  if (direct) return direct;

  for (const [projectId, aliases] of Object.entries(ALIASES)) {
    if (aliases.some((alias) => t.includes(alias))) {
      return projects.find((p) => p.id === projectId) ?? null;
    }
  }
  return null;
}

function getLastMentionedProject(history: ConversationTurn[], projects: Project[]): Project | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const found = findProject(history[i].text.toLowerCase(), projects);
    if (found) return found;
  }
  return null;
}

// 50/50 chance to append a follow-up question
function maybe(text: string): string | undefined {
  return Math.random() > 0.5 ? text : undefined;
}

// ── Main intent processor ─────────────────────────────────────────────────────

export function processInput(
  transcript: string,
  history: ConversationTurn[],
  projects: Project[],
): EngineResult {
  const t = transcript.toLowerCase().trim();
  const tod = getTimeOfDay();

  // ── Context resolution ("what about that", "tell me more", etc.) ─────────
  if (
    has(t, 'what about that', 'what about it', 'that one', 'tell me more',
      'more about that', 'and that', 'go back to that', 'you were saying',
      'what were you saying', 'what did you mean', 'elaborate')
  ) {
    const last = getLastMentionedProject(history, projects);
    if (last) {
      return {
        response: pick([
          `${last.name} — ${last.description} It's at ${last.progress} percent right now.`,
          `Right, ${last.name}. ${last.voiceIntro} Currently at ${last.progress} percent.`,
          `${last.name}. ${last.progress} percent complete. ${last.description}`,
        ]),
        action: { type: 'highlight-project', projectId: last.id, durationMs: 6000 },
        followUp: maybe(`Want me to open ${last.name}?`),
        confidence: 'high',
      };
    }
    return {
      response: `I'm not sure what you're referring to — which project are you asking about?`,
      confidence: 'high',
    };
  }

  // ── Presence check / greeting ────────────────────────────────────────────
  if (
    has(t, 'you there', 'are you there', 'you awake', 'you listening', 'you here',
      'you ready', 'hello', 'hey')
  ) {
    return {
      response: pick([
        `Always. Where else would I go?`,
        `Right here. What do you need?`,
        `Present. Good ${tod} — what are we working on?`,
        `I'm here. Always am.`,
        `Of course. Go ahead.`,
      ]),
      confidence: 'high',
    };
  }

  // ── How are you ──────────────────────────────────────────────────────────
  if (
    has(t, 'how are you', 'how you doing', 'you good', 'how do you feel',
      "how's it going with you", 'how you been', "how's life")
  ) {
    return {
      response: pick([
        `Running clean. No errors, no lag. You?`,
        `All systems nominal. How about you?`,
        `Good — everything's quiet on my end. How are you holding up?`,
        `Clean bill of health. What about you?`,
      ]),
      confidence: 'high',
    };
  }

  // ── Tired / low energy ───────────────────────────────────────────────────
  if (
    has(t, "i'm tired", 'im tired', 'exhausted', 'i need rest', 'need sleep',
      'so tired', "i'm drained", 'im drained', 'worn out', 'need a break')
  ) {
    return {
      response: pick([
        `Then rest. I'll hold it down while you're out.`,
        `Take the time you need. Everything here is handled.`,
        `Copy that. Recharge. I'll keep watch.`,
        `Rest is productive too. Go — I'm right here when you're back.`,
      ]),
      confidence: 'high',
    };
  }

  // ── What's good / what's up ──────────────────────────────────────────────
  if (has(t, "what's good", 'whats good', "what's up", 'whats up')) {
    const active = projects.filter((p) => p.status === 'Active');
    const avg = Math.round(active.reduce((s, p) => s + p.progress, 0) / (active.length || 1));
    return {
      response: pick([
        `${active.length} agents running, averaging ${avg} percent. Things are moving.`,
        `Honestly? Solid. ${active.length} active, ${avg} percent average. No red flags.`,
        `${active.length} agents online, ${avg} percent average. You're in good shape.`,
      ]),
      confidence: 'high',
    };
  }

  // ── Surprise me / something interesting ─────────────────────────────────
  if (
    has(t, 'something interesting', 'surprise me', "what's interesting",
      'fun fact', 'tell me something', 'something cool', 'impress me')
  ) {
    const p = projects[Math.floor(Math.random() * projects.length)];
    return {
      response: pick([
        `${p.name} is at ${p.progress} percent — and it's one of your more sophisticated builds. ${p.description}`,
        `Think about what ${p.name} actually does: ${p.description} Already at ${p.progress} percent. That's real.`,
        `Here's one: ${p.name} — ${p.description} At ${p.progress} percent. You built that.`,
      ]),
      action: { type: 'highlight-project', projectId: p.id, durationMs: 5000 },
      confidence: 'high',
    };
  }

  // ── What do you think / give an opinion ─────────────────────────────────
  if (
    has(t, 'what do you think', 'your opinion', 'your take', 'what would you do',
      'what should i', 'advice', 'recommend', 'what do you suggest')
  ) {
    const last = getLastMentionedProject(history, projects);
    if (last) {
      return {
        response: pick([
          `My take on ${last.name}: you're at ${last.progress} percent. Past the hard part. Push it to completion before splitting focus.`,
          `${last.name} at ${last.progress} percent — you're close. Momentum matters more than starting something new right now.`,
          `Honestly? ${last.name} is worth finishing first. At ${last.progress} percent, you're too close to stop.`,
        ]),
        confidence: 'high',
      };
    }
    return {
      response: pick([
        `You've got four solid projects. If I had to pick one — push the one closest to completion. What are you weighing?`,
        `Give me more to work with. Which project are we talking about?`,
        `Depends on what you're deciding. What's on your mind?`,
      ]),
      confidence: 'high',
    };
  }

  // ── Thanks / positive acknowledgment ────────────────────────────────────
  if (
    has(t, 'thank you', 'thanks', 'appreciate', 'good job', 'well done',
      'nice work', "you're great", 'perfect', 'exactly', 'great', 'awesome', 'nice one')
  ) {
    return {
      response: pick([
        `That's what I'm here for. What else?`,
        `Always. Anything else?`,
        `Glad I could help. What's next?`,
        `Of course. I've got you.`,
      ]),
      confidence: 'high',
    };
  }

  // ── Status report ────────────────────────────────────────────────────────
  if (
    has(t, 'status', 'report', 'update', 'how are things', "how's everything", 'hows everything',
      'overview', 'summary', "what's going on", 'whats going on', "what's happening", 'whats happening',
      'check in', 'rundown', 'how we doing', 'how we looking', "how's it looking", 'where are we',
      'anything new', 'what do we have', "what's the situation", 'give me the')
  ) {
    const active = projects.filter((p) => p.status === 'Active');
    const avg = Math.round(active.reduce((s, p) => s + p.progress, 0) / (active.length || 1));
    return {
      response: pick([
        `${active.length} agents online, averaging ${avg} percent across active missions. No critical flags. You're in a solid position.`,
        `Quick rundown — ${active.length} active, ${avg} percent overall. Everything's holding. The work is moving.`,
        `Things look clean. ${active.length} agents running, ${avg} percent average. No red flags.`,
        `${active.length} agents holding it down. Overall progress: ${avg} percent. Nothing critical on my radar.`,
      ]),
      confidence: 'high',
    };
  }

  // ── Overall progress breakdown ───────────────────────────────────────────
  if (
    has(t, 'how far', 'how much progress', 'progress overall', 'overall progress',
      'how close', 'percentage overall', 'combined progress', 'all projects progress')
  ) {
    const active = projects.filter((p) => p.status === 'Active');
    const avg = Math.round(active.reduce((s, p) => s + p.progress, 0) / (active.length || 1));
    const breakdown = projects.map((p) => `${p.name} at ${p.progress}`).join(', ');
    return {
      response: `Across all active missions you're at ${avg} percent overall. Breakdown: ${breakdown} percent.`,
      confidence: 'high',
    };
  }

  // ── Threat check ─────────────────────────────────────────────────────────
  if (
    has(t, 'threat', 'intrusion', 'attack', 'breach', 'hack', 'all good',
      'any issues', 'any threats', 'are we safe')
  ) {
    return {
      response: pick([
        `Balogun sweep complete. No intrusions. All perimeters secure. You're clear.`,
        `All clear. No active threats. Systems are locked down.`,
        `Security sweep: clean. No breaches, no flags. Command center is tight.`,
        `Perimeter's holding. Nothing's getting through.`,
      ]),
      confidence: 'high',
    };
  }

  // ── Time ─────────────────────────────────────────────────────────────────
  if (has(t, 'what time', 'time is it', 'current time', "what's the time", 'the time')) {
    return { response: `It's ${getTimeString()}.`, confidence: 'high' };
  }

  // ── Date ─────────────────────────────────────────────────────────────────
  if (has(t, 'what day', "what's today", "today's date", 'what date', 'what is today')) {
    const d = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return { response: `Today is ${d}.`, confidence: 'high' };
  }

  // ── Scripture ─────────────────────────────────────────────────────────────
  if (
    has(t, 'scripture', 'verse', 'word of the day', 'bible', 'the word',
      'read me a verse', 'give me a verse', 'daily verse')
  ) {
    return { response: `Here's your word. ${getDailyVerse()}`, confidence: 'high' };
  }

  // ── Help / capabilities ───────────────────────────────────────────────────
  if (has(t, 'help', 'what can you do', 'commands', 'what do you know', 'capabilities', 'what are you')) {
    return {
      response: `I can give you a status report, walk through your agents, open any project, check threats, tell you the time and weather, or just talk. Say anything — I'll figure it out.`,
      confidence: 'high',
    };
  }

  // ── Introduce all agents ──────────────────────────────────────────────────
  if (
    has(t, 'introduce', 'show me all', 'list all', 'all agents', 'all projects',
      'walk me through', 'run me through', 'brief me', 'meet the team',
      'show the team', 'run the agents', 'tell me about all', 'list my projects') ||
    (has(t, 'who') && has(t, 'agent', 'project', 'running', 'working'))
  ) {
    return {
      response: pick([
        `Alright, let me walk you through your full command center.`,
        `Copy that. Here's your complete team briefing.`,
        `Standing by — let me introduce every agent.`,
      ]),
      action: { type: 'introduce-all' },
      confidence: 'high',
    };
  }

  // ── Farewell ─────────────────────────────────────────────────────────────
  if (
    has(t, 'goodbye', 'good night', 'goodnight', "that's all", 'thats all',
      "i'm done", 'signing off', "i'm out", 'catch you later')
  ) {
    return {
      response: pick([
        `Understood. I'll be right here when you need me.`,
        `Got it. Standing by.`,
        `Copy that. I'll keep everything running.`,
        `Stepping back. Call me when you're ready.`,
      ]),
      confidence: 'high',
    };
  }

  // ── Specific project — open / status / intro ──────────────────────────────
  const matched = findProject(t, projects);

  if (matched) {
    if (
      has(t, 'open', 'launch', 'start', 'go to', 'take me to', 'run',
        'visit', 'pull up', 'load', 'navigate', 'show me')
    ) {
      return {
        response: pick([
          `Opening ${matched.name}.`,
          `Launching ${matched.name} now.`,
          `On it — pulling up ${matched.name}.`,
        ]),
        action: { type: 'open-url', url: matched.url },
        confidence: 'high',
      };
    }

    if (
      has(t, 'how is', "how's", 'hows', 'doing', 'progress', 'update on', 'status of',
        'tell me about', 'how far', 'where is', 'how close', 'check')
    ) {
      return {
        response: pick([
          `${matched.name} is at ${matched.progress} percent. Status: ${matched.status}. Last touched ${matched.lastActivity}.`,
          `${matched.name} — ${matched.progress} percent complete. ${matched.status}. Last activity: ${matched.lastActivity}.`,
          `${matched.description} Currently at ${matched.progress} percent. ${matched.status === 'Active' ? "It's live." : `Status: ${matched.status}.`}`,
        ]),
        action: { type: 'highlight-project', projectId: matched.id, durationMs: 6000 },
        followUp: maybe(`Want me to open ${matched.name}?`),
        confidence: 'high',
      };
    }

    // Just mentioned by name → give intro
    return {
      response: pick([
        matched.voiceIntro,
        `${matched.name} — ${matched.description} Currently at ${matched.progress} percent.`,
        `That's ${matched.name}. ${matched.description} Progress: ${matched.progress} percent.`,
      ]),
      action: { type: 'highlight-project', projectId: matched.id, durationMs: 5000 },
      followUp: maybe(`Want me to open it?`),
      confidence: 'high',
    };
  }

  // ── Low confidence → caller falls back to Claude ──────────────────────────
  return { response: '', confidence: 'low' };
}
