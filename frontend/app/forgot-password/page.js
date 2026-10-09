"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/auth";
import Logo from "@/components/Logo";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ bad: true, text: "Enter a valid email address." });
    const sb = getSupabase();
    if (!sb) return setMsg({ bad: true, text: "Password reset is not configured yet." });
    setBusy(true);
    await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    // Same message whether or not the account exists, so nobody can probe which emails are registered.
    setMsg({ text: "If an account exists for that email, we sent a reset link. Check your inbox." });
    setBusy(false);
  }
  return (
    <div className="authwrap"><div className="card authcard">
      <Link href="/" aria-label="Back to home"><Logo /></Link>
      <p className="eyebrow" style={{ marginTop: 22 }}>Account recovery</p><h2>Reset your password</h2>
      <form onSubmit={submit} noValidate>
        <label htmlFor="e">Email</label><input id="e" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {msg && <p role={msg.bad ? "alert" : "status"} style={{ color: msg.bad ? "var(--bad-t)" : "var(--ok-t)" }}>{msg.text}</p>}
        <button className="btn primary" style={{ width: "100%", marginTop: 16 }} disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      </form>
      <p className="small muted" style={{ marginTop: 14 }}><Link href="/login">Back to sign in</Link></p>
    </div></div>
  );
}