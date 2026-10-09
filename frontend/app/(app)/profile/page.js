"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { removeFile, signedUrl, uploadFile } from "@/lib/storage";
import useApi from "@/hooks/useApi";
import { ErrorBox, Loading } from "@/components/Status";

const WORK = ["Any", "Remote", "Hybrid", "On-site"];

export default function Profile() {
  const { data, error, loading, reload, refresh } = useApi("/profile/details");
  const [f, setF] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [resume, setResume] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const p = data.career_prefs || {};
    setF({ name: data.name, headline: data.headline, bio: data.bio, education: data.education, experience_summary: data.experience_summary,
      skills: data.skills.join(", "), open_to_work: !!p.open_to_work, work_type: p.work_type || "Any", location: p.location || "" });
  }, [data]);
  useEffect(() => {
    if (!data || data.demo) return;
    data.avatar_path ? signedUrl("avatars", data.avatar_path).then(setPhoto).catch(() => setPhoto(null)) : setPhoto(null);
    data.resume_path ? signedUrl("resumes", data.resume_path).then(setResume).catch(() => setResume(null)) : setResume(null);
  }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!f) return <Loading />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function save(e) {
    e.preventDefault(); setMsg(null);
    const skills = f.skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skills.length > 20 || skills.some((s) => s.length > 40)) return setMsg("Use at most 20 skills, each up to 40 characters.");
    setBusy(true);
    try {
      await api("/profile/details", { method: "PUT", body: { name: f.name.trim(), headline: f.headline, bio: f.bio, education: f.education,
        experience_summary: f.experience_summary, skills, career_prefs: { open_to_work: f.open_to_work, work_type: f.work_type, location: f.location } } });
      setMsg("Profile saved."); refresh();
    } catch (x) { setMsg(x.message); }
    setBusy(false);
  }
  async function upload(bucket, flag, file) {
    if (!file) return;
    setMsg(null); setBusy(true);
    try { await uploadFile(bucket, file, data.uid); await api("/profile/files", { method: "PUT", body: { [flag]: true } }); setMsg("Uploaded."); refresh(); }
    catch (x) { setMsg(x.message); }
    setBusy(false);
  }
  async function remove(bucket, flag) {
    setBusy(true);
    try { await removeFile(bucket, data.uid); await api("/profile/files", { method: "PUT", body: { [flag]: false } }); setMsg("Removed."); refresh(); }
    catch (x) { setMsg(x.message); }
    setBusy(false);
  }

  return (
    <>
      <p className="eyebrow">Profile</p><h1>Your profile</h1>
      <div className="grid g2">
        <form className="card" onSubmit={save}>
          <label htmlFor="n">Name</label><input id="n" value={f.name} onChange={set("name")} maxLength={80} />
          <label htmlFor="e">Email</label><input id="e" value={data.email || ""} disabled />
          <label htmlFor="h">Headline</label><input id="h" value={f.headline} onChange={set("headline")} maxLength={120} placeholder="For example: Python developer learning ML" />
          <label htmlFor="b">Bio</label><textarea id="b" rows={4} value={f.bio} onChange={set("bio")} maxLength={600} />
          <label htmlFor="s">Skills (comma separated)</label><input id="s" value={f.skills} onChange={set("skills")} placeholder="Python, SQL, Docker" />
          <label htmlFor="x">Experience</label><textarea id="x" rows={3} value={f.experience_summary} onChange={set("experience_summary")} maxLength={600} />
          <label htmlFor="d">Education</label><textarea id="d" rows={2} value={f.education} onChange={set("education")} maxLength={300} />
          <h3 style={{ marginTop: 18 }}>Career preferences</h3>
          <label className="chk"><input type="checkbox" checked={f.open_to_work} onChange={set("open_to_work")} /> I am open to work</label>
          <label htmlFor="w">Work type</label><select id="w" value={f.work_type} onChange={set("work_type")}>{WORK.map((w) => <option key={w}>{w}</option>)}</select>
          <label htmlFor="l">Preferred location</label><input id="l" value={f.location} onChange={set("location")} maxLength={80} />
          <button className="btn primary" style={{ marginTop: 16 }} disabled={busy || !f.name.trim()}>{busy ? "Saving…" : "Save profile"}</button>
        </form>

        <div className="card">
          <h3>Photo and resume</h3>
          {data.demo ? <p className="muted">File uploads need a real account. They are turned off in demo mode.</p> : <>
            <div className="row" style={{ marginBottom: 12 }}>
              {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="avatar-lg" src={photo} alt="Your profile photo" /> : <div className="avatar-lg" aria-hidden>{(f.name || "?")[0].toUpperCase()}</div>}
              <div><label htmlFor="ph" style={{ marginTop: 0 }}>Photo (PNG, JPEG or WebP, up to 2 MB)</label>
                <input id="ph" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(e) => upload("avatars", "avatar", e.target.files[0])} />
                {data.avatar_path && <button className="btn" style={{ marginTop: 8 }} onClick={() => remove("avatars", "avatar")}>Remove photo</button>}</div>
            </div>
            <label htmlFor="rs">Resume (PDF, up to 5 MB)</label>
            <input id="rs" type="file" accept="application/pdf" disabled={busy} onChange={(e) => upload("resumes", "resume", e.target.files[0])} />
            {data.resume_path && <div className="row" style={{ marginTop: 8 }}>
              {resume && <a className="btn" href={resume} target="_blank" rel="noopener noreferrer">Open resume</a>}
              <button className="btn" onClick={() => remove("resumes", "resume")}>Remove resume</button></div>}
            <p className="small muted" style={{ marginTop: 12 }}>Files are private to your account. Only you can open them.</p>
          </>}
        </div>
      </div>
      {msg && <p role="status" style={{ marginTop: 14 }}>{msg}</p>}
    </>
  );
}