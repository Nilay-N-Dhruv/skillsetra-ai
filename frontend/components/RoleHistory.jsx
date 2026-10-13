"use client";
import useApi from "@/hooks/useApi";

const day = (s) => (s ? new Date(s).toLocaleDateString() : null);

export default function RoleHistory({ compact = false }) {
  const { data } = useApi("/roles/history");
  if (!data) return null;                                      // loading or error: stay quiet
  const items = data.items;
  if (items.length === 0 || (compact && items.length < 2)) return null;
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <p className="eyebrow">Role history</p>
      <h3>Your roles so far</h3>
      <p className="small muted">Switching role never deletes anything. Your earlier results are kept and shown here.</p>
      <div className="grid g2">
        {items.map((r) => (
          <div className="item" key={r.role}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{r.role}</strong>{r.current && <span className="badge ok">Current</span>}
            </div>
            <p className="small">
              {r.attempts > 0
                ? <>Assessment: latest <strong>{r.latest_pct}%</strong> · best {r.best_pct}% · {r.attempts} attempt{r.attempts === 1 ? "" : "s"}</>
                : "No full assessment yet for this role."}
              {r.skill_retests > 0 && <> · {r.skill_retests} skill re-test{r.skill_retests === 1 ? "" : "s"}</>}
            </p>
            <div className="bar" aria-hidden><i style={{ width: `${r.coverage_pct}%` }} /></div>
            <p className="small muted">Evidence coverage {r.coverage_pct}% ({r.coverage.backed} of {r.coverage.total} skills)
              {r.last_at ? ` · last assessed ${day(r.last_at)}` : ""}</p>
            {r.history.length > 1 && <p className="small muted">Progress: {r.history.map((h) => `${h.pct}%`).join(" → ")}</p>}
          </div>))}
      </div>
      {data.switches.length > 0 && (
        <p className="small muted" style={{ marginBottom: 0 }}>
          Role changes: {data.switches.slice(0, 3).map((s) => `${s.from} → ${s.to} (${day(s.at)})`).join(", ")}
        </p>)}
      <p className="small muted">{data.note}</p>
    </div>
  );
}