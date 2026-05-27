import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { projectsData } from "./data/projects";
import AgentCard from "./components/AgentCard";
import HUDSphere from "./components/HUDSphere";
import StatusBar from "./components/StatusBar";
import VoicePanel from "./components/VoicePanel";
import { useClapDetect } from "./hooks/useClapDetect";
import { useVoiceAssistant } from "./hooks/useVoiceAssistant";
import "./index.css";

const STATS = {
  total: projectsData.length,
  active: projectsData.filter((p) => p.status === "Active").length,
  avg: Math.round(
    projectsData.reduce((s, p) => s + p.progress, 0) / projectsData.length
  ),
};

export default function App() {
  const [sleeping, setSleeping] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [voicePanelVisible, setVoicePanelVisible] = useState(false);
  const [wakeRipple, setWakeRipple] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVoiceResponse = useCallback((text: string) => {
    setVoiceText(text);
    setVoicePanelVisible(true);
    const hideAfter = Math.max(4000, text.length * 55);
    setTimeout(() => setVoicePanelVisible(false), hideAfter);
  }, []);

  const { speak, greet, startListening, stopListening, listening } =
    useVoiceAssistant({
      projects: projectsData,
      onHighlightProject: setHighlightedId,
      onVoiceResponse: handleVoiceResponse,
    });

  const wake = useCallback(() => {
    if (sleeping) {
      setSleeping(false);
      setWakeRipple(true);
      setMicActive(true);
      setTimeout(() => setWakeRipple(false), 1200);
      setTimeout(() => greet(), 700);
    } else {
      startListening();
    }
  }, [sleeping, greet, startListening]);

  // Clap-to-wake
  useClapDetect({ onDoubleclap: wake, enabled: true });

  // Auto-sleep after 5 min inactivity
  const resetSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    sleepTimerRef.current = setTimeout(() => setSleeping(true), 5 * 60 * 1000);
  }, []);

  useEffect(() => {
    if (sleeping) return;
    resetSleepTimer();
    window.addEventListener("mousemove", resetSleepTimer);
    window.addEventListener("keydown", resetSleepTimer);
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      window.removeEventListener("mousemove", resetSleepTimer);
      window.removeEventListener("keydown", resetSleepTimer);
    };
  }, [sleeping, resetSleepTimer]);

  const orbData = useMemo(
    () => projectsData.map((p) => ({ id: p.id, color: p.color })),
    []
  );

  const statBlocks = useMemo(
    () => [
      { label: "AGENTS", value: String(STATS.total) },
      { label: "ACTIVE", value: String(STATS.active) },
      { label: "AVG PROGRESS", value: `${STATS.avg}%` },
      { label: "THREATS", value: "NONE" },
    ],
    []
  );

  return (
    <div
      className={`os-shell${sleeping ? " os-shell--sleeping" : ""}`}
      onClick={() => sleeping && wake()}
    >
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
              <div className="sleep-logo__mark">J</div>
              <span className="sleep-logo__text">JAHDA OS</span>
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

          {/* Spinning ring overlay */}
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
            className={`voice-btn${listening ? " voice-btn--active" : ""}`}
            onClick={listening ? stopListening : startListening}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {listening ? "■ Stop" : "🎙 Voice Command"}
          </motion.button>

          <motion.button
            className="voice-btn voice-btn--secondary"
            onClick={() =>
              speak(
                `All systems nominal. ${STATS.active} agents online. Average mission progress: ${STATS.avg} percent. No critical threats detected.`
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
              let delay = 0;
              projectsData.forEach((p, i) => {
                setTimeout(() => {
                  setHighlightedId(p.id);
                  speak(p.voiceIntro);
                }, delay);
                delay += 4500 + i * 200;
              });
              setTimeout(() => setHighlightedId(null), delay + 2000);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🤖 Introduce Agents
          </motion.button>
        </motion.div>
      </main>

      <footer className="os-footer">
        <span>JAHDA OS · Built by Jahdaful · {new Date().getFullYear()}</span>
      </footer>

      {/* Voice response panel */}
      <VoicePanel text={voiceText} visible={voicePanelVisible} />
    </div>
  );
}
