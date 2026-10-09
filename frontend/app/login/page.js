"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import AuthShell from "@/components/AuthShell";

export default function Login() {
  const router = useRouter();
  const { user, signIn, signOut, startDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const manual = useRef(false);
  const cleared = useRef(false);

  // Arrived from the confirmation email?
  useEffect(() => {
    const ok = new URLSearchParams(window.location.search).get("confirmed") === "1";
    const bad = window.location.hash.includes("error");
    if (bad) setNotice({ bad: true, text: "That confirmation link is invalid or has expired. Create your account again, or sign in if you already confirmed." });
    else if (ok) { setConfirmed(true); setNotice({ text: "Your email is confirmed. Sign in to continue." }); }
    if (ok || bad) window.history.replaceState(null, "", "/login");
  }, []);

  // The confirmation link may sign the user in automatically. Clear it so they sign in themselves.
  useEffect(() => {
    if (confirmed && user && !manual.current && !cleared.current) {
      cleared.current = true;
      signOut().finally(() => setConfirmed(false));
    }
  }, [confirmed, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Already signed in and just visiting /login? Go to the dashboard.
  useEffect(() => { if (user && !confirmed) router.replace("/dashboard"); }, [user, confirmed, router]);

  async function submit(e) {
    e.preventDefault(); setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address.");
    if (!password) return setErr("Enter your password.");
    setBusy(true); manual.current = true;
    try { await signIn(email.trim(), password); router.push("/dashboard"); }
    catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <AuthShell footer={<>New to SkillSetra? <Link href="/signup">Create an account</Link></>}>
      <p className="eyebrow">Welcome back</p>
      <h2>Sign in to your account</h2>
      {notice && (
        <p role={notice.bad ? "alert" : "status"} className="small"
           style={{ display: "flex", gap: 8, alignItems: "center", color: notice.bad ? "var(--bad-t)" : "var(--ok-t)", margin: "4px 0 8px" }}>
          {!notice.bad && <CheckCircle2 size={16} aria-hidden />}{notice.text}
        </p>)}
      <form onSubmit={submit} noValidate>
        <label htmlFor="e">Email</label>
        <input id="e" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="p">Password</label>
        <div className="pw">
          <input id="p" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="btn" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
        <p className="small" style={{ margin: "8px 0 0", textAlign: "right" }}><Link href="/forgot-password">Forgot password?</Link></p>
        {err && <p role="alert" style={{ color: "var(--bad-t)", margin: "12px 0 0" }}>{err}</p>}
        <button className="btn primary" style={{ width: "100%", marginTop: 18 }} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      {/* <div className="divider">or</div> */}
      {/* <button className="btn" style={{ width: "100%" }} onClick={() => { startDemo(); router.push("/dashboard"); }}>Explore the demo (no account)</button> */}
    </AuthShell>
  );
}