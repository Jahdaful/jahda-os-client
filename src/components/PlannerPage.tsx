import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WORK_SCHEDULE } from "../data/projects";

function useTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const SLOTS = [
  { label: "Morning Devotion",     start:  5 * 60,      end:  7 * 60,      icon: "🌅", color: "#f59e0b",  note: "Prayer & Scripture" },
  { label: "Prep & Commute",       start:  7 * 60,      end:  9 * 60,      icon: "🚗", color: "#6b7280",  note: "Breakfast & readiness" },
  { label: "9-to-5 Employment",    start:  9 * 60,      end: 17 * 60,      icon: "💼", color: "#3b82f6",  note: "Focus & excellence" },
  { label: "Family Time",          start: 17 * 60,      end: 19 * 60,      icon: "🏡", color: "#f59e0b",  note: "Dinner & presence" },
  { label: "Ministry Hour",        start: 19 * 60,      end: 20 * 60 + 30, icon: "✝️", color: "#ff3333",  note: "Pastoral duties" },
  { label: "Chef Studio",          start: 20 * 60 + 30, end: 22 * 60,      icon: "👨‍🍳", color: "#00d4ff", note: "Culinary craft" },
  { label: "Design Atelier",       start: 22 * 60,      end: 23 * 60 + 30, icon: "👗", color: "#a855f7",  note: "Fashion & creative" },
  { label: "Rest & Recovery",      start: 23 * 60 + 30, end: 29 * 60,      icon: "😴", color: "#475569",  note: "Restore & renew" },
];

const WEEKEND_SLOTS = [
  { label: "Morning Devotion",     start:  6 * 60,      end:  8 * 60,      icon: "🌅", color: "#f59e0b",  note: "Extended prayer time" },
  { label: "Ministry Morning",     start:  8 * 60,      end: 13 * 60,      icon: "✝️", color: "#ff3333",  note: "Church & pastoral" },
  { label: "Family Afternoon",     start: 13 * 60,      end: 16 * 60,      icon: "🏡", color: "#f59e0b",  note: "Rest & togetherness" },
  { label: "Chef Studio",          start: 16 * 60,      end: 18 * 60,      icon: "👨‍🍳", color: "#00d4ff", note: "Weekend culinary" },
  { label: "Design Atelier",       start: 18 * 60,      end: 21 * 60,      icon: "👗", color: "#a855f7",  note: "Fashion projects" },
  { label: "Evening Wind-Down",    start: 21 * 60,      end: 29 * 60,      icon: "😴", color: "#475569",  note: "Rest" },
];

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function PlannerPage() {
  const now = useTime();

  // Auto-close after 5 min of no mouse movement
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => window.close(), 5 * 60 * 1000);
    };
    reset();
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
    };
  }, []);
  const h = now.getHours();
  const m = now.getMinutes();
  const day = now.getDay();
  const isWorkDay = WORK_SCHEDULE.workDays.includes(day);
  const currentMin = h * 60 + m;
  const dayProgress = (currentMin / (24 * 60)) * 100;

  const slots = isWorkDay ? SLOTS : WEEKEND_SLOTS;
  const activeSlot = slots.find(s => currentMin >= s.start && currentMin < s.end);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = `${DAY_LABELS[day]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;

  // Calendar
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);
  while (calCells.length % 7 !== 0) calCells.push(null);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#03020a",
      fontFamily: "'Space Grotesk', sans-serif",
      color: "#fff",
      overflow: "hidden",
    }}>
      {/* Background aurora */}
      <motion.div style={{ position: "absolute", width: 800, height: 500, borderRadius: "50%", top: "-10%", left: "-10%", background: "radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }}
        animate={{ x: [0, 60, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div style={{ position: "absolute", width: 600, height: 400, borderRadius: "50%", bottom: "5%", right: "-5%", background: "radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }}
        animate={{ x: [0, -40, 0], y: [0, -20, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 5 }} />

      {/* Grid */}
      <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto 1fr", height: "100%", gap: 1, background: "rgba(212,175,55,0.06)" }}>

        {/* ── Header ── */}
        <div style={{ gridColumn: "1 / -1", background: "#03020a", padding: "20px 40px", borderBottom: "1px solid rgba(212,175,55,0.1)", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <motion.div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #b8860b, #d4af37)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#0d0b07" }}
              animate={{ boxShadow: ["0 0 16px rgba(212,175,55,0.4)", "0 0 32px rgba(212,175,55,0.7)", "0 0 16px rgba(212,175,55,0.4)"] }}
              transition={{ duration: 3, repeat: Infinity }}>P</motion.div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.18em" }}>PWAL PLANNER</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(212,175,55,0.5)" }}>INTELLIGENT LIFE SCHEDULER</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "center" }}>
            <motion.div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-1px", background: "linear-gradient(135deg, #fff 40%, #d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 4, repeat: Infinity }}>{timeStr}</motion.div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{dateStr}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)" }}>
              {isWorkDay ? "WORK DAY" : "WEEKEND"}
            </div>
            <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, letterSpacing: "0.12em", marginTop: 4 }}>
              ● {dayProgress.toFixed(0)}% OF DAY COMPLETE
            </div>
          </div>
        </div>

        {/* ── Left: Daily Schedule ── */}
        <div style={{ background: "#03020a", padding: "28px 32px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "rgba(212,175,55,0.5)", marginBottom: 16 }}>TODAY'S SCHEDULE</div>

          {/* Day progress bar */}
          <div style={{ height: 3, background: "rgba(212,175,55,0.08)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
            <motion.div style={{ height: "100%", background: "linear-gradient(90deg, #b8860b, #f0c060)", borderRadius: 2 }}
              initial={{ width: 0 }} animate={{ width: `${dayProgress}%` }} transition={{ duration: 1.5 }} />
          </div>

          {/* Active slot callout */}
          {activeSlot && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: `${activeSlot.color}14`, border: `1px solid ${activeSlot.color}35`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}
            >
              <motion.div style={{ width: 8, height: 8, borderRadius: "50%", background: activeSlot.color }}
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: activeSlot.color }}>ACTIVE NOW · {activeSlot.icon} {activeSlot.label}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{activeSlot.note}</div>
              </div>
            </motion.div>
          )}

          {/* Slots list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {slots.map((s) => {
              const isActive = currentMin >= s.start && currentMin < s.end;
              const isPast = currentMin >= s.end;
              const startH = Math.floor(s.start / 60) % 24;
              const startM = s.start % 60;
              const endH = Math.floor(s.end / 60) % 24;
              const endM = s.end % 60;
              const fmt = (hh: number, mm: number) => `${hh.toString().padStart(2,"0")}:${mm.toString().padStart(2,"0")}`;
              return (
                <div key={s.label} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 8,
                  background: isActive ? `${s.color}10` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isActive ? s.color + "35" : "rgba(255,255,255,0.04)"}`,
                  opacity: isPast ? 0.35 : 1,
                  transition: "all 0.3s",
                }}>
                  <div style={{ width: 3, height: 32, borderRadius: 2, background: isActive ? s.color : "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? "#fff" : "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>{s.label}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>{fmt(startH, startM)} – {fmt(endH, endM)}</div>
                  </div>
                  {isActive && <span style={{ fontSize: 8, color: s.color, fontWeight: 700, letterSpacing: "0.1em" }}>{s.note}</span>}
                  {isPast && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Calendar + Zones ── */}
        <div style={{ background: "#03020a", padding: "28px 32px", overflowY: "auto" }}>

          {/* Mini calendar */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "rgba(212,175,55,0.5)", marginBottom: 14 }}>
              {MONTH_NAMES[month].toUpperCase()} {year}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d, i) => (
                <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: (i===0||i===6) ? "rgba(255,100,100,0.3)" : "rgba(255,255,255,0.2)", paddingBottom: 4 }}>{d}</div>
              ))}
              {calCells.map((d, i) => {
                const isToday = d === todayDate;
                const isWknd = i % 7 === 0 || i % 7 === 6;
                return (
                  <div key={i} style={{
                    textAlign: "center", fontSize: 10, padding: "5px 0", borderRadius: 6,
                    fontWeight: isToday ? 900 : 400,
                    background: isToday ? "rgba(212,175,55,0.22)" : "transparent",
                    color: isToday ? "#f0c060" : d ? (isWknd ? "rgba(255,120,120,0.4)" : "rgba(255,255,255,0.5)") : "transparent",
                    border: isToday ? "1px solid rgba(212,175,55,0.45)" : "1px solid transparent",
                    boxShadow: isToday ? "0 0 10px rgba(212,175,55,0.3)" : "none",
                  }}>{d ?? ""}</div>
                );
              })}
            </div>
          </div>

          {/* Life zones */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "rgba(212,175,55,0.5)", marginBottom: 14 }}>LIFE ZONES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {WORK_SCHEDULE.zones.map((z) => (
                <div key={z.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: z.color, flexShrink: 0, boxShadow: `0 0 8px ${z.color}60` }} />
                  <span style={{ fontSize: 16 }}>{z.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)" }}>{z.label.toUpperCase()}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>{z.hours}</div>
                  </div>
                  <div style={{ width: 60, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "70%", background: z.color, borderRadius: 2, opacity: 0.6 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <motion.div
            style={{ marginTop: 28, padding: "14px 16px", borderRadius: 10, background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", textAlign: "center" }}
            animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity }}
          >
            <div style={{ fontSize: 10, fontStyle: "italic", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              "Whatever you do, work at it with all your heart,<br />as working for the Lord."
            </div>
            <div style={{ fontSize: 9, color: "rgba(212,175,55,0.6)", marginTop: 6, letterSpacing: "0.12em", fontWeight: 700 }}>— Colossians 3:23</div>
          </motion.div>
        </div>
      </div>

      {/* Corner marks */}
      {[{ top: 8, left: 8, borderTop: "1px solid", borderLeft: "1px solid" }, { top: 8, right: 8, borderTop: "1px solid", borderRight: "1px solid" }, { bottom: 8, left: 8, borderBottom: "1px solid", borderLeft: "1px solid" }, { bottom: 8, right: 8, borderBottom: "1px solid", borderRight: "1px solid" }].map((s, i) => (
        <motion.div key={i} style={{ position: "fixed", width: 20, height: 20, borderColor: "rgba(212,175,55,0.2)", zIndex: 10, ...s }}
          animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }} />
      ))}

      {/* Close button */}
      <button
        onClick={() => window.close()}
        style={{ position: "fixed", top: 20, right: 48, zIndex: 10, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "rgba(212,175,55,0.7)", fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.12em" }}
      >
        ✕ CLOSE
      </button>
    </div>
  );
}
