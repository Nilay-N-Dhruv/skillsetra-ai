import { getToken } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const OFFLINE = "We couldn't reach the server. Check your connection and try again.";

export async function api(path, { method = "GET", body, headers = {} } = {}) {
  const token = await getToken();
  if (!token) { const e = new Error("Please sign in to continue."); e.status = 401; throw e; }
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch { throw new Error(OFFLINE); }
  if (!res.ok) {
    let msg = "Something went wrong. Please try again.";
    try { const j = await res.json(); if (typeof j.detail === "string") msg = j.detail; } catch {}
    const e = new Error(msg); e.status = res.status; throw e;
  }
  return res.json();
}

// For public endpoints (no sign-in needed), such as the role list on the sign-up page.
export async function publicGet(path) {
  try {
    const r = await fetch(`${BASE}/api${path}`);
    if (!r.ok) throw new Error();
    return await r.json();
  } catch { throw new Error(OFFLINE); }
}