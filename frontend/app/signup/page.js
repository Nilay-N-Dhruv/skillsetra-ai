"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { publicGet } from "@/lib/api";
import Logo from "@/components/Logo";

const EXPERIENCE = ["Student", "Early career", "Mid-level", "Senior"];
const STATUS = ["Student", "Working", "Between jobs", "Other"];
const STEPS = ["Account", "About you", "Target role"];
const COLORS = ["#f87171", "#fbbf24", "#fbbf24", "#34d399", "#34d399"];

const score = (p) => [p.length >= 8, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
const ageOf = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 31557600000);

export default function Signup() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState(null);
  const [f, setF] = useState({ name: "", email: "", password: "", dob: "", status: "Student", experience: "Early career",
    country: "", target_role: "", goal: "Become job-ready with credible evidence", consent: false });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const loadRoles = () => publicGet("/roles").then((d) => setRoles(d.roles)).catch(() => setRoles(false));
  useEffect(() => { loadRoles(); }, []);

  function check() {
    if (step === 0) {
      if (!f.name.trim()) return "Enter your name.";
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return "Enter a valid email address.";
      if (f.password.length < 8 || score(f.password) < 3) return "Use at least 8 characters with 3 of: upper and lower case, a number, a symbol.";
    }
    if (step === 1) {
      if (!f.dob) return "Enter your date of birth.";
      const a = ageOf(f.dob);
      if (!(a >= 13 && a <= 100)) return "You must be at least 13 years old to create an account.";
    }
    if (step === 2) {
      if (!f.target_role) return "Choose the role you want to prove.";
      if (!f.consent) return "Please accept the privacy notice to continue.";
    }
    return null;
  }
  const next = () => { const m = check(); setErr(m); if (!m) setStep(step + 1); };

  async function finish() {
    const m = check(); setErr(m); if (m) return;
    setBusy(true);
    try {
      const { name, dob, status, experience, country, target_role, goal, consent } = f;
      const r = await signUp(f.email.trim(), f.password, name.trim(), { name: name.trim(), dob, status, experience, country, target_role, goal, consent });
      if (r.needsConfirm) setInfo("Account created. Check your email to confirm it, then sign in.");
      else router.push("/onboarding");
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const role = roles && roles.find((r) => r.name === f.target_role);
  const s = score(f.password);
  const minor = f.dob && ageOf(f.dob) >= 13 && ageOf(f.dob) < 18;
  return (
    <div className="authwrap"><div className="card authcard wide">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link href="/" aria-label="Back to home"><Logo /></Link>
        <Link href="/login" className="small">Already have an account? Sign in</Link>
      </div>
      <div className="row" style={{ margin: "18px 0" }}>{STEPS.map((l, i) => <span key={l} className={`pill ${i === step ? "on" : ""}`}>0{i + 1} {l}</span>)}</div>

      {step === 0 && <div style={{ maxWidth: 440 }}>
        <p className="eyebrow">Create your account</p><h2>Start with what you want to prove.</h2>
        <label htmlFor="n">Full name</label><input id="n" autoComplete="name" value={f.name} onChange={set("name")} maxLength={80} />
        <label htmlFor="e">Email</label><input id="e" type="email" autoComplete="email" value={f.email} onChange={set("email")} />
        <label htmlFor="p">Password</label>
        <div className="pw">
          <input id="p" type={show ? "text" : "password"} autoComplete="new-password" value={f.password} onChange={set("password")} />
          <button type="button" className="btn" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
        <div className="strength" aria-hidden><i style={{ width: `${s * 25}%`, background: COLORS[s] }} /></div>
      </div>}

      {step === 1 && <div style={{ maxWidth: 440 }}>
        <p className="eyebrow">About you</p><h2>Help us set the right starting point.</h2>
        <label htmlFor="d">Date of birth</label><input id="d" type="date" value={f.dob} onChange={set("dob")} max={new Date().toISOString().slice(0, 10)} />
        {minor && <p className="small muted" style={{ marginTop: 8 }}>You are under 18. Your data stays private to your account and is never shared. We suggest using SkillSetra with a parent or guardian's awareness.</p>}
        <label htmlFor="s">Current status</label><select id="s" value={f.status} onChange={set("status")}>{STATUS.map((x) => <option key={x}>{x}</option>)}</select>
        <label htmlFor="x">Experience level</label><select id="x" value={f.experience} onChange={set("experience")}>{EXPERIENCE.map((x) => <option key={x}>{x}</option>)}</select>
        <label htmlFor="c">Country (optional)</label><input id="c" value={f.country} onChange={set("country")} maxLength={60} />
      </div>}

      {step === 2 && <div>
        <p className="eyebrow">Target role</p><h2>What role are you preparing for?</h2>
        <p className="muted">This becomes the reference point for your assessment and learning recommendations.</p>
        {roles === null && <p className="muted">Loading roles…</p>}
        {roles === false && <p role="alert">We couldn't load the roles. <button type="button" className="btn" onClick={loadRoles}>Try again</button></p>}
        {roles && <div className="roles">{roles.map((r) => (
          <button key={r.name} type="button" className="rolebtn" aria-pressed={f.target_role === r.name} onClick={() => setF({ ...f, target_role: r.name })}>
            <strong>{r.name}</strong><small>Use this as your competency target</small></button>))}</div>}
        {role && <div className="card" style={{ marginTop: 16, background: "var(--soft)" }} aria-live="polite">
          <h3>{role.name}</h3><p>{role.summary}</p>
          <p className="small muted" style={{ marginBottom: 6 }}>Skills you will be assessed on</p>
          <div className="strip" style={{ marginTop: 0 }}>{role.skills.map((x) => <span className="chip" key={x}>{x}</span>)}</div>
          <p className="small"><strong>Common tools:</strong> {role.tools.join(", ")}</p>
          <p className="small" style={{ marginBottom: 0 }}><strong>Projects that prove it:</strong> {role.projects.join(" · ")}</p>
        </div>}
        <label htmlFor="g">Primary goal</label><input id="g" value={f.goal} onChange={set("goal")} maxLength={160} />
        <label className="row" style={{ marginTop: 16, color: "var(--ink)", fontWeight: 500 }}>
          <input type="checkbox" checked={f.consent} onChange={set("consent")} />
          <span>I agree to the <Link href="/#privacy" target="_blank" rel="noopener noreferrer">privacy notice</Link>. My data stays private to my account and I can delete it any time.</span>
        </label>
      </div>}

      {err && <p role="alert" style={{ color: "var(--bad-t)" }}>{err}</p>}
      {info && <p role="status" style={{ color: "var(--ok-t)" }}>{info}</p>}
      <div className="row" style={{ marginTop: 20 }}>
        {step > 0 && <button className="btn" onClick={() => { setErr(null); setStep(step - 1); }}>Back</button>}
        {step < 2 ? <button className="btn primary" onClick={next}>Continue</button>
                  : <button className="btn primary" onClick={finish} disabled={busy}>{busy ? "Creating…" : "Create account"}</button>}
      </div>
    </div></div>
  );
}