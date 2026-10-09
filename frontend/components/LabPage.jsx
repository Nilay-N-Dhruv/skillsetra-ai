"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import AiTag from "./AiTag";
import { Badge, ErrorBox, Loading } from "./Status";

const STATE = ["Not Yet Demonstrated", "Limited", "Developing", "Demonstrated"];
const pretty = (k) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export default function LabPage({ mode, eyebrow, title, blurb, label, placeholder, button }) {
  const [prompt, setPrompt] = useState(null);
  const [text, setText] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (after) => {
    setLoading(true); setErr(null); setRes(null); setText("");
    try { setPrompt(await api(`/lab/${mode}/prompt${after ? `?after=${after}` : ""}`)); } catch (e) { setErr(e.message); }
    setLoading(false);
  }, [mode]);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    setBusy(true); setErr(null);
    try { setRes(await api(`/lab/${mode}/submit`, { method: "POST", body: { prompt_id: prompt.id, text: text.trim() } })); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  if (loading) return <Loading />;
  if (!prompt) return <ErrorBox message={err} onRetry={() => load()} />;
  return (
    <>
      <p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted" style={{ fontSize: "1.05rem" }}>{blurb}</p>
      {prompt.text && <div className="card" style={{ margin: "16px 0" }}><p className="eyebrow">Case</p><h3 style={{ fontSize: "1.3rem", lineHeight: 1.35 }}>{prompt.text}</h3></div>}
      <label htmlFor="t">{label}</label>
      <textarea id="t" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} maxLength={3000} />
      <p className="small muted">{text.trim().length} / 3000 characters (at least 30)</p>
      {err && <p role="alert" style={{ color: "var(--bad-t)" }}>{err}</p>}
      <div className="row">
        <button className="btn primary" disabled={busy || text.trim().length < 30} onClick={submit}>{busy ? "Analysing…" : button}</button>
        {prompt.text && <button className="btn" onClick={() => load(prompt.id)}>Next case</button>}
      </div>
      {res && (
        <div className="card diag" style={{ marginTop: 20 }} aria-live="polite">
          <div className="row"><strong>Result</strong>{res.level !== null && <Badge state={STATE[res.level]} />}<AiTag source={res.source} /></div>
          {res.evidence_saved && <p className="small muted">Saved to your evidence timeline. Confidence about {Math.round(res.confidence * 100)}%.</p>}
          {Object.entries(res.sections).map(([k, items]) => items.length > 0 && (
            <div key={k}><h4>{pretty(k)}</h4><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>))}
        </div>)}
    </>
  );
}