"use client";

export default function DebugEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = pub || anon;
  const row = (label, ok, detail) => (
    <p key={label}><strong>{label}:</strong> {ok ? "OK" : "MISSING"} {detail}</p>
  );
  return (
    <main className="container" style={{ padding: 40 }}>
      <h1>Environment check</h1>
      {row("Supabase URL", !!url, url ? `(${new URL(url).host})` : "")}
      {row("Publishable key", !!key, key ? `(starts ${key.slice(0, 15)}, length ${key.length})` : "")}
      {row("API URL", !!process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_API_URL || "")}
      <p className="muted">Delete this page when everything works.</p>
    </main>
  );
}