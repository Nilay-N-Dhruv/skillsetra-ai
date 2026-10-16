
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  History,
  FileSearch,
} from "lucide-react";

import useApi from "@/hooks/useApi";
import Radar from "@/components/Radar";
import { SkillBars, TrendLine } from "@/components/Charts";
import ClaimForm from "@/components/ClaimForm";
import { Badge, Empty, ErrorBox } from "@/components/Status";
import BrandLoader from "@/components/BrandLoader";
import CountUp from "@/components/CountUp";

export default function Dashboard() {
  const router = useRouter();
  const { data, error, loading, reload, refresh } =
    useApi("/dashboard");

  const [skill, setSkill] = useState("");

  useEffect(() => {
    if (data?.stage === "choose_role") {
      router.replace("/onboarding");
    }
  }, [data, router]);

  if (loading || data?.stage === "choose_role") {
    return <BrandLoader label="Loading your dashboard" />;
  }

  if (error) {
    return <ErrorBox message={error} onRetry={reload} />;
  }

  if (!data) {
    return (
      <ErrorBox
        message="Dashboard data is not available."
        onRetry={reload}
      />
    );
  }

  if (data.stage === "take_exam") {
    return (
      <>
        <p className="eyebrow">
          First session · Evidence baseline
        </p>

        <h1>Start with what you want to prove.</h1>

        <p className="muted" style={{ fontSize: "1.05rem" }}>
          SkillSetra does not drop you into a pre-filled dashboard.
          Answer applied questions for <strong>{data.role}</strong>,
          then see your baseline, gaps and next actions.
        </p>

        <div className="row" style={{ marginTop: 18 }}>
          <Link
            className="btn primary"
            href={`/assessment?role=${encodeURIComponent(data.role)}`}
          >
            Start the {data.role} assessment
          </Link>

          <Link className="btn" href="/onboarding">
            Change role
          </Link>
        </div>
      </>
    );
  }

  const {
    baseline: b,
    gaps = [],
    skills = [],
    materials = [],
    radar = [],
    trend = [],
    role = "Your target role",
    overview: o = {},
  } = data;

  const q = encodeURIComponent(role);

  const retestSkill =
    skill ||
    skills.find((item) => item.state !== "Demonstrated")?.key ||
    skills[0]?.key ||
    "";

  const practice = o.practice || {};
  const interviews = o.interviews || {};
  const learning = o.learning || {};
  const jobs = o.jobs || {};

  const recommendations = o.recommendations || [];
  const activity = o.activity || [];

  return (
    <>
      <p className="eyebrow">
        First session · Evidence baseline
      </p>

      <h1>Start with what you want to prove.</h1>

      <div className="row" style={{ margin: "12px 0 18px" }}>
        <span className="pill on">01 Target role</span>
        <span className="pill on">02 Evidence questions</span>
        <span className="pill on">03 Gap + next actions</span>
      </div>

      <div className="row" style={{ marginBottom: 20 }}>
        <Link className="btn" href="/competencies">
          <Target size={16} aria-hidden="true" />
          Competencies
        </Link>

        <Link className="btn" href="/evidence">
          <History size={16} aria-hidden="true" />
          Evidence
        </Link>

        <Link className="btn" href="/resume-analysis/">
          <FileSearch size={16} aria-hidden="true" />
          Resume analysis
        </Link>
      </div>

      <div className="kpis">
        <div className="card kpi">
          <p className="eyebrow">Overall competency baseline</p>

          <div className="num">
            <CountUp to={b?.pct ?? 0} suffix="%" />
          </div>

          <p className="cap">
            {b?.correct ?? 0} of {b?.total ?? 0} applied questions
            answered correctly. This measures the assessment only.
          </p>

          <p className="cap" style={{ marginTop: 4 }}>
            {(b?.attempts ?? 0) > 1
              ? `${b.delta >= 0 ? "+" : ""}${b.delta} points since your first attempt`
              : "Your first baseline"}
          </p>
        </div>

        <div className="card kpi">
          <p className="eyebrow">Gaps detected</p>
          <div className="num">
            <CountUp to={gaps.length} />
          </div>
          <p className="cap">
            Competency areas needing more evidence
          </p>
        </div>

        <div className="card kpi">
          <p className="eyebrow">Target</p>
          <div className="num" style={{ fontSize: "1.7rem" }}>
            {role}
          </div>
          <p className="cap">
            Your roadmap is anchored to this role
          </p>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <p className="eyebrow">Competency radar</p>
          <h3>Eleven dimensions</h3>
          <Radar items={radar} />
        </div>

        <div className="card">
          <p className="eyebrow">Skill evidence</p>
          <h3>Skills for {role}</h3>
          <SkillBars skills={skills} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="eyebrow">Progress</p>
        <h3>Baseline across attempts</h3>
        <TrendLine points={trend} />
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <p className="eyebrow">Gap map</p>
          <h2 style={{ fontSize: "1.5rem" }}>
            What to strengthen next
          </h2>

          {gaps.length === 0 ? (
            <Empty title="No gaps detected">
              Re-test to confirm your results.
            </Empty>
          ) : (
            gaps.map((gap) => (
              <div className="item" key={gap.key}>
                <div
                  className="row"
                  style={{ justifyContent: "space-between" }}
                >
                  <strong>{gap.key}</strong>
                  <Badge state={gap.state} />
                </div>
                <p className="small muted">{gap.action}</p>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <p className="eyebrow">Learning materials</p>
          <h2 style={{ fontSize: "1.5rem" }}>
            Start closing the gap
          </h2>

          <p className="small muted">
            Use these alongside projects and re-tests so learning
            produces evidence.
          </p>

          {materials.length === 0 ? (
            <Empty title="Nothing to study yet">
              Materials appear when gaps are found.
            </Empty>
          ) : (
            materials.map((material) => (
              <div className="item" key={material.url}>
                <span className="badge none">{material.for}</span>
                <p>
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>{material.title}</strong>
                  </a>{" "}
                  <span className="small muted">
                    ({material.type})
                  </span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="eyebrow">Your next loop</p>

        <h2 style={{ fontSize: "1.6rem" }}>
          Claim → practice → prove → re-test
        </h2>

        <p className="muted">
          Learn something, claim it, then re-test. Your dashboard
          updates from the new evidence.
        </p>

        <div className="row">
          <Link className="btn primary" href={`/assessment?role=${q}`}>
            Re-test this role
          </Link>

          <Link className="btn" href="/onboarding">
            Try a different role
          </Link>

          <Link className="btn" href="/roadmap">
            Open roadmap
          </Link>
        </div>

        <div className="row" style={{ marginTop: 16 }}>
          <div style={{ minWidth: 200 }}>
            <label htmlFor="rs" style={{ marginTop: 0 }}>
              Re-test one skill
            </label>

            <select
              id="rs"
              value={retestSkill}
              onChange={(event) => setSkill(event.target.value)}
              disabled={skills.length === 0}
            >
              {skills.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.key}
                </option>
              ))}
            </select>
          </div>

          <Link
            className="btn"
            style={{ alignSelf: "flex-end" }}
            href={
              retestSkill
                ? `/assessment?role=${q}&skill=${encodeURIComponent(retestSkill)}`
                : `/assessment?role=${q}`
            }
          >
            Start skill re-test
          </Link>
        </div>

        <ClaimForm
          role={role}
          skills={skills.map((item) => item.key)}
          onDone={refresh}
        />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="eyebrow">Across SkillSetra</p>
        <h2 style={{ fontSize: "1.5rem" }}>
          Your progress at a glance
        </h2>

        <div
          className="kpis"
          style={{
            gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          }}
        >
          <div className="stat">
            <b>{practice.attempts ?? 0}</b>
            <p className="small muted" style={{ margin: 0 }}>
              Practice attempts
              {practice.last ? ` · last: ${practice.last}` : ""}
            </p>
          </div>

          <div className="stat">
            <b>{interviews.count ?? 0}</b>
            <p className="small muted" style={{ margin: 0 }}>
              Interviews
              {interviews.last ? ` · last: ${interviews.last}` : ""}
            </p>
          </div>

          <div className="stat">
            <b>{learning.pct ?? 0}%</b>
            <p className="small muted" style={{ margin: 0 }}>
              Learning items done ({learning.done ?? 0}/
              {learning.total ?? 0})
            </p>
          </div>

          <div className="stat">
            <b>{jobs.saved ?? 0}</b>
            <p className="small muted" style={{ margin: 0 }}>
              Saved opportunities
            </p>
          </div>
        </div>

        <div className="grid g2" style={{ marginTop: 14 }}>
          <div>
            <h3>Suggested next steps</h3>

            {recommendations.length === 0 ? (
              <p className="muted small">You are up to date.</p>
            ) : (
              <ul>
                {recommendations.map((recommendation, index) => (
                  <li key={`${recommendation}-${index}`}>
                    {recommendation}
                  </li>
                ))}
              </ul>
            )}

            <p className="small muted">
              Suggested from your own data, not AI-generated.
            </p>
          </div>

          <div>
            <h3>Recent activity</h3>

            {activity.length === 0 ? (
              <p className="muted small">No activity yet.</p>
            ) : (
              activity.map((item, index) => (
                <p
                  key={`${item.when}-${index}`}
                  className="small"
                  style={{ margin: "0 0 6px" }}
                >
                  {new Date(item.when).toLocaleDateString()} · {item.text}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
