import { useEffect, useRef } from "react";

interface OrbData { id: string; color: string; }
interface Props { orbs: OrbData[]; highlightedId: string | null; }

export default function HUDSphere({ orbs, highlightedId }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const hlRef      = useRef(highlightedId);
  const orbsRef    = useRef(orbs);

  useEffect(() => { hlRef.current  = highlightedId; }, [highlightedId]);
  useEffect(() => { orbsRef.current = orbs; },        [orbs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let t   = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ── helpers ──────────────────────────────────────────────────────────────
    const ring = (r: number, color: string, lw: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth   = lw;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    };

    const arc = (r: number, startFrac: number, endFrac: number) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, startFrac * Math.PI * 2, endFrac * Math.PI * 2);
      ctx.stroke();
    };

    // ── draw ─────────────────────────────────────────────────────────────────
    const draw = () => {
      try {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (W === 0 || H === 0) { raf = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const R  = Math.min(W, H) * 0.43;
      const C  = "rgba(0,212,255,";

      ctx.save();
      ctx.translate(cx, cy);

      // ── Scattered × markers ───────────────────────────────────────────────
      const xPts = [
        [-R*1.05, -R*0.75], [R*0.95, -R*0.55],
        [-R*0.45, R*1.05],  [R*0.65, R*0.90],
        [-R*1.25, R*0.25],  [R*1.15, R*0.18],
        [-R*0.15, -R*1.15], [R*0.28, -R*1.05],
        [-R*0.80, -R*0.25], [R*0.80, R*0.40],
      ];
      ctx.strokeStyle = C + "0.18)";
      ctx.lineWidth = 1;
      xPts.forEach(([x, y]) => {
        const s = 5;
        ctx.beginPath(); ctx.moveTo(x-s, y-s); ctx.lineTo(x+s, y+s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+s, y-s); ctx.lineTo(x-s, y+s); ctx.stroke();
      });

      // ── 1 · Outer segmented ring (48 bricks, counter-clockwise) ──────────
      const SEG_N = 48;
      const SEG_R = R * 0.97;
      ctx.save();
      ctx.rotate(-t * 0.38);
      for (let i = 0; i < SEG_N; i++) {
        const angle = (i / SEG_N) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(SEG_R, 0);
        ctx.rotate(Math.PI / 2);
        const op = i % 4 === 0 ? 1.0 : i % 2 === 0 ? 0.45 : 0.2;
        ctx.fillStyle = C + op + ")";
        ctx.fillRect(-5, -3, 10, 6);
        ctx.restore();
      }
      ctx.restore();

      // ── 2 · Tick / hash ring ──────────────────────────────────────────────
      const HASH_R = R * 0.855;
      ctx.save();
      ctx.rotate(t * 0.18);
      ring(HASH_R, C + "0.12)", 1);
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const big  = i % 9 === 0;
        const mid  = i % 3 === 0;
        const len  = big ? 16 : mid ? 9 : 4;
        const col  = big ? C + "0.85)" : mid ? C + "0.45)" : C + "0.2)";
        ctx.strokeStyle = col;
        ctx.lineWidth = big ? 2 : 1;
        const r1 = HASH_R - len / 2;
        const r2 = HASH_R + len / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }
      // Corner bracket marks at 0 / 90 / 180 / 270
      ctx.strokeStyle = C + "0.6)";
      ctx.lineWidth = 1.5;
      [0, 1, 2, 3].forEach((q) => {
        const a = (q / 4) * Math.PI * 2;
        const bx = Math.cos(a) * (HASH_R + 20);
        const by = Math.sin(a) * (HASH_R + 20);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(-7, -6); ctx.lineTo(-7, 6); ctx.lineTo(7, 6);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      // ── 3 · Dashed ring (clockwise) ───────────────────────────────────────
      ctx.save();
      ctx.rotate(t * 0.55);
      ctx.strokeStyle = C + "0.55)";
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([7, 5]);
      ring(R * 0.735, C + "0.55)", 1.5);
      ctx.setLineDash([]);
      ctx.restore();

      // ── 4 · Arc ring A (four arcs, CCW) ───────────────────────────────────
      ctx.save();
      ctx.rotate(-t * 0.32);
      ctx.strokeStyle = C + "0.65)";
      ctx.lineWidth = 2.5;
      arc(R * 0.635, 0.02,  0.23);
      arc(R * 0.635, 0.27,  0.48);
      arc(R * 0.635, 0.52,  0.73);
      arc(R * 0.635, 0.77,  0.98);
      ctx.restore();

      // ── 5 · Arc ring B (two arcs, CW) ─────────────────────────────────────
      ctx.save();
      ctx.rotate(t * 0.48);
      ctx.strokeStyle = C + "0.4)";
      ctx.lineWidth = 1.5;
      arc(R * 0.525, 0.04, 0.46);
      arc(R * 0.525, 0.54, 0.96);
      ctx.restore();

      // ── 6 · Orb orbit ring + project orbs ────────────────────────────────
      const ORB_R = R * 0.425;
      ctx.save();
      ring(ORB_R, C + "0.15)", 1);
      ctx.restore();

      orbsRef.current.forEach((orb, i) => {
        const baseAngle = (i / orbsRef.current.length) * Math.PI * 2;
        const angle     = baseAngle + t * 0.65;
        const ox = Math.cos(angle) * ORB_R;
        const oy = Math.sin(angle) * ORB_R;
        const isHl  = hlRef.current === orb.id;
        const pulse = isHl ? 1 + Math.sin(t * 8) * 0.45 : 1;
        const orbR  = (isHl ? 7 : 5) * pulse;

        // trail arc
        ctx.strokeStyle = orb.color + "30";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.arc(0, 0, ORB_R, baseAngle + t * 0.65 - 0.55, baseAngle + t * 0.65);
        ctx.stroke();

        // glow halo
        const grd = ctx.createRadialGradient(ox, oy, 0, ox, oy, orbR * 3.5);
        grd.addColorStop(0, orb.color + "cc");
        grd.addColorStop(1, orb.color + "00");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(ox, oy, orbR * 3.5, 0, Math.PI * 2); ctx.fill();

        // dot
        ctx.fillStyle = orb.color;
        ctx.beginPath(); ctx.arc(ox, oy, orbR, 0, Math.PI * 2); ctx.fill();

        // bright center
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(ox, oy, orbR * 0.4, 0, Math.PI * 2); ctx.fill();
      });

      // ── 7 · Inner arc ring (CW) ───────────────────────────────────────────
      ctx.save();
      ctx.rotate(t * 0.72);
      ctx.strokeStyle = C + "0.35)";
      ctx.lineWidth = 1;
      arc(R * 0.305, 0.0,  0.18);
      arc(R * 0.305, 0.25, 0.43);
      arc(R * 0.305, 0.5,  0.68);
      arc(R * 0.305, 0.75, 0.93);
      ctx.restore();

      // ── 8 · Solid inner rings ─────────────────────────────────────────────
      ring(R * 0.22, C + "0.45)", 1.5);
      ring(R * 0.14, C + "0.28)", 1);

      // ── 9 · Core glow ─────────────────────────────────────────────────────
      const pulse = 1 + Math.sin(t * 2.2) * 0.08;
      const cR = R * 0.10 * pulse;

      const coreGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, cR * 4);
      coreGrd.addColorStop(0,   `rgba(255,200,80,${0.9 + Math.sin(t * 3) * 0.05})`);
      coreGrd.addColorStop(0.2, "rgba(212,175,55,0.7)");
      coreGrd.addColorStop(0.5, "rgba(0,212,255,0.35)");
      coreGrd.addColorStop(1,   "rgba(0,212,255,0)");
      ctx.fillStyle = coreGrd;
      ctx.beginPath(); ctx.arc(0, 0, cR * 4, 0, Math.PI * 2); ctx.fill();

      // core ring
      ctx.strokeStyle = C + "0.7)";
      ctx.lineWidth   = 1.5;
      ring(cR, C + "0.7)", 1.5);

      // bright center dot
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(0, 0, cR * 0.35, 0, Math.PI * 2); ctx.fill();

      ctx.restore();

      t   += 0.016;
      raf  = requestAnimationFrame(draw);
      } catch { raf = requestAnimationFrame(draw); }
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
