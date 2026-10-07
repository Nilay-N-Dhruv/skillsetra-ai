"use client";
import { useState } from "react";
import useApi from "@/hooks/useApi";
import { Badge, ErrorBox, Loading } from "@/components/Status";

export default function Career() {
  const [role, setRole] = useState("");
  const { data, error, loading, reload } = useApi("/career" + (role ? `?role=${encodeURIComponent(role)}` : ""));
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <>
      <p className="eyebrow">Career intelligence</p>
      <h1>What your evidence shows for a role</h1>
      <p className="muted">This maps your evidence to a role. It does not predict hiring outcomes and is not a job-readiness score.</p>
      <label htmlFor="role">Role</label>
      <select id="role" value={role || data?.role || ""} onChange={(e) => setRole(e.target.value)} style={{ maxWidth: 340 }}>
        {(data?.roles || []).map((r) => <option key={r}>{r}</option>)}
      </select>
      {loading && !data ? <Loading /> : (
        <div className="grid g2" style={{ marginTop: 20 }}>{data && Object.entries(data.groups).map(([g, skills]) => (
          <div className="card" key={g}><Badge state={g} />
            <div className="strip">{skills.length ? skills.map((s) => <span className="chip" key={s}>{s}</span>) : <span className="muted small">Nothing here.</span>}</div>
          </div>))}</div>
      )}
    </>
  );
}