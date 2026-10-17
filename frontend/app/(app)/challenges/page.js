// "use client";
// import Link from "next/link";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { api } from "@/lib/api";
// import { callAI } from "@/lib/ai";
// import useApi from "@/hooks/useApi";
// import AiTag from "@/components/AiTag";
// import { Badge, ErrorBox, Loading } from "@/components/Status";

// const List = ({ title, items }) => (items?.length ? <><h4>{title}</h4><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></> : null);
// const CATS = [["", "Weakest first"], ["Debugging", "Debugging"], ["Testing", "Testing"], ["Transfer", "Transfer"]];
// const LEVEL = ["No evidence", "Limited", "Developing", "Demonstrated"];

// export default function Challenges() {
//   const [cat, setCat] = useState("");
//   const [ch, setCh] = useState(null);
//   const [code, setCode] = useState("");
//   const [why, setWhy] = useState("");
//   const [res, setRes] = useState(null);
//   const [check, setCheck] = useState(null);
//   const [hint, setHint] = useState(null);
//   const [err, setErr] = useState(null);
//   const [busy, setBusy] = useState(false);
//   const [secs, setSecs] = useState(0);
//   const timer = useRef(null);
//   const history = useApi("/challenges/history");

//   const load = useCallback(async ({ competency, id } = {}) => {
//     setCh(null); setRes(null); setCheck(null); setErr(null); setWhy(""); setSecs(0); setHint(null);
//     try {
//       const q = id ? `?id=${id}` : competency ? `?competency=${competency}` : "";
//       const c = await api("/challenges/next" + q);
//       setCh(c); setCode(c.starter_code);
//     } catch (e) { setErr(e.message); }
//   }, []);
//   useEffect(() => { load(); }, [load]);
//   useEffect(() => {
//     if (ch && !res) timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
//     return () => clearInterval(timer.current);
//   }, [ch, res]);

//   async function runCheck() {
//     setBusy(true); setErr(null);
//     try { setCheck((await api(`/challenges/${ch.id}/check`, { method: "POST", body: { code } })).checks); } catch (e) { setErr(e.message); }
//     setBusy(false);
//   }
//   async function showHint() { try { setHint((await api(`/challenges/${ch.id}/hint`)).hint); } catch (e) { setErr(e.message); } }
//   async function submit() {
//     setBusy(true); setErr(null);
//     try { setRes(await callAI(`/challenges/${ch.id}/submit`, { method: "POST", body: { code, explanation: why, seconds: secs } })); history.refresh(); }
//     catch (e) { setErr(e.message); }
//     setBusy(false);
//   }

//   if (err && !ch) return <ErrorBox message={err} onRetry={() => load()} />;
//   if (!ch) return <Loading label="Preparing a problem for you" />;
//   const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");

//   if (res) return (
//     <>
//       <p className="eyebrow">Evaluation</p><h1>What your answer shows</h1>
//       <div className="card diag" aria-live="polite">
//         <div className="row"><strong>{res.competency}</strong><Badge state={res.state_after} /><AiTag source={res.source} /></div>
//         <p className="muted small" style={{ margin: "6px 0" }}>Your result: {res.level_label}. {res.state_after || "Keep practising"}.</p>
//         <section className="item" style={{ margin: "16px 0", padding: 18 }}>
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
//             <div><strong>Practice progress</strong><p className="small muted" style={{ margin: "4px 0 0" }}>Based on this practice attempt</p></div>
//             <strong style={{ fontSize: "2rem", lineHeight: 1.1, color: "var(--good, #16803d)" }}>{Math.round(Math.max(0, Math.min(3, Number(res.level) || 0)) / 3 * 100)}%</strong>
//           </div>
//           <div className="bar" style={{ height: 12, marginTop: 12, overflow: "hidden" }}><i style={{ display: "block", height: "100%", width: `${Math.round(Math.max(0, Math.min(3, Number(res.level) || 0)) / 3 * 100)}%`, transition: "width .25s ease" }} /></div>
//           <p className="small muted" style={{ marginBottom: 0 }}>Practice indicator, not a hiring prediction. Feedback confidence: {Math.round((Number(res.confidence) || 0) * 100)}%.</p>
//         </section>
//         <h4 style={{ marginBottom: 8 }}>Quick feedback</h4>
//         {(res.improve || []).length ? <ul style={{ marginTop: 0 }}>{res.improve.slice(0, 2).map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="small muted">No specific improvement note was returned. Review the details below.</p>}
//         {res.next_action && <p><strong>Next step:</strong> {res.next_action}</p>}
//         {res.comparison && <p className="small muted">Retest: level {res.comparison.previous_level} before → level {res.comparison.new_level} now.</p>}
//         <details style={{ margin: "12px 0" }}>
//           <summary style={{ cursor: "pointer", fontWeight: 600 }}>View detailed feedback</summary>
//           <List title="What was observed" items={(res.observed || []).slice(0, 4)} />
//           <List title="Evidence" items={(res.supports || []).slice(0, 3)} />
//           <List title="What remains uncertain" items={(res.uncertain || []).slice(0, 2)} />
//           <List title="More ways to improve" items={(res.improve || []).slice(2, 5)} />
//         </details>
//         <div className="row" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
//           <button className="btn" onClick={() => load({ id: ch.id })}>Retry this problem</button>
//           <button className="btn primary" onClick={() => load({ competency: res.competency })}>Adaptive re-test</button>
//           <button className="btn" onClick={() => load({ competency: cat })}>Next problem</button>
//           <Link className="btn" href="/roadmap">Learning resources</Link>
//         </div>
//       </div>
//     </>
//   );

//   return (
//     <>
//       <p className="eyebrow">Practice · challenges</p>
//       <div className="row" style={{ marginBottom: 12 }} role="group" aria-label="Category">
//         {CATS.map(([v, l]) => <button key={l} className={`pill ${cat === v ? "on" : ""}`} style={{ background: "none", cursor: "pointer" }} onClick={() => { setCat(v); load({ competency: v }); }}>{l}</button>)}
//       </div>
//       <div className="row" style={{ justifyContent: "space-between" }}>
//         <div><h1 style={{ margin: 0 }}>{ch.title}</h1></div><span className="badge none" aria-label="Time spent">{mm}:{ss}</span>
//       </div>
//       {ch.is_retest && <p className="small muted">A practice or re-test problem. Your score is saved to your evidence.</p>}
//       <div className="card" style={{ margin: "16px 0" }}>
//         <p>{ch.scenario}</p>
//         <strong>Requirements</strong><ul>{ch.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
//         <strong>Constraints</strong><ul>{ch.constraints.map((r) => <li key={r}>{r}</li>)}</ul>
//         {hint ? <p className="small"><strong>Hint:</strong> {hint}</p> : <button className="btn" onClick={showHint}>Show a hint</button>}
//       </div>
//       <label htmlFor="code">Your code</label>
//       <textarea id="code" className="code" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} maxLength={6000} />
//       <label htmlFor="why">Explain your reasoning: what did you find or decide, and why?</label>
//       <textarea id="why" rows={5} value={why} onChange={(e) => setWhy(e.target.value)} maxLength={2000} />
//       {check && <p className="small" role="status">Static checks: syntax {check.syntax_ok ? "valid" : "invalid"}, required function {check.has_function ? "found" : "missing"}{check.errors.length ? `. ${check.errors[0]}` : ""}. Your code is checked, never run, on the server.</p>}
//       {err && <p role="alert" style={{ color: "var(--bad-t)" }}>{err}</p>}
//       <div className="row" style={{ marginTop: 14 }}>
//         <button className="btn" onClick={runCheck} disabled={busy}>Check syntax</button>
//         <button className="btn primary" onClick={submit} disabled={busy || code.trim().length < 5}>{busy ? "Evaluating…" : "Submit for evaluation"}</button>
//       </div>
//       {/* {history.data?.items.length > 0 && (
//         <div className="card" style={{ marginTop: 20 }}><h3>Your attempts</h3>
//           {history.data.items.map((a) => <div className="item" key={a.id}><div className="row" style={{ justifyContent: "space-between" }}>
//             <strong>{a.title}</strong><span className="badge none">{LEVEL[a.level] ?? "–"}</span></div>
//             <p className="small muted">{new Date(a.created_at).toLocaleString()}</p></div>)}</div>)} */}
//     </>
//   );
// }


"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { callAI } from "@/lib/ai";
import useApi from "@/hooks/useApi";
import AiTag from "@/components/AiTag";
import { Badge, ErrorBox, Loading } from "@/components/Status";

const List = ({ title, items }) =>
  items?.length ? (
    <>
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </>
  ) : null;

const CATS = [
  ["", "Weakest first"],
  ["Debugging", "Debugging"],
  ["Testing", "Testing"],
  ["Transfer", "Transfer"],
];

const LEVEL = [
  "No evidence",
  "Limited",
  "Developing",
  "Demonstrated",
];

export default function Challenges() {
  const [cat, setCat] = useState("");
  const [ch, setCh] = useState(null);
  const [code, setCode] = useState("");
  const [why, setWhy] = useState("");
  const [res, setRes] = useState(null);
  const [check, setCheck] = useState(null);
  const [hint, setHint] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [secs, setSecs] = useState(0);

  const timer = useRef(null);
  const history = useApi("/challenges/history");

  const load = useCallback(async ({ competency, id } = {}) => {
    clearInterval(timer.current);

    setCh(null);
    setRes(null);
    setCheck(null);
    setErr(null);
    setWhy("");
    setSecs(0);
    setHint(null);
    setBusy(false);

    try {
      const query = id
        ? `?id=${encodeURIComponent(id)}`
        : competency
          ? `?competency=${encodeURIComponent(competency)}`
          : "";

      const challenge = await api("/challenges/next" + query);

      setCh(challenge);
      setCode(challenge.starter_code || "");
    } catch (error) {
      setErr(error.message || "Unable to load the next challenge.");
    }
  }, []);

  useEffect(() => {
    load();
    return () => clearInterval(timer.current);
  }, [load]);

  useEffect(() => {
    clearInterval(timer.current);

    if (ch && !res) {
      timer.current = setInterval(() => {
        setSecs((seconds) => seconds + 1);
      }, 1000);
    }

    return () => clearInterval(timer.current);
  }, [ch, res]);

  async function runCheck() {
    if (!ch || busy || res) return;

    setBusy(true);
    setErr(null);

    try {
      const response = await api(`/challenges/${ch.id}/check`, {
        method: "POST",
        body: { code },
      });

      setCheck(response.checks);
    } catch (error) {
      setErr(error.message || "Unable to check your code.");
    } finally {
      setBusy(false);
    }
  }

  async function showHint() {
    if (!ch || busy || res) return;

    setBusy(true);
    setErr(null);

    try {
      const response = await api(`/challenges/${ch.id}/hint`);
      setHint(response.hint);
    } catch (error) {
      setErr(error.message || "Unable to load a hint.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!ch || busy || res || code.trim().length < 5) return;

    setBusy(true);
    setErr(null);

    try {
      const response = await callAI(`/challenges/${ch.id}/submit`, {
        method: "POST",
        body: {
          code,
          explanation: why,
          seconds: secs,
        },
      });

      setRes(response);
      history.refresh();

      // Keep the question visible and scroll down to the evaluation.
      requestAnimationFrame(() => {
        document
          .getElementById("challenge-evaluation")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      });
    } catch (error) {
      setErr(error.message || "Unable to evaluate your answer.");
    } finally {
      setBusy(false);
    }
  }

  if (err && !ch) {
    return <ErrorBox message={err} onRetry={() => load()} />;
  }

  if (!ch) {
    return <Loading label="Preparing a problem for you" />;
  }

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const level = Math.max(0, Math.min(3, Number(res?.level) || 0));
  const percentage = Math.round((level / 3) * 100);

  return (
    <>
      <p className="eyebrow">Practice · Challenges</p>

      <div
        className="row"
        style={{
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
        role="group"
        aria-label="Challenge category"
      >
        {CATS.map(([value, label]) => (
          <button
            key={label}
            type="button"
            className={`pill ${cat === value ? "on" : ""}`}
            style={{ background: "none", cursor: "pointer" }}
            disabled={busy}
            onClick={() => {
              setCat(value);
              load({ competency: value });
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className="row"
        style={{
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>{ch.title}</h1>
        <span className="badge none" aria-label="Time spent">
          {mm}:{ss}
        </span>
      </div>

      {ch.is_retest && (
        <p className="small muted">
          A practice or re-test problem. Your score is saved to your evidence.
        </p>
      )}

      {/* Question remains visible after evaluation. */}
      <div className="card" style={{ margin: "16px 0" }}>
        <p>{ch.scenario}</p>

        <strong>Requirements</strong>
        <ul>
          {(ch.requirements || []).map((requirement, index) => (
            <li key={index}>{requirement}</li>
          ))}
        </ul>

        <strong>Constraints</strong>
        <ul>
          {(ch.constraints || []).map((constraint, index) => (
            <li key={index}>{constraint}</li>
          ))}
        </ul>

        {hint ? (
          <p className="small">
            <strong>Hint:</strong> {hint}
          </p>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={showHint}
            disabled={busy || !!res}
          >
            Show a hint
          </button>
        )}
      </div>

      <label htmlFor="code">Your code</label>
      <textarea
        id="code"
        className="code"
        spellCheck={false}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        maxLength={6000}
        readOnly={!!res}
      />

      <label htmlFor="why">
        Explain your reasoning: what did you find or decide, and why?
      </label>
      <textarea
        id="why"
        rows={5}
        value={why}
        onChange={(event) => setWhy(event.target.value)}
        maxLength={2000}
        readOnly={!!res}
      />

      {check && !res && (
        <p className="small" role="status">
          Static checks: syntax {check.syntax_ok ? "valid" : "invalid"},
          required function {check.has_function ? "found" : "missing"}
          {check.errors?.length ? `. ${check.errors[0]}` : ""}. Your code is
          checked, never run, on the server.
        </p>
      )}

      {err && (
        <p role="alert" style={{ color: "var(--bad-t)" }}>
          {err}
        </p>
      )}

      {!res && (
        <div
          className="row"
          style={{
            marginTop: 14,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={runCheck}
            disabled={busy}
          >
            Check syntax
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={submit}
            disabled={busy || code.trim().length < 5}
          >
            {busy ? "Evaluating..." : "Submit for evaluation"}
          </button>
        </div>
      )}

      {/* Evaluation appears below the question after submission. */}
      {res && (
        <section
          id="challenge-evaluation"
          className="card challenge-evaluation"
          aria-live="polite"
          style={{
            marginTop: 28,
            scrollMarginTop: 100,
            padding: 24,
          }}
        >
          <p className="eyebrow">Evaluation</p>
          <h2 style={{ marginTop: 0 }}>What your answer shows</h2>

          <div
            className="row"
            style={{
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <strong>{res.competency || ch.title}</strong>
            <Badge state={res.state_after} />
            <AiTag source={res.source} />
          </div>

          <p className="muted small" style={{ margin: "8px 0 18px" }}>
            Your result: {res.level_label || LEVEL[level]}.{" "}
            {res.state_after || "Keep practising"}.
          </p>

          <section
            className="item"
            style={{
              margin: "16px 0",
              padding: 18,
              borderRadius: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong>Practice progress</strong>
                <p className="small muted" style={{ margin: "4px 0 0" }}>
                  Based on this practice attempt
                </p>
              </div>

              <strong
                style={{
                  fontSize: "2rem",
                  lineHeight: 1.1,
                  color: "var(--good, #16803d)",
                }}
              >
                {percentage}%
              </strong>
            </div>

            <div
              className="bar"
              style={{
                height: 12,
                marginTop: 12,
                overflow: "hidden",
                borderRadius: 999,
              }}
            >
              <i
                style={{
                  display: "block",
                  height: "100%",
                  width: `${percentage}%`,
                  transition: "width .25s ease",
                }}
              />
            </div>

            <p className="small muted" style={{ marginBottom: 0 }}>
              Practice indicator, not a hiring prediction. Feedback confidence:{" "}
              {Math.round((Number(res.confidence) || 0) * 100)}%.
            </p>
          </section>

          <h3 style={{ marginBottom: 8 }}>Quick feedback</h3>

          {(res.improve || []).length > 0 ? (
            <ul style={{ marginTop: 0 }}>
              {res.improve.slice(0, 2).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="small muted">
              No specific improvement note was returned. Review the detailed
              feedback below.
            </p>
          )}

          {res.next_action && (
            <p>
              <strong>Next step:</strong> {res.next_action}
            </p>
          )}

          {res.comparison && (
            <p className="small muted">
              Retest: level {res.comparison.previous_level} before → level{" "}
              {res.comparison.new_level} now.
            </p>
          )}

          <details style={{ margin: "12px 0" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              View detailed feedback
            </summary>

            <List
              title="What was observed"
              items={(res.observed || []).slice(0, 4)}
            />

            <List
              title="Evidence"
              items={(res.supports || []).slice(0, 3)}
            />

            <List
              title="What remains uncertain"
              items={(res.uncertain || []).slice(0, 2)}
            />

            <List
              title="More ways to improve"
              items={(res.improve || []).slice(2, 5)}
            />
          </details>

          <div
            className="row"
            style={{
              flexWrap: "wrap",
              gap: 10,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => load({ id: ch.id })}
            >
              Retry this problem
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={() =>
                load({ competency: res.competency || cat })
              }
            >
              Adaptive re-test
            </button>

            <button
              type="button"
              className="btn"
              onClick={() =>
                load({ competency: res.competency || cat })
              }
            >
              Next problem
            </button>

            <Link className="btn" href="/roadmap">
              Learning resources
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
