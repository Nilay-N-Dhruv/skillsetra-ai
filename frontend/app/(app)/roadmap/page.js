"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { callAI } from "@/lib/ai";
import useApi from "@/hooks/useApi";
import AiTag from "@/components/AiTag";
import { Badge, Empty, ErrorBox, Loading } from "@/components/Status";

export default function Roadmap() {
  const { data, error, loading, reload, refresh } = useApi("/roadmap");
  const [advice, setAdvice] = useState({});
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  if (loading) return <Loading label="Building your roadmap" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  async function toggle(skill, key, done) {
    setErr(null);
    try { await api("/learning/progress", { method: "POST", body: { skill, key, done } }); refresh(); } catch (e) { setErr(e.message); }
  }
  async function ask(skill) {
    setBusy(skill);
    try { setAdvice({ ...advice, [skill]: await callAI("/learning/advice", { method: "POST", body: { skill } }) }); }
    catch (e) { setAdvice({ ...advice, [skill]: { text: e.message, source: "error" } }); }
    setBusy(null);
  }
  return (
    <>
      <p className="eyebrow">Learning path</p><h1>{data.role} evidence roadmap</h1>
      <p className="muted">{data.completed} skills already demonstrated. Tick items as you finish them, then re-test to turn learning into evidence.</p>
      {err && <p role="alert" style={{ color: "var(--bad-t)" }}>{err}</p>}
      {data.steps.length === 0
        ? <Empty title="Nothing left on this roadmap">Every skill for this role has strong evidence. <Link href="/onboarding">Try another role</Link></Empty>
        : <div className="grid">{data.steps.map((s, i) => (
          <div className="card" key={s.competency}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>Step {i + 1}: {s.competency}</h3>
              <span className="row"><Badge state={s.state} /><span className="badge none">{s.status}</span></span></div>
            <p className="muted" style={{ margin: "8px 0" }}>{s.why}</p>
            <div className="bar" aria-hidden><i style={{ width: `${(s.progress.done / s.progress.total) * 100}%` }} /></div>
            <p className="small muted">{s.progress.done} of {s.progress.total} learning items done</p>
            {s.modules.map((m) => (
              <label key={m.key} className="chk">
                <input type="checkbox" checked={m.done} onChange={() => toggle(s.competency, m.key, !m.done)} />
                <span>{m.url ? <a href={m.url} target="_blank" rel="noopener noreferrer">{m.title}</a> : <><strong>Project task:</strong> {m.title}</>} <span className="small muted">({m.type})</span></span>
              </label>))}
            <p className="small muted"><strong>Evidence required:</strong> {s.evidence_required}</p>
            <div className="row">
              <Link className="btn primary" href={`/assessment?skill=${encodeURIComponent(s.competency)}`}>Re-test {s.competency}</Link>
              <button className="btn" disabled={busy === s.competency} onClick={() => ask(s.competency)}>{busy === s.competency ? "Writing…" : "Why this matters to me"}</button>
            </div>
            {advice[s.competency] && <p style={{ marginTop: 10 }}>{advice[s.competency].text} {advice[s.competency].source !== "error" && <AiTag source={advice[s.competency].source} />}</p>}
          </div>))}</div>}
    </>
  );
}