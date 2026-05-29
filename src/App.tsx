import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { projectsData } from "./data/projects";
import AgentCard from "./components/AgentCard";
import HUDSphere from "./components/HUDSphere";
import StatusBar from "./components/StatusBar";
import VoicePanel from "./components/VoicePanel";
import Screensaver from "./components/Screensaver";
import CommandBoard, { MediaPanel } from "./components/CommandBoard";
import PlannerPage from "./components/PlannerPage";
import DesignAtelierPage from "./components/DesignAtelierPage";
import { useClapDetect } from "./hooks/useClapDetect";
import { useVoiceAssistant } from "./hooks/useVoiceAssistant";
import "./index.css";

// ── Mobile voice popout (top-right, mobile only) ──────────────────────────────
interface MobileVoicePopoutProps {
  listening: boolean;
  speaking: boolean;
  onVoiceCommand: () => void;
  onConversation: () => void;
  onStatusReport: () => void;
  onIntroduceAgents: () => void;
  onExpand: () => void;
  onRetract: () => void;
}

const VOICE_ITEMS = [
  { key: "voice",       emoji: "🎙", label: "Voice Command",    color: "#7c3aed" },
  { key: "convo",       emoji: "🔄", label: "Conversation",     color: "#22c55e" },
  { key: "status",      emoji: "📊", label: "Status Report",    color: "#d4af37" },
  { key: "agents",      emoji: "🤖", label: "Introduce Agents", color: "#f59e0b" },
  { key: "expand",      emoji: "📺", label: "Expand Desktop",   color: "#3b82f6" },
  { key: "retract",     emoji: "✕",  label: "Retract",          color: "#ff3333" },
];

function MobileVoicePopout({ listening, speaking, onVoiceCommand, onConversation, onStatusReport, onIntroduceAgents, onExpand, onRetract }: MobileVoicePopoutProps) {
  const [open, setOpen] = useState(false);

  const handlers: Record<string, () => void> = {
    voice:   onVoiceCommand,
    convo:   onConversation,
    status:  onStatusReport,
    agents:  onIntroduceAgents,
    expand:  onExpand,
    retract: onRetract,
  };

  const triggerColor = speaking ? "#22c55e" : listening ? "#d4af37" : "rgba(212,175,55,0.7)";

  return (
    <div className="mobile-voice-popout" style={{ position: "fixed", top: 56, right: 14, zIndex: 90 }}>
      {/* Trigger */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 14px",
          background: open ? "rgba(212,175,55,0.15)" : "rgba(6,5,10,0.88)",
          border: `1px solid ${open ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.2)"}`,
          borderRadius: 10,
          backdropFilter: "blur(20px)",
          cursor: "pointer",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: triggerColor,
        }}
      >
        {speaking ? (
          <motion.div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 13 }}>
            {[0,1,2].map(i => (
              <motion.div key={i} style={{ width: 3, background: "#22c55e", borderRadius: 2 }}
                animate={{ height: ["3px","11px","3px"] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }} />
            ))}
          </motion.div>
        ) : (
          <span style={{ fontSize: 13 }}>{listening ? "👂" : "🎙"}</span>
        )}
        <span>{speaking ? "Speaking…" : listening ? "Listening" : "Voice"}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ fontSize: 9, opacity: 0.5 }}>▼</motion.span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "rgba(6,5,10,0.96)",
                border: "1px solid rgba(212,175,55,0.15)",
                borderRadius: 14,
                backdropFilter: "blur(24px)",
                padding: 8,
                display: "flex", flexDirection: "column", gap: 3,
                minWidth: 200,
                boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
              }}
            >
              {VOICE_ITEMS.map(({ key, emoji, label, color }) => (
                <motion.button
                  key={key}
                  onClick={() => { handlers[key](); setOpen(false); }}
                  whileHover={{ background: "rgba(255,255,255,0.05)", x: 2 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 9,
                    cursor: "pointer", background: "transparent",
                    border: "none", width: "100%", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color, letterSpacing: "0.05em" }}>
                    {label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
            {/* click-outside */}
            <div style={{ position: "fixed", inset: 0, zIndex: -1 }} onClick={() => setOpen(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const STATS = {
  total: projectsData.length,
  active: projectsData.filter((p) => p.status === "Active").length,
  avg: Math.round(
    projectsData.reduce((s, p) => s + p.progress, 0) / projectsData.length
  ),
};


// Screensaver-only window mode (?screensaver in URL)
function ScreensaverWindow() {
  return <Screensaver visible={true} onWake={() => window.close()} />;
}

export default function App() {
  // Parse once — avoids 4× repeated URLSearchParams instantiation
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const isScreensaverMode = params.has("screensaver");

  const [sleeping, setSleeping] = useState(true);
  const [screensaver, setScreensaver] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [voicePanelVisible, setVoicePanelVisible] = useState(false);
  const [wakeRipple, setWakeRipple] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const screensaverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandedWindowsRef = useRef<Window[]>([]);

  const handleVoiceResponse = useCallback((text: string) => {
    setVoiceText(text);
    setVoicePanelVisible(true);
    const hideAfter = Math.max(4000, text.length * 55);
    setTimeout(() => setVoicePanelVisible(false), hideAfter);
  }, []);

  const { speak, greet, startListening, stopListening, toggleConversationMode, wakeAndListen, listening, speaking } =
    useVoiceAssistant({
      projects: projectsData,
      onHighlightProject: setHighlightedId,
      onVoiceResponse: handleVoiceResponse,
    });

  const dismissScreensaver = useCallback(() => {
    setScreensaver(false);
  }, []);

  const wake = useCallback(() => {
    setScreensaver(false);
    if (sleeping) {
      setSleeping(false);
      setWakeRipple(true);
      setMicActive(true);
      setTimeout(() => setWakeRipple(false), 1200);
      greet();
    } else {
      wakeAndListen(); // interrupt speech + snap to listening
    }
  }, [sleeping, greet, wakeAndListen]);

  // Double clap → wake / interrupt. Voice interrupt → stop agent mid-sentence.
  useClapDetect({
    onDoubleclap: wake,
    onVoiceInterrupt: wakeAndListen,
    interruptEnabled: speaking,
    enabled: true,
  });

  // Screensaver after 5 min of no mouse movement (only when awake)
  const resetScreensaverTimer = useCallback(() => {
    if (screensaverTimerRef.current) clearTimeout(screensaverTimerRef.current);
    screensaverTimerRef.current = setTimeout(
      () => setScreensaver(true),
      5 * 60 * 1000
    );
  }, []);

  useEffect(() => {
    if (sleeping) return;
    resetScreensaverTimer();
    const reset = () => {
      setScreensaver(false);
      resetScreensaverTimer();
    };
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    return () => {
      if (screensaverTimerRef.current) clearTimeout(screensaverTimerRef.current);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [sleeping, resetScreensaverTimer]);

  // Open full The Pwal OS desktop on the other monitors using Window Management API
  const expandToAllMonitors = useCallback(async () => {
    const base = window.location.origin + window.location.pathname + "?expanded";
    // popup=yes forces Chrome to open a window, not a tab
    const feat = (l: number, t: number, w: number, h: number) =>
      `popup=yes,left=${l},top=${t},width=${w},height=${h}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;

    if (!("getScreenDetails" in win)) {
      speak("Multi-monitor launch requires Chrome 100 or later. Open this page in Chrome, allow popups, then try again.");
      return;
    }

    // This triggers the Window Management permission prompt
    let details;
    try {
      details = await win.getScreenDetails();
    } catch {
      speak("Permission denied. When Chrome asks for Window Management access, click Allow, then try again.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const others: any[] = details.screens.filter((s: any) => !s.isPrimary);

    if (others.length === 0) {
      speak("No other screens detected. Make sure your extra monitors are connected and enabled in Windows display settings.");
      return;
    }

    // Only expand to the first non-primary display
    const target = others[0];
    expandedWindowsRef.current = [];
    let anyBlocked = false;
    const popup = window.open(base, "_blank", feat(target.left, target.top, target.availWidth, target.availHeight));
    if (popup) expandedWindowsRef.current.push(popup);
    else anyBlocked = true;

    if (anyBlocked) {
      speak("Popups are blocked. Click the popup blocked icon in the address bar, allow popups for this site, then try again.");
    }
  }, [speak]);

  const retractAllMonitors = useCallback(() => {
    expandedWindowsRef.current.forEach((w) => { if (!w.closed) w.close(); });
    expandedWindowsRef.current = [];
  }, []);

  const orbData = useMemo(
    () => projectsData.map((p) => ({ id: p.id, color: p.color })),
    []
  );

  const statBlocks = useMemo(
    () => [
      { label: "MISSIONS", value: String(STATS.total) },
      { label: "ACTIVE", value: String(STATS.active) },
      { label: "AVG PROGRESS", value: `${STATS.avg}%` },
      { label: "STATUS", value: "NOMINAL" },
    ],
    []
  );

  if (isScreensaverMode)       return <ScreensaverWindow />;
  if (params.has("expanded"))  return <CommandBoard />;
  if (params.has("planner"))   return <PlannerPage />;
  if (params.has("design"))    return <DesignAtelierPage />;

  return (
    <div
      className={`os-shell${sleeping ? " os-shell--sleeping" : ""}`}
      onClick={() => {
        if (sleeping) wake();
        else dismissScreensaver();
      }}
    >
      {/* Screensaver — activates after 5 min of no mouse movement */}
      <Screensaver visible={screensaver} onWake={dismissScreensaver} />

      {/* Wake ripple */}
      <AnimatePresence>
        {wakeRipple && (
          <motion.div
            className="wake-ripple"
            initial={{ scale: 0, opacity: 0.85 }}
            animate={{ scale: 10, opacity: 0 }}
            exit={{}}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Sleep overlay */}
      <AnimatePresence>
        {sleeping && (
          <motion.div
            className="sleep-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="sleep-logo"
              animate={{ opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="sleep-logo__mark">P</div>
              <span className="sleep-logo__text">THE PWAL OS</span>
            </motion.div>
            <motion.p
              className="sleep-hint"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              Double clap · Click to wake
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status bar */}
      <StatusBar micActive={micActive} listening={listening} sleeping={sleeping} />

      {/* Main content */}
      <main className="os-main">
        {/* ── HUD Sphere ───────────────────────── */}
        <motion.div
          className="hud-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: sleeping ? 0 : 1, scale: sleeping ? 0.8 : 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <HUDSphere orbs={orbData} highlightedId={highlightedId} />

          <div className="hud-overlay" aria-hidden="true">
            <motion.div
              className="hud-spin-ring"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="hud-spin-ring hud-spin-ring--reverse"
              animate={{ rotate: -360 }}
              transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            />
            <div className="hud-center-text">
              <span className="hud-label-top">SYSTEMS</span>
              <span className="hud-value">{STATS.active}</span>
              <span className="hud-label-bot">ONLINE</span>
            </div>
          </div>
        </motion.div>

        {/* ── Stats row ────────────────────────── */}
        <motion.div
          className="stats-row"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: sleeping ? 0 : 1, y: sleeping ? 24 : 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          {statBlocks.map((s) => (
            <div key={s.label} className="stat-block">
              <span className="stat-block__value">{s.value}</span>
              <span className="stat-block__label">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Agent Cards ───────────────────────── */}
        <section className="agents-section">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: sleeping ? 0 : 1, x: sleeping ? -20 : 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            Active Agents
          </motion.h2>

          <div className="agents-grid">
            {projectsData.map((project, i) => (
              <AgentCard
                key={project.id}
                project={project}
                index={i}
                highlighted={highlightedId === project.id}
                onVoiceIntro={(p) => speak(p.voiceIntro)}
              />
            ))}
          </div>
        </section>

        {/* ── Voice Controls ────────────────────── */}
        <motion.div
          className="voice-controls"
          initial={{ opacity: 0 }}
          animate={{ opacity: sleeping ? 0 : 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.button
            className={`voice-btn${listening ? " voice-btn--active" : ""}${speaking ? " voice-btn--speaking" : ""}`}
            onClick={listening ? stopListening : () => startListening()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {speaking ? "💬 Speaking…" : listening ? "■ Stop" : "🎙 Voice Command"}
          </motion.button>

          <motion.button
            className="voice-btn voice-btn--conversation"
            onClick={toggleConversationMode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Hands-free conversation — agent auto-listens after each response"
          >
            🔄 Conversation
          </motion.button>

          <motion.button
            className="voice-btn voice-btn--secondary"
            onClick={() =>
              speak(
                `You're looking good, P Wal. ${STATS.active} agents are online and you're averaging ${STATS.avg} percent across all missions. All clear.`
              )
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📊 Status Report
          </motion.button>

          <motion.button
            className="voice-btn voice-btn--secondary"
            onClick={() => {
              const next = (idx: number) => {
                if (idx >= projectsData.length) {
                  setTimeout(() => setHighlightedId(null), 800);
                  return;
                }
                const p = projectsData[idx];
                setHighlightedId(p.id);
                const line = `${p.name}. ${p.title}. ${p.voiceIntro} Progress: ${p.progress} percent.`;
                speak(line, () => setTimeout(() => next(idx + 1), 700));
              };
              speak("Let me walk you through your command center.", () => setTimeout(() => next(0), 400));
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🤖 Introduce Agents
          </motion.button>

          <motion.button
            className="voice-btn voice-btn--secondary"
            onClick={expandToAllMonitors}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Open The Pwal OS on monitors 2, 3 and 4"
          >
            📺 Expand Desktop
          </motion.button>

          <motion.button
            className="voice-btn voice-btn--danger"
            onClick={retractAllMonitors}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Close all expanded displays"
          >
            ✕ Retract
          </motion.button>
        </motion.div>
      </main>

      <footer className="os-footer">
        <span>THE PWAL OS · Pastor · Chef · Designer · {new Date().getFullYear()}</span>
      </footer>


      <MediaPanel />

      {/* Mobile voice popout — top right, hidden on desktop via CSS */}
      {!sleeping && (
        <MobileVoicePopout
          listening={listening}
          speaking={speaking}
          onVoiceCommand={() => listening ? stopListening() : startListening()}
          onConversation={toggleConversationMode}
          onStatusReport={() => speak(`You're looking good, P Wal. ${STATS.active} agents are online and you're averaging ${STATS.avg} percent across all missions. All clear.`)}
          onIntroduceAgents={() => {
            const next = (idx: number) => {
              if (idx >= projectsData.length) { setTimeout(() => setHighlightedId(null), 800); return; }
              const p = projectsData[idx];
              setHighlightedId(p.id);
              speak(`${p.name}. ${p.title}. ${p.voiceIntro} Progress: ${p.progress} percent.`, () => setTimeout(() => next(idx + 1), 700));
            };
            speak("Let me walk you through your command center.", () => setTimeout(() => next(0), 400));
          }}
          onExpand={expandToAllMonitors}
          onRetract={retractAllMonitors}
        />
      )}

      <VoicePanel text={voiceText} visible={voicePanelVisible} />
    </div>
  );
}
