import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  visible: boolean;
  onWake: () => void;
}

function useTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; color: string }[] = [];
    const COLORS = ["#d4af37", "#f0c060", "#b8860b", "#f59e0b", "#e8c84a"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.4 + 0.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212,175,55,${0.06 * (1 - d / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.a * 255).toString(16).padStart(2, "0");
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
}

export default function Screensaver({ visible, onWake }: Props) {
  const now = useTime();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onClick={onWake}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "#000008",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            cursor: "none", overflow: "hidden",
            touchAction: "manipulation",
          }}
        >
          <ParticleBg />

          {/* Scan line */}
          <motion.div
            style={{
              position: "absolute", left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)",
              zIndex: 1,
            }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Aurora blobs */}
          <motion.div style={{ position: "absolute", width: 700, height: 400, borderRadius: "50%", top: "10%", left: "-5%", background: "radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 1 }}
            animate={{ x: [0, 80, 0], y: [0, 40, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div style={{ position: "absolute", width: 500, height: 300, borderRadius: "50%", bottom: "15%", right: "5%", background: "radial-gradient(ellipse, rgba(240,192,96,0.06) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 1 }}
            animate={{ x: [0, -60, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 5 }} />

          {/* Center content */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            {/* P logo */}
            <motion.div
              style={{
                width: 90, height: 90, borderRadius: 24,
                background: "linear-gradient(135deg, #b8860b, #d4af37, #f0c060)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 48, fontWeight: 900, color: "#0d0b07",
                fontFamily: "'Space Grotesk', sans-serif",
                marginBottom: 40,
              }}
              animate={{
                boxShadow: [
                  "0 0 40px rgba(212,175,55,0.4), 0 0 80px rgba(240,192,96,0.2)",
                  "0 0 80px rgba(212,175,55,0.7), 0 0 160px rgba(240,192,96,0.4)",
                  "0 0 40px rgba(212,175,55,0.4), 0 0 80px rgba(240,192,96,0.2)",
                ],
                scale: [1, 1.04, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              P
            </motion.div>

            {/* Clock */}
            <motion.div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 96, fontWeight: 800,
                letterSpacing: "-4px", lineHeight: 1,
                background: "linear-gradient(135deg, #fff 40%, #f0c060)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {timeStr}
            </motion.div>

            {/* Date */}
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginTop: 14, textTransform: "uppercase" }}>
              {dateStr}
            </div>

            {/* Brand */}
            <motion.div
              style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 12 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div style={{ width: 1, height: 20, background: "rgba(212,175,55,0.4)" }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, letterSpacing: "0.3em", color: "rgba(212,175,55,0.8)", textTransform: "uppercase" }}>
                THE PWAL OS · SYSTEMS ONLINE
              </span>
              <div style={{ width: 1, height: 20, background: "rgba(212,175,55,0.4)" }} />
            </motion.div>

            {/* Wake hint */}
            <motion.p
              style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", fontFamily: "'Space Grotesk', sans-serif" }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              CLAP · CLICK · TOUCH TO WAKE
            </motion.p>
          </div>

          {/* Corner HUD marks */}
          {[
            { top: 20, left: 20, borderTop: "1px solid", borderLeft: "1px solid" },
            { top: 20, right: 20, borderTop: "1px solid", borderRight: "1px solid" },
            { bottom: 20, left: 20, borderBottom: "1px solid", borderLeft: "1px solid" },
            { bottom: 20, right: 20, borderBottom: "1px solid", borderRight: "1px solid" },
          ].map((s, i) => (
            <motion.div
              key={i}
              style={{ position: "absolute", width: 24, height: 24, borderColor: "rgba(212,175,55,0.35)", zIndex: 2, ...s }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
