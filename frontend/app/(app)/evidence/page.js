"use client";
import Link from "next/link";
import useApi from "@/hooks/useApi";
import { Empty, ErrorBox, Loading } from "@/components/Status";

const LEVEL = ["No evidence", "Limited", "Developing", "Demonstrated"];
const SRC = { exam: "Assessment", claim: "Self-reported (unverified)", challenge: "Challenge", github: "GitHub analysis", project: "Project", defense: "Defense" };

export default function Evidence() {
  const { data, error, loading, reload } = useApi("/evidence");
  if (loading) return <Loading label="Loading your evidence" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <>
      <Link href="/dashboard" className="small">← Back to dashboard</Link>
      <p className="eyebrow" style={{ marginTop: 14 }}>Evidence timeline</p>
      <h1>Every result, with its source</h1>
      {data.items.length === 0
        ? <Empty title="No evidence yet">Take your assessment to start your timeline. <Link href="/assessment">Start assessment</Link></Empty>
        : <ol className="timeline">{data.items.map((e) => (
            <li key={e.id}>
              <strong>{SRC[e.source_type] || e.source_type}: {e.competency}</strong>
              <div className="small muted">{new Date(e.created_at).toLocaleDateString()} · Result: {LEVEL[e.level]} · Confidence about {Math.round((e.confidence || 0) * 100)}%</div>
              <div>{e.summary}</div>
            </li>))}</ol>}
    </>
  );
}