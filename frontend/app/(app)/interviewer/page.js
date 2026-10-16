"use client";
import { useEffect, useRef, useState } from "react";
import { api, publicGet } from "@/lib/api";
import { callAI } from "@/lib/ai";
import AiTag from "@/components/AiTag";
import VoiceControls from "@/components/VoiceControls";
import { Badge, Loading } from "@/components/Status";
import { Download, FileText, Mic, MessageSquare, ChartNoAxesCombined } from "lucide-react";

const STATE = ["Not Yet Demonstrated", "Limited", "Developing", "Demonstrated"];
const List = ({ t, items }) => (items?.length ? <><h4>{t}</h4><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></> : null);

function scorePercent(report) {
  if (typeof report?.overall_score === "number") return Math.max(0, Math.min(100, Math.round(report.overall_score)));
  if (typeof report?.score === "number") return Math.max(0, Math.min(100, Math.round(report.score)));
  const scores = Object.values(report?.dimension_scores || {}).map(Number).filter((n) => Number.isFinite(n));
  return scores.length ? Math.round((scores.reduce((sum, n) => sum + Math.max(0, Math.min(4, n)), 0) / (scores.length * 4)) * 100) : null;
}

function reportLines(report) {
  const sections = [
    ["Summary", report?.summary],
    ["Strengths", report?.strengths],
    ["Areas to improve", report?.gaps || report?.improve],
    ["Next steps", report?.next_steps],
    ["Contradictions discussed", report?.contradictions],
  ];
  return sections.filter(([, value]) => Array.isArray(value) ? value.length : Boolean(value));
}

export default function Interviewer() {
  const [roles, setRoles] = useState(null);
  const [cfg, setCfg] = useState({ role: "", kind: "Technical", difficulty: "Beginner" });
  const [voiceMode, setVoiceMode] = useState("text");
  const [language, setLanguage] = useState("en-US");
  const [sess, setSess] = useState(null); // Declare before any effect that reads it.
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [past, setPast] = useState([]);
  const [conversationStatus, setConversationStatus] = useState("Ready");
  const recognitionRef = useRef(null);
  const sessionRef = useRef(null);
  const voiceModeRef = useRef(voiceMode);
  const languageRef = useRef(language);
  const busyRef = useRef(false);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { if (!sess) { setQuestionSeconds(0); return undefined; } setQuestionSeconds(0); const id = setInterval(() => setQuestionSeconds((n) => n + 1), 1000); return () => clearInterval(id); }, [sess?.id, sess?.index, sess?.question]);
  const [answer, setAnswer] = useState("");
  const [last, setLast] = useState(null);       // feedback on the previous answer
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const loadPast = () => api("/interviews").then((d) => setPast(d.items || [])).catch(() => {});
  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch {} if (typeof window !== "undefined") window.speechSynthesis?.cancel(); }, []);
  useEffect(() => {
    (async () => {
      try {
        const [r, p] = await Promise.all([publicGet("/roles"), api("/profile")]);
        setRoles(r.roles.map((x) => x.name));
        setCfg((c) => ({ ...c, role: p.target_role || r.roles[0].name }));
        loadPast();
      } catch (e) { setErr(e.message); }
    })();
  }, []);

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
  }

  function speak(text, thenListen = false) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (thenListen) startListening();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageRef.current;
    utterance.rate = 0.96;
    utterance.onend = () => { if (thenListen && voiceModeRef.current === "voice") startListening(); };
    utterance.onerror = () => { if (thenListen && voiceModeRef.current === "voice") startListening(); };
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setConversationStatus("Voice recognition is unavailable in this browser. Please type your answer or use Chrome/Edge.");
      return;
    }
    stopListening();
    const rec = new SR();
    rec.lang = languageRef.current;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let transcript = "";
    rec.onstart = () => setConversationStatus("Listening — speak your answer now…");
    rec.onresult = (event) => {
      transcript = Array.from(event.results).map((r) => r[0]?.transcript || "").join(" ").trim();
      if (transcript) setAnswer(transcript);
    };
    rec.onerror = (event) => {
      setConversationStatus(event.error === "not-allowed" ? "Microphone permission denied. Allow microphone access or type your answer." : "I couldn't hear that clearly. Press Start listening and try again.");
    };
    rec.onend = () => {
      recognitionRef.current = null;
      if (transcript && voiceModeRef.current === "voice") {
        setConversationStatus("Answer captured. Preparing feedback…");
        submitAnswer(transcript, true);
      } else if (voiceModeRef.current === "voice") {
        setConversationStatus("No speech detected. Try again or type your answer.");
      }
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch { setConversationStatus("Could not start microphone. Try again or type your answer."); }
  }

  async function start() {
    setBusy(true); busyRef.current = true; setErr(null); setReport(null); setLast(null); setAnswer(""); sessionRef.current = null;
    setConversationStatus(voiceMode === "voice" ? "Starting your interview…" : "Interview ready.");
    try {
      const session = await callAI("/interviews/start", { method: "POST", body: cfg });
      sessionRef.current = session;
      setSess(session);
      if (voiceMode === "voice") {
        speak(`Hello and welcome to your SkillSetra interview for ${cfg.role}. I'll ask one question at a time. After each answer, I'll give you brief feedback and continue. Let's begin. ${session.question}`, true);
        setConversationStatus("AI interviewer is speaking…");
      }
    } catch (e) { setErr(e.message); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function submitAnswer(text, fromVoice = false) {
    const cleanAnswer = (text || answer).trim();
    const activeSession = sessionRef.current;
    if (!activeSession || cleanAnswer.length < 20 || busyRef.current) {
      if (fromVoice && cleanAnswer.length < 20) {
        setConversationStatus("Please give a little more detail (at least 20 characters), then try again.");
        speak("Could you please give a little more detail?", true);
      }
      return;
    }
    busyRef.current = true; setBusy(true); setErr(null); stopListening();
    try {
      const r = await callAI(`/interviews/${activeSession.id}/answer`, { method: "POST", body: { answer: cleanAnswer } });
      setLast(r); setAnswer("");
      const shortFeedback = (r.feedback || []).slice(0, 1).join(". ");
      if (r.done) {
        setReport(r.report); sessionRef.current = null; setSess(null); loadPast();
        const summary = r.report?.summary || "You have completed your interview.";
        setConversationStatus("Interview complete. Your report is ready below.");
        if (voiceModeRef.current === "voice") speak(`Thank you. That completes the interview. Your overall result is ${r.report?.level_label || "ready"}. ${summary}`);
      } else {
        const next = { ...activeSession, index: r.index + 1, question: r.question, source: r.source };
        sessionRef.current = next;
        setSess(next);
        if (voiceModeRef.current === "voice") {
          const acknowledgement = shortFeedback ? `Okay, thank you. ${shortFeedback}. Let's continue. ` : "Okay, thank you for your answer. Let's continue. ";
          setConversationStatus("AI is giving feedback, then asking the next question…");
          speak(`${acknowledgement}Next question. ${r.question}`, true);
        } else setConversationStatus("Answer evaluated. Continue to the next question.");
      }
    } catch (e) { setErr(e.message); setConversationStatus("There was a problem submitting your answer."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function send() { return submitAnswer(answer, false); }

  function downloadPdfReport() {
    if (!report || typeof window === "undefined") return;
    const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    const scores = Object.values(report.dimension_scores || {}).map(Number).filter(Number.isFinite);
    const pct = typeof report.overall_score === "number" ? Math.max(0, Math.min(100, Math.round(report.overall_score))) : scores.length ? Math.round(scores.reduce((sum, n) => sum + Math.max(0, Math.min(4, n)), 0) / (scores.length * 4) * 100) : null;
    const sections = [["Summary", report.summary], ["Strengths", report.strengths], ["Areas to improve", report.gaps || report.improve], ["Next steps", report.next_steps], ["Contradictions discussed", report.contradictions]];
    const sectionHtml = sections.filter(([, value]) => value && (!Array.isArray(value) || value.length)).map(([title, value]) => `<section><h2>${esc(title)}</h2>${(Array.isArray(value) ? value : [value]).map((item) => `<p>${esc(typeof item === "string" ? item : JSON.stringify(item))}</p>`).join("")}</section>`).join("");
    const dimensions = Object.entries(report.dimension_scores || {}).map(([name, raw]) => { const value = Math.max(0, Math.min(4, Number(raw) || 0)); return `<div class="dimension"><span>${esc(name)}</span><strong>${value}/4 · ${Math.round(value / 4 * 100)}%</strong><div class="track"><i style="width:${value / 4 * 100}%"></i></div></div>`; }).join("");
    const evidence = (report.evidence || []).map((item) => `<p><strong>${esc(item.dimension)}:</strong> ${esc(item.quote ? `“${item.quote}”` : "No direct quote verified.")} <span>${esc(item.rationale || "")}</span></p>`).join("");
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) { setErr("Allow pop-ups to export your PDF report."); return; }
    popup.document.write(`<!doctype html><html><head><title>SkillSetra Interview Report</title><style>body{font:14px Arial,sans-serif;color:#17251d;max-width:800px;margin:36px auto;line-height:1.55}header{background:#117543;color:white;padding:22px 26px;border-radius:12px}h1{margin:0;font-size:25px}header p{margin:6px 0 0}h2{font-size:16px;margin:24px 0 8px;border-bottom:1px solid #dce7df;padding-bottom:6px;text-transform:capitalize}.score{font-size:30px;font-weight:700;color:#117543}.track{height:8px;background:#dce7df;border-radius:8px;margin:7px 0 12px;overflow:hidden}.track i{display:block;background:#14964e;height:100%}.dimension{margin:10px 0}.dimension strong{float:right}.note{font-size:11px;color:#627168;margin-top:30px}@media print{body{margin:14mm}button{display:none}section{break-inside:avoid}}</style></head><body><header><h1>SkillSetra | Interview Report</h1><p>${esc(cfg.role)} · ${esc(cfg.kind)} interview · ${esc(new Date().toLocaleDateString())}</p></header>${pct === null ? "" : `<section><h2>Overall score</h2><div class="score">${pct}%</div><div class="track"><i style="width:${pct}%"></i></div></section>`}${sectionHtml}${dimensions ? `<section><h2>Seven-dimension rubric</h2>${dimensions}</section>` : ""}${evidence ? `<section><h2>Evidence quotes</h2>${evidence}</section>` : ""}<p class="note">AI-generated practice guidance, not a hiring prediction. Use this report to guide learning and verify its recommendations.</p><button onclick="window.print()">Print / Save as PDF</button><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  }

  if (!roles && !err) return <Loading />;
  return (
    <>
      <p className="eyebrow">AI Interviewer</p><h1>Practice the room before the room.</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>Five questions, scored one by one, then a final report that is saved to your evidence timeline.</p>
      {err && <p role="alert" style={{ color: "var(--bad-t)" }}>{err}</p>}

      {!sess && !report && roles && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Interview setup</h3>
          <div className="grid g3">
            <div><label htmlFor="r">Role</label><select id="r" value={cfg.role} onChange={(e) => setCfg({ ...cfg, role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</select></div>
            <div><label htmlFor="k">Interview type</label><select id="k" value={cfg.kind} onChange={(e) => setCfg({ ...cfg, kind: e.target.value })}>{["Technical", "Behavioral", "Mixed"].map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label htmlFor="d">Difficulty</label><select id="d" value={cfg.difficulty} onChange={(e) => setCfg({ ...cfg, difficulty: e.target.value })}>{["Beginner", "Intermediate", "Advanced", "Senior", "Adaptive"].map((x) => <option key={x}>{x}</option>)}</select></div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label htmlFor="voice-mode">Interview mode</label>
            <select id="voice-mode" value={voiceMode} onChange={(e) => setVoiceMode(e.target.value)}>
              <option value="text">Text interview</option><option value="voice">Live voice conversation (AI speaks and listens)</option>
            </select>
            <p className="small muted">Live voice mode speaks the welcome and questions, listens for your spoken answer, gives short feedback, and continues automatically. Chrome/Edge recommended; typing remains available.</p>
            <label htmlFor="voice-language">Conversation language</label>
            <select id="voice-language" value={language} onChange={(e) => setLanguage(e.target.value)}>{[["en-US","English"],["hi-IN","Hindi"],["gu-IN","Gujarati"],["es-ES","Spanish"],["fr-FR","French"],["de-DE","German"],["pt-BR","Portuguese"],["ar-SA","Arabic"],["ur-PK","Urdu"],["bn-IN","Bengali"],["ta-IN","Tamil"],["te-IN","Telugu"],["mr-IN","Marathi"]].map(([v,n]) => <option key={v} value={v}>{n}</option>)}</select>
          </div>
          <button className="btn primary" style={{ marginTop: 16 }} disabled={busy || !cfg.role} onClick={start}>{busy ? "Preparing…" : "Start interview"}</button>
        </div>)}

      {sess && (
        <div className="card" style={{ marginTop: 16 }} aria-live="polite">
          {last && <div className="item"><div className="row"><strong>Quick feedback</strong><Badge state={STATE[last.level] || STATE[0]} /><AiTag source={last.source} /></div>
            {scorePercent(last) !== null && <div style={{margin:"10px 0"}}><div className="row" style={{justifyContent:"space-between"}}><strong>Answer score</strong><strong>{scorePercent(last)}%</strong></div><div className="bar" style={{height:10}}><i style={{width:`${scorePercent(last)}%`}} /></div></div>}
            <List t="In short" items={(last.feedback || []).slice(0, 2)} /><List t="What went well" items={(last.strengths || []).slice(0, 2)} /><List t="Try next time" items={(last.improve || []).slice(0, 2)} />
            {last.contradictions?.length > 0 && <List t="Clarify" items={last.contradictions.slice(0, 1)} />}
            {last.dimension_scores && <><h4>Seven-dimension score (0–4)</h4><div className="grid g2">{Object.entries(last.dimension_scores).map(([k, v]) => <div key={k} className="item"><div className="row" style={{justifyContent:"space-between"}}><span>{k}</span><strong>{v}/4</strong></div><div className="bar"><i style={{width:`${v*25}%`}} /></div></div>)}</div></>}
            {last.evidence?.length > 0 && <><h4>Evidence from your answer</h4>{last.evidence.map((e,i)=><div className="item" key={i}><strong>{e.dimension}</strong><p>{e.quote ? `“${e.quote}”` : "No direct quote was verified."}</p><p className="small muted">{e.rationale}</p></div>)}</>}
          </div>}
          <p className="eyebrow">Question {sess.index + 1} of {sess.total} · <AiTag source={sess.source} /></p>
          {voiceMode === "voice" && <p className="small muted" aria-live="polite">{conversationStatus}</p>}
          <p className="small muted" role="timer">Time on this question: {Math.floor(questionSeconds / 60)}:{String(questionSeconds % 60).padStart(2, "0")}</p>
          <h2 style={{ fontSize: "1.5rem", lineHeight: 1.3 }}>{sess.question}</h2>
          <label htmlFor="a">Your answer</label>
          <textarea id="a" rows={7} value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={2500} />
          {voiceMode === "voice" ? <div className="row" style={{gap:8,flexWrap:"wrap"}}><button type="button" className="btn" onClick={startListening} disabled={busy}>Start listening again</button><button type="button" className="btn" onClick={() => { stopListening(); window.speechSynthesis?.cancel(); setConversationStatus("Voice paused. You can type your answer."); }}>Stop voice</button></div> : <VoiceControls language={language} onTranscript={(text) => setAnswer((old) => `${old}${old ? " " : ""}${text}`)} speakText={sess.question} />}
          <p className="small muted">{answer.trim().length} / 2500 characters (at least 20)</p>
          <button className="btn primary" disabled={busy || answer.trim().length < 20} onClick={send}>
            {busy ? "Evaluating…" : sess.index + 1 === sess.total ? "Finish interview" : "Submit answer"}</button>
        </div>)}

      {report && (
        <div className="card diag" style={{ marginTop: 16 }}>
          <div className="row"><ChartNoAxesCombined size={20} aria-hidden="true" /><strong>Final report</strong><Badge state={STATE[report.level] || STATE[0]} />{last && <AiTag source={last.source} />}</div>
          {scorePercent(report) !== null && <div className="item"><div className="row" style={{justifyContent:"space-between"}}><strong>Overall score</strong><strong>{scorePercent(report)}%</strong></div><div className="bar" style={{height:12}}><i style={{width:`${scorePercent(report)}%`}} /></div><p className="small muted">A simple practice estimate based on the available rubric scores.</p></div>}
          <p>{report.summary || "Interview complete. Review your strengths and next steps below."}</p>
          <List t="Strengths" items={report.strengths} /><List t="Gaps" items={report.gaps} /><List t="Next steps" items={report.next_steps} />
          {report.dimension_scores && <><h3>Rubric results (0–4)</h3><div className="grid g2">{Object.entries(report.dimension_scores).map(([k,v])=><div className="item" key={k}><div className="row" style={{justifyContent:"space-between"}}><span>{k}</span><strong>{v}/4</strong></div><div className="bar"><i style={{width:`${v*25}%`}} /></div></div>)}</div></>}
          <List t="Contradictions discussed" items={report.contradictions} />
          {report.evidence?.length > 0 && <><h3>Evidence quotes</h3>{report.evidence.map((e,i)=><div className="item" key={i}><strong>{e.dimension}</strong><p>{e.quote ? `“${e.quote}”` : "No direct quote was verified."}</p><p className="small muted">{e.rationale}</p></div>)}</>}
          <p className="small muted">Saved to your evidence timeline. Interview scores are one signal, never a verdict.</p>
          <button className="btn primary" onClick={downloadPdfReport}><Download size={16} aria-hidden="true" /> Download professional PDF report</button>
          <button className="btn primary" onClick={() => { setReport(null); setLast(null); }}>Start another interview</button>
        </div>)}

      {past.length > 0 && !sess && (
        <div className="card" style={{ marginTop: 16 }}><h3>Past interviews</h3>
          {past.map((p) => <div className="item" key={p.id}><div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{p.role} · {p.kind}</strong><span className="badge none">{p.status === "done" ? p.level_label : "Unfinished"}</span></div>
            <p className="small muted">{p.difficulty} · {new Date(p.created_at).toLocaleDateString()}</p></div>)}</div>)}
    </>
  );
}