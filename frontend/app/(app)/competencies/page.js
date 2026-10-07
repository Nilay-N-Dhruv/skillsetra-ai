"use client";
import Link from "next/link";
import useApi from "@/hooks/useApi";
import Radar from "@/components/Radar";
import { Badge, ErrorBox, Loading } from "@/components/Status";

const ORDER = ["Demonstrated", "Developing", "Limited", "Transfer Gap", "Needs Evidence"];

export default function Competencies() {
  const { data, error, loading, reload } = useApi("/competencies");
  if (loading) return <Loading label="Loading your competencies" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const dims = data.items.filter((i) => i.kind === "dimension");
  return (
    <>
      <Link href="/dashboard" className="small">← Back to dashboard</Link>
      <p className="eyebrow" style={{ marginTop: 14 }}>Competencies</p>
      <h1>What your evidence shows</h1>
      <p className="muted">"Needs Evidence" means unknown, not failed. Self-reported skills never replace verified evidence.</p>
      <div className="row" style={{ marginBottom: 16 }}>{ORDER.map((s) => <span key={s} className="row" style={{ gap: 6 }}><Badge state={s} /> <strong>{data.counts[s] || 0}</strong></span>)}</div>
      <div className="grid g2">
        <div className="card"><h3>Dimensions</h3><Radar items={dims} /></div>
        <div className="card"><h3>All competencies</h3>
          {[...data.items].sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state)).map((i) => (
            <div className="item" key={i.key}>
              <div className="row" style={{ justifyContent: "space-between" }}><strong>{i.key}</strong><Badge state={i.state} /></div>
              <p className="small muted">{i.explain}{i.claimed ? " Includes a self-reported claim (unverified)." : ""}</p>
            </div>))}</div>
      </div>
    </>
  );
}