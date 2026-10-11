"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import useApi from "@/hooks/useApi";
import { ErrorBox, Loading } from "@/components/Status";

export default function Passport() {
  const { data, error, loading, reload, refresh } = useApi("/passport");
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (data) setF({ ...data.settings }); }, [data]);

  if (loading || (data && !f)) return <Loading label="Loading your passport" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const link = data.slug ? `${window.location.origin}/p/${data.slug}` : null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const toggleSkill = (key) => {
    const has = f.skills.includes(key);
    if (!has && f.skills.length >= 20) return setMsg("You can show at most 20 skills.");
    setF({ ...f, skills: has ? f.skills.filter((s) => s !== key) : [...f.skills, key] });
  };

  async function save(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api("/passport", { method: "PUT", body: { display_name: f.display_name.trim(), headline: f.headline.trim(), show_role: f.show_role, show_repos: f.show_repos, skills: f.skills } });
      setMsg("Saved. Publish when you are ready."); await refresh();
    } catch (x) { setMsg(x.message); }
    setBusy(false);
  }
  async function act(path, ok, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); setMsg(null);
    try { await api(path, { method: "POST" }); setMsg(ok); await refresh(); } catch (x) { setMsg(x.message); }
    setBusy(false);
  }
  const copy = async () => { try { await navigator.clipboard.writeText(link); setMsg("Link copied."); } catch { setMsg("Copy failed. Select the link and copy it."); } };

  return (
    <>
      <p className="eyebrow">Proof Passport</p>
      <h1>Share what you can show</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>A public, unlisted page with only the skills you choose. It shows dates, sources and levels of your results, never your answers.</p>
      {data.demo && <div className="demo-banner" role="note">Demo accounts cannot publish a passport. Sign up to create one.</div>}

      <div className="grid g2">
        <form className="card" onSubmit={save}>
          <h3>Your page</h3>
          <label htmlFor="n">Name shown publicly</label><input id="n" value={f.display_name} onChange={set("display_name")} maxLength={80} disabled={data.demo} />
          <label htmlFor="h">Headline</label><input id="h" value={f.headline} onChange={set("headline")} maxLength={120} disabled={data.demo} placeholder="For example: Python developer" />
          <label className="chk"><input type="checkbox" checked={f.show_role} onChange={set("show_role")} disabled={data.demo} /> Show my target role</label>
          <label className="chk"><input type="checkbox" checked={f.show_repos} onChange={set("show_repos")} disabled={data.demo} /> Show the public GitHub repositories I analysed</label>
          <h3 style={{ marginTop: 16 }}>Skills to show ({f.skills.length}/20)</h3>
          {data.available.length === 0 ? <p className="muted small">You have no evidence yet. Take an assessment first.</p> : data.available.map((s) => (
            <label key={s.key} className="chk"><input type="checkbox" checked={f.skills.includes(s.key)} onChange={() => toggleSkill(s.key)} disabled={data.demo} />
              <span>{s.key} <span className="small muted">({s.klass}, {s.verified_count} result{s.verified_count === 1 ? "" : "s"})</span></span></label>))}
          <button className="btn primary" style={{ marginTop: 14 }} disabled={busy || data.demo || !f.display_name.trim()}>Save</button>
        </form>

        <div className="grid">
          <div className="card">
            <h3>Publishing</h3>
            <p className="muted">Status: <strong>{data.published ? "Published" : "Not published"}</strong></p>
            {link && <div className="copybox"><input readOnly aria-label="Public link" value={link} onFocus={(e) => e.target.select()} /><button className="btn" onClick={copy}>Copy</button></div>}
            <div className="row" style={{ marginTop: 12 }}>
              {!data.published
                ? <button className="btn primary" disabled={busy || data.demo} onClick={() => act("/passport/publish", "Published.")}>Publish</button>
                : <button className="btn" disabled={busy} onClick={() => act("/passport/unpublish", "Hidden. Your link is kept.", "Hide your passport? The link will show 'not available' until you publish again.")}>Hide page</button>}
              {data.published && <a className="btn" href={link} target="_blank" rel="noopener noreferrer">Open page</a>}
              {data.slug && <button className="btn" disabled={busy} onClick={() => act("/passport/revoke", "Link revoked.", "Revoke this link? It stops working forever. Publishing again creates a new link.")}>Revoke link</button>}
            </div>
          </div>
          <div className="card">
            <h3>What visitors can and cannot see</h3>
            <p className="small"><strong>Can see:</strong> your chosen name and headline, the skills you ticked, each result's date, source type and level, and whether a skill is self-reported.</p>
            <p className="small"><strong>Cannot see:</strong> your answers, code, notes, email, account id, other skills, and the text of self-reported claims.</p>
            <p className="small muted">This is evidence recorded by SkillSetra. It is not an external certification.</p>
          </div>
        </div>
      </div>
      {msg && <p role="status" style={{ marginTop: 14 }}>{msg}</p>}
    </>
  );
}