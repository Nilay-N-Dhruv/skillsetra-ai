"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

/**
 * Browser-native voice controls. Speech recognition availability varies by browser.
 * This component does not send or store audio; only the resulting transcript is used.
 */
export default function VoiceControls({ onTranscript, speakText = "", compact = false, language = "en-US" }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognition = useRef(null);

  useEffect(() => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSupported(Boolean(SR));
    return () => {
      try { recognition.current?.stop(); } catch {}
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  function toggleListen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) {
      try { recognition.current?.stop(); } catch {}
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = language || navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = Array.from(event.results).slice(event.resultIndex)
        .map((r) => r[0]?.transcript || "").join(" ").trim();
      if (transcript) onTranscript?.(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognition.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }

  function speak() {
    if (!speakText || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.lang = language || navigator.language || "en-US";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() { window.speechSynthesis?.cancel(); }

  return (
    <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: compact ? 0 : 10 }}>
      <button type="button" className="btn" onClick={toggleListen} disabled={!supported}
        title={!supported ? "Speech recognition is not supported by this browser" : listening ? "Stop microphone" : "Start voice input"}>
        {listening ? <MicOff size={16} /> : <Mic size={16} />}
        {listening ? "Stop listening" : "Voice input"}
      </button>
      {speakText && <button type="button" className="btn" onClick={speak} title="Read aloud">
        <Volume2 size={16} /> Read aloud
      </button>}
      <button type="button" className="btn" onClick={stopSpeaking} title="Stop speech">
        <VolumeX size={16} /> Stop audio
      </button>
      {!supported && <span className="small muted">Voice input needs a supported browser (Chrome or Edge recommended).</span>}
    </div>
  );
}
