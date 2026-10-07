import { createClient } from "@supabase/supabase-js";

let client = null;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;                 // not configured: only the demo works
  if (!client) client = createClient(url, key);
  return client;
}

// Demo mode sends a fixed token the backend recognises. Real users send their Supabase token.
export async function getToken() {
  if (typeof window !== "undefined" && sessionStorage.getItem("demo") === "1") return "demo-token";
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token || null;
}