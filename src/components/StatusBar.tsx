import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  micActive: boolean;
  listening: boolean;
  sleeping: boolean;
}

export default function StatusBar({ micActive, listening, sleeping }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.header
      className="status-bar"
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: sleeping ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="status-bar__left">
        <span className="status-bar__brand">THE PWAL OS</span>
        <span className="status-bar__sep">·</span>
        <span className="status-bar__date">{dateStr}</span>
      </div>

      <div className="status-bar__center">
        <span className="status-bar__time">{timeStr}</span>
      </div>

      <div className="status-bar__right">
        <div
          className={`status-mic ${
            listening
              ? "status-mic--listening"
              : micActive
              ? "status-mic--active"
              : ""
          }`}
        >
          <motion.span
            className="status-dot"
            animate={listening ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
          <span className="status-label">
            {listening ? "LISTENING" : micActive ? "MIC ON" : "STANDBY"}
          </span>
        </div>

        <div className="threat-indicator">
          <span className="threat-dot" />
          <span className="threat-label">THREAT: NOMINAL</span>
        </div>
      </div>
    </motion.header>
  );
}
