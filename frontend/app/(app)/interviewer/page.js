"use client";
import { useEffect, useState } from "react";
import { api, publicGet } from "@/lib/api";
import { callAI } from "@/lib/ai";
import AiTag from "@/components/AiTag";
import { Badge, Loading } from "@/components/Status";

const STATE = ["Not Yet Demonstrated", "Limited", "Developing", "Demonstrated"];
const List = ({ t, items }) => (items?.length ? <><h4>{t}</h4><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></> : null);

export default function Interviewer() {
  const [roles, setRoles] = useState(null);
  const [cfg, setCfg] = useState({ role: "", kind: "Technical", difficulty: "Adaptive" });
  const [past, setPast] = useState([]);
  const [sess, setSess] = useState(null);       // { id, total, index, question, source }
  const [answer, setAnswer] = useState("");
  const [last, setLast] = useState(null);       // feedback on the previous answer
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const loadPast = () => api("/interviews").then((d) => setPast(d.items)).catch(() => {});
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

  async function start() {
    setBusy(true); setErr(null); setReport(null); setLast(null);
    try { setSess(await callAI("/interviews/start", { method: "POST", body: cfg })); setAnswer(""); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }
  async function send() {
    setBusy(true); setErr(null);
    try {
      const r = await callAI(`/interviews/${sess.id}/answer`, { method: "POST", body: { answer: answer.trim() } });
      setLast(r); setAnswer("");
      if (r.done) { setReport(r.report); setSess(null); loadPast(); }
      else setSess({ ...sess, index: r.index + 1, question: r.question, source: r.source });
    } catch (e) { setErr(e.message); }
    setBusy(false);
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
            <div><label htmlFor="d">Difficulty</label><select id="d" value={cfg.difficulty} onChange={(e) => setCfg({ ...cfg, difficulty: e.target.value })}>{["Beginner", "Intermediate", "Advanced", "Adaptive"].map((x) => <option key={x}>{x}</option>)}</select></div>
          </div>
          <button className="btn primary" style={{ marginTop: 16 }} disabled={busy || !cfg.role} onClick={start}>{busy ? "Preparing…" : "Start interview"}</button>
        </div>)}

      {sess && (
        <div className="card" style={{ marginTop: 16 }} aria-live="polite">
          {last && <div className="item"><div className="row"><strong>Last answer</strong><Badge state={STATE[last.level]} /><AiTag source={last.source} /></div>
            <List t="Feedback" items={last.feedback} /><List t="Strengths" items={last.strengths} /><List t="To improve" items={last.improve} /></div>}
          <p className="eyebrow">Question {sess.index + 1} of {sess.total} · <AiTag source={sess.source} /></p>
          <h2 style={{ fontSize: "1.5rem", lineHeight: 1.3 }}>{sess.question}</h2>
          <label htmlFor="a">Your answer</label>
          <textarea id="a" rows={7} value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={2500} />
          <p className="small muted">{answer.trim().length} / 2500 characters (at least 20)</p>
          <button className="btn primary" disabled={busy || answer.trim().length < 20} onClick={send}>
            {busy ? "Evaluating…" : sess.index + 1 === sess.total ? "Finish interview" : "Submit answer"}</button>
        </div>)}

      {report && (
        <div className="card diag" style={{ marginTop: 16 }}>
          <div className="row"><strong>Final report</strong><Badge state={STATE[report.level]} />{last && <AiTag source={last.source} />}</div>
          <p>{report.summary}</p>
          <List t="Strengths" items={report.strengths} /><List t="Gaps" items={report.gaps} /><List t="Next steps" items={report.next_steps} />
          <p className="small muted">Saved to your evidence timeline. Interview scores are one signal, never a verdict.</p>
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