import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;            // not configured: only demo mode works
  if (!client) client = createClient(url, key);
  return client;
}

function demoId() {
  let id = sessionStorage.getItem("demoId");
  if (!id) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join("");
    sessionStorage.setItem("demoId", id);
  }
  return id;
}

// Demo mode sends a private demo id. Real users send their Supabase session token.
export async function getToken() {
  if (typeof window !== "undefined" && sessionStorage.getItem("demo") === "1") return `demo-${demoId()}`;
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token || null;
}