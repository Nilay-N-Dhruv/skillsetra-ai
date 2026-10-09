"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getSupabase } from "@/lib/auth";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
const toUser = (s) => (s ? { email: s.user.email, meta: s.user.user_metadata?.profile || null } : null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("demo") === "1") { setUser({ email: "demo@skillsetra", demo: true }); setLoading(false); return; }
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    sb.auth.getSession().then(({ data }) => { setUser(toUser(data.session)); setLoading(false); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setUser(toUser(s)));
    return () => sub.subscription.unsubscribe();
  }, []);

  const friendly = (e) => {
    const code = e?.code || "";
    const msg = (e?.message || "").toLowerCase();
    if (process.env.NODE_ENV !== "production") console.warn("[auth]", code, e?.status, e?.message);   // read this in DevTools
    if (code === "invalid_credentials" || msg.includes("invalid login")) return "Email or password is incorrect.";
    if (code === "email_not_confirmed" || msg.includes("not confirmed")) return "Please confirm your email first. Check your inbox, then sign in.";
    if (code === "user_already_exists" || msg.includes("already")) return "An account with this email already exists. Try signing in.";
    if (code === "weak_password") return "That password is too weak. Use at least 8 characters with letters, numbers and a symbol.";
    if (code === "signup_disabled") return "Sign-ups are turned off for this project.";
    if (code.includes("rate_limit") || e?.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
    return "We couldn't complete that. Please check your details and try again.";
  };
  const need = () => {
    const sb = getSupabase();
    if (!sb) throw new Error("Sign-in is not configured yet. Use the demo to explore.");
    return sb;
  };

  const value = {
    user, loading,
    async signIn(email, password) {
      // const { error } = await need().auth.signInWithPassword({ email, password });
      const { error } = await need().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw new Error(friendly(error));
    },
        async signUp(email, password, name, profile) {
      const { data, error } = await need().auth.signUp({
        email, password,
        options: { data: { name, profile }, emailRedirectTo: `${window.location.origin}/login?confirmed=1` },
      });
      if (error) throw new Error(friendly(error));
      // With Confirm email on, an already-registered address returns a user with no identities and no error.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return { exists: true };
      return { needsConfirm: !data.session };
    },
    async resendConfirmation(email) {
      const { error } = await need().auth.resend({
        type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/login?confirmed=1` },
      });
      if (error) throw new Error("We couldn't resend the email yet. Please wait a minute and try again.");
    },
    
    async signOut() {
      sessionStorage.removeItem("demo");
      const sb = getSupabase();
      if (sb) await sb.auth.signOut();
      setUser(null);
    },
    startDemo() { sessionStorage.setItem("demo", "1"); setUser({ email: "demo@skillsetra", demo: true }); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}