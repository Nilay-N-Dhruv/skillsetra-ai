"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/auth";
import Logo from "@/components/Logo";

const strong = (p) => p.length >= 8 && [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length >= 3;

export default function Reset() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange((e) => { if (e === "PASSWORD_RECOVERY") setReady(true); });
    sb.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!strong(pw)) return setMsg({ bad: true, text: "Use at least 8 characters with 3 of: upper and lower case, a number, a symbol." });
    setBusy(true);
    const { error } = await getSupabase().auth.updateUser({ password: pw });
    if (error) setMsg({ bad: true, text: "We couldn't update your password. The link may have expired. Request a new one." });
    else { setMsg({ text: "Password updated. Taking you to your dashboard…" }); setTimeout(() => router.push("/dashboard"), 1200); }
    setBusy(false);
  }
  return (
    <div className="authwrap"><div className="card authcard">
      <Link href="/" aria-label="Back to home"><Logo /></Link>
      <p className="eyebrow" style={{ marginTop: 22 }}>Account recovery</p><h2>Choose a new password</h2>
      {!ready ? <p className="muted">Open this page from the link in your reset email. <Link href="/forgot-password">Request a new link</Link></p> : (
        <form onSubmit={submit} noValidate>
          <label htmlFor="p">New password</label><input id="p" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          {msg && <p role={msg.bad ? "alert" : "status"} style={{ color: msg.bad ? "var(--bad-t)" : "var(--ok-t)" }}>{msg.text}</p>}
          <button className="btn primary" style={{ width: "100%", marginTop: 16 }} disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
        </form>)}
    </div></div>
  );
}