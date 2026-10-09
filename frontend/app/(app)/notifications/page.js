"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import useApi from "@/hooks/useApi";
import { Empty, ErrorBox, Loading } from "@/components/Status";

const PREFS = [["assessment", "Assessment notifications"], ["interview", "Interview notifications"],
  ["learning", "Learning notifications"], ["job", "Job notifications"], ["email", "Email notifications"]];

export default function Notifications() {
  const { data, error, loading, reload, refresh } = useApi("/notifications");
  const [msg, setMsg] = useState(null);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  async function markAll() { try { await api("/notifications/read", { method: "POST", body: {} }); refresh(); } catch (e) { setMsg(e.message); } }
  async function toggle(k) {
    try { await api("/notifications/prefs", { method: "PUT", body: { ...data.prefs, [k]: !data.prefs[k] } }); refresh(); setMsg("Preference saved."); }
    catch (e) { setMsg(e.message); }
  }
  return (
    <>
      <p className="eyebrow">Notifications</p><h1>What happened lately</h1>
      <div className="grid g2">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>Recent</h3>
            {data.unread > 0 && <button className="btn" onClick={markAll}>Mark all read</button>}</div>
          {data.items.length === 0 ? <Empty title="Nothing yet">Notifications appear when you finish assessments, interviews and learning steps.</Empty>
            : data.items.map((n) => (
              <div className="item" key={n.id} style={{ opacity: n.read ? 0.65 : 1 }}>
                <div className="row" style={{ justifyContent: "space-between" }}><strong>{n.title}</strong><span className="badge none">{n.kind}</span></div>
                <p className="small muted">{n.body} {n.link && <Link href={n.link}>Open</Link>}</p>
                <p className="small muted">{new Date(n.created_at).toLocaleString()}</p>
              </div>))}
        </div>
        <div className="card"><h3>Preferences</h3>
          {PREFS.map(([k, label]) => (
            <label key={k} className="chk"><input type="checkbox" checked={!!data.prefs[k]} onChange={() => toggle(k)} /> {label}</label>))}
          <p className="small muted">Email delivery is not connected yet. The preference is saved for when it is.</p>
        </div>
      </div>
      {msg && <p role="status" style={{ marginTop: 14 }}>{msg}</p>}
    </>
  );
}