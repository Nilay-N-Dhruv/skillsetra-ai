"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ClaimForm({ role, skills, onDone }) {
  const [skill, setSkill] = useState(skills[0] || "");
  const [kind, setKind] = useState("course");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);

  async function save(e) {
    e.preventDefault(); setErr(null);
    if (note.trim().length < 10) return setErr("Describe what you learned in at least 10 characters.");
    setBusy(true);
    try {
      await api("/skills/claim", { method: "POST", body: { skill, kind, note: note.trim(), ...(link.trim() ? { link: link.trim() } : {}) } });
      setDone(skill); setNote(""); setLink(""); onDone?.();
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="item" style={{ marginTop: 16 }}>
      <h3>I learned something new</h3>
      <p className="small muted">This is saved as limited, self-reported evidence. Re-test the skill to make it count.</p>
      <div className="grid g3">
        <div><label htmlFor="cs">Skill</label><select id="cs" value={skill} onChange={(e) => setSkill(e.target.value)}>{skills.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label htmlFor="ck">How did you learn it?</label>
          <select id="ck" value={kind} onChange={(e) => setKind(e.target.value)}><option value="course">Course</option><option value="project">Project</option><option value="practice">Practice</option></select></div>
        <div><label htmlFor="cl">Link (optional)</label><input id="cl" type="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} /></div>
      </div>
      <label htmlFor="cn">What did you learn or build?</label>
      <textarea id="cn" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} />
      {err && <p role="alert" style={{ color: "var(--bad-t)" }}>{err}</p>}
      {done && <p role="status" style={{ color: "var(--ok-t)" }}>Saved. Next, <Link href={`/assessment?role=${encodeURIComponent(role)}&skill=${encodeURIComponent(done)}`}>re-test {done}</Link> to strengthen it.</p>}
      <button className="btn" style={{ marginTop: 12 }} disabled={busy}>{busy ? "Saving…" : "Save skill"}</button>
    </form>
  );
}