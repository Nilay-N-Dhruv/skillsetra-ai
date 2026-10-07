"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Target, History } from "lucide-react";
import useApi from "@/hooks/useApi";
import Radar from "@/components/Radar";
import { SkillBars, TrendLine } from "@/components/Charts";
import ClaimForm from "@/components/ClaimForm";
import { Badge, Empty, ErrorBox, Loading } from "@/components/Status";

export default function Dashboard() {
  const router = useRouter();
  const { data, error, loading, reload, refresh } = useApi("/dashboard");
  const [skill, setSkill] = useState("");

  useEffect(() => { if (data?.stage === "choose_role") router.replace("/onboarding"); }, [data, router]);

  if (loading || data?.stage === "choose_role") return <Loading label="Loading your dashboard" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  if (data.stage === "take_exam") return (
    <>
      <p className="eyebrow">First session · Evidence baseline</p>
      <h1>Start with what you want to prove.</h1>
      <p className="muted" style={{ fontSize: "1.05rem" }}>SkillSetra does not drop you into a pre-filled dashboard. Answer applied questions for <strong>{data.role}</strong>, then see your baseline, gaps and next actions.</p>
      <div className="row" style={{ marginTop: 18 }}>
        <Link className="btn primary" href={`/assessment?role=${encodeURIComponent(data.role)}`}>Start the {data.role} assessment</Link>
        <Link className="btn" href="/onboarding">Change role</Link>
      </div>
    </>
  );

  const { baseline: b, gaps, skills, materials, radar, trend, role } = data;
  const q = encodeURIComponent(role);
  const retestSkill = skill || (skills.find((s) => s.state !== "Demonstrated") || skills[0]).key;
  return (
    <>
      <p className="eyebrow">First session · Evidence baseline</p>
      <h1>Start with what you want to prove.</h1>
      <div className="row" style={{ margin: "12px 0 18px" }}>
        <span className="pill on">01 Target role</span><span className="pill on">02 Evidence questions</span><span className="pill on">03 Gap + next actions</span>
      </div>
      <div className="row" style={{ marginBottom: 20 }}>
        <Link className="btn" href="/competencies"><Target size={16} aria-hidden /> Competencies</Link>
        <Link className="btn" href="/evidence"><History size={16} aria-hidden /> Evidence</Link>
      </div>

      <div className="kpis">
        <div className="card kpi"><p className="eyebrow">Overall competency baseline</p><div className="num">{b.pct}%</div>
          <p className="cap">{b.correct} of {b.total} applied questions answered correctly. This measures the assessment only.</p>
          <p className="cap" style={{ marginTop: 4 }}>{b.attempts > 1 ? `${b.delta >= 0 ? "+" : ""}${b.delta} points since your first attempt` : "Your first baseline"}</p></div>
        <div className="card kpi"><p className="eyebrow">Gaps detected</p><div className="num">{gaps.length}</div><p className="cap">Competency areas needing more evidence</p></div>
        <div className="card kpi"><p className="eyebrow">Target</p><div className="num" style={{ fontSize: "1.7rem" }}>{role}</div><p className="cap">Your roadmap is anchored to this role</p></div>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card"><p className="eyebrow">Competency radar</p><h3>Eleven dimensions</h3><Radar items={radar} /></div>
        <div className="card"><p className="eyebrow">Skill evidence</p><h3>Skills for {role}</h3><SkillBars skills={skills} /></div>
      </div>
      <div className="card" style={{ marginTop: 16 }}><p className="eyebrow">Progress</p><h3>Baseline across attempts</h3><TrendLine points={trend} /></div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card"><p className="eyebrow">Gap map</p><h2 style={{ fontSize: "1.5rem" }}>What to strengthen next</h2>
          {gaps.length === 0 ? <Empty title="No gaps detected">Re-test to confirm your results.</Empty>
            : gaps.map((g) => (<div className="item" key={g.key}><div className="row" style={{ justifyContent: "space-between" }}><strong>{g.key}</strong><Badge state={g.state} /></div><p className="small muted">{g.action}</p></div>))}</div>
        <div className="card"><p className="eyebrow">Learning materials</p><h2 style={{ fontSize: "1.5rem" }}>Start closing the gap</h2>
          <p className="small muted">Use these alongside projects and re-tests so learning produces evidence.</p>
          {materials.length === 0 ? <Empty title="Nothing to study yet">Materials appear when gaps are found.</Empty>
            : materials.map((m) => (<div className="item" key={m.url}><span className="badge none">{m.for}</span>
              <p><a href={m.url} target="_blank" rel="noopener noreferrer"><strong>{m.title}</strong></a> <span className="small muted">({m.type})</span></p></div>))}</div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="eyebrow">Your next loop</p>
        <h2 style={{ fontSize: "1.6rem" }}>Claim → practice → prove → re-test</h2>
        <p className="muted">Learn something, claim it, then re-test. Your dashboard updates from the new evidence.</p>
        <div className="row">
          <Link className="btn primary" href={`/assessment?role=${q}`}>Re-test this role</Link>
          <Link className="btn" href="/onboarding">Try a different role</Link>
          <Link className="btn" href="/roadmap">Open roadmap</Link>
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <div style={{ minWidth: 200 }}><label htmlFor="rs" style={{ marginTop: 0 }}>Re-test one skill</label>
            <select id="rs" value={retestSkill} onChange={(e) => setSkill(e.target.value)}>{skills.map((s) => <option key={s.key}>{s.key}</option>)}</select></div>
          <Link className="btn" style={{ alignSelf: "flex-end" }} href={`/assessment?role=${q}&skill=${encodeURIComponent(retestSkill)}`}>Start skill re-test</Link>
        </div>
        <ClaimForm role={role} skills={skills.map((s) => s.key)} onDone={refresh} />
      </div>
    </>
  );
}