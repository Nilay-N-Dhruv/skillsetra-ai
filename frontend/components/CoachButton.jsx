"use client";
import { useRef, useState } from "react";
import { Bot, Send, X, Radio } from "lucide-react";
import { callAI } from "@/lib/ai";
import AiTag from "./AiTag";
// import VoiceControls from "./VoiceControls";

const LANGUAGES = [["en-US","English"],["hi-IN","Hindi"],["gu-IN","Gujarati"],["es-ES","Spanish"],["fr-FR","French"],["de-DE","German"],["pt-BR","Portuguese"],["ar-SA","Arabic"],["ur-PK","Urdu"],["bn-IN","Bengali"],["ta-IN","Tamil"],["te-IN","Telugu"],["mr-IN","Marathi"]];

export default function CoachButton() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ me: false, text: "Hi! I’m your SkillSetra coach. Ask me anything, or start live voice conversation." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [live, setLive] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognition = useRef(null);
  const liveRef = useRef(false);
  const busyRef = useRef(false);
  const end = useRef(null);

  function speak(textToSpeak) {
    if (!("speechSynthesis" in window) || !textToSpeak) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language;
    utterance.rate = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => { setSpeaking(false); if (liveRef.current) startListening(); };
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    if (!liveRef.current || busyRef.current || typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMsgs((x) => [...x, { me: false, text: "Live microphone is not supported in this browser. Try Chrome or Edge, or use the text box." }]); setLive(false); liveRef.current = false; return; }
    try {
      const rec = new SR(); recognition.current = rec;
      rec.lang = language; rec.continuous = false; rec.interimResults = false;
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (transcript && liveRef.current) sendMessage(transcript, true);
      };
      rec.onerror = () => { if (liveRef.current) { setLive(false); liveRef.current = false; } };
      rec.onend = () => { if (liveRef.current && !busyRef.current) setTimeout(startListening, 250); };
      rec.start();
    } catch { /* browser may reject overlapping microphone sessions */ }
  }

  function toggleLive() {
    if (liveRef.current) {
      liveRef.current = false; setLive(false);
      try { recognition.current?.stop(); } catch {}
      window.speechSynthesis?.cancel(); setSpeaking(false);
    } else {
      liveRef.current = true; setLive(true);
      startListening();
    }
  }

  async function sendMessage(message, fromVoice = false) {
    const m = message.trim();
    if (m.length < 2 || busyRef.current) return;
    setMsgs((x) => [...x, { me: true, text: m }]);
    if (!fromVoice) setText("");
    setBusy(true); busyRef.current = true;
    try {
      const r = await callAI("/coach", { method: "POST", body: { message: m } });
      setMsgs((x) => [...x, { me: false, text: r.text, source: r.source }]);
      // Speak every answer for natural, face-to-face style voice mode.
      if (liveRef.current) speak(r.text);
    } catch (err) {
      setMsgs((x) => [...x, { me: false, text: err.message || "I couldn't answer just now. Please try again.", err: true }]);
    } finally {
      setBusy(false); busyRef.current = false;
      setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50);
      if (liveRef.current && !window.speechSynthesis?.speaking) setTimeout(startListening, 350);
    }
  }

  async function send(e) { e.preventDefault(); await sendMessage(text); }

  return <>
    {open && <div className="coach-panel" role="dialog" aria-label="AI Coach">
      <div className="row" style={{ justifyContent:"space-between", padding:"12px 14px", borderBottom:"1px solid var(--line)" }}>
        <strong>AI Coach · live conversation</strong>
        <button className="btn icon" aria-label="Close coach" onClick={() => { toggleLiveIfNeeded(); setOpen(false); }}><X size={16}/></button>
      </div>
      <div className="coach-log" aria-live="polite">
        {msgs.map((m,i) => <div key={i} className={`msg ${m.me ? "me" : ""} ${m.err ? "err" : ""}`}>{m.text}{m.source && <div style={{marginTop:6}}><span className={`tag ${m.source === "puter" ? "live" : "demo"}`}>{m.source === "puter" ? "Live AI" : "AI / fallback"}</span></div>}</div>)}
        {busy && <div className="msg">Thinking…</div>}<div ref={end}/>
      </div>
      <form onSubmit={send} className="row" style={{padding:12,borderTop:"1px solid var(--line)",flexWrap:"nowrap"}}>
        <input aria-label="Message" value={text} onChange={(e)=>setText(e.target.value)} maxLength={500} placeholder={live ? "Speak when ready…" : "Ask about your next step"}/>
        <button type="submit" className="btn primary icon" aria-label="Send" disabled={busy}><Send size={16}/></button>
      </form>
      <div style={{padding:"0 12px 12px"}}>
        <label htmlFor="coach-language">Conversation language</label>
        <select id="coach-language" value={language} onChange={(e)=>{setLanguage(e.target.value); if(live) {toggleLive();}}} style={{marginBottom:8}}>{LANGUAGES.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select>
        <button type="button" className={`btn ${live ? "primary" : ""}`} onClick={toggleLive} style={{width:"100%",marginBottom:8}}><Radio size={16}/>{live ? "End live conversation" : "Start live voice conversation"}</button>
        <p className="small muted">{live ? "Listening for your speech; answers are spoken aloud. Keep this panel open." : "Live mode listens to one turn at a time and speaks the reply in your selected language. You can also use text."}</p>
        {/* <VoiceControls language={language} compact onTranscript={(transcript)=>setText((old)=>`${old}${old ? " " : ""}${transcript}`)} speakText={[...msgs].reverse().find((m)=>!m.me && !m.err)?.text || ""}/> */}
      </div>
    </div>}
    <button className="coach-btn" aria-expanded={open} onClick={()=>setOpen(!open)}><Bot size={18} aria-hidden/> AI Coach</button>
  </>;

  function toggleLiveIfNeeded() {
    if (liveRef.current) { liveRef.current = false; setLive(false); try { recognition.current?.stop(); } catch {} window.speechSynthesis?.cancel(); }
  }
}
