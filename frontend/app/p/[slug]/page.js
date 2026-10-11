"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Logo from "@/components/Logo";
import { Loading } from "@/components/Status";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const LABEL = { demonstrated: "Demonstrated", "self-reported": "Self-reported (not verified)", insufficient: "Limited evidence", outdated: "Older evidence" };

export default function PublicPassport() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/api/public/passport/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setP)
      .catch((s) => setErr(s === 404 || s === 422 ? "This passport is not available." : "We couldn't load this passport. Please try again later."));
  }, [slug]);

  if (err) return <main className="container" style={{ padding: "64px 20px", textAlign: "center" }}><Logo /><h2 style={{ marginTop: 24 }}>{err}</h2></main>;
  if (!p) return <Loading label="Loading passport" />;
  return (
    <main className="container report" style={{ padding: "32px 20px 64px" }}>
      <div className="row no-print" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <Logo height={36} /><button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
      </div>
      <p className="eyebrow">Proof Passport</p>
      <h1>{p.name}</h1>
      {p.headline && <p style={{ fontSize: "1.15rem" }}>{p.headline}</p>}
      <p className="muted small">{p.role ? `Target role: ${p.role} · ` : ""}{p.published_on ? `Published ${p.published_on}` : ""}</p>

      {p.skills.length === 0 ? <div className="card empty">No skills are shown on this passport.</div> : (
        <div className="grid" style={{ marginTop: 16 }}>{p.skills.map((s) => (
          <section className="card" key={s.key}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{s.key}</h3>
              <span className="small"><span className={`kdot k-${s.status}`} />{LABEL[s.status]}{s.state ? ` · ${s.state}` : ""}</span>
            </div>
            <p className="small muted">
              {s.verified_results} recorded result{s.verified_results === 1 ? "" : "s"}
              {s.first_result ? ` · ${s.first_result} to ${s.last_result}` : ""}{s.self_reported ? " · includes a self-reported claim" : ""}</p>
            {s.results.length > 0 && (
              <table className="sheet"><thead><tr><th>Date</th><th>Source</th><th>Judged by</th><th>Level</th></tr></thead>
                <tbody>{s.results.map((r, i) => <tr key={i}><td>{r.date}</td><td>{r.source}</td><td>{r.judged_by}</td><td>{r.level}</td></tr>)}</tbody></table>)}
          </section>))}</div>)}

      {p.repos.length > 0 && <div className="card" style={{ marginTop: 16 }}><h3>Public repositories analysed</h3>
        <ul>{p.repos.map((r) => <li key={r}><a href={`https://github.com/${r}`} target="_blank" rel="noopener noreferrer">{r}</a></li>)}</ul></div>}
      <div className="card" style={{ marginTop: 16 }}>{p.notes.map((n) => <p className="small muted" key={n}>{n}</p>)}</div>
    </main>
  );
}