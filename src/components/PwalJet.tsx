import { motion } from "framer-motion";

// Side-profile SVG private jet — nose pointing right, flies left→right
function JetSVG({ scale = 1 }: { scale: number }) {
  const w = Math.round(200 * scale);
  const h = Math.round(70 * scale);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 200 70"
      style={{
        filter: [
          "drop-shadow(0 0 10px rgba(212,175,55,0.5))",
          "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
        ].join(" "),
        overflow: "visible",
      }}
    >
      {/* ── Fuselage ── */}
      <ellipse cx="96" cy="32" rx="78" ry="11" fill="#f0f0f0" />

      {/* Nose cone (tapers to a point on the right) */}
      <path d="M174 32 C182 30 196 32 198 32 C196 34 182 34 174 32Z" fill="#fff" />

      {/* Tail / rear fuselage (tapers on left) */}
      <path d="M18 32 C12 30 4 32 4 32 C4 32 12 34 18 32Z" fill="#ddd" />

      {/* ── Cockpit windows ── */}
      <ellipse cx="162" cy="29" rx="8" ry="5" fill="#aad4f5" opacity="0.8" />
      <ellipse cx="148" cy="29" rx="5" ry="4" fill="#aad4f5" opacity="0.6" />

      {/* Cabin windows */}
      {[130, 116, 102, 88, 74, 60].map((x) => (
        <ellipse key={x} cx={x} cy="29" rx="4" ry="3.5" fill="#aad4f5" opacity="0.5" />
      ))}

      {/* ── Main wing (swept back, below fuselage) ── */}
      <path d="M100 36 L70 62 L85 60 L108 42 Z" fill="#e2e2e2" />

      {/* Wing leading edge highlight */}
      <line x1="100" y1="36" x2="70" y2="62" stroke="#fff" strokeWidth="0.8" opacity="0.5" />

      {/* ── Wing engine / nacelle ── */}
      <ellipse cx="78" cy="60" rx="9" ry="4" fill="#ccc" />
      <ellipse cx="74" cy="60" rx="3" ry="4" fill="#aaa" />
      {/* Exhaust glow */}
      <ellipse cx="69" cy="60" rx="2.5" ry="2.5" fill="rgba(255,160,40,0.55)" />

      {/* ── Vertical tail fin ── */}
      <path d="M22 31 C20 22 22 10 26 6 C28 10 28 22 26 31 Z" fill="#e0e0e0" />

      {/* ── Horizontal tail stabilizer ── */}
      <path d="M20 33 L8 42 L14 41 L22 36 Z" fill="#ddd" />
      <path d="M20 31 L8 22 L14 23 L22 28 Z" fill="#ddd" />

      {/* ── Gold fuselage stripe ── */}
      <line x1="18" y1="24" x2="172" y2="24" stroke="#d4af37" strokeWidth="1" opacity="0.4" />
      <line x1="18" y1="40" x2="172" y2="40" stroke="#d4af37" strokeWidth="1" opacity="0.4" />

      {/* ── PWAL livery ── */}
      <text
        x="96"
        y="35"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
        letterSpacing="3"
        fill="#d4af37"
      >
        PWAL
      </text>
    </svg>
  );
}

function Jet({ delay = 0, scale = 1, duration = 22 }: { delay?: number; scale?: number; duration?: number }) {
  return (
    <motion.div
      style={{
        position: "fixed",
        zIndex: 3,
        pointerEvents: "none",
        willChange: "transform",
        // Tilt nose up ~20° to match the diagonal climb
        transform: "rotate(-20deg)",
      }}
      // Fly from bottom-left to top-right, matching user's drawn path
      initial={{ x: "-10vw", y: "92vh" }}
      animate={{ x: "110vw",  y: "-10vh" }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <JetSVG scale={scale} />
    </motion.div>
  );
}

export default function PwalJet({ sleeping = false }: { sleeping?: boolean }) {
  if (sleeping) return null;
  return <Jet delay={0} duration={22} scale={0.55} />;
}
