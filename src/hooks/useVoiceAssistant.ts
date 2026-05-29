import { useCallback, useRef, useState } from "react";
import type { Project } from "../data/projects";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any;

interface Options {
  projects: Project[];
  onHighlightProject: (id: string | null) => void;
  onVoiceResponse: (text: string) => void;
}

const GREETING_VERSES = [
  "Psalm 118 verse 24 — This is the day the Lord has made; let us rejoice and be glad in it.",
  "Proverbs 3 verse 5 — Trust in the Lord with all your heart and lean not on your own understanding.",
  "Philippians 4 verse 13 — I can do all things through Christ who strengthens me.",
  "Joshua 1 verse 9 — Be strong and courageous. The Lord your God is with you wherever you go.",
  "Jeremiah 29 verse 11 — For I know the plans I have for you, plans to prosper you.",
  "Isaiah 41 verse 10 — Do not fear, for I am with you. Be not dismayed, for I am your God.",
  "Romans 8 verse 28 — All things work together for good to those who love God.",
  "Matthew 6 verse 33 — Seek first the kingdom of God, and all these things will be added to you.",
  "Proverbs 16 verse 3 — Commit your works to the Lord and your plans will succeed.",
  "Psalm 23 verse 1 — The Lord is my shepherd; I shall not want.",
];

function getDailyVerse() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return GREETING_VERSES[dayOfYear % GREETING_VERSES.length];
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function getTimeString() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "clear skies", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "foggy", 48: "icy fog", 51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain", 71: "light snow", 73: "snow", 75: "heavy snow",
  80: "rain showers", 81: "heavy showers", 82: "violent showers",
  95: "thunderstorms", 96: "thunderstorms with hail", 99: "severe thunderstorms",
};

const WEATHER_CACHE_KEY = "pwal_weather";
const WEATHER_CACHE_TTL = 30 * 60 * 1000;

async function fetchWeather(): Promise<string> {
  try {
    const cached = sessionStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const { text, ts } = JSON.parse(cached) as { text: string; ts: number };
      if (Date.now() - ts < WEATHER_CACHE_TTL) return text;
    }
  } catch { /* ignore */ }

  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve("weather unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`;
          const res = await fetch(url);
          const data = await res.json();
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weathercode as number;
          const wind = Math.round(data.current.windspeed_10m);
          const desc = WMO_DESCRIPTIONS[code] ?? "conditions unknown";
          const text = `${desc}, ${temp} degrees, wind at ${wind} miles per hour`;
          try { sessionStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ text, ts: Date.now() })); } catch { /* quota */ }
          resolve(text);
        } catch {
          resolve("weather data unavailable");
        }
      },
      () => resolve("location access denied"),
      { timeout: 6000 }
    );
  });
}

function has(t: string, ...words: string[]) {
  return words.some((w) => t.includes(w));
}

export function useVoiceAssistant({ projects, onHighlightProject, onVoiceResponse }: Options) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;
  // When true, mic reopens automatically after agent finishes speaking
  const conversationModeRef = useRef(false);
  const startListeningRef = useRef<(override?: boolean) => void>(() => {});
  const wakeAndListenRef = useRef<() => void>(() => {});

  const getVoiceRef = useRef(() => {
    const voices = synth.getVoices();
    return (
      voices.find((v) =>
        v.name.toLowerCase().includes("daniel") ||
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("alex") ||
        v.name.toLowerCase().includes("google uk english male")
      ) ?? null
    );
  });

  const makeUtt = useCallback((text: string) => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;   // sharp, confident delivery
    utt.pitch = 0.88;  // warm male tone
    utt.volume = 1;
    const v = getVoiceRef.current();
    if (v) utt.voice = v;
    return utt;
  }, []);

  const speakQueue = useCallback(
    (segments: string[], onDone?: () => void) => {
      synth.cancel();
      setSpeaking(true);
      onVoiceResponse(segments.join(" "));

      const enqueue = (i: number) => {
        if (i >= segments.length) {
          setSpeaking(false);
          onDone?.();
          // Re-open mic quickly after responding in conversation mode
          if (conversationModeRef.current) {
            setTimeout(() => startListeningRef.current(), 250);
          }
          return;
        }
        const utt = makeUtt(segments[i]);
        if (!getVoiceRef.current() && i === 0) {
          synth.addEventListener("voiceschanged", () => {
            const v = getVoiceRef.current();
            if (v) utt.voice = v;
          }, { once: true });
        }
        utt.onend = () => enqueue(i + 1);
        synth.speak(utt);
      };
      enqueue(0);
    },
    [synth, onVoiceResponse, makeUtt]
  );

  const speak = useCallback(
    (text: string, onDone?: () => void) => speakQueue([text], onDone),
    [speakQueue]
  );

  // Instantly interrupt any speech and snap into listen mode
  const wakeAndListen = useCallback(() => {
    synth.cancel();
    setSpeaking(false);
    conversationModeRef.current = true;
    onVoiceResponse("Here. Listening.");
    const utt = makeUtt("Here.");
    utt.onend = () => {
      setSpeaking(false);
      setTimeout(() => startListeningRef.current(true), 50);
    };
    setSpeaking(true);
    synth.speak(utt);
  }, [synth, makeUtt, onVoiceResponse]);

  wakeAndListenRef.current = wakeAndListen;

  const greet = useCallback(async () => {
    conversationModeRef.current = true; // stay in conversation after each response
    const timeOfDay = getTimeOfDay();
    const timeStr = getTimeString();
    const verse = getDailyVerse();
    const active = projects.filter((p) => p.status === "Active").length;
    const avg = Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length);
    const weather = await fetchWeather();

    const pick = (opts: string[]) => opts[Math.floor(Math.random() * opts.length)];
    speakQueue([
      pick([
        `Good ${timeOfDay}, P Wal. We're live.`,
        `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}, P Wal. Command center's up.`,
        `Hey P Wal — we're online and ready to move.`,
      ]),
      `Real quick — here's your word.`,
      verse,
      `Clock's at ${timeStr}.`,
      `Outside: ${weather}.`,
      pick([
        `${active} agents are active right now — averaging ${avg} percent across the board. Things are moving.`,
        `You've got ${active} agents holding it down. Overall mission progress is sitting at ${avg} percent.`,
        `Command center looks clean — ${active} active agents, ${avg} percent average. No issues.`,
      ]),
      pick([
        `Talk to me whenever you're ready.`,
        `I'm right here — what do you need?`,
        `What are we doing today?`,
      ]),
    ], () => {
      setTimeout(() => startListeningRef.current(), 600);
    });
  }, [speakQueue, projects]);

  const startListening = useCallback((override = false) => {
    if (speaking && !override) return; // block mic while talking unless wake override
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR: SpeechRecognitionCtor | undefined = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      speak("Voice recognition isn't available in this browser.");
      return;
    }

    // Stop any previous session cleanly
    recognitionRef.current?.stop();

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e: { error: string }) => {
      setListening(false);
      // Auto-retry on no-speech — keeps conversation alive
      if (e.error === "no-speech" && conversationModeRef.current) {
        setTimeout(() => startListeningRef.current(false), 150);
      }
    };
    rec.onresult = (e: SpeechRecognitionEvent) => {
      processCommandRef.current(e.results[0][0].transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [speaking, speak]);

  // Keep a stable ref so speakQueue closure and onerror can call startListening
  startListeningRef.current = startListening;

  const stopListening = useCallback(() => {
    conversationModeRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const toggleConversationMode = useCallback(() => {
    const next = !conversationModeRef.current;
    conversationModeRef.current = next;
    if (next) {
      speak("Conversation mode on. I'm listening.", () => {
        setTimeout(() => startListeningRef.current(), 150);
      });
    } else {
      synth.cancel();
      recognitionRef.current?.stop();
      setSpeaking(false);
      setListening(false);
    }
  }, [speak, synth]);

  // Stable ref for processCommand (avoids stale closure in rec.onresult)
  const processCommandRef = useRef((_transcript: string) => {});

  const processCommand = useCallback(
    (transcript: string) => {
      const t = transcript.toLowerCase().trim();
      const pick = (opts: string[]) => opts[Math.floor(Math.random() * opts.length)];

      // ── Summon / wake word — instantly interrupt and listen ──────────────
      if (
        t === "assistant" || t === "agent" || t === "cos" || t === "chief" ||
        has(t, "hey assistant", "ok assistant", "okay assistant", "hi assistant",
               "yo assistant", "hey agent", "hey cos", "yo cos", "hey chief",
               "chief of staff", "pwal os", "p wal",
               "are you there", "you there", "you listening", "you awake",
               "stop talking", "stop and listen", "be quiet", "quiet")
      ) {
        wakeAndListenRef.current();
        return;
      }

      // ── Greeting ────────────────────────────────────────────────────────
      if (has(t, "hello", "hi there", "good morning", "good afternoon", "good evening", "what's up", "whats up", "sup")) {
        speak(pick([
          `${getTimeOfDay().charAt(0).toUpperCase() + getTimeOfDay().slice(1)}, P Wal. We're live — what are we working on?`,
          `Hey. Everything's moving. Talk to me.`,
          `P Wal. Good to hear from you. What do you need?`,
        ]));
        return;
      }

      // ── How are you ─────────────────────────────────────────────────────
      if (has(t, "how are you", "how you doing", "you good", "you okay", "you alright")) {
        speak(pick([
          "Dialed in and ready. Honestly, I'm only as good as the work we're putting in — so let's make it count. What's on your mind?",
          "I'm locked. Everything in here is running clean. More importantly — how are you doing?",
          "Good. Real good. I've been watching the mission — things are moving. What do you need from me?",
        ]));
        return;
      }

      // ── Affirmations / acknowledgements ──────────────────────────────────
      if (has(t, "thank you", "thanks", "appreciate", "thank you so much", "much appreciated")) {
        speak(pick([
          "Always. You don't have to thank me — this is what I'm built for.",
          "That's what I'm here for. What's next?",
          "Don't mention it. What else you got for me?",
        ]));
        return;
      }
      if (has(t, "good job", "well done", "nice work", "great job", "you did great", "love that", "love it", "perfect", "exactly")) {
        speak(pick([
          "I appreciate that. Now let's not stop there — what are we hitting next?",
          "That means something, P Wal. Thank you. What's the next move?",
          "We're in sync. That's when it's fun. What do you need?",
        ]));
        return;
      }
      if (has(t, "yes", "yeah", "yep", "correct", "right", "sure", "okay okay", "ok ok", "got it", "copy")) {
        speak(pick([
          "Good. I'm right here.",
          "Understood. What's next?",
          "Copy. Talk to me.",
        ]));
        return;
      }
      if (has(t, "never mind", "forget it", "cancel", "stop that", "not now")) {
        speak(pick([
          "No worries. I'm here when you need me.",
          "All good. Just say the word.",
          "Got it — standing by.",
        ]));
        return;
      }

      // ── Encouragement / emotional support ────────────────────────────────
      if (has(t, "i'm tired", "im tired", "exhausted", "burned out", "i'm stressed", "im stressed", "overwhelmed", "struggling")) {
        speak(pick([
          `P Wal — I hear you. You're carrying a lot right now, and that's real. But hear this: ${getDailyVerse()} Rest isn't quitting. It's strategy.`,
          "Listen — you don't have to hold everything at once. Your agents are doing their part. You built this so it could run without you grinding yourself down. Take a breath. What do you actually need right now?",
          `Take a moment. ${getDailyVerse()} You're further along than you think. The mission is still moving.`,
        ]));
        return;
      }
      if (has(t, "motivate me", "inspire me", "push me", "encourage me", "i need motivation", "pump me up")) {
        speak(pick([
          `Alright — listen up. ${getDailyVerse()} That's not just a verse. That's a mandate. You are a pastor, a chef, a designer, and a builder. That combination doesn't exist anywhere else. Now move.`,
          `P Wal, most people pick one thing and struggle with it. You're running four and building your own infrastructure while you do it. That's not normal — that's exceptional. Don't forget what you're actually doing here.`,
          `You started. That's the hardest part and it's already done. The mission is clear, your agents are ready, and the Lord's got the rest. What are we executing on right now?`,
        ]));
        return;
      }
      if (has(t, "i'm good", "im good", "doing well", "feeling good", "i'm great", "im great", "blessed")) {
        speak(pick([
          "That's what I want to hear. Blessed and building — nothing better than that. What are we working on?",
          "Good. That energy is everything. Let's use it. What's the move?",
          "I love to hear that. God is good. Let's keep the momentum — what's next?",
        ]));
        return;
      }

      // ── Prayer / faith ───────────────────────────────────────────────────
      if (has(t, "pray for me", "say a prayer", "need prayer", "bless me", "word of prayer")) {
        speak(`P Wal, I speak this over you right now. ${getDailyVerse()} May every step you take today be ordered. May the work of your hands be blessed. Go in peace, and go with power. Amen.`);
        return;
      }

      // ── Help ────────────────────────────────────────────────────────────
      if (has(t, "help", "what can you do", "commands", "what do you know", "capabilities", "what are you")) {
        speak(
          "I'm your Chief of Staff. Talk to me like a person — ask for a status report, have me walk you through your agents, check the weather, pull up a project, read you scripture, or just have a conversation. I don't need specific commands. Just say what you need."
        );
        return;
      }

      // ── Who am I / identity ──────────────────────────────────────────────
      if (has(t, "who am i", "remind me", "what am i building", "what is this")) {
        speak("You're P Wal — pastor, chef, designer, builder. This is your command center: four active agents, all running their missions. You built this from scratch. Don't ever lose sight of what that means.");
        return;
      }

      // ── Conversation mode ────────────────────────────────────────────────
      if (has(t, "conversation mode", "keep listening", "stay on", "hands free", "keep talking")) {
        conversationModeRef.current = true;
        speak("I'm with you. Keep talking — I'll stay right here.");
        return;
      }
      if (has(t, "stop listening", "go quiet", "go to sleep", "stand by", "that's all", "thats all", "goodbye", "good night", "bye")) {
        conversationModeRef.current = false;
        speak(pick([
          "Understood. I'll be right here when you need me. Have a good one, P Wal.",
          "Got it. Standing by. You know where to find me.",
          "Stepping back. Call me when you're ready. Stay blessed.",
        ]));
        recognitionRef.current?.stop();
        return;
      }

      // ── Introduce all agents ─────────────────────────────────────────────
      if (
        has(t, "introduce", "show me all", "show me my", "tell me about all", "list all", "list my",
               "show all", "show my", "all agents", "all projects", "present the",
               "walk me through", "take me through", "run me through", "walk through",
               "tell me about your", "brief me on", "run the agents", "read me",
               "show the team", "meet the agents", "meet the team", "agents") ||
        (has(t, "who") && has(t, "agent", "project", "running", "working"))
      ) {
        // Chain agents via onDone — never cuts off mid-sentence
        const introNext = (idx: number) => {
          if (idx >= projects.length) {
            setTimeout(() => onHighlightProject(null), 800);
            return;
          }
          const p = projects[idx];
          onHighlightProject(p.id);
          const fullLine = `${p.name}. ${p.title}. ${p.voiceIntro} Current progress: ${p.progress} percent. Status: ${p.status}.`;
          speak(fullLine, () => setTimeout(() => introNext(idx + 1), 700));
        };
        speak(
          pick([
            "Alright P Wal, let me walk you through your full command center.",
            "Copy that. Here's your complete team briefing.",
            "Standing by. Let me introduce every agent now.",
          ]),
          () => setTimeout(() => introNext(0), 500)
        );
        return;
      }

      // ── Status report ────────────────────────────────────────────────────
      if (
        has(t, "status", "report", "update", "how are things", "how's everything",
               "hows everything", "overview", "summary", "what's going on",
               "whats going on", "what's happening", "whats happening",
               "check in", "give me a rundown", "rundown", "how we doing",
               "how we looking", "how's it looking", "where are we")
      ) {
        const active = projects.filter((p) => p.status === "Active");
        const avg = Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length);
        speak(pick([
          `Honestly? Things look solid. You've got ${active.length} agents running, averaging ${avg} percent across active missions. No red flags anywhere — you're in a good position.`,
          `${active.length} agents online, ${avg} percent average. It's clean, P Wal. Everything's holding. Keep doing what you're doing.`,
          `Quick rundown — ${active.length} active agents, mission progress at ${avg} percent overall. No issues. The work is moving.`,
        ]));
        return;
      }

      // ── Progress / how far along ─────────────────────────────────────────
      if (has(t, "how far", "how much progress", "progress overall", "overall progress", "how close", "percentage")) {
        const active = projects.filter((p) => p.status === "Active");
        const avg = Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length);
        speak(`Across all active missions, you're at ${avg} percent overall. ${projects.map(p => `${p.name} at ${p.progress}`).join(", ")} percent.`);
        return;
      }

      // ── Threat check ─────────────────────────────────────────────────────
      if (has(t, "threat", "security", "intrusion", "attack", "breach", "hack", "safe", "danger", "any issues", "all good")) {
        speak(pick([
          "Security sweep complete. No active intrusions. All perimeters are secure. You're clear, P Wal.",
          "All clear on the perimeter. No threats detected. Systems are secure.",
          "We're clean. No breaches, no flags. Command center is locked down tight.",
        ]));
        return;
      }

      // ── Time ─────────────────────────────────────────────────────────────
      if (has(t, "what time", "time is it", "current time", "tell me the time", "what's the time")) {
        speak(`It's ${getTimeString()} right now.`);
        return;
      }

      // ── Date ─────────────────────────────────────────────────────────────
      if (has(t, "what day", "what's today", "today's date", "what date")) {
        const d = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
        speak(`Today is ${d}.`);
        return;
      }

      // ── Weather ──────────────────────────────────────────────────────────
      if (has(t, "weather", "temperature", "outside", "forecast", "how's the weather", "what's it like outside")) {
        fetchWeather().then((w) => speak(`Outside right now you've got ${w}.`));
        return;
      }

      // ── Scripture ────────────────────────────────────────────────────────
      if (has(t, "scripture", "verse", "word of the day", "bible", "the word", "read me a verse", "give me a verse")) {
        speak(`Here's your word. ${getDailyVerse()}`);
        return;
      }

      // ── Schedule / what's next ────────────────────────────────────────────
      if (has(t, "what's next", "whats next", "what should i do", "schedule", "what's on", "agenda", "what's my", "what time is")) {
        const h = new Date().getHours();
        let next = "";
        if (h < 9)  next = "You've got morning prep and commute coming up at 7. Then your 9-to-5 shift at 9.";
        else if (h < 17) next = `You're in your work shift right now. Free time starts at 5 PM — that's ${17 - h} hour${17 - h !== 1 ? "s" : ""} away.`;
        else if (h < 19) next = "You're in family time right now. Ministry hour starts at 7 PM.";
        else if (h < 21) next = "Ministry hour is active. Chef Studio window opens at 8:30.";
        else if (h < 22) next = "Chef Studio window is active. Design Atelier opens at 10 PM.";
        else next = "Design Atelier is your window right now. Rest starts at 11:30.";
        speak(next);
        return;
      }

      // ── Specific project by name ──────────────────────────────────────────
      const matchedProject = projects.find((p) => {
        const name = p.name.toLowerCase();
        const id = p.id.toLowerCase();
        const idSpaced = p.id.replace(/-/g, " ").toLowerCase();
        const words = name.split(" ");
        return (
          t.includes(name) || t.includes(id) || t.includes(idSpaced) ||
          words.some(w => w.length > 3 && t.includes(w))
        );
      });

      if (matchedProject && has(t, "open", "launch", "start", "go to", "take me to", "show me", "run", "visit", "pull up", "load")) {
        speak(`Opening ${matchedProject.name} now.`);
        setTimeout(() => window.open(matchedProject.url, "_blank"), 1000);
        return;
      }

      if (matchedProject && has(t, "how is", "how's", "hows", "doing", "progress", "update on", "status of", "what about", "tell me about", "how far", "where is")) {
        speak(
          `${matchedProject.name} is at ${matchedProject.progress} percent. Status: ${matchedProject.status}. Last activity was ${matchedProject.lastActivity}.`
        );
        return;
      }

      if (matchedProject) {
        speak(matchedProject.voiceIntro);
        onHighlightProject(matchedProject.id);
        setTimeout(() => onHighlightProject(null), 5000);
        return;
      }

      // ── Smart fallback ────────────────────────────────────────────────────
      const active = projects.filter((p) => p.status === "Active");
      const avg = Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length);
      if (has(t, "how", "what", "where", "when", "tell", "show", "give")) {
        speak(pick([
          `I want to help — can you be a bit more specific? We've got ${active.length} agents at ${avg} percent. Tell me what exactly you need.`,
          "Say it again — I want to make sure I actually answer your question, not just give you something generic.",
          `Give me a little more to work with and I'll get you exactly what you need.`,
        ]));
      } else if (t.length < 8) {
        speak(pick([
          "I heard something but I'm not sure what you need. Say a bit more.",
          "I'm with you — what are you asking?",
        ]));
      } else {
        speak(pick([
          `I'm not sure I caught that clearly. You can ask about any of your agents, the schedule, the weather — or just have a conversation. Talk to me naturally.`,
          `Didn't quite catch that. Try asking about your status, your agents, or just say what's on your mind.`,
          `Say that again — I want to get it right. Or ask me anything — I'm here.`,
        ]));
      }
    },
    [projects, onHighlightProject, speak]
  );

  // Keep processCommandRef in sync so rec.onresult never goes stale
  processCommandRef.current = processCommand;

  return { speak, greet, startListening, stopListening, toggleConversationMode, wakeAndListen, listening, speaking };
}
