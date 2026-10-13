"use client";
import Link from "next/link";
import useApi from "@/hooks/useApi";

export default function RoleSuggestion() {
  const { data } = useApi("/radar");
  if (!data) return null;
  const rec = data.roles.filter((r) => r.recommended);
  if (rec.length === 0) return null;                          // no evidence yet: say nothing rather than guess
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <p className="eyebrow">Based on your evidence</p>
      <h3>{data.suggestion || "Roles that fit your evidence"}</h3>
      <ul>{rec.map((r) => <li key={r.role}><strong>{r.role}</strong>: {r.coverage_pct}% of its skills have evidence
        {r.effort_weeks > 0 ? `, about ${r.effort_weeks} weeks to close the gaps at ${data.assumptions.weekly_hours} hours a week` : ""}</li>)}</ul>
      <p className="small muted">Suggestions come from the skills you have actually evidenced. They are not a prediction of hiring outcomes.</p>
      <Link className="btn" href="/opportunity-radar">See all roles and the assumptions</Link>
    </div>
  );
}