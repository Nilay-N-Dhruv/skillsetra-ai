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

  const friendly = (e) =>
    e?.message?.toLowerCase().includes("invalid login") ? "Email or password is incorrect."
    : e?.message?.toLowerCase().includes("already") ? "An account with this email already exists. Try signing in."
    : e?.message?.toLowerCase().includes("not confirmed") ? "Please confirm your email first, then sign in."
    : "We couldn't complete that. Please check your details and try again.";
  const need = () => {
    const sb = getSupabase();
    if (!sb) throw new Error("Sign-in is not configured yet. Use the demo to explore.");
    return sb;
  };

  const value = {
    user, loading,
    async signIn(email, password) {
      const { error } = await need().auth.signInWithPassword({ email, password });
      if (error) throw new Error(friendly(error));
    },
    async signUp(email, password, name, profile) {
      const { data, error } = await need().auth.signUp({ email, password, options: { data: { name, profile } } });
      if (error) throw new Error(friendly(error));
      return { needsConfirm: !data.session };
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