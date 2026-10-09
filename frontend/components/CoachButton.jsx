"use client";
import { useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { callAI } from "@/lib/ai";
import AiTag from "./AiTag";

export default function CoachButton() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ me: false, text: "Ask me what to learn or practise next. I can see your target role and your gaps." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  async function send(e) {
    e.preventDefault();
    const m = text.trim();
    if (m.length < 2 || busy) return;
    setMsgs((x) => [...x, { me: true, text: m }]); setText(""); setBusy(true);
    try {
      const r = await callAI("/coach", { method: "POST", body: { message: m } });
      setMsgs((x) => [...x, { me: false, text: r.text, source: r.source }]);
    } catch (err) { setMsgs((x) => [...x, { me: false, text: err.message, err: true }]); }
    setBusy(false);
    setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <>
      {open && (
        <div className="coach-panel" role="dialog" aria-label="AI Coach">
          <div className="row" style={{ justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
            <strong>AI Coach</strong>
            <button className="btn icon" aria-label="Close coach" onClick={() => setOpen(false)}><X size={16} /></button>
          </div>
          <div className="coach-log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.me ? "me" : ""} ${m.err ? "err" : ""}`}>{m.text}
                {m.source && <div style={{ marginTop: 6 }}><span className={`tag ${m.source === "puter" ? "live" : "demo"}`}>{m.source === "puter" ? "Live AI" : "Template, AI offline"}</span></div>}
              </div>))}
            {busy && <div className="msg">Thinking…</div>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="row" style={{ padding: 12, borderTop: "1px solid var(--line)", flexWrap: "nowrap" }}>
            <input aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Ask about your next step" />
            <button className="btn primary icon" aria-label="Send" disabled={busy}><Send size={16} /></button>
          </form>
        </div>)}
      <button className="coach-btn" aria-expanded={open} onClick={() => setOpen(!open)}><Bot size={18} aria-hidden /> AI Coach</button>
    </>
  );
}