"use client";
import Link from "next/link";
import { useState } from "react";
import useApi from "@/hooks/useApi";
import Fingerprint from "@/components/Fingerprint";
import { Badge, Empty, ErrorBox, Loading } from "@/components/Status";

const SRC = { exam: "Assessment", challenge: "Challenge", github: "GitHub analysis", interview: "AI interview", defense: "Defense",
  project: "Project", whatif: "What-If", disagreement: "AI Disagreement", seed: "Demo data" };
const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(1));

export default function SkillDna() {
  const { data, error, loading, reload } = useApi("/skill-dna");
  const [open, setOpen] = useState(null);
  if (loading) return <Loading label="Building your Skill DNA" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <>
      <p className="eyebrow">Skill DNA</p>
      <h1>Your ability fingerprint</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>How you work, not just what you know. Every point below links to the activities behind it.</p>
      <p className="small muted">{data.disclaimer}</p>

      {data.total_evidence === 0 ? (
        <Empty title="No evidence yet">Complete an assessment or a challenge to start your fingerprint. <Link href="/assessment">Start assessment</Link></Empty>
      ) : (
        <>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <div className="card"><h3>Fingerprint</h3><Fingerprint items={data.indicators} />
              <p className="small muted">The centre means "not enough evidence yet", not "weak".</p></div>
            <div className="card"><h3>What the evidence suggests</h3>
              <ul>{data.observations.map((o) => <li key={o}>{o}</li>)}</ul>
              <p className="small muted">These sentences come from fixed rules over your saved results. They are not AI-generated.</p></div>
          </div>

          <h3 style={{ margin: "24px 0 10px" }}>The evidence behind each indicator</h3>
          <div className="grid">{data.indicators.map((i) => (
            <div className="card" key={i.key}>
              <button className="state-row" aria-expanded={open === i.key} onClick={() => setOpen(open === i.key ? null : i.key)}>
                <span><strong>{i.label}</strong><br /><span className="small muted">{i.blurb}</span></span>
                <span className="row">
                  {i.trend && <span className="badge none">{i.trend}</span>}
                  {i.consistency && <span className="badge none">{i.consistency}</span>}
                  <span className="small muted">{i.count} result{i.count === 1 ? "" : "s"}</span>
                  <Badge state={i.state} />
                </span>
              </button>
              {open === i.key && (i.evidence.length === 0
                ? <p className="small muted" style={{ marginTop: 10 }}>Nothing recorded yet.</p>
                : <table className="sheet" style={{ marginTop: 10 }}>
                    <thead><tr><th>Date</th><th>Source</th><th>Level</th><th>What was recorded</th></tr></thead>
                    <tbody>{i.evidence.map((r, k) => (
                      <tr key={k}><td>{new Date(r.when).toLocaleDateString()}</td><td>{SRC[r.source] || r.source}</td><td>{fmt(r.level)} of 3</td><td>{r.summary}</td></tr>))}</tbody>
                  </table>)}
            </div>))}</div>
        </>)}
    </>
  );
}