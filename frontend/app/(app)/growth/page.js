"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import useApi from "@/hooks/useApi";
import { Empty, ErrorBox, Loading } from "@/components/Status";

const LEVEL = ["No evidence", "Limited", "Developing", "Demonstrated"];
const day = (s) => new Date(s).toLocaleDateString();
const MOVE = { up: "The evidence level moved up", down: "The evidence level moved down", same: "The evidence level stayed the same" };

export default function Growth() {
  const list = useApi("/growth");
  const [report, setReport] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);

  async function open(key) {
    setBusy(key); setErr(null);
    try { setReport(await api(`/growth/report?competency=${encodeURIComponent(key)}`)); } catch (e) { setErr(e.message); }
    setBusy(null);
  }

  if (list.loading) return <Loading label="Loading your evidence" />;
  if (list.error) return <ErrorBox message={list.error} onRetry={list.reload} />;

  if (report?.ready) {
    const { before: b, after: a } = report;
    return (
      <article className="report">
        <div className="row no-print" style={{ marginBottom: 12 }}>
          <button className="btn" onClick={() => setReport(null)}>Back</button>
          <button className="btn primary" onClick={() => window.print()}>Print or save as PDF</button>
        </div>
        <p className="eyebrow">Proof of Growth</p>
        <h1>{report.competency}</h1>
        <p className="muted">Learner: <strong>{report.learner}</strong>{report.role ? ` · Target role: ${report.role}` : ""} · Generated {day(new Date().toISOString())}</p>
        <div className="pair" style={{ margin: "16px 0" }}>
          {[["Before", b], ["After", a]].map(([t, e]) => (
            <div className="card" key={t}><p className="eyebrow">{t}</p><h3>{e.level_label}</h3>
              <p className="small muted">{day(e.when)} · {e.kind}</p><p>{e.summary}</p></div>))}
        </div>
        <div className="card">
          <h3>{MOVE[report.movement]}</h3>
          <p className="muted">From {b.level_label} to {a.level_label}. This compares two saved results. It does not say what caused the difference.</p>
          <h4>Learning completed between the two results</h4>
          {report.interventions.length ? <ul>{report.interventions.map((x) => <li key={x}>{x}</li>)}</ul>
            : <p className="small muted">No learning items were ticked on your roadmap between these two results.</p>}
          <h4>What remains</h4><p>{report.remaining}</p>
          <h4>How reliable is this?</h4><p>{report.verification}</p>
          <ul>{report.limitations.map((l) => <li key={l} className="small">{l}</li>)}</ul>
        </div>
        <div className="card" style={{ marginTop: 16 }}><h3>All results used</h3>
          <table className="sheet"><thead><tr><th>Date</th><th>Level</th><th>How it was judged</th><th>Summary</th></tr></thead>
            <tbody>{report.comparison.map((e, i) => <tr key={i}><td>{day(e.when)}</td><td>{e.level_label}</td><td>{e.kind}</td><td>{e.summary}</td></tr>)}</tbody></table>
        </div>
        <p className="small muted no-print" style={{ marginTop: 14 }}>This report is private to your account. Print or save it yourself if you want to share it.</p>
      </article>
    );
  }

  return (
    <>
      <p className="eyebrow">Proof of Growth</p>
      <h1>Show how a skill changed</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>Pick a competency with at least two results. You get a before-and-after report that you can print.</p>
      {err && <p role="alert" style={{ color: "var(--bad-t)" }}>{err}</p>}
      {report && !report.ready && <div className="card" role="status" style={{ marginBottom: 16 }}>{report.reason}</div>}
      {list.data.items.length === 0 ? (
        <Empty title="No evidence yet">Take an assessment first, then re-test to see growth.</Empty>
      ) : (
        <div className="grid g3">{list.data.items.map((i) => (
          <div className="card" key={i.key}>
            <h3>{i.key}</h3>
            <p className="small muted">{i.count} result{i.count === 1 ? "" : "s"} · first: {LEVEL[i.first_level]} · latest: {LEVEL[i.latest_level]}</p>
            <button className="btn primary" disabled={!i.ready || busy === i.key} onClick={() => open(i.key)}>
              {busy === i.key ? "Building…" : i.ready ? "View report" : "Needs 2 results"}</button>
          </div>))}</div>)}
    </>
  );
}