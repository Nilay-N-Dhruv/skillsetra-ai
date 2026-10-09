"use client";
import { useEffect, useState } from "react";
import { puterLoaded, runPuter } from "@/lib/ai";

export default function PuterStatus() {
  const [loaded, setLoaded] = useState(null);       // null = still checking
  const [signedIn, setSignedIn] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function refresh() {
    setLoaded(puterLoaded());
    try { setSignedIn(window.puter?.auth?.isSignedIn ? !!(await window.puter.auth.isSignedIn()) : null); } catch { setSignedIn(null); }
  }
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => { n++; if (puterLoaded() || n > 16) { clearInterval(t); refresh(); } }, 500);
    return () => clearInterval(t);
  }, []);

  async function connect() {
    setBusy(true); setMsg(null);
    try { await window.puter.auth.signIn(); await refresh(); setMsg({ ok: true, text: "Connected to Puter." }); }
    catch { setMsg({ text: "Sign-in was cancelled or blocked. Allow pop-ups for this site and try again." }); }
    setBusy(false);
  }
  async function test() {
    setBusy(true); setMsg(null);
    try {
      const t = await runPuter("You are a friendly assistant. Reply in one short sentence.", "Say hello to a SkillSetra learner.");
      setMsg({ ok: true, text: `Puter replied: ${t.slice(0, 200)}` });
    } catch (e) { setMsg({ text: e.message || "The test failed." }); }
    setBusy(false);
  }

  return (
    <div className="card">
      <h3>Puter AI (browser)</h3>
      <p className="muted">
        Script: <strong>{loaded === null ? "checking…" : loaded ? "loaded" : "not loaded"}</strong>
        {" · "}Account: <strong>{signedIn === null ? "unknown" : signedIn ? "signed in" : "not signed in"}</strong>
      </p>
      {loaded === false && <p className="small" style={{ color: "var(--bad-t)" }}>The Puter script did not load. Check your connection, disable ad blockers for this site, and confirm the script tag in layout.js.</p>}
      <div className="row">
        {signedIn === false && <button className="btn" onClick={connect} disabled={busy || !loaded}>Connect Puter</button>}
        <button className="btn primary" onClick={test} disabled={busy || !loaded}>{busy ? "Working…" : "Test Puter AI"}</button>
      </div>
      {msg && <p role="status" className="small" style={{ marginTop: 10, color: msg.ok ? "var(--ok-t)" : "var(--bad-t)" }}>{msg.text}</p>}
      <p className="small muted" style={{ marginTop: 10 }}>Puter runs AI in your browser and bills your own Puter account. Browser AI results are capped at "Developing" and never prove mastery alone.</p>
    </div>
  );
}