import { AnimatePresence, motion } from "framer-motion";

interface Props {
  text: string;
  visible: boolean;
}

export default function VoicePanel({ text, visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="voice-panel"
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
        >
          <div className="voice-panel__indicator">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="voice-bar"
                animate={{ scaleY: [0.3, 1, 0.3] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <p className="voice-panel__text">{text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
