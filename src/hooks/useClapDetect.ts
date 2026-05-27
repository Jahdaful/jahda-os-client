import { useCallback, useEffect, useRef } from "react";

interface Options {
  onDoubleclap: () => void;
  threshold?: number;
  windowMs?: number;
  enabled?: boolean;
}

export function useClapDetect({
  onDoubleclap,
  threshold = 0.18,
  windowMs = 700,
  enabled = true,
}: Options) {
  const lastClapRef = useRef<number>(0);
  const aboveRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    ctxRef.current?.close();
    ctxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);

        const data = new Float32Array(analyser.fftSize);

        function tick() {
          frameRef.current = requestAnimationFrame(tick);
          analyser.getFloatTimeDomainData(data);
          let peak = 0;
          for (let i = 0; i < data.length; i++) {
            const abs = Math.abs(data[i]);
            if (abs > peak) peak = abs;
          }

          if (peak > threshold && !aboveRef.current) {
            aboveRef.current = true;
            const now = Date.now();
            const elapsed = now - lastClapRef.current;
            if (elapsed > 80 && elapsed < windowMs) {
              onDoubleclap();
              lastClapRef.current = 0;
            } else {
              lastClapRef.current = now;
            }
          } else if (peak < threshold * 0.4) {
            aboveRef.current = false;
          }
        }

        tick();
      } catch {
        // mic denied — clap detection unavailable
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, threshold, windowMs, onDoubleclap, cleanup]);
}
