"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, publicGet } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { ErrorBox, Loading } from "@/components/Status";

const EXPERIENCE = ["Student", "Early career", "Mid-level", "Senior"];

export default function Onboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const ran = useRef(false);
  const [roles, setRoles] = useState(null);
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("Early career");
  const [goal, setGoal] = useState("Become job-ready with credible evidence");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const [r, p] = await Promise.all([publicGet("/roles"), api("/profile")]);
        setRoles(r.roles);
        if (p.target_role) setRole(p.target_role);
        if (!p.complete && user?.meta) {            // first login after sign-up: save the form details
          try { await api("/profile", { method: "PUT", body: user.meta }); router.replace("/assessment"); return; }
          catch { setErr("We couldn't save your sign-up details. Choose your role below to continue."); }
        }
      } catch (e) { setErr(e.message); }
      setLoading(false);
    })();
  }, [user, router]);

  async function go() {
    setBusy(true); setErr(null);
    try {
      await api("/profile/role", { method: "PUT", body: { target_role: role, experience, goal } });
      router.push(`/assessment?role=${encodeURIComponent(role)}`);
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  if (loading) return <Loading label="Getting things ready" />;
  if (!roles) return <ErrorBox message={err} onRetry={() => location.reload()} />;
  const info = roles.find((r) => r.name === role);
  return (
    <>
      <p className="eyebrow">First session · Evidence baseline</p>
      <h1>Start with what you want to prove.</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>Choose a target, answer applied questions, then see your competency baseline, gaps and next evidence actions.</p>
      <div className="row" style={{ margin: "16px 0" }}><span className="pill on">01 Target role</span><span className="pill">02 Evidence questions</span><span className="pill">03 Gap + next actions</span></div>
      <div className="card">
        <p className="eyebrow">Target role</p><h2>What role are you preparing for?</h2>
        <div className="roles">{roles.map((r) => (
          <button key={r.name} className="rolebtn" aria-pressed={role === r.name} onClick={() => setRole(r.name)}>
            <strong>{r.name}</strong><small>Use this as your competency target</small></button>))}</div>
        {info && <p className="muted" style={{ marginTop: 14 }}>{info.summary} You will be assessed on: {info.skills.join(", ")}.</p>}
        <div className="grid g2">
          <div><label htmlFor="x">Experience level</label><select id="x" value={experience} onChange={(e) => setExperience(e.target.value)}>{EXPERIENCE.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label htmlFor="g">Primary goal</label><input id="g" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={160} /></div>
        </div>
        {err && <p role="alert" style={{ color: "var(--bad-t)" }}>{err}</p>}
        <button className="btn primary" style={{ marginTop: 18 }} disabled={!role || busy} onClick={go}>{busy ? "Saving…" : "Continue to evidence questions"}</button>
      </div>
    </>
  );
}