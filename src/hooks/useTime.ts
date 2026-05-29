import { useEffect, useState } from "react";

/** Shared reactive clock. Updates every `intervalMs` (default 1 s). */
export function useTime(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
