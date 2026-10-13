"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import useApi from "@/hooks/useApi";

const STATUS = { demonstrated: ["Demonstrated", "ok"], partial: ["Partially supported", "lim"], missing: ["Missing evidence", "none"] };
const LEVEL = ["No evidence", "Limited", "Developing", "Demonstrated"];
const Chip = ({ s }) => <span className={`badge ${STATUS[s][1]}`}>{STATUS[s][0]}</span>;

export default function JobCheck() {
  const saved = useApi("/job-check/saved");
  const [f, setF] = useState({ title: "", company: "", text: "" });
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pick, setPick] = useState({ a: "", b: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ready = f.text.trim().length >= 50;

  async function run(save) {
    setBusy(true); setMsg(null);
    try {
      const r = await api("/job-check/analyze", { method: "POST", body: { title: f.title.trim() || "Job posting", company: f.company.trim(), text: f.text, save } });
      setRes(r);
      if (save) { setMsg("Saved."); saved.refresh(); }
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  }
  async function remove(id) {
    if (!window.confirm("Delete this saved analysis?")) return;
    try { await api(`/job-check/saved/${id}`, { method: "DELETE" }); setPick({ a: "", b: "" }); saved.refresh(); } catch (e) { setMsg(e.message); }
  }

  const items = saved.data?.items || [];
  const A = items.find((x) => x.id === pick.a), B = items.find((x) => x.id === pick.b);
  const keys = A && B ? [...new Set([...A.result.requirements, ...B.result.requirements].map((r) => r.key))] : [];
  const stat = (x, k) => { const r = x.result.requirements.find((q) => q.key === k); return r ? STATUS[r.status][0] : "Not in posting"; };

  return (
    <>
      <p className="eyebrow">Job Reality Check</p>
      <h1>How does a job compare with your evidence?</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>Paste a job description. We compare it with what you have <strong>demonstrated</strong>, not with what you claim. The pasted text is not stored.</p>

      <div className="card">
        <div className="grid g2">
          <div><label htmlFor="t" style={{ marginTop: 0 }}>Job title</label><input id="t" value={f.title} onChange={set("title")} maxLength={120} placeholder="Backend Engineer" /></div>
          <div><label htmlFor="c" style={{ marginTop: 0 }}>Company (optional)</label><input id="c" value={f.company} onChange={set("company")} maxLength={120} /></div>
        </div>
        <label htmlFor="d">Job description</label>
        <textarea id="d" rows={12} value={f.text} onChange={set("text")} maxLength={8000} placeholder="Paste the full posting here, including requirements and nice-to-have sections." />
        <p className="small muted">{f.text.trim().length} / 8000 characters (at least 50). Pasting a link is not supported. Paste the text itself.</p>
        <div className="row">
          <button className="btn primary" disabled={busy || !ready} onClick={() => run(false)}>{busy ? "Analysing…" : "Analyse"}</button>
          <button className="btn" disabled={busy || !ready} onClick={() => run(true)}>Analyse and save</button>
        </div>
        {msg && <p role="status" style={{ marginTop: 10 }}>{msg}</p>}
      </div>

      {res && (
        <div style={{ marginTop: 20 }} aria-live="polite">
          <div className="card">
            <p className="eyebrow">Match with your evidence</p>
            {res.score === null
              ? <h2>No score: we found no known skills in this text</h2>
              : <h2 style={{ fontSize: "2.4rem" }}>{res.score}% <span className="small muted">({res.score_confidence} confidence)</span></h2>}
            <p className="small muted">{res.formula}. {res.counts.total} assessable requirement{res.counts.total === 1 ? "" : "s"} found.</p>
            <div className="chips"><span className="badge ok">{res.counts.demonstrated} demonstrated</span><span className="badge lim">{res.counts.partial} partially supported</span>
              <span className="badge none">{res.counts.missing} missing evidence</span></div>
          </div>

          {res.requirements.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}><h3>Requirement by requirement</h3>
              <div style={{ overflowX: "auto" }}><table className="sheet">
                <thead><tr><th>Skill</th><th>Type</th><th>Status</th><th>Your recorded evidence</th></tr></thead>
                <tbody>{res.requirements.map((r) => (
                  <tr key={r.key}><td><strong>{r.key}</strong></td><td>{r.level}</td><td><Chip s={r.status} /></td>
                    <td>{r.evidence.length ? r.evidence.map((e, i) => <div key={i} className="small">{e.date} · {e.source} · {LEVEL[e.level]}</div>) : <span className="small muted">None recorded</span>}
                      <div className="small muted">{r.why}</div></td></tr>))}</tbody></table></div>
            </div>)}

          <div className="grid g2" style={{ marginTop: 16 }}>
            {res.not_assessed.length > 0 && <div className="card"><h3>Not assessed by SkillSetra</h3><div className="chips">{res.not_assessed.map((x) => <span className="badge none" key={x}>{x}</span>)}</div>
              <p className="small muted">We cannot test these yet. They are not counted in the score.</p></div>}
            {(res.experience_years.length > 0 || res.qualifications.length > 0) && <div className="card"><h3>Experience and qualifications</h3>
              {res.experience_years.length > 0 && <p className="small">Mentions up to {Math.max(...res.experience_years)} years of experience. We cannot verify years of experience.</p>}
              <ul>{res.qualifications.map((q, i) => <li key={i} className="small">{q}</li>)}</ul></div>}
            {res.responsibilities.length > 0 && <div className="card"><h3>Responsibilities</h3><ul>{res.responsibilities.map((x, i) => <li key={i} className="small">{x}</li>)}</ul></div>}
          </div>

          {res.plan.length > 0 && <div className="card" style={{ marginTop: 16 }}><h3>Your preparation plan</h3>
            <p className="small muted">Ordered by what the posting asks for most. About {res.total_hours} hours in total, using planning assumptions that vary a lot in real life.</p>
            {res.plan.map((p) => (<div className="item" key={p.skill}>
              <div className="row" style={{ justifyContent: "space-between" }}><strong>{p.skill}</strong><span className="small muted">{p.level} · about {p.hours} hours</span></div>
              <p className="small">{p.action}.{p.resource && <> Start here: <a href={p.resource.url} target="_blank" rel="noopener noreferrer">{p.resource.title}</a></>}</p></div>))}</div>}
          <div className="card" style={{ marginTop: 16 }}>{res.notes.map((n) => <p className="small muted" key={n}>{n}</p>)}</div>
        </div>)}

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Saved analyses ({items.length}/30)</h3>
        {items.length === 0 ? <p className="muted small">Nothing saved yet. Use "Analyse and save".</p> : (
          <>
            {items.map((x) => (<div className="item" key={x.id}><div className="row" style={{ justifyContent: "space-between" }}>
              <span><strong>{x.title}</strong> <span className="small muted">{x.company} · {new Date(x.created_at).toLocaleDateString()}</span></span>
              <span className="row"><span className="badge dev">{x.score === null ? "no score" : `${x.score}%`}</span><button className="btn" onClick={() => remove(x.id)}>Delete</button></span></div></div>))}
            {items.length >= 2 && (<>
              <h4 style={{ marginTop: 16 }}>Compare two analyses</h4>
              <div className="grid g2">
                {["a", "b"].map((k) => <div key={k}><label htmlFor={`p${k}`}>{k === "a" ? "First" : "Second"}</label>
                  <select id={`p${k}`} value={pick[k]} onChange={(e) => setPick({ ...pick, [k]: e.target.value })}><option value="">Choose…</option>
                    {items.map((x) => <option key={x.id} value={x.id}>{x.title} ({x.score ?? "n/a"}%)</option>)}</select></div>)}
              </div>
              {A && B && <div style={{ overflowX: "auto", marginTop: 10 }}><table className="sheet">
                <thead><tr><th>Skill</th><th>{A.title}</th><th>{B.title}</th></tr></thead>
                <tbody><tr><td><strong>Score</strong></td><td>{A.score ?? "n/a"}%</td><td>{B.score ?? "n/a"}%</td></tr>
                  {keys.map((k) => <tr key={k}><td>{k}</td><td>{stat(A, k)}</td><td>{stat(B, k)}</td></tr>)}</tbody></table>
                <p className="small muted">Statuses are as of the day each analysis was saved.</p></div>}
            </>)}
          </>)}
      </div>
    </>
  );
}