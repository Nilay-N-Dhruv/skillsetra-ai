"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import Logo from "@/components/Logo";

export default function Login() {
  const router = useRouter();
  const { user, signIn, startDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { if (user) router.replace("/dashboard"); }, [user, router]);

  async function submit(e) {
    e.preventDefault(); setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address.");
    if (!password) return setErr("Enter your password.");
    setBusy(true);
    try { await signIn(email.trim(), password); router.push("/dashboard"); }
    catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <div className="authwrap"><div className="card authcard">
      <Link href="/" aria-label="Back to home"><Logo /></Link>
      <p className="eyebrow" style={{ marginTop: 22 }}>Welcome back</p>
      <h2>Sign in to SkillSetra</h2>
      <form onSubmit={submit} noValidate>
        <label htmlFor="e">Email</label>
        <input id="e" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="p">Password</label>
        <div className="pw">
          <input id="p" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="btn" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>
        {err && <p role="alert" style={{ color: "var(--bad-t)", margin: "12px 0 0" }}>{err}</p>}
        <button className="btn primary" style={{ width: "100%", marginTop: 18 }} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="small muted" style={{ margin: "14px 0" }}>New here? <Link href="/signup">Create an account</Link></p>
      <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "6px 0 16px" }} />
      <button className="btn" style={{ width: "100%" }} onClick={() => { startDemo(); router.push("/dashboard"); }}>Explore the demo (no account)</button>
    </div></div>
  );
}