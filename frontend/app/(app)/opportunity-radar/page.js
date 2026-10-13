"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import useApi from "@/hooks/useApi";
import { ErrorBox, Loading } from "@/components/Status";

export default function OpportunityRadar() {
  const [hours, setHours] = useState(6);
  const { data, error, loading, reload } = useApi(`/radar?weekly_hours=${hours}`);
  const [msg, setMsg] = useState(null);

  async function adopt(role) {
    if (!window.confirm(`Make ${role} your target role? Your results for other roles are kept.`)) return;
    try { await api("/profile/role", { method: "PUT", body: { target_role: role } }); setMsg(`Your target role is now ${role}. Take its assessment to build evidence.`); reload(); }
    catch (e) { setMsg(e.message); }
  }

  if (!data && loading) return <Loading label="Reading your evidence" />;
  if (!data) return <ErrorBox message={error} onRetry={reload} />;
  const a = data.assumptions;
  return (
    <>
      <p className="eyebrow">Opportunity Radar</p>
      <h1>Roles that fit your evidence</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>See where your recorded evidence is strongest, and which roles are closest to what you can already show.</p>

      <div className="card" style={{ margin: "16px 0" }}>
        {data.strongest
          ? <><p className="eyebrow">Strongest evidence area</p><h2 style={{ fontSize: "1.6rem" }}>{data.strongest.area}</h2>
              <p className="muted">{data.strongest.backed} of {data.strongest.total} skills in this area have Developing or Demonstrated evidence.</p></>
          : <><h3>Not enough evidence yet to name a strongest area</h3><p className="muted">{data.note} <Link href="/assessment">Take an assessment</Link> to start.</p></>}
        {data.suggestion && <p><strong>{data.suggestion}</strong></p>}
        {data.shortest_path && <p className="small muted">Shortest estimated path among the roles you have evidence for: {data.shortest_path}.</p>}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Evidence by area</h3>
        {data.areas.map((x) => (
          <div key={x.area} style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><strong>{x.area}</strong><span className="small muted">{x.backed} of {x.total} skills backed</span></div>
            <div className="bar" aria-hidden><i style={{ width: `${x.pct}%` }} /></div>
          </div>))}
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div><label htmlFor="h" style={{ marginTop: 0 }}>My weekly study hours</label>
          <select id="h" value={hours} onChange={(e) => setHours(+e.target.value)} style={{ minWidth: 160 }}>
            {[3, 6, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} hours</option>)}</select></div>
      </div>
      {msg && <p role="status">{msg}</p>}

      <div className="grid g2">
        {data.roles.map((r) => (
          <div className="card" key={r.role}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{r.role}</h3>
              <span className="row">{r.recommended && <span className="badge ok">Recommended</span>}{r.is_target && <span className="badge dev">Your target</span>}</span>
            </div>
            <p className="small muted" style={{ margin: "6px 0" }}>Evidence coverage {r.coverage_pct}% ({r.backed.length} of {r.total} skills)</p>
            <div className="bar" aria-hidden><i style={{ width: `${r.coverage_pct}%` }} /></div>
            {r.backed.length > 0 && <div className="chips">{r.backed.map((s) => <span className="badge ok" key={s}>{s}</span>)}</div>}
            {r.partial.length > 0 && <div className="chips">{r.partial.map((s) => <span className="badge lim" key={s}>{s} (thin)</span>)}</div>}
            {r.missing.length > 0 && <div className="chips">{r.missing.map((s) => <span className="badge none" key={s}>{s}</span>)}</div>}
            <p className="small">{r.effort_hours > 0 ? `Estimated preparation: about ${r.effort_weeks} weeks at ${hours} hours a week (${r.effort_hours} hours).` : "No extra preparation estimated from your evidence."}</p>
            <div className="row">
              {!r.is_target && <button className="btn" onClick={() => adopt(r.role)}>Make this my target role</button>}
              <Link className="btn" href="/job-check">Check a job for this role</Link>
            </div>
          </div>))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>How to read this</h3>
        <ul>
          <li>Green skills have Developing or Demonstrated evidence. Amber skills have thin evidence. Grey skills have no evidence yet, which is not proof that you lack them.</li>
          <li>Preparation time assumes {a.hours_partial} hours to strengthen thin evidence and {a.hours_missing} hours to build first evidence for one skill. Real time varies a lot.</li>
          <li>A role is recommended only if at least two of its skills have evidence.</li>
          <li>For live listings, use the <Link href="/jobs">Jobs page</Link>.</li>
        </ul>
      </div>
    </>
  );
}