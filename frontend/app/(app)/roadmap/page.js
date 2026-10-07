"use client";
import Link from "next/link";
import useApi from "@/hooks/useApi";
import { Badge, Empty, ErrorBox, Loading } from "@/components/Status";

export default function Roadmap() {
  const { data, error, loading, reload } = useApi("/roadmap");
  if (loading) return <Loading label="Building your roadmap" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <>
      <p className="eyebrow">Roadmap</p>
      <h1>{data.role} evidence roadmap</h1>
      <p className="muted">{data.completed} skills already demonstrated. The steps below are ordered by importance for the role and are rebuilt from your latest evidence.</p>
      {data.steps.length === 0
        ? <Empty title="Nothing left on this roadmap">Every skill for this role has strong evidence. <Link href="/onboarding">Try another role</Link></Empty>
        : <div className="grid">{data.steps.map((s, i) => (
            <div className="card" key={s.competency}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>Step {i + 1}: {s.competency}</h3>
                <span className="row"><Badge state={s.state} /><span className="badge none">{s.status}</span></span>
              </div>
              <p className="muted" style={{ margin: "8px 0" }}>{s.why}</p>
              <strong>Learn</strong>
              <ul>{s.resources.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a> <span className="small muted">({r.type})</span></li>)}</ul>
              <p style={{ margin: "8px 0" }}><strong>Project task:</strong> {s.project_task}</p>
              <p className="small muted"><strong>Evidence required:</strong> {s.evidence_required}</p>
              <Link className="btn" href={`/assessment?skill=${encodeURIComponent(s.competency)}`}>Re-test {s.competency}</Link>
            </div>))}</div>}
    </>
  );
}