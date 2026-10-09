"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import useApi from "@/hooks/useApi";
import ThemeToggle from "@/components/ThemeToggle";
import { ErrorBox, Loading } from "@/components/Status";
import PuterStatus from "@/components/PuterStatus";

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data, error, loading, reload } = useApi("/profile");
  const ai = useApi("/ai/status");
  const [msg, setMsg] = useState(null);
  const [puterOk, setPuterOk] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      if (window.puter?.ai?.chat) {
        setPuterOk(true);
        clearInterval(t);
      }
    }, 500);
    const stop = setTimeout(() => {
      clearInterval(t);
      setPuterOk((v) => v ?? false);
    }, 8000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, []);

  async function wipe() {
    if (!window.confirm("Delete all your assessments, evidence and results? This cannot be undone.")) return;
    try {
      await api("/me/data", { method: "DELETE" });
      setMsg("Your learning data was deleted.");
    } catch (x) {
      setMsg(x.message);
    }
  }

  async function resetDemo() {
    try {
      await api("/demo/reset", { method: "POST" });
      router.push("/onboarding");
    } catch (x) {
      setMsg(x.message);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <p className="eyebrow">Settings</p>
      <h1>Your account</h1>
      <div className="grid g2">
        <PuterStatus />
        <div className="card">
          <h3>Account</h3>
          <p className="muted">
            {data.demo ? "Demo learner" : data.name || "No name set"}<br />
            {data.email}
          </p>
        </div>
        <div className="card">
          <h3>Target role</h3>
          <p className="muted">{data.target_role || "Not chosen yet"}</p>
          <Link className="btn" href="/onboarding">Change role</Link>
        </div>
        <div className="card">
          <h3>Appearance</h3>
          <p className="muted">Switch between the dark and the light green theme.</p>
          <ThemeToggle />
        </div>
        <div className="card">
          <h3>Privacy</h3>
          <p className="muted">You own your learning data. Deleting removes your assessments and evidence.</p>
          <button className="btn" onClick={wipe}>Delete my learning data</button>
        </div>
        <div className="card">
          <h3>Security</h3>
          <p className="muted">Your session is managed by Supabase Auth.</p>
          <button
            className="btn"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            Sign out
          </button>
        </div>
        {data.demo && (
          <div className="card">
            <h3>Demo</h3>
            <p className="muted">Start again as a brand-new learner.</p>
            <button className="btn" onClick={resetDemo}>Reset demo data</button>
          </div>
        )}
        <div className="card">
          <h3>AI provider</h3>
          {ai.data ? (
            ai.data.browser ? (
              <p className="muted">
                Provider: <strong>Puter</strong> (runs in your browser).{" "}
                {puterOk === null
                  ? "Checking…"
                  : puterOk
                    ? "Loaded: AI features are live."
                    : "Not loaded: check your connection or ad blocker. Labelled demo fallbacks are used."}{" "}
                Browser AI results are capped at "Developing" and never prove mastery alone.
              </p>
            ) : (
              <p className="muted">
                Provider: <strong>{ai.data.provider}</strong> ({ai.data.model}).{" "}
                {ai.data.reachable
                  ? "Connected: analysis is live."
                  : ai.data.fallback
                    ? "Not reachable: labelled demo fallbacks are used."
                    : "Not reachable: AI features are paused."}
              </p>
            )
          ) : (
            <Loading />
          )}
          <p className="small muted">
            Browser AI runs through Puter when enabled. No private AI keys are exposed to the browser.
          </p>
        </div>
        <div className="card">
          <h3>Notifications</h3>
          <p className="muted">Choose which updates you want.</p>
          <Link className="btn" href="/notifications">Notification settings</Link>
        </div>
        <div className="card">
          <h3>Profile and legal</h3>
          <p className="muted">Edit your details, photo and resume.</p>
          <div className="row">
            <Link className="btn" href="/profile">Edit profile</Link>
            <Link className="btn" href="/privacy">Privacy</Link>
            <Link className="btn" href="/terms">Terms</Link>
          </div>
        </div>
      </div>
      {msg && <p role="status" style={{ marginTop: 14 }}>{msg}</p>}
    </>
  );
}