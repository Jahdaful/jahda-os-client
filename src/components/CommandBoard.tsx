import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { projectsData, WORK_SCHEDULE } from "../data/projects";
import type { Project } from "../data/projects";

function useTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function speak(text: string) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.88;
  utt.pitch = 0.65;
  utt.volume = 1;
  const pick = () => {
    const v = synth.getVoices().find(v =>
      v.name.toLowerCase().includes("daniel") ||
      v.name.toLowerCase().includes("david") ||
      v.name.toLowerCase().includes("alex") ||
      v.name.toLowerCase().includes("google uk english male")
    );
    if (v) utt.voice = v;
  };
  synth.getVoices().length ? pick() : synth.addEventListener("voiceschanged", pick, { once: true });
  synth.speak(utt);
}

// ── Globe canvas ──────────────────────────────────────────────────────────────
interface GlobeProps {
  selectedId: string | null;
  onOrbClick: (id: string) => void;
}

function GlobeCanvas({ selectedId, onOrbClick }: GlobeProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<{ id: string; x: number; y: number; r: number }[]>([]);
  const onOrbClickRef = useRef(onOrbClick);
  onOrbClickRef.current = onOrbClick;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let rot = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const o of orbsRef.current) {
        const dx = mx - o.x, dy = my - o.y;
        if (Math.sqrt(dx * dx + dy * dy) < o.r + 14) {
          onOrbClickRef.current(o.id);
          return;
        }
      }
    };
    canvas.addEventListener("click", handleClick);

    // Particles
    const pts: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    for (let i = 0; i < 80; i++) pts.push({ x: Math.random() * 2000, y: Math.random() * 1200, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.25 + 0.05 });

    function project(lat: number, lng: number, R: number, cx: number, cy: number, rotation: number) {
      const phi = (lat * Math.PI) / 180;
      const theta = (lng * Math.PI) / 180 + rotation;
      return {
        x: cx + R * Math.cos(phi) * Math.cos(theta),
        y: cy - R * Math.sin(phi),
        z: R * Math.cos(phi) * Math.sin(theta),
      };
    }

    const orbLngLat = [
      { lat: 35, lng: 30 }, { lat: -10, lng: 130 },
      { lat: 55, lng: -50 }, { lat: -35, lng: -110 },
    ];

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.42, cy = H * 0.5;
      const R = Math.min(W, H) * 0.28;

      // Particles
      for (const p of pts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.a})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }

      // Globe glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
      glow.addColorStop(0, "rgba(180,130,20,0.1)"); glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2); ctx.fill();

      // Latitude rings
      for (let lat = -75; lat <= 75; lat += 15) {
        const pts2: { x: number; y: number; z: number }[] = [];
        for (let lng = -180; lng <= 180; lng += 4) pts2.push(project(lat, lng, R, cx, cy, rot));
        ctx.beginPath();
        pts2.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = "rgba(212,175,55,0.1)"; ctx.lineWidth = 0.7; ctx.stroke();
      }

      // Longitude lines
      for (let lng = 0; lng < 360; lng += 20) {
        const pts2: { x: number; y: number; z: number }[] = [];
        for (let lat = -90; lat <= 90; lat += 3) pts2.push(project(lat, lng, R, cx, cy, rot));
        for (let i = 0; i < pts2.length - 1; i++) {
          const a = pts2[i], b = pts2[i + 1];
          const alpha = (a.z > 0 && b.z > 0) ? 0.12 : 0.03;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,212,255,${alpha})`; ctx.lineWidth = 0.6; ctx.stroke();
        }
      }

      // Edge ring
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      const edgeG = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      edgeG.addColorStop(0, "rgba(180,130,20,0.5)"); edgeG.addColorStop(0.5, "rgba(212,175,55,0.15)"); edgeG.addColorStop(1, "rgba(180,130,20,0.5)");
      ctx.strokeStyle = edgeG; ctx.lineWidth = 1.2; ctx.stroke();

      // Outer dashed rings
      [R * 1.15, R * 1.35].forEach((rr, ri) => {
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212,175,55,${ri === 0 ? 0.07 : 0.04})`; ctx.lineWidth = 1;
        ctx.setLineDash([4, 10]); ctx.stroke(); ctx.setLineDash([]);
      });

      // Project orbs
      const newOrbs: typeof orbsRef.current = [];
      projectsData.forEach((p, i) => {
        const pos = project(orbLngLat[i].lat, orbLngLat[i].lng, R, cx, cy, rot);
        const visible = pos.z > -R * 0.1;
        const alpha = visible ? Math.max(0.25, (pos.z / R + 1) / 2) : 0;
        const orbR = 9 * (visible ? alpha : 0.3);
        const isSelected = selectedId === p.id;

        newOrbs.push({ id: p.id, x: pos.x, y: pos.y, r: orbR });

        if (isSelected) {
          // Pulse ring around selected
          ctx.beginPath(); ctx.arc(pos.x, pos.y, orbR + 14 + Math.sin(Date.now() * 0.005) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = p.color + "99"; ctx.lineWidth = 1.5; ctx.stroke();
        }

        ctx.beginPath(); ctx.arc(pos.x, pos.y, orbR, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = alpha;
        ctx.shadowBlur = isSelected ? 40 : 18; ctx.shadowColor = p.color;
        ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;

        if (visible && pos.z > 0) {
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.85})`;
          ctx.font = `${isSelected ? "700" : "600"} 10px 'Space Grotesk', sans-serif`;
          ctx.fillText(p.name, pos.x + orbR + 6, pos.y + 4);
        }
      });
      orbsRef.current = newOrbs;

      rot += 0.003;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("resize", resize);
    };
  }, [selectedId]);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, cursor: "crosshair" }} />;
}

// ── Mission strip ─────────────────────────────────────────────────────────────
function MissionStrip({ project, index, selected, onClick }: {
  project: Project; index: number; selected: boolean; onClick: () => void;
}) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / 1400, 1);
        setPct(Math.round((1 - Math.pow(1 - p, 3)) * project.progress));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, index * 200 + 600);
    return () => clearTimeout(t);
  }, [project.progress, index]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      whileHover={{ scale: 1.02, x: -4 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 18px",
        background: selected
          ? `linear-gradient(90deg, ${project.color}22 0%, ${project.color}08 100%)`
          : `linear-gradient(90deg, ${project.color}0f 0%, transparent 100%)`,
        border: `1px solid ${selected ? project.color + "55" : project.color + "18"}`,
        borderLeft: `3px solid ${project.color}`,
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.2s, border-color 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {selected && (
        <motion.div
          style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at left, ${project.color}12 0%, transparent 70%)`, pointerEvents: "none" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <motion.div
        style={{ width: 8, height: 8, borderRadius: "50%", background: project.color, flexShrink: 0 }}
        animate={{ opacity: [1, 0.3, 1], boxShadow: [`0 0 6px ${project.color}`, `0 0 2px ${project.color}`, `0 0 6px ${project.color}`] }}
        transition={{ duration: 1.8 + index * 0.3, repeat: Infinity }}
      />
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: selected ? "#fff" : "rgba(255,255,255,0.65)", whiteSpace: "nowrap", minWidth: 130 }}>
        {project.name}
      </span>
      <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 1, overflow: "hidden" }}>
        <motion.div style={{ height: "100%", background: project.color, borderRadius: 1 }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, delay: index * 0.2 + 0.6, ease: "easeOut" }} />
      </div>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 800, color: project.color, minWidth: 38, textAlign: "right" }}>
        {pct}%
      </span>
    </motion.div>
  );
}

// ── Project detail panel ──────────────────────────────────────────────────────
function ProjectPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)",
        zIndex: 10, width: 480,
        background: "rgba(0,0,12,0.92)",
        border: `1px solid ${project.color}44`,
        borderTop: `2px solid ${project.color}`,
        borderRadius: 12,
        backdropFilter: "blur(20px)",
        overflow: "hidden",
        boxShadow: `0 0 60px ${project.color}18, 0 20px 60px rgba(0,0,0,0.8)`,
      }}
    >
      {/* Glow strip */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${project.color}88, transparent)` }} />

      <div style={{ padding: "22px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <motion.div style={{ width: 9, height: 9, borderRadius: "50%", background: project.color, boxShadow: `0 0 10px ${project.color}` }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: "0.15em", color: "#fff" }}>
                {project.name}
              </span>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>
              {project.techTag}
            </span>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, width: 28, height: 28, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Description */}
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 18 }}>
          {project.description}
        </p>

        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em" }}>PROGRESS</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 800, color: project.color }}>{project.progress}%</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 1, ease: "easeOut" }}
              style={{ height: "100%", background: `linear-gradient(90deg, ${project.color}, ${project.color}aa)`, borderRadius: 2 }} />
          </div>
        </div>

        {/* Meta grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginBottom: 20 }}>
          {[
            { label: "STATUS", value: project.status, color: "#22c55e" },
            { label: "BUGS", value: project.bugs === 0 ? "✓ Clear" : `${project.bugs} open`, color: project.bugs === 0 ? "#22c55e" : "#ff3333" },
            { label: "BRANCH", value: project.branch, color: "rgba(255,255,255,0.6)" },
            { label: "UPDATED", value: project.lastActivity, color: "rgba(255,255,255,0.4)" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)", marginBottom: 3 }}>{label}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <motion.button
            onClick={() => speak(project.voiceIntro)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer",
              background: `${project.color}22`, border: `1px solid ${project.color}44`,
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.12em", color: project.color,
            }}
          >
            🎙 BRIEF ME
          </motion.button>
          <motion.a
            href={project.url} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer",
              background: project.color, border: "none",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.12em", color: "#fff", textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            LAUNCH →
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function Ticker() {
  const msgs = ["ALL SYSTEMS NOMINAL", "THREAT LEVEL · NONE", `${projectsData.filter(p => p.status === "Active").length} AGENTS ACTIVE`, "PERIMETER SECURE", "MINISTRY HUB · CLEAR", "CHEF STUDIO · STANDBY", "NO INTRUSIONS DETECTED", "THE PWAL OS · PASTOR · CHEF · DESIGNER · LIVE"];
  const text = msgs.join("   ◆   ") + "   ◆   ";
  return (
    <div style={{ overflow: "hidden", padding: "8px 0", borderTop: "1px solid rgba(212,175,55,0.07)" }}>
      <motion.div
        style={{ display: "inline-block", whiteSpace: "nowrap", fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: "0.25em", color: "rgba(212,175,55,0.4)" }}
        animate={{ x: ["0%", "-50%"] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >{text}{text}</motion.div>
    </div>
  );
}

// ── Life Planner Panel ───────────────────────────────────────────────────────

function PlannerPanel() {
  const now = useTime();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const isWorkDay = WORK_SCHEDULE.workDays.includes(day);
  const isWorkHours = isWorkDay && hour >= WORK_SCHEDULE.workStart && hour < WORK_SCHEDULE.workEnd;
  const timeDecimal = hour + minute / 60;

  type Block = { label: string; icon: string; color: string; note: string };

  function getCurrentBlock(): Block {
    if (isWorkHours) {
      return { label: "9-TO-5 SHIFT", icon: "💼", color: "#f59e0b", note: "Work mode active — personal projects on hold" };
    }
    if (hour >= 17 && hour < 19) {
      return { label: "TRANSITION", icon: "🌅", color: "#f97316", note: "Wind down from work — family time" };
    }
    if (hour >= 19 && hour < 21) {
      return { label: "MINISTRY HOUR", icon: "✝️", color: "#ff3333", note: "Sermon prep, congregation outreach, prayer" };
    }
    if (hour >= 21 || hour < 6) {
      return { label: "REST & FAMILY", icon: "🏡", color: "#22c55e", note: "Protected family and rest time" };
    }
    if (!isWorkDay && hour >= 9 && hour < 14) {
      return { label: "CHEF WINDOW", icon: "👨‍🍳", color: "#00d4ff", note: "Culinary work — recipes, prep, bookings" };
    }
    if (!isWorkDay && hour >= 14 && hour < 18) {
      return { label: "DESIGN WINDOW", icon: "🎨", color: "#a855f7", note: "Design projects, client work, creativity" };
    }
    return { label: "OPEN TIME", icon: "⚡", color: "#d4af37", note: "Flexible — ministry, design, or family" };
  }

  const block = getCurrentBlock();

  // Work day progress bar
  const workProgress = isWorkHours
    ? Math.round(((timeDecimal - WORK_SCHEDULE.workStart) / (WORK_SCHEDULE.workEnd - WORK_SCHEDULE.workStart)) * 100)
    : isWorkDay && hour >= WORK_SCHEDULE.workEnd ? 100 : 0;

  const hoursUntilFree = isWorkHours
    ? Math.round((WORK_SCHEDULE.workEnd - timeDecimal) * 10) / 10
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
      style={{
        position: "fixed", top: "50%", left: 40,
        transform: "translateY(-50%)",
        zIndex: 5, width: 290,
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.28em", color: "rgba(212,175,55,0.75)", marginBottom: 2, textTransform: "uppercase", fontWeight: 700 }}>
        Life Planner · Now
      </div>

      {/* Current block */}
      <motion.div
        style={{
          padding: "16px 18px",
          background: `linear-gradient(135deg, ${block.color}18 0%, transparent 100%)`,
          border: `1px solid ${block.color}44`,
          borderLeft: `3px solid ${block.color}`,
          borderRadius: 8,
        }}
        animate={{ borderColor: [`${block.color}44`, `${block.color}88`, `${block.color}44`] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{block.icon}</span>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: "0.15em", color: block.color }}>
              {block.label}
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", marginTop: 3 }}>
              {block.note}
            </div>
          </div>
        </div>

        {isWorkHours && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em" }}>SHIFT PROGRESS</span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color: block.color }}>{hoursUntilFree}h left</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${workProgress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ height: "100%", background: block.color, borderRadius: 2 }}
              />
            </div>
          </>
        )}
      </motion.div>

      {/* Daily pillars */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {WORK_SCHEDULE.zones.map((z, i) => (
          <motion.div
            key={z.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.1 }}
            style={{
              padding: "12px 14px",
              background: `${z.color}14`,
              border: `1px solid ${z.color}40`,
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{z.icon}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 800, color: z.color, letterSpacing: "0.08em" }}>{z.label}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", marginTop: 3 }}>{z.hours}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Schedule tab ─────────────────────────────────────────────────────────────
function ScheduleView() {
  const now = useTime();
  const h = now.getHours();
  const m = now.getMinutes();
  const day = now.getDay();
  const isWorkDay = WORK_SCHEDULE.workDays.includes(day);
  const dayProgress = ((h * 60 + m) / (24 * 60)) * 100;

  const slots: { label: string; time: string; icon: string; color: string; active: boolean; note?: string }[] = [
    { label: "Morning Devotion", time: "05:00 – 07:00", icon: "🌅", color: "#f59e0b", active: h >= 5 && h < 7, note: "Prayer & Scripture" },
    { label: "Prep & Commute", time: "07:00 – 09:00", icon: "🚗", color: "#6b7280", active: h >= 7 && h < 9 },
    { label: isWorkDay ? "9-to-5 Employment" : "Rest Day", time: "09:00 – 17:00", icon: "💼", color: "#3b82f6", active: h >= 9 && h < 17, note: isWorkDay ? "Focus & Excel" : "Weekend — recharge" },
    { label: "Family Time", time: "17:00 – 19:00", icon: "🏡", color: "#f59e0b", active: h >= 17 && h < 19, note: "Dinner & presence" },
    { label: "Ministry Hour", time: "19:00 – 20:30", icon: "✝️", color: "#ff3333", active: h >= 19 && h < 21, note: "Pastoral duties" },
    { label: "Chef Studio", time: "20:30 – 22:00", icon: "👨‍🍳", color: "#00d4ff", active: h >= 20 && h < 22, note: "Culinary craft" },
    { label: "Design Atelier", time: "22:00 – 23:30", icon: "🎨", color: "#a855f7", active: h >= 22 && h < 24, note: "Creative work" },
    { label: "Rest & Recovery", time: "23:30 – 05:00", icon: "😴", color: "#475569", active: h >= 23 || h < 5, note: "Restore & renew" },
  ];

  const currentSlot = slots.find((s) => s.active);

  return (
    <div style={{ height: 240, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Day progress */}
      <div style={{ padding: "10px 14px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.18em", color: "rgba(212,175,55,0.6)", fontWeight: 700 }}>
            {isWorkDay ? "WORK DAY" : "WEEKEND"}
          </span>
          <span style={{ fontSize: 9, color: "rgba(212,175,55,0.5)", letterSpacing: "0.08em" }}>{dayProgress.toFixed(0)}% of day</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
          <motion.div
            style={{ height: "100%", background: "linear-gradient(90deg, #b8860b, #f0c060)", borderRadius: 2 }}
            initial={{ width: 0 }}
            animate={{ width: `${dayProgress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        {currentSlot && (
          <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
            <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: currentSlot.color }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <span style={{ fontSize: 9, color: currentSlot.color, fontWeight: 700, letterSpacing: "0.1em" }}>NOW: {currentSlot.label.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Slot list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 10px" }}>
        {slots.map((s) => (
          <div key={s.label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 0",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            opacity: s.active ? 1 : 0.35,
            transition: "opacity 0.3s",
          }}>
            <div style={{ width: 3, height: 28, borderRadius: 2, background: s.active ? s.color : "rgba(255,255,255,0.08)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: s.active ? "#fff" : "rgba(255,255,255,0.4)", letterSpacing: "0.07em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.label}
              </div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>{s.time}</div>
            </div>
            {s.note && s.active && (
              <span style={{ fontSize: 8, color: "rgba(212,175,55,0.6)", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>{s.note}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calendar tab ──────────────────────────────────────────────────────────────
function CalendarView() {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isWeekend = (cellIndex: number) => (cellIndex % 7 === 0 || cellIndex % 7 === 6);

  return (
    <div style={{ height: 280, display: "flex", flexDirection: "column", padding: "10px 12px" }}>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(212,175,55,0.5)", fontSize: 14, padding: "0 4px" }}>‹</button>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(212,175,55,0.85)", textTransform: "uppercase" }}>{monthLabel}</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(212,175,55,0.5)", fontSize: 14, padding: "0 4px" }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
          <div key={d} style={{ textAlign: "center", fontSize: 8, fontWeight: 700, letterSpacing: "0.05em", color: (i === 0 || i === 6) ? "rgba(255,100,100,0.35)" : "rgba(255,255,255,0.18)", padding: "2px 0" }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, flex: 1 }}>
        {cells.map((d, i) => {
          const isToday = isCurrentMonth && d === todayDate;
          const weekend = isWeekend(i);
          return (
            <div key={i} style={{
              textAlign: "center",
              fontSize: 9,
              padding: "3px 0",
              borderRadius: 4,
              fontWeight: isToday ? 900 : 400,
              background: isToday ? "rgba(212,175,55,0.22)" : "transparent",
              color: isToday ? "#f0c060" : d ? (weekend ? "rgba(255,150,150,0.35)" : "rgba(255,255,255,0.5)") : "transparent",
              boxShadow: isToday ? "0 0 10px rgba(212,175,55,0.35)" : "none",
              border: isToday ? "1px solid rgba(212,175,55,0.45)" : "1px solid transparent",
              cursor: d ? "default" : "default",
            }}>
              {d ?? ""}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 6, justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: 2, background: "rgba(212,175,55,0.6)" }} />
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>Today</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: 2, background: "rgba(255,100,100,0.3)" }} />
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>Weekend</span>
        </div>
      </div>
    </div>
  );
}

// ── Scripture tab ─────────────────────────────────────────────────────────────
const SCRIPTURES = [
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." },
  { ref: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
  { ref: "Proverbs 16:3", text: "Commit to the Lord whatever you do, and he will establish your plans." },
  { ref: "Psalm 23:1-3", text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul." },
  { ref: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  { ref: "Isaiah 40:31", text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint." },
  { ref: "Matthew 6:33", text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well." },
  { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
  { ref: "Colossians 3:23", text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters." },
  { ref: "Ephesians 2:10", text: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do." },
  { ref: "Proverbs 22:29", text: "Do you see someone skilled in their work? They will serve before kings; they will not serve before officials of low rank." },
  { ref: "2 Timothy 1:7", text: "For God has not given us a spirit of fear, but of power and of love and of a sound mind." },
  { ref: "Psalm 46:10", text: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth." },
  { ref: "1 Corinthians 10:31", text: "So whether you eat or drink or whatever you do, do it all for the glory of God." },
  { ref: "Joshua 1:9", text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." },
  { ref: "Psalm 37:4", text: "Take delight in the Lord, and he will give you the desires of your heart." },
  { ref: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God will guard your hearts and your minds in Christ Jesus." },
  { ref: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
  { ref: "John 15:5", text: "I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing." },
  { ref: "Lamentations 3:22-23", text: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness." },
];

const SCRIPTURE_INTERVAL = 5 * 60; // 5 minutes in seconds

function ScriptureView() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * SCRIPTURES.length));
  const [secondsLeft, setSecondsLeft] = useState(SCRIPTURE_INTERVAL);
  const [fading, setFading] = useState(false);

  const goTo = (newIdx: number) => {
    setFading(true);
    setTimeout(() => {
      setIdx(newIdx);
      setSecondsLeft(SCRIPTURE_INTERVAL);
      setFading(false);
    }, 400);
  };

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          goTo((idx + 1) % SCRIPTURES.length);
          return SCRIPTURE_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const scripture = SCRIPTURES[idx];
  const progress = ((SCRIPTURE_INTERVAL - secondsLeft) / SCRIPTURE_INTERVAL) * 100;
  const minsLeft = Math.floor(secondsLeft / 60);
  const secsLeft = secondsLeft % 60;

  return (
    <div style={{ height: 280, display: "flex", flexDirection: "column", padding: "12px 16px", gap: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(212,175,55,0.6)" }}>✝ WORD OF THE HOUR</span>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>
          {minsLeft}:{secsLeft.toString().padStart(2, "0")} until next
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "rgba(212,175,55,0.1)", borderRadius: 1, marginBottom: 14, overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", background: "linear-gradient(90deg, #b8860b, #f0c060)", borderRadius: 1 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </div>

      {/* Scripture text */}
      <motion.div
        animate={{ opacity: fading ? 0 : 1, y: fading ? 6 : 0 }}
        transition={{ duration: 0.35 }}
        style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        {/* Opening quote */}
        <div style={{ fontSize: 36, lineHeight: 0.6, color: "rgba(212,175,55,0.25)", fontFamily: "Georgia, serif", marginBottom: 6, marginLeft: -2 }}>"</div>

        {/* Verse text */}
        <p style={{
          fontSize: 11, lineHeight: 1.65, color: "rgba(255,255,255,0.82)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic", margin: 0, letterSpacing: "0.01em",
          display: "-webkit-box", WebkitLineClamp: 6,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {scripture.text}
        </p>

        {/* Reference */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.15)" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#d4af37", letterSpacing: "0.12em", fontFamily: "'Space Grotesk', sans-serif" }}>
            — {scripture.ref}
          </span>
        </div>
      </motion.div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <button
          onClick={() => goTo((idx - 1 + SCRIPTURES.length) % SCRIPTURES.length)}
          style={{ background: "none", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "rgba(212,175,55,0.6)", fontSize: 12, fontFamily: "'Space Grotesk', sans-serif" }}
        >‹ Prev</button>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
          {idx + 1} / {SCRIPTURES.length}
        </span>
        <button
          onClick={() => goTo((idx + 1) % SCRIPTURES.length)}
          style={{ background: "none", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "rgba(212,175,55,0.6)", fontSize: 12, fontFamily: "'Space Grotesk', sans-serif" }}
        >Next ›</button>
      </div>
    </div>
  );
}

// ── Active Agent resolver ─────────────────────────────────────────────────────
function getActiveAgent(now: Date) {
  const h = now.getHours();
  const day = now.getDay();
  const isWorkDay = WORK_SCHEDULE.workDays.includes(day);

  if (h >= 9 && h < 17 && isWorkDay) {
    return { name: "PWAL PLANNER", icon: "📅", color: "#22c55e", note: "Work hours — schedule active" };
  }
  if ((h >= 19 && h < 21) || (!isWorkDay && h >= 10 && h < 14)) {
    return { name: "MINISTRY HUB", icon: "✝️", color: "#ff3333", note: "Pastoral duties online" };
  }
  if ((h >= 20 && h < 22) || (!isWorkDay && h >= 14 && h < 18)) {
    return { name: "CHEF STUDIO", icon: "👨‍🍳", color: "#00d4ff", note: "Culinary agent active" };
  }
  if (h >= 22 || (!isWorkDay && h >= 18 && h < 22)) {
    return { name: "DESIGN ATELIER", icon: "🎨", color: "#a855f7", note: "Creative agent online" };
  }
  return { name: "PWAL PLANNER", icon: "📅", color: "#22c55e", note: "Standby — ready to assist" };
}

// ── Relax tab (Games + Dream Destinations) ───────────────────────────────────
const GAMES = [
  { label: "Chess",    icon: "♟️", url: "https://lichess.org/",              color: "#f59e0b" },
  { label: "Wordle",   icon: "🟩", url: "https://www.nytimes.com/games/wordle/index.html", color: "#22c55e" },
  { label: "2048",     icon: "🧩", url: "https://play2048.co/",              color: "#ff6b35" },
  { label: "Tetris",   icon: "🎮", url: "https://jstris.jezevec10.com/",     color: "#00d4ff" },
  { label: "Sudoku",   icon: "🔢", url: "https://sudoku.com/",               color: "#a855f7" },
  { label: "Solitaire",icon: "🃏", url: "https://www.solitr.com/",           color: "#d4af37" },
];

const DESTINATIONS = [
  { label: "Maldives",   icon: "🏝️", url: "https://www.visitmaldives.com/",         color: "#00d4ff", note: "Indian Ocean paradise" },
  { label: "Paris",      icon: "🗼", url: "https://www.parisinfo.com/",             color: "#f59e0b", note: "City of Lights, France" },
  { label: "Santorini",  icon: "🌅", url: "https://www.visitgreece.gr/",            color: "#3b82f6", note: "Greek island jewel" },
  { label: "Bali",       icon: "🌴", url: "https://www.bali-indonesia.com/",        color: "#22c55e", note: "Island of Gods, Indonesia" },
  { label: "Tokyo",      icon: "🏯", url: "https://www.gotokyo.org/en/",            color: "#ff4040", note: "Japan — culture & neon" },
  { label: "Safari",     icon: "🦁", url: "https://www.magicalkenya.com/",          color: "#f97316", note: "Kenya — wild Africa" },
  { label: "Dubai",      icon: "✈️", url: "https://www.visitdubai.com/",            color: "#d4af37", note: "UAE — ultimate luxury" },
  { label: "Amalfi",     icon: "🌊", url: "https://www.amalficoast.it/",            color: "#a855f7", note: "Italian coastal cliffs" },
];

function RelaxView() {
  const [section, setSection] = useState<"games" | "travel">("games");

  return (
    <div style={{ height: 280, display: "flex", flexDirection: "column" }}>
      {/* Section toggle */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {([["games", "🎮 GAMES"], ["travel", "✈️ TRAVEL"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={{
            flex: 1, padding: "6px 0", background: "transparent", border: "none",
            borderBottom: section === id ? "2px solid #d4af37" : "2px solid transparent",
            cursor: "pointer", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
            fontFamily: "'Space Grotesk', sans-serif",
            color: section === id ? "#d4af37" : "rgba(255,255,255,0.22)",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {section === "games" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {GAMES.map((g) => (
              <motion.button key={g.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => window.open(g.url, "_blank")}
                style={{ background: `${g.color}0c`, border: `1px solid ${g.color}28`, borderRadius: 8, padding: "9px 8px", cursor: "pointer", textAlign: "left", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 18 }}>{g.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: g.color, letterSpacing: "0.08em" }}>{g.label.toUpperCase()}</span>
              </motion.button>
            ))}
          </div>
        )}

        {section === "travel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {DESTINATIONS.map((d) => (
              <motion.button key={d.label} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                onClick={() => window.open(d.url, "_blank")}
                style={{ background: `${d.color}0a`, border: `1px solid ${d.color}20`, borderRadius: 7, padding: "7px 10px", cursor: "pointer", textAlign: "left", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: d.color, letterSpacing: "0.1em" }}>{d.label.toUpperCase()}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>{d.note}</div>
                </div>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>→</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sky Lounge ────────────────────────────────────────────────────────────────
const CHARTER_PLATFORMS = [
  { label: "NetJets",       icon: "✈️", url: "https://www.netjets.com/",                color: "#00d4ff", note: "World's largest private jet fleet" },
  { label: "VistaJet",      icon: "🛩️", url: "https://www.vistajet.com/",               color: "#d4af37", note: "Global membership · 300+ aircraft" },
  { label: "PrivateFly",    icon: "🌐", url: "https://www.privatefly.com/",             color: "#a855f7", note: "Instant quotes worldwide" },
  { label: "Wheels Up",     icon: "🔵", url: "https://wheelsup.com/",                   color: "#3b82f6", note: "Membership-based private aviation" },
  { label: "Air Charter",   icon: "📋", url: "https://www.aircharterservice.com/",      color: "#22c55e", note: "Largest charter broker globally" },
  { label: "Blade",         icon: "🏙️", url: "https://blade.com/",                     color: "#ff4040", note: "Urban air mobility + jets" },
];

const JET_FLEET = [
  { name: "Gulfstream G700",      icon: "🛫", range: "7,500 nm",  pax: "19 pax",  note: "Ultra-long range flagship" },
  { name: "Bombardier Global 7500",icon: "🌍", range: "7,700 nm",  pax: "19 pax",  note: "Longest range in class" },
  { name: "Dassault Falcon 10X",  icon: "⚡", range: "7,500 nm",  pax: "16 pax",  note: "Next-gen wide cabin" },
  { name: "Embraer Praetor 600",  icon: "💫", range: "4,000 nm",  pax: "12 pax",  note: "Super-midsize efficiency" },
];

function SkyLoungeView() {
  const [section, setSection] = useState<"hangar" | "charter">("hangar");

  return (
    <div style={{ height: 280, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        {([["hangar", "✈️ HANGAR"], ["charter", "📋 CHARTER"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={{
            flex: 1, padding: "8px 0", background: "transparent", border: "none",
            borderBottom: section === id ? "2px solid #00d4ff" : "2px solid transparent",
            cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            fontFamily: "'Space Grotesk', sans-serif",
            color: section === id ? "#00d4ff" : "rgba(255,255,255,0.4)",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
        {section === "hangar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(0,212,255,0.7)", fontWeight: 700, marginBottom: 2 }}>PWAL PRIVATE FLEET — DREAM HANGAR</div>
            {JET_FLEET.map((j) => (
              <div key={j.name} style={{ background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 26 }}>{j.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#00d4ff", letterSpacing: "0.06em" }}>{j.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{j.note}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#d4af37", fontWeight: 800 }}>{j.range}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{j.pax}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {section === "charter" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(0,212,255,0.7)", fontWeight: 700, marginBottom: 2 }}>BOOK A PRIVATE JET</div>
            {CHARTER_PLATFORMS.map((p) => (
              <motion.button key={p.label} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                onClick={() => window.open(p.url, "_blank")}
                style={{ background: `${p.color}10`, border: `1px solid ${p.color}30`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: p.color, letterSpacing: "0.08em" }}>{p.label.toUpperCase()}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{p.note}</div>
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>→</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Media Panel ──────────────────────────────────────────────────────────────
type PanelTab = "spotify" | "youtube" | "scripture" | "schedule" | "calendar" | "relax" | "skylounge";

function MediaPanelContent({ tab, setTab }: { tab: PanelTab; setTab: (t: PanelTab) => void }) {
  const now = useTime();
  const activeAgent = getActiveAgent(now);

  const tabs: { id: PanelTab; label: string; color: string }[] = [
    { id: "spotify",   label: "♫",  color: "#1db954" },
    { id: "youtube",   label: "▶",  color: "#ff4040" },
    { id: "scripture", label: "✝",  color: "#d4af37" },
    { id: "schedule",  label: "⏱", color: "#22c55e" },
    { id: "calendar",  label: "🗓", color: "#3b82f6" },
    { id: "relax",     label: "🎮", color: "#a855f7" },
    { id: "skylounge", label: "✈",  color: "#00d4ff" },
  ];

  const tabLabels: Record<PanelTab, string> = {
    spotify:   "MUSIC",
    youtube:   "VIDEO",
    scripture: "WORD",
    schedule:  "DAY",
    calendar:  "CAL",
    relax:     "RELAX",
    skylounge: "SKYLOUNGE",
  };

  return (
    <>
      {/* Active Agent status bar */}
      <div style={{ padding: "7px 14px", background: `${activeAgent.color}10`, borderBottom: `1px solid ${activeAgent.color}20`, display: "flex", alignItems: "center", gap: 8 }}>
        <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: activeAgent.color, flexShrink: 0 }}
          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: activeAgent.color }}>{activeAgent.icon} ACTIVE AGENT: {activeAgent.name}</span>
        <span style={{ marginLeft: "auto", fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>{activeAgent.note}</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(212,175,55,0.07)", background: "rgba(0,0,0,0.3)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={tabLabels[t.id]}
            style={{
              flex: 1, padding: "9px 0",
              background: tab === t.id ? `${t.color}12` : "transparent",
              border: "none",
              borderBottom: tab === t.id ? `2px solid ${t.color}` : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14,
              color: tab === t.id ? t.color : "rgba(255,255,255,0.22)",
              transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}
          >
            <span>{t.label}</span>
            <span style={{ fontSize: 7, letterSpacing: "0.12em", fontWeight: 700, color: tab === t.id ? t.color : "rgba(255,255,255,0.15)" }}>{tabLabels[t.id]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === "spotify" && (
          <motion.div key="spotify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <iframe
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0"
              width="100%" height="280"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ display: "block", border: "none" }}
            />
          </motion.div>
        )}
        {tab === "youtube" && (
          <motion.div key="youtube" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div style={{ height: 280, display: "flex", flexDirection: "column", padding: "14px 16px", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, background: "rgba(255,0,0,0.06)", border: "1px solid rgba(255,64,64,0.2)" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #ff4040, #cc0000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>P</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.1em" }}>PWAL</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Pastor · Chef · Designer · Creator</div>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => window.open("https://www.youtube.com/@pwal", "_blank")}
                  style={{ background: "#ff0000", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "#fff", fontSize: 9, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.1em" }}
                >▶ VISIT</motion.button>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.2)" }}>BROWSE TOPICS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { label: "Sermons",  icon: "✝️", q: "pwal sermons pastor",  color: "#ff3333" },
                  { label: "Fashion",  icon: "🤵", q: "pwal menswear fashion", color: "#a855f7" },
                  { label: "Cooking",  icon: "👨‍🍳", q: "pwal chef cooking",   color: "#00d4ff" },
                  { label: "Lifestyle",icon: "✨", q: "pwal lifestyle",         color: "#d4af37" },
                ].map((t) => (
                  <motion.button key={t.label} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(t.q)}`, "_blank")}
                    style={{ background: `${t.color}0d`, border: `1px solid ${t.color}28`, borderRadius: 8, padding: "10px 10px", cursor: "pointer", textAlign: "left", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: t.color, letterSpacing: "0.08em" }}>{t.label.toUpperCase()}</span>
                  </motion.button>
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => window.open("https://www.youtube.com", "_blank")}
                style={{ marginTop: "auto", background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,64,64,0.25)", borderRadius: 8, padding: "10px", cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.14em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>▶</span> OPEN YOUTUBE
              </motion.button>
            </div>
          </motion.div>
        )}
        {tab === "scripture" && (<motion.div key="scripture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><ScriptureView /></motion.div>)}
        {tab === "schedule" && (<motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><ScheduleView /></motion.div>)}
        {tab === "calendar" && (<motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><CalendarView /></motion.div>)}
        {tab === "relax" && (<motion.div key="relax" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><RelaxView /></motion.div>)}
        {tab === "skylounge" && (<motion.div key="skylounge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><SkyLoungeView /></motion.div>)}
      </AnimatePresence>
    </>
  );
}

export function MediaPanel() {
  const [tab, setTab] = useState<PanelTab>("spotify");
  const [mobileOpen, setMobileOpen] = useState(false);
  const now = useTime();
  const activeAgent = getActiveAgent(now);

  const panelStyle: React.CSSProperties = {
    background: "rgba(4,3,14,0.96)",
    border: "1px solid rgba(212,175,55,0.12)",
    overflow: "hidden",
    backdropFilter: "blur(24px)",
    boxShadow: "0 12px 48px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(212,175,55,0.08)",
  };

  return (
    <>
      {/* ── Desktop: fixed bottom-right panel (hidden on mobile via CSS) ── */}
      <motion.div
        className="media-panel-desktop"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{ ...panelStyle, position: "fixed", bottom: 44, right: 40, zIndex: 5, width: 420, borderRadius: 14 }}
      >
        <MediaPanelContent tab={tab} setTab={setTab} />
      </motion.div>

      {/* ── Mobile: FAB trigger (hidden on desktop via CSS) ── */}
      <motion.button
        className="media-panel-fab"
        onClick={() => setMobileOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        style={{
          position: "fixed", bottom: 80, right: 18, zIndex: 30,
          width: 52, height: 52, borderRadius: "50%",
          background: `linear-gradient(135deg, ${activeAgent.color}30, rgba(4,3,14,0.95))`,
          border: `1px solid ${activeAgent.color}55`,
          backdropFilter: "blur(16px)",
          cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          boxShadow: `0 4px 20px ${activeAgent.color}30`,
        }}
      >
        <span style={{ fontSize: 18 }}>{mobileOpen ? "✕" : activeAgent.icon}</span>
        {!mobileOpen && <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: activeAgent.color, fontFamily: "'Space Grotesk', sans-serif" }}>MEDIA</span>}
      </motion.button>

      {/* ── Mobile: bottom sheet (hidden on desktop via CSS) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 28, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            />
            {/* Sheet */}
            <motion.div
              className="media-panel-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{
                ...panelStyle,
                position: "fixed", bottom: 0, left: 0, right: 0,
                zIndex: 29,
                borderRadius: "18px 18px 0 0",
                maxHeight: "82dvh",
                display: "flex", flexDirection: "column",
              }}
            >
              {/* Drag handle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              </div>
              {/* Sheet header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 16px 10px" }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.7)" }}>MEDIA & TOOLS</span>
                <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>✕</button>
              </div>
              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
                <MediaPanelContent tab={tab} setTab={setTab} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CommandBoard() {
  const now = useTime();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProject = projectsData.find(p => p.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => {
      const project = projectsData.find(p => p.id === id);
      if (project && prev !== id) speak(project.voiceIntro);
      return prev === id ? null : id;
    });
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const active = projectsData.filter(p => p.status === "Active").length;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#000008", overflow: "hidden", fontFamily: "'Space Grotesk', sans-serif" }}
      onClick={(e) => { if ((e.target as HTMLElement).closest(".project-panel") === null && selectedId) setSelectedId(null); }}
    >
      <GlobeCanvas selectedId={selectedId} onOrbClick={handleSelect} />

      {/* Aurora blobs */}
      <motion.div style={{ position: "fixed", width: 900, height: 500, borderRadius: "50%", top: "-10%", left: "-15%", background: "radial-gradient(ellipse, rgba(160,120,10,0.1) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 1, pointerEvents: "none" }}
        animate={{ x: [0, 60, 0], y: [0, 30, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div style={{ position: "fixed", width: 700, height: 400, borderRadius: "50%", bottom: "-5%", right: "-10%", background: "radial-gradient(ellipse, rgba(100,40,160,0.09) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 1, pointerEvents: "none" }}
        animate={{ x: [0, -50, 0], y: [0, -25, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 6 }} />

      {/* Scan line */}
      <motion.div style={{ position: "fixed", left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent)", zIndex: 2, pointerEvents: "none" }}
        animate={{ top: ["0%", "100%"] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />

      {/* Corner marks */}
      {[{ top: 20, left: 20, borderTop: "1px solid", borderLeft: "1px solid" }, { top: 20, right: 20, borderTop: "1px solid", borderRight: "1px solid" }, { bottom: 20, left: 20, borderBottom: "1px solid", borderLeft: "1px solid" }, { bottom: 20, right: 20, borderBottom: "1px solid", borderRight: "1px solid" }].map((s, i) => (
        <motion.div key={i} style={{ position: "fixed", width: 22, height: 22, borderColor: "rgba(212,175,55,0.25)", zIndex: 3, ...s }}
          animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }} />
      ))}

      {/* Header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 4, display: "flex", alignItems: "center", padding: "18px 40px", borderBottom: "1px solid rgba(212,175,55,0.07)", background: "linear-gradient(to bottom, rgba(0,0,8,0.92), transparent)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #b8860b, #d4af37)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" }}
            animate={{ boxShadow: ["0 0 16px rgba(212,175,55,0.5)", "0 0 32px rgba(240,192,96,0.7)", "0 0 16px rgba(212,175,55,0.5)"] }} transition={{ duration: 3, repeat: Infinity }}>P</motion.div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", color: "#fff" }}>THE PWAL OS</div>
            <div style={{ fontSize: 9, letterSpacing: "0.35em", color: "rgba(212,175,55,0.55)" }}>COMMAND CENTER</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "center" }}>
          <motion.div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-2px", lineHeight: 1, background: "linear-gradient(135deg, #fff 40%, #d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 4, repeat: Infinity }}>{timeStr}</motion.div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.2)", marginTop: 3, textTransform: "uppercase" }}>{dateStr}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right" }}>
          <motion.div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#22c55e", fontWeight: 700, marginBottom: 5 }}
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>● SYSTEMS NOMINAL</motion.div>
          <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)" }}>THREAT: <span style={{ color: "#22c55e" }}>NONE</span></span>
            <span style={{ fontSize: 10, letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)" }}>ACTIVE: <span style={{ color: "#d4af37" }}>{active}</span></span>
          </div>
        </div>
      </div>

      {/* Right mission panel */}
      <div style={{ position: "fixed", right: 40, top: "50%", transform: "translateY(-50%)", zIndex: 4, width: 380, display: "flex", flexDirection: "column", gap: 10 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ fontSize: 9, letterSpacing: "0.35em", color: "rgba(212,175,55,0.35)", marginBottom: 4, textTransform: "uppercase" }}>
          Mission Status · Click to Activate
        </motion.div>
        {projectsData.map((p, i) => (
          <MissionStrip key={p.id} project={p} index={i} selected={selectedId === p.id} onClick={() => handleSelect(p.id)} />
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedProject && (
          <div className="project-panel" key={selectedProject.id}>
            <ProjectPanel project={selectedProject} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </AnimatePresence>

      {/* Life planner — left side */}
      <PlannerPanel />



      {/* Bottom ticker */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 4, background: "linear-gradient(to top, rgba(0,0,8,0.92), transparent)" }}>
        <Ticker />
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
