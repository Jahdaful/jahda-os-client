import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const COLLECTIONS = [
  { name: "THE SOVEREIGN",   season: "AW 2026",  status: "In Progress", pieces: 14, icon: "🤵", color: "#a855f7", note: "Power suits · structured authority" },
  { name: "AGBADA ROYALE",   season: "SS 2026",  status: "Complete",    pieces: 20, icon: "👘", color: "#d4af37", note: "Grand native wear · ceremonial" },
  { name: "THE DIPLOMAT",    season: "AW 2025",  status: "Archived",    pieces: 18, icon: "🎩", color: "#9333ea", note: "Tailored suits · boardroom elegance" },
  { name: "KAFTAN EMPIRE",   season: "SS 2025",  status: "Archived",    pieces: 22, icon: "👑", color: "#f59e0b", note: "Kaftan & senator · heritage luxury" },
];

const SERVICES = [
  { label: "Bespoke Suits",       icon: "🤵", note: "Made-to-measure power tailoring" },
  { label: "Native Wear",         icon: "👘", note: "Agbada, Kaftan & Senator styles" },
  { label: "Luxury Fabric",       icon: "🧵", note: "Premium Aso-oke, silk & linen" },
  { label: "Brand Styling",       icon: "💎", note: "Executive image direction" },
  { label: "Event Dressing",      icon: "🎭", note: "Weddings, galas & launches" },
  { label: "Wardrobe Curation",   icon: "🪞", note: "Full personal wardrobe builds" },
];

function useTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function DesignAtelierPage() {
  const now = useTime();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

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

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#06030f",
      fontFamily: "'Space Grotesk', sans-serif",
      color: "#fff",
      overflow: "hidden",
    }}>
      {/* Background aurora */}
      <motion.div style={{ position: "absolute", width: 900, height: 600, borderRadius: "50%", top: "-15%", right: "-10%", background: "radial-gradient(ellipse, rgba(168,85,247,0.09) 0%, transparent 70%)", filter: "blur(90px)", pointerEvents: "none" }}
        animate={{ x: [0, -50, 0], y: [0, 30, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div style={{ position: "absolute", width: 700, height: 500, borderRadius: "50%", bottom: "-10%", left: "-5%", background: "radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }}
        animate={{ x: [0, 40, 0], y: [0, -25, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 6 }} />

      {/* Scanline texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168,85,247,0.012) 2px, rgba(168,85,247,0.012) 4px)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ padding: "20px 40px", borderBottom: "1px solid rgba(168,85,247,0.12)", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "linear-gradient(135deg, #7e22ce, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}
              animate={{ boxShadow: ["0 0 16px rgba(168,85,247,0.4)", "0 0 32px rgba(168,85,247,0.7)", "0 0 16px rgba(168,85,247,0.4)"] }}
              transition={{ duration: 3, repeat: Infinity }}>🤵</motion.div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.22em" }}>DESIGN ATELIER</div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(168,85,247,0.55)" }}>MENSWEAR · SUITS & NATIVE WEAR · PWAL</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <motion.div style={{
            fontSize: 28, fontWeight: 900, letterSpacing: "-1px",
            background: "linear-gradient(135deg, #fff 40%, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }} animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 4, repeat: Infinity }}>{timeStr}</motion.div>
          <div style={{ flex: 1 }} />
          <motion.div style={{
            fontSize: 9, letterSpacing: "0.18em", color: "rgba(168,85,247,0.6)", fontWeight: 700,
            border: "1px solid rgba(168,85,247,0.25)", borderRadius: 6, padding: "4px 10px",
          }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity }}>● ATELIER ACTIVE</motion.div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(168,85,247,0.04)", overflow: "hidden" }}>

          {/* Left — Collections */}
          <div style={{ background: "#06030f", padding: "28px 32px", overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "rgba(168,85,247,0.5)", marginBottom: 20 }}>COLLECTIONS</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {COLLECTIONS.map((c) => (
                <motion.div key={c.name}
                  whileHover={{ x: 4 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 18px", borderRadius: 10,
                    background: c.status === "In Progress" ? `${c.color}0e` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${c.status === "In Progress" ? c.color + "30" : "rgba(255,255,255,0.05)"}`,
                    cursor: "default",
                  }}>
                  <div style={{ width: 3, height: 44, borderRadius: 2, background: c.color, flexShrink: 0, opacity: c.status === "Archived" ? 0.3 : 1 }} />
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", color: c.status === "Archived" ? "rgba(255,255,255,0.3)" : "#fff" }}>{c.name}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.06em" }}>{c.note}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", marginTop: 1, letterSpacing: "0.1em" }}>{c.season} · {c.pieces} PIECES</div>
                  </div>
                  <div style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
                    color: c.status === "In Progress" ? c.color : c.status === "Complete" ? "#22c55e" : "rgba(255,255,255,0.2)",
                    border: `1px solid ${c.status === "In Progress" ? c.color + "40" : c.status === "Complete" ? "#22c55e40" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 4, padding: "2px 8px",
                  }}>{c.status.toUpperCase()}</div>
                </motion.div>
              ))}
            </div>

            {/* Coming Soon banner */}
            <motion.div
              style={{ marginTop: 24, padding: "16px 18px", borderRadius: 10, background: "rgba(168,85,247,0.06)", border: "1px dashed rgba(168,85,247,0.2)", textAlign: "center" }}
              animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 4, repeat: Infinity }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(168,85,247,0.7)" }}>✦ PWAL MENSWEAR HOUSE</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 6, lineHeight: 1.6 }}>
                Full collection portal launching soon.<br />Lookbook · Client booking · Press kit
              </div>
            </motion.div>
          </div>

          {/* Right — Services + Design Philosophy */}
          <div style={{ background: "#06030f", padding: "28px 32px", overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "rgba(168,85,247,0.5)", marginBottom: 20 }}>ATELIER SERVICES</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SERVICES.map((s) => (
                <motion.div key={s.label}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    padding: "14px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(168,85,247,0.1)",
                    cursor: "default",
                  }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.65)" }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.22)", marginTop: 3, lineHeight: 1.4 }}>{s.note}</div>
                </motion.div>
              ))}
            </div>

            {/* Design pillars */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "rgba(168,85,247,0.5)", marginBottom: 14 }}>DESIGN PILLARS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Tailoring",    pct: 100, color: "#a855f7" },
                  { label: "Heritage",     pct: 97,  color: "#d4af37" },
                  { label: "Luxury",       pct: 95,  color: "#9333ea" },
                  { label: "Authority",    pct: 92,  color: "#f59e0b" },
                ].map((bar) => (
                  <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 72, fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>{bar.label.toUpperCase()}</div>
                    <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <motion.div
                        style={{ height: "100%", background: bar.color, borderRadius: 2 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.pct}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                    <div style={{ width: 28, fontSize: 9, color: bar.color, fontWeight: 700, textAlign: "right" }}>{bar.pct}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scripture — suited to a king */}
            <motion.div
              style={{ marginTop: 24, padding: "14px 16px", borderRadius: 10, background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)", textAlign: "center" }}
              animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity }}
            >
              <div style={{ fontSize: 10, fontStyle: "italic", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                "A man's gift makes room for him<br />and brings him before great men."
              </div>
              <div style={{ fontSize: 9, color: "rgba(212,175,55,0.6)", marginTop: 6, letterSpacing: "0.12em", fontWeight: 700 }}>— Proverbs 18:16</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Corner marks */}
      {[{ top: 8, left: 8, borderTop: "1px solid", borderLeft: "1px solid" }, { top: 8, right: 8, borderTop: "1px solid", borderRight: "1px solid" }, { bottom: 8, left: 8, borderBottom: "1px solid", borderLeft: "1px solid" }, { bottom: 8, right: 8, borderBottom: "1px solid", borderRight: "1px solid" }].map((s, i) => (
        <motion.div key={i} style={{ position: "fixed", width: 20, height: 20, borderColor: "rgba(168,85,247,0.25)", zIndex: 10, ...s }}
          animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }} />
      ))}

      {/* Close button */}
      <button
        onClick={() => window.close()}
        style={{ position: "fixed", top: 20, right: 48, zIndex: 10, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "rgba(168,85,247,0.7)", fontSize: 11, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.12em" }}
      >
        ✕ CLOSE
      </button>
    </div>
  );
}
