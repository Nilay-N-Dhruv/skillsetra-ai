"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSupabase } from "@/lib/auth";

const Ctx = createContext(null);

export const useAuth = () => useContext(Ctx);

const toUser = (session) => {
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    meta: session.user.user_metadata?.profile || null,
    demo: false,
  };
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const sb = getSupabase();

    if (!sb) {
      setUser(null);
      return null;
    }

    const { data, error } = await sb.auth.getSession();

    if (error) throw error;

    const nextUser = toUser(data.session);
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    let alive = true;

    if (sessionStorage.getItem("demo") === "1") {
      setUser({ email: "demo@skillsetra", demo: true });
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    const sb = getSupabase();

    if (!sb) {
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    sb.auth
      .getSession()
      .then(({ data, error }) => {
        if (!alive) return;
        setUser(error ? null : toUser(data?.session));
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setUser(null);
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (alive) setUser(toUser(session));
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const friendly = (e) => {
    const code = e?.code || "";
    const msg = (e?.message || "").toLowerCase();

    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth]", code, e?.status, e?.message);
    }

    if (code === "invalid_credentials" || msg.includes("invalid login")) {
      return "Email or password is incorrect.";
    }
    if (code === "email_not_confirmed" || msg.includes("not confirmed")) {
      return "Please confirm your email first. Check your inbox, then sign in.";
    }
    if (code === "user_already_exists" || msg.includes("already")) {
      return "An account with this email already exists. Try signing in.";
    }
    if (code === "weak_password") {
      return "That password is too weak. Use at least 8 characters with letters, numbers and a symbol.";
    }
    if (code === "signup_disabled") {
      return "Sign-ups are turned off for this project.";
    }
    if (code.includes("rate_limit") || e?.status === 429) {
      return "Too many attempts. Please wait a few minutes and try again.";
    }

    return "We couldn't complete that. Please check your details and try again.";
  };

  const need = () => {
    const sb = getSupabase();

    if (!sb) {
      throw new Error(
        "Sign-in is not configured yet. Use the demo to explore."
      );
    }

    return sb;
  };

  const value = {
    user,
    loading,
    isDemo: Boolean(user?.demo),
    refreshUser,

    async signIn(email, password) {
      const { error } = await need().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw new Error(friendly(error));

      sessionStorage.removeItem("demo");
      await refreshUser();
    },

    async signUp(email, password, name, profile) {
      const { data, error } = await need().auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name, profile },
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        },
      });

      if (error) throw new Error(friendly(error));

      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        return { exists: true };
      }

      return { needsConfirm: !data.session };
    },

    async resendConfirmation(email) {
      const { error } = await need().auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        },
      });

      if (error) {
        throw new Error(
          "We couldn't resend the email yet. Please wait a minute and try again."
        );
      }
    },

    async signOut() {
      sessionStorage.removeItem("demo");

      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.auth.signOut();
        if (error) throw new Error(friendly(error));
      }

      setUser(null);
    },

    startDemo() {
      sessionStorage.setItem("demo", "1");
      setUser({ email: "demo@skillsetra", demo: true });
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}