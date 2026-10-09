"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Empty, ErrorBox, Loading } from "@/components/Status";

export default function Jobs() {
  const [tab, setTab] = useState("matches");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [min, setMin] = useState(0);
  const [data, setData] = useState(null);
  const [saved, setSaved] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSaved = () => api("/jobs/saved").then((d) => setSaved(d.items)).catch(() => {});
  useEffect(() => {
    setLoading(true); setErr(null);
    api("/jobs" + (query ? `?q=${encodeURIComponent(query)}` : "")).then(setData).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [query]);
  useEffect(() => { loadSaved(); }, []);

  async function toggle(j) {
    try {
      if (j.saved) await api(`/jobs/save/${j.id}`, { method: "DELETE" });
      else await api("/jobs/save", { method: "POST", body: { id: j.id, title: j.title, company: j.company, url: j.url } });
      setData({ ...data, items: data.items.map((x) => (x.id === j.id ? { ...x, saved: !x.saved } : x)) });
      loadSaved();
    } catch (e) { setErr(e.message); }
  }

  const items = (data?.items || []).filter((j) => j.pct >= min);
  return (
    <>
      <p className="eyebrow">Jobs / Opportunities</p><h1>Openings that fit your skills</h1>
      <p className="muted">{data?.note || "Real remote listings, compared with your target role's skills."}</p>
      <div className="row" style={{ margin: "12px 0" }}>
        <button className={`pill ${tab === "matches" ? "on" : ""}`} style={{ background: "none", cursor: "pointer" }} onClick={() => setTab("matches")}>Matches</button>
        <button className={`pill ${tab === "saved" ? "on" : ""}`} style={{ background: "none", cursor: "pointer" }} onClick={() => setTab("saved")}>Saved ({saved.length})</button>
      </div>
      {err && <ErrorBox message={err} onRetry={() => setQuery(query + " ")} />}

      {tab === "matches" && <>
        <form className="row" style={{ alignItems: "flex-end" }} onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); }}>
          <div style={{ flex: 1, minWidth: 200 }}><label htmlFor="q" style={{ marginTop: 0 }}>Search</label><input id="q" value={q} onChange={(e) => setQ(e.target.value)} maxLength={40} placeholder={data ? `Default: ${data.query}` : "Search"} /></div>
          <div><label htmlFor="m" style={{ marginTop: 0 }}>Minimum match</label>
            <select id="m" value={min} onChange={(e) => setMin(+e.target.value)}><option value={0}>Any</option><option value={25}>25%+</option><option value={50}>50%+</option></select></div>
          <button className="btn primary">Search</button>
        </form>
        {loading ? <Loading label="Finding opportunities" /> : items.length === 0 && !err ? <div style={{ marginTop: 16 }}><Empty title="No listings found">Try a different search or lower the minimum match.</Empty></div> : (
          <div className="grid" style={{ marginTop: 16 }}>{items.map((j) => (
            <div className="card" key={j.id}>
              <div className="row" style={{ justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>{j.title}</h3><span className="badge dev">{j.pct}% skill match</span></div>
              <p className="muted small">{j.company} · {j.location || "Remote"} · {j.type?.replace("_", " ")} · posted {j.posted}{j.salary ? ` · ${j.salary}` : ""}</p>
              {j.matched.length > 0 && <div className="strip" style={{ margin: "6px 0" }}>{j.matched.map((s) => <span key={s} className={`badge ${j.have.includes(s) ? "ok" : "none"}`}>{s}{j.have.includes(s) ? " ✓" : ""}</span>)}</div>}
              {j.missing.length > 0 && <p className="small muted">Skills to build: {j.missing.join(", ")}</p>}
              <div className="row"><a className="btn" href={j.url} target="_blank" rel="noopener noreferrer">View listing</a>
                <button className="btn" onClick={() => toggle(j)}>{j.saved ? "Remove bookmark" : "Save"}</button></div>
            </div>))}</div>)}
        {data && <p className="small muted" style={{ marginTop: 14 }}>{data.attribution}. ✓ means your evidence shows at least "Developing" for that skill.</p>}
      </>}

      {tab === "saved" && (saved.length === 0 ? <Empty title="No saved opportunities">Save listings from the Matches tab.</Empty>
        : <div className="grid">{saved.map((j) => (
          <div className="card" key={j.id}><h3 style={{ margin: 0 }}>{j.title}</h3><p className="muted small">{j.company}</p>
            <div className="row"><a className="btn" href={j.url} target="_blank" rel="noopener noreferrer">View listing</a>
              <button className="btn" onClick={async () => { await api(`/jobs/save/${j.id}`, { method: "DELETE" }); loadSaved(); setData((d) => d && { ...d, items: d.items.map((x) => (x.id === j.id ? { ...x, saved: false } : x)) }); }}>Remove</button></div></div>))}</div>)}
    </>
  );
}