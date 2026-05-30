import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "../data/projects";
import {
  processInput,
  getDailyVerse,
  getTimeString,
  type ConversationTurn,
} from "../conversationEngine";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any;

interface Options {
  projects: Project[];
  onHighlightProject: (id: string | null) => void;
  onVoiceResponse: (text: string) => void;
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
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

function pingTTS(synth: SpeechSynthesis) {
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0; u.rate = 10;
  synth.speak(u);
}

const SILENCE_PROMPTS = ["I'm listening.", "Go ahead.", "Take your time."];

export function useVoiceAssistant({ projects, onHighlightProject, onVoiceResponse }: Options) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [listenTrigger, setListenTrigger] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;
  const conversationModeRef = useRef(false);
  const startListeningRef = useRef<(override?: boolean) => void>(() => {});
  const wakeAndListenRef = useRef<() => void>(() => {});
  const historyRef = useRef<ConversationTurn[]>([]);
  const speakingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Keep TTS engine alive — Chrome freezes synthesis after ~15 min idle or in background
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (!synth.speaking) pingTTS(synth);
    }, 5 * 60 * 1000);

    function onVisible() {
      if (document.visibilityState === "visible") {
        synth.cancel();
        setTimeout(() => pingTTS(synth), 300);
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [synth]);

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
    utt.rate = 1.05;
    utt.pitch = 0.88;
    utt.volume = 1;
    const v = getVoiceRef.current();
    if (v) utt.voice = v;
    return utt;
  }, []);

  const speakQueue = useCallback(
    (segments: string[], onDone?: () => void) => {
      synth.cancel();
      setSpeaking(true);
      speakingRef.current = true;
      onVoiceResponse(segments.join(" "));

      const enqueue = (i: number) => {
        if (i >= segments.length) {
          setSpeaking(false);
          speakingRef.current = false;
          onDone?.();
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
    conversationModeRef.current = true;
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
    ]);
    setListenTrigger(v => v + 1);
  }, [speakQueue, projects]);

  const startListening = useCallback((override = false) => {
    if (speaking && !override) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR: SpeechRecognitionCtor | undefined = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      onVoiceResponse("Voice recognition not available in this browser.");
      return;
    }

    recognitionRef.current?.stop();

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setListening(true);
      if (conversationModeRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          if (!speakingRef.current && conversationModeRef.current) {
            speak(SILENCE_PROMPTS[Math.floor(Math.random() * SILENCE_PROMPTS.length)]);
          }
        }, 3000);
      }
    };

    rec.onend = () => {
      clearSilenceTimer();
      setListening(false);
      if (conversationModeRef.current && recognitionRef.current === rec) {
        setTimeout(() => startListeningRef.current(false), 400);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      clearSilenceTimer();
      const err: string = e.error ?? "";
      setListening(false);
      if (err === "not-allowed" || err === "service-not-allowed") {
        setPermissionDenied(true);
        speak("Microphone access is blocked. Please allow microphone permission in your browser settings, then refresh the page.");
        return;
      }
      if (err === "audio-capture") {
        speak("No microphone detected. Please connect a microphone and try again.");
        return;
      }
      if (err === "network") {
        speak("Voice recognition requires an internet connection.");
        return;
      }
      // no-speech or aborted — restart silently in conversation mode
      if (conversationModeRef.current && recognitionRef.current === rec) {
        setTimeout(() => startListeningRef.current(false), 600);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      clearSilenceTimer();
      if (window.speechSynthesis.speaking) return;
      const last = e.results[e.results.length - 1];
      if (last && last.isFinal) processCommandRef.current(last[0].transcript);
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* already starting */ }
  }, [speaking, onVoiceResponse, speak, clearSilenceTimer]);

  // Start listening when greeting finishes — state trigger guarantees fresh closure
  useEffect(() => {
    if (listenTrigger > 0) startListening(true);
  }, [listenTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  startListeningRef.current = startListening;

  const stopListening = useCallback(() => {
    conversationModeRef.current = false;
    clearSilenceTimer();
    recognitionRef.current?.stop();
    setListening(false);
  }, [clearSilenceTimer]);

  const toggleConversationMode = useCallback(() => {
    const next = !conversationModeRef.current;
    conversationModeRef.current = next;
    if (next) {
      speak("Conversation mode on. I'm listening.", () => {
        setTimeout(() => startListeningRef.current(), 150);
      });
    } else {
      synth.cancel();
      clearSilenceTimer();
      recognitionRef.current?.stop();
      setSpeaking(false);
      setListening(false);
    }
  }, [speak, synth, clearSilenceTimer]);

  const askClaude = useCallback(async (transcript: string) => {
    try {
      const context = {
        projects: projects.map(p => ({
          name: p.name, title: p.title, description: p.description,
          progress: p.progress, status: p.status,
        })),
      };
      const claudeHistory = historyRef.current.slice(-6).map(t => ({
        role: t.role === "jarvis" ? "assistant" : "user" as const,
        content: t.text,
      }));
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: transcript, history: claudeHistory, context }),
      });
      if (!res.ok) throw new Error("API error");
      const { response } = await res.json();
      if (!response) throw new Error("Empty response");
      historyRef.current = [
        ...historyRef.current,
        { role: "user" as const, text: transcript, timestamp: Date.now() },
        { role: "jarvis" as const, text: response, timestamp: Date.now() + 1 },
      ].slice(-20);
      speak(response);
    } catch {
      speak("I'm having trouble reaching my thinking engine right now. Try again in a moment, P Wal.");
    }
  }, [projects, speak]);

  // Stable ref so rec.onresult never goes stale
  const processCommandRef = useRef((_transcript: string) => {});

  const processCommand = useCallback(
    (transcript: string) => {
      const t = transcript.toLowerCase().trim();
      const pick = (opts: string[]) => opts[Math.floor(Math.random() * opts.length)];

      // ── Wake word / summon ────────────────────────────────────────────────
      if (
        !speakingRef.current && (
          t === "assistant" || t === "agent" || t === "cos" || t === "chief" ||
          has(t, "hey assistant", "ok assistant", "okay assistant", "hi assistant",
                 "yo assistant", "hey agent", "hey cos", "yo cos", "hey chief",
                 "chief of staff", "pwal os", "p wal",
                 "are you there", "you there", "you listening", "you awake",
                 "stop talking", "stop and listen", "be quiet", "quiet")
        )
      ) {
        wakeAndListenRef.current();
        return;
      }

      // ── Conversation mode toggles ──────────────────────────────────────────
      if (has(t, "conversation mode", "keep listening", "stay on", "hands free", "keep talking")) {
        conversationModeRef.current = true;
        speak("I'm with you. Keep talking — I'll stay right here.");
        return;
      }
      if (has(t, "stop listening", "go quiet", "go to sleep", "stand by")) {
        conversationModeRef.current = false;
        speak(pick([
          "Understood. I'll be right here when you need me. Have a good one, P Wal.",
          "Got it. Standing by. You know where to find me.",
          "Stepping back. Call me when you're ready. Stay blessed.",
        ]));
        recognitionRef.current?.stop();
        return;
      }

      // ── Weather (local async — skip engine round-trip) ────────────────────
      if (has(t, "weather", "temperature", "outside", "forecast", "how's the weather", "what's it like outside")) {
        fetchWeather().then((w) => speak(`Outside right now you've got ${w}.`));
        return;
      }

      // ── Schedule / what's next ─────────────────────────────────────────────
      if (has(t, "what's next", "whats next", "what should i do", "schedule", "what's on", "agenda")) {
        const h = new Date().getHours();
        let next = "";
        if (h < 9)  next = "You've got morning prep coming up. Then your 9-to-5 shift at 9.";
        else if (h < 17) next = `You're in your work shift right now. Free time starts at 5 PM — that's ${17 - h} hour${17 - h !== 1 ? "s" : ""} away.`;
        else if (h < 19) next = "You're in family time right now. Ministry hour starts at 7 PM.";
        else if (h < 21) next = "Ministry hour is active. Chef Studio window opens at 8:30.";
        else if (h < 22) next = "Chef Studio window is active. Design Atelier opens at 10 PM.";
        else next = "Design Atelier is your window right now. Rest starts at 11:30.";
        speak(next);
        return;
      }

      // ── Conversation engine ────────────────────────────────────────────────
      const result = processInput(transcript, historyRef.current, projects);

      if (result.confidence === "low") {
        askClaude(transcript);
        return;
      }

      // Track history (max 10 exchanges = 20 turns)
      const now = Date.now();
      historyRef.current = [
        ...historyRef.current,
        { role: "user" as const, text: transcript, timestamp: now },
        { role: "jarvis" as const, text: result.response, timestamp: now + 1 },
      ].slice(-20);

      // Execute action
      if (result.action) {
        const { type, url, projectId, durationMs } = result.action;
        if (type === "open-url" && url) {
          setTimeout(() => window.open(url, "_blank"), 1000);
        } else if (type === "highlight-project" && projectId) {
          onHighlightProject(projectId);
          setTimeout(() => onHighlightProject(null), durationMs ?? 5000);
        } else if (type === "introduce-all") {
          const introNext = (idx: number) => {
            if (idx >= projects.length) {
              setTimeout(() => onHighlightProject(null), 800);
              return;
            }
            const p = projects[idx];
            onHighlightProject(p.id);
            const line = `${p.name}. ${p.title}. ${p.voiceIntro} Current progress: ${p.progress} percent. Status: ${p.status}.`;
            speak(line, () => setTimeout(() => introNext(idx + 1), 700));
          };
          speak(result.response, () => setTimeout(() => introNext(0), 500));
          return;
        }
      }

      // Speak response — optional follow-up after a pause
      if (result.followUp) {
        speak(result.response, () => setTimeout(() => speak(result.followUp!), 800));
      } else {
        speak(result.response);
      }
    },
    [projects, onHighlightProject, speak, askClaude]
  );

  processCommandRef.current = processCommand;

  return { speak, greet, startListening, stopListening, toggleConversationMode, wakeAndListen, listening, speaking, permissionDenied };
}
