"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import "./login.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Do not redirect based only on a client-side role field.
    // The protected admin endpoint below is the authority.
    let cancelled = false;

    async function checkExistingSession() {
      if (!auth?.user) return;

      try {
        await api("/admin/overview");
        if (!cancelled) router.replace("/admin");
      } catch {
        // Existing session is not authorized for the admin workspace.
      }
    }

    checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, [auth?.user, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      if (typeof auth?.signIn !== "function") {
        throw new Error(
          "Your authentication provider does not expose signIn(email, password). Update the call to match AuthProvider."
        );
      }

      await auth.signIn(email.trim(), password);

      // Validate authorization against the backend before opening the admin page.
      await api("/admin/overview");
      router.replace("/admin");
    } catch (err) {
      try {
        // If authentication succeeded but the account is not an admin,
        // clear that session so it cannot be mistaken for admin access.
        if (typeof auth?.signOut === "function") {
          await auth.signOut();
        }
      } catch {
        // Keep the original authentication/authorization error.
      }

      setError(
        err?.message ||
          "Unable to sign in. Check your credentials and admin permissions."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <div className="admin-login-glow admin-login-glow-one" />
      <div className="admin-login-glow admin-login-glow-two" />

      <header className="admin-login-header">
        <a className="admin-login-brand" href="/" aria-label="SkillSetra home">
          <span className="admin-login-brand-mark">S</span>
          <span className="admin-login-brand-text">
            <strong>SkillSetra</strong>
            <small>ADMIN CONSOLE</small>
          </span>
        </a>
        <span className="admin-login-header-note">
          <span className="admin-login-live-dot" />
          Secure administrator access
        </span>
      </header>

      <section className="admin-login-content">
        <div className="admin-login-intro">
          <div className="admin-login-kicker">
            <Sparkles size={14} />
            YOUR WORKSPACE, IN CONTROL
          </div>
          <h1>
            Good to have
            <br />
            <span>you back.</span>
          </h1>
          <p>
            Sign in with your authorized administrator account to manage
            SkillSetra users, profiles, and platform activity.
          </p>

          <div className="admin-login-feature-list">
            <div className="admin-login-feature">
              <span className="admin-login-feature-icon">
                <ShieldCheck size={18} />
              </span>
              <span>
                <strong>Protected access</strong>
                <small>Verified by the SkillSetra backend</small>
              </span>
            </div>
            <div className="admin-login-feature">
              <span className="admin-login-feature-icon">
                <LockKeyhole size={18} />
              </span>
              <span>
                <strong>Private workspace</strong>
                <small>Admin tools stay behind authorization</small>
              </span>
            </div>
          </div>
        </div>

        <div className="admin-login-card">
          <div className="admin-login-card-heading">
            <div className="admin-login-card-icon">
              <LockKeyhole size={21} />
            </div>
            <div>
              <h2>Admin sign in</h2>
              <p>Enter your administrator credentials below.</p>
            </div>
          </div>

          {error && (
            <div className="admin-login-error" role="alert">
              <strong>Sign-in unsuccessful</strong>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <label className="admin-login-label" htmlFor="admin-email">
              Email address
            </label>
            <div className="admin-login-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="admin-email"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="admin@yourcompany.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={busy}
              />
            </div>

            <div className="admin-login-password-heading">
              <label className="admin-login-label" htmlFor="admin-password">
                Password
              </label>
            </div>
            <div className="admin-login-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={busy}
              />
              <button
                className="admin-login-password-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={busy}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <button
              className="admin-login-submit"
              type="submit"
              disabled={busy || !email.trim() || !password}
            >
              {busy ? (
                <>
                  <span className="admin-login-spinner" />
                  Verifying access...
                </>
              ) : (
                <>
                  Sign in to admin
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="admin-login-secure-note">
            <ShieldCheck size={15} />
            <span>Your access is checked by the server.</span>
          </div>
        </div>
      </section>

      <footer className="admin-login-footer">
        <span>© {new Date().getFullYear()} SkillSetra</span>
        <span>Administrator access only</span>
      </footer>
    </main>
  );
}
