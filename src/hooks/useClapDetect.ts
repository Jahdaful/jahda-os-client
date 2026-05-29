import { useCallback, useEffect, useRef } from "react";

interface Options {
  onSingleClap?: () => void;
  onDoubleclap: () => void;
  onVoiceInterrupt?: () => void;
  interruptEnabled?: boolean;
  threshold?: number;
  windowMs?: number;
  enabled?: boolean;
}

export function useClapDetect({
  onSingleClap,
  onDoubleclap,
  onVoiceInterrupt,
  interruptEnabled = false,
  threshold = 0.18,
  windowMs = 700,
  enabled = true,
}: Options) {
  const lastClapRef = useRef<number>(0);
  const aboveRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number>(0);
  const singleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs so tick() always reads latest values without restarting the effect
  const interruptEnabledRef = useRef(interruptEnabled);
  const onVoiceInterruptRef = useRef(onVoiceInterrupt);
  useEffect(() => { interruptEnabledRef.current = interruptEnabled; }, [interruptEnabled]);
  useEffect(() => { onVoiceInterruptRef.current = onVoiceInterrupt; }, [onVoiceInterrupt]);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    ctxRef.current?.close();
    ctxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (singleTimerRef.current) clearTimeout(singleTimerRef.current);
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
        let sustainStart: number | null = null;
        let interruptCooldown = 0;

        function tick() {
          frameRef.current = requestAnimationFrame(tick);
          analyser.getFloatTimeDomainData(data);
          let peak = 0;
          for (let i = 0; i < data.length; i++) {
            const abs = Math.abs(data[i]);
            if (abs > peak) peak = abs;
          }

          // ── Clap detection ────────────────────────────────────────────────
          if (peak > threshold && !aboveRef.current) {
            aboveRef.current = true;
            const now = Date.now();
            const elapsed = now - lastClapRef.current;

            if (elapsed > 80 && elapsed < windowMs) {
              if (singleTimerRef.current) {
                clearTimeout(singleTimerRef.current);
                singleTimerRef.current = null;
              }
              onDoubleclap();
              lastClapRef.current = 0;
            } else {
              lastClapRef.current = now;
              if (onSingleClap) {
                if (singleTimerRef.current) clearTimeout(singleTimerRef.current);
                const snapTime = now;
                singleTimerRef.current = setTimeout(() => {
                  singleTimerRef.current = null;
                  if (lastClapRef.current === snapTime) {
                    onSingleClap();
                    lastClapRef.current = 0;
                  }
                }, windowMs);
              }
            }
          } else if (peak < threshold * 0.4) {
            aboveRef.current = false;
          }

          // ── Voice interrupt — sustained speech while agent is talking ─────
          if (interruptEnabledRef.current && onVoiceInterruptRef.current) {
            const now = Date.now();
            if (peak > 0.08 && now > interruptCooldown) {
              if (sustainStart === null) sustainStart = now;
              else if (now - sustainStart > 250) {
                onVoiceInterruptRef.current();
                sustainStart = null;
                interruptCooldown = now + 2000;
              }
            } else if (peak < 0.05) {
              sustainStart = null;
            }
          }
        }

        tick();
      } catch {
        // mic denied — clap/interrupt detection unavailable
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, threshold, windowMs, onDoubleclap, onSingleClap, cleanup]);
}
