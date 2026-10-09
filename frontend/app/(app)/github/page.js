"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { ErrorBox } from "@/components/Status";

const SIGNALS = { tests: "Tests", ci: "CI workflow", dockerfile: "Dockerfile", compose: "Compose file", license: "License", env_example: ".env.example", deps: "Dependency file", readme: "README" };

export default function GitHub() {
  const [repo, setRepo] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault(); setBusy(true); setErr(null); setRes(null);
    try { setRes(await api("/github/analyze", { method: "POST", body: { repo: repo.trim() } })); } catch (x) { setErr(x.message); }
    setBusy(false);
  }
  return (
    <>
      <p className="eyebrow">Repository intelligence</p><h1>GitHub, with evidence.</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>Analyze a public repository. SkillSetra separates observed facts from interpretation, and only public metadata is read.</p>
      <form onSubmit={go} className="row" style={{ alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 240 }}><label htmlFor="r" style={{ marginTop: 0 }}>Repository URL or owner/name</label>
          <input id="r" placeholder="https://github.com/owner/repository" value={repo} onChange={(e) => setRepo(e.target.value)} maxLength={201} /></div>
        <button className="btn primary" disabled={busy || repo.trim().length < 3}>{busy ? "Analysing…" : "Analyze repository"}</button>
      </form>
      {err && <div style={{ marginTop: 16 }}><ErrorBox message={err} /></div>}
      {res && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>{res.repo}</h3><p className="muted">{res.description || "No description."}</p>
          <p className="small">Languages: {res.languages.join(", ") || "none detected"} · {res.file_count} files</p>
          <h4>Engineering signals</h4>
          <div className="strip">{Object.entries(SIGNALS).map(([k, l]) => <span key={k} className={`badge ${res.signals[k] ? "ok" : "none"}`}>{res.signals[k] ? "Found" : "Missing"}: {l}</span>)}</div>
          <h4>Evidence created</h4>
          {res.evidence.length ? <ul>{res.evidence.map((e) => <li key={e.competency}>{e.competency}: {e.summary}</li>)}</ul> : <p>No evidence was created from this repository.</p>}
          <p className="small muted">{res.evidence_saved > 0 ? `${res.evidence_saved} new evidence item(s) saved.` : "Nothing new was saved (already analysed before)."} {res.note}</p>
        </div>)}
    </>
  );
}