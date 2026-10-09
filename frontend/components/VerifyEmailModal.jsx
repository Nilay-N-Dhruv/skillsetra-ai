"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";

export default function VerifyEmailModal({ email }) {
  const router = useRouter();
  const { resendConfirmation } = useAuth();
  const okRef = useRef(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const goHome = () => router.push("/");

  useEffect(() => {
    okRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && goHome();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function resend() {
    setBusy(true); setMsg(null);
    try { await resendConfirmation(email); setMsg({ text: "Sent again. Check your inbox and spam folder." }); }
    catch (e) { setMsg({ bad: true, text: e.message }); }
    setBusy(false);
  }

  return (
    <div className="modal-scrim" role="presentation">
      <div className="card modal" role="dialog" aria-modal="true" aria-labelledby="verify-title">
        <MailCheck size={34} color="var(--teal)" aria-hidden />
        <h2 id="verify-title" style={{ marginTop: 12 }}>Verify your email</h2>
        <p style={{ margin: "0 auto 10px" }}>We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account, then sign in.</p>
        <p className="small muted" style={{ margin: "0 auto 14px" }}>Can't find it? Check your spam folder.</p>
        {msg && <p role={msg.bad ? "alert" : "status"} style={{ color: msg.bad ? "var(--bad-t)" : "var(--ok-t)", margin: "0 auto 10px" }}>{msg.text}</p>}
        <div className="row" style={{ justifyContent: "center" }}>
          <button ref={okRef} className="btn primary" onClick={goHome}>OK</button>
          <button className="btn" onClick={resend} disabled={busy}>{busy ? "Sending…" : "Resend email"}</button>
        </div>
      </div>
    </div>
  );
}