"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { callAI } from "@/lib/ai";
import AiTag from "@/components/AiTag";
import { Badge, ErrorBox, Loading } from "@/components/Status";

const STATE = ["Not Yet Demonstrated", "Limited", "Developing", "Demonstrated"];
const List = ({ t, items }) => (items?.length ? <><h4>{t}</h4><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></> : null);

export default function WhatIf() {
  const [sc, setSc] = useState(null);
  const [text, setText] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setSc(null); setRes(null); setErr(null); setText("");
    try { setSc(await api("/whatif/next")); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    setBusy(true); setErr(null);
    try {
      const r = await callAI(`/whatif/${sc.id}/submit`, { method: "POST", body: { text: text.trim() } });
      if (!r || !Array.isArray(r.covered)) throw new Error("The AI did not return a usable answer. Please try again.");
      setRes(r);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  if (err && !sc) return <ErrorBox message={err} onRetry={load} />;
  if (!sc) return <Loading label="Preparing a scenario" />;
  return (
    <>
      <p className="eyebrow">What-If Machine · scenario {Math.min(sc.seen + 1, sc.total)} of {sc.total}</p>
      <h1>{sc.title}</h1>
      <div className="card" style={{ margin: "16px 0" }}>
        <p className="eyebrow">The situation</p><p>{sc.base}</p>
        <p className="eyebrow">What changes</p><p><strong>{sc.change}</strong></p>
        <p className="eyebrow">Your task</p><p style={{ marginBottom: 0 }}>{sc.question}</p>
      </div>
      <label htmlFor="w">Explain your revised plan</label>
      <textarea id="w" rows={9} value={text} onChange={(e) => setText(e.target.value)} maxLength={3000}
        placeholder="What would you change first, why, and how would you check that it works?" />
      <p className="small muted">{text.trim().length} / 3000 characters (at least 60)</p>
      {err && <p role="alert" style={{ color: "var(--bad-t)" }}>{err}</p>}
      <div className="row">
        <button className="btn primary" disabled={busy || text.trim().length < 60 || !!res} onClick={submit}>{busy ? "Evaluating…" : "Submit my plan"}</button>
      </div>

      {res && (
        <div className="card diag" style={{ marginTop: 20 }} aria-live="polite">
          <div className="row"><strong>Result</strong><Badge state={STATE[res.level]} /><AiTag source={res.source} /></div>
          <p className="small muted">Confidence about {Math.round(res.confidence * 100)}%. Saved to your evidence as Adaptation.</p>
          <h4>Expected ideas</h4>
          {res.covered.map((c) => (
            <div className="cov" key={c.label}>{c.covered ? <Check size={16} className="ok" aria-hidden /> : <Minus size={16} className="no" aria-hidden />}
              <span>{c.label} <span className="small muted">({c.covered ? "mentioned" : "not mentioned"})</span></span></div>))}
          <p className="small muted">The idea check looks for key words, so it is a rough guide. It sets a maximum level, and the AI judges quality below that.</p>
          <List t="What was observed" items={res.observed} /><List t="What to improve" items={res.improve} />
          <List t="What remains uncertain" items={res.uncertain} />
          <h4>Next step</h4><p>{res.next_action}</p>
          <button className="btn primary" onClick={load}>Try another scenario</button>
        </div>)}
    </>
  );
}