"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import useApi from "@/hooks/useApi";
import ThemeToggle from "@/components/ThemeToggle";
import { ErrorBox, Loading } from "@/components/Status";

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data, error, loading, reload } = useApi("/profile");
  const [msg, setMsg] = useState(null);

  async function wipe() {
    if (!window.confirm("Delete all your assessments, evidence and results? This cannot be undone.")) return;
    try { await api("/me/data", { method: "DELETE" }); setMsg("Your learning data was deleted."); } catch (x) { setMsg(x.message); }
  }
  async function resetDemo() {
    try { await api("/demo/reset", { method: "POST" }); router.push("/onboarding"); } catch (x) { setMsg(x.message); }
  }
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <>
      <p className="eyebrow">Settings</p><h1>Your account</h1>
      <div className="grid g2">
        <div className="card"><h3>Account</h3><p className="muted">{data.demo ? "Demo learner" : data.name || "No name set"}<br />{data.email}</p></div>
        <div className="card"><h3>Target role</h3><p className="muted">{data.target_role || "Not chosen yet"}</p><Link className="btn" href="/onboarding">Change role</Link></div>
        <div className="card"><h3>Appearance</h3><p className="muted">Switch between the dark and the light green theme.</p><ThemeToggle /></div>
        <div className="card"><h3>Privacy</h3><p className="muted">You own your learning data. Deleting removes your assessments and evidence.</p><button className="btn" onClick={wipe}>Delete my learning data</button></div>
        <div className="card"><h3>Security</h3><p className="muted">Your session is managed by Supabase Auth.</p><button className="btn" onClick={async () => { await signOut(); router.push("/"); }}>Sign out</button></div>
        {data.demo && <div className="card"><h3>Demo</h3><p className="muted">Start again as a brand-new learner.</p><button className="btn" onClick={resetDemo}>Reset demo data</button></div>}
      </div>
      {msg && <p role="status" style={{ marginTop: 14 }}>{msg}</p>}
    </>
  );
}