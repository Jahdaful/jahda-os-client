import { useCallback, useRef, useState } from "react";
import type { Project } from "../data/projects";

// Web Speech API constructor — not fully typed in all TS DOM libs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any;

interface Options {
  projects: Project[];
  onHighlightProject: (id: string | null) => void;
  onVoiceResponse: (text: string) => void;
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function useVoiceAssistant({ projects, onHighlightProject, onVoiceResponse }: Options) {
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;

  const speak = useCallback(
    (text: string) => {
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.88;
      utt.pitch = 0.65;
      utt.volume = 1;

      const pickVoice = () => {
        const voices = synth.getVoices();
        const preferred = voices.find(
          (v) =>
            v.name.toLowerCase().includes("daniel") ||
            v.name.toLowerCase().includes("david") ||
            v.name.toLowerCase().includes("alex") ||
            v.name.toLowerCase().includes("google uk english male")
        );
        if (preferred) utt.voice = preferred;
      };

      if (synth.getVoices().length > 0) {
        pickVoice();
      } else {
        synth.addEventListener("voiceschanged", pickVoice, { once: true });
      }

      onVoiceResponse(text);
      synth.speak(utt);
    },
    [synth, onVoiceResponse]
  );

  const greet = useCallback(() => {
    speak(`Jahda OS online. Good ${getTimeOfDay()}, Jahda.`);
  }, [speak]);

  const processCommand = useCallback(
    (transcript: string) => {
      const t = transcript.toLowerCase();

      if (t.includes("introduce") && (t.includes("agent") || t.includes("project"))) {
        let delay = 0;
        projects.forEach((p, i) => {
          setTimeout(() => {
            onHighlightProject(p.id);
            speak(p.voiceIntro);
          }, delay);
          delay += 4500 + i * 200;
        });
        setTimeout(() => onHighlightProject(null), delay + 2000);
        return;
      }

      if (t.includes("status") || t.includes("what's the status") || t.includes("whats the status")) {
        const active = projects.filter((p) => p.status === "Active");
        const avg = Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length);
        speak(
          `All systems nominal. ${active.length} agents online. Average mission progress: ${avg} percent. No critical threats detected.`
        );
        return;
      }

      if (t.includes("threat") || t.includes("any threat") || t.includes("balogun")) {
        speak(
          "Balogun security sweep complete. No active intrusions detected. All perimeters secure. Threat level: nominal."
        );
        return;
      }

      const matchedProject = projects.find(
        (p) =>
          t.includes(p.name.toLowerCase()) ||
          t.includes(p.id.toLowerCase()) ||
          t.includes(p.id.replace("-", " ").toLowerCase())
      );

      if (t.startsWith("open") && matchedProject) {
        speak(`Launching ${matchedProject.name}.`);
        setTimeout(() => window.open(matchedProject.url, "_blank"), 1400);
        return;
      }

      if ((t.includes("how is") || t.includes("how's") || t.includes("doing")) && matchedProject) {
        speak(
          `${matchedProject.name} is at ${matchedProject.progress} percent completion. Status: ${matchedProject.status}. Last activity: ${matchedProject.lastActivity}.`
        );
        return;
      }

      speak(
        "Command not recognized. Try: introduce my agents, status, open a project, any threats, or how is a project doing."
      );
    },
    [projects, onHighlightProject, speak]
  );

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR: SpeechRecognitionCtor | undefined = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      speak("Voice recognition is not available in this browser.");
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: SpeechRecognitionEvent) => {
      processCommand(e.results[0][0].transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [processCommand, speak]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { speak, greet, startListening, stopListening, listening };
}
