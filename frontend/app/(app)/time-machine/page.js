"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import useApi from "@/hooks/useApi";
import { Badge, ErrorBox, Loading } from "@/components/Status";

const GROUPS = [["backed", "Evidence you carry over"], ["partial", "Partial evidence"], ["missing", "Needs evidence"]];

export default function TimeMachine() {
  const career = useApi("/career");
  const [target, setTarget] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function compare(role) {
    setTarget(role); setBusy(true); setMsg(null);
    try { setRes(await api(`/career/compare?target=${encodeURIComponent(role)}`)); } catch (e) { setMsg(e.message); }
    setBusy(false);
  }
  async function adopt() {
    try { await api("/profile/role", { method: "PUT", body: { target_role: res.target } }); setMsg(`Your target role is now ${res.target}. Take its assessment to build evidence.`); }
    catch (e) { setMsg(e.message); }
  }

  if (career.loading) return <Loading />;
  if (career.error) return <ErrorBox message={career.error} onRetry={career.reload} />;
  return (
    <>
      <p className="eyebrow">Career Time Machine</p>
      <h1>What if I changed roles?</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>See which of your existing evidence carries over to another role, and what is new. You do not start from zero.</p>
      <label htmlFor="t">Compare with</label>
      <select id="t" value={target} onChange={(e) => compare(e.target.value)} style={{ maxWidth: 340 }}>
        <option value="" disabled>Choose a role</option>
        {career.data.roles.map((r) => <option key={r}>{r}</option>)}
      </select>
      {busy && <Loading label="Comparing" />}
      {msg && <p role="status" style={{ marginTop: 12 }}>{msg}</p>}

      {res && !busy && (
        <>
          <p style={{ marginTop: 16 }}>From <strong>{res.origin}</strong> to <strong>{res.target}</strong>.{res.same_role && " This is already your role."}</p>
          <div className="grid g3">{GROUPS.map(([k, title]) => (
            <div className="card" key={k}><h3>{title}</h3>
              {res[k].length === 0 ? <p className="small muted">Nothing here.</p> : res[k].map((r) => (
                <div className="item" key={r.skill}><div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{r.skill}</strong><Badge state={r.state} /></div>
                  {!r.in_origin && <p className="small muted">New compared with {res.origin}</p>}</div>))}
            </div>))}</div>
          {res.resources.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}><h3>Start with these gaps</h3>
              {res.resources.map((g) => (
                <div key={g.skill}><strong>{g.skill}</strong>
                  <ul>{g.links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a></li>)}</ul></div>))}</div>)}
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn primary" disabled={res.same_role} onClick={adopt}>Make {res.target} my target role</button>
            <Link className="btn" href={`/assessment?role=${encodeURIComponent(res.target)}`}>Take the {res.target} assessment</Link>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>{res.note}</p>
        </>)}
    </>
  );
}