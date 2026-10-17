
// "use client";

// import Link from "next/link";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Target,
//   History,
//   FileSearch,
// } from "lucide-react";


// import useApi from "@/hooks/useApi";
// import Radar from "@/components/Radar";
// import { SkillBars, TrendLine } from "@/components/Charts";
// import ClaimForm from "@/components/ClaimForm";
// import { Badge, Empty, ErrorBox } from "@/components/Status";
// import BrandLoader from "@/components/BrandLoader";
// import CountUp from "@/components/CountUp";

// export default function Dashboard() {
//   const router = useRouter();
//   const { data, error, loading, reload, refresh } =
//     useApi("/dashboard");

//   const [skill, setSkill] = useState("");

//   useEffect(() => {
//     if (data?.stage === "choose_role") {
//       router.replace("/onboarding");
//     }
//   }, [data, router]);

//   if (loading || data?.stage === "choose_role") {
//     return <BrandLoader label="Loading your dashboard" />;
//   }

//   if (error) {
//     return <ErrorBox message={error} onRetry={reload} />;
//   }

//   if (!data) {
//     return (
//       <ErrorBox
//         message="Dashboard data is not available."
//         onRetry={reload}
//       />
//     );
//   }

//   if (data.stage === "take_exam") {
//     return (
//       <>
//         <p className="eyebrow">
//           First session · Evidence baseline
//         </p>

//         <h1>Start with what you want to prove.</h1>

//         <p className="muted" style={{ fontSize: "1.05rem" }}>
//           SkillSetra does not drop you into a pre-filled dashboard.
//           Answer applied questions for <strong>{data.role}</strong>,
//           then see your baseline, gaps and next actions.
//         </p>

//         <div className="row" style={{ marginTop: 18 }}>
//           <Link
//             className="btn primary"
//             href={`/assessment?role=${encodeURIComponent(data.role)}`}
//           >
//             Start the {data.role} assessment
//           </Link>

//           <Link className="btn" href="/onboarding">
//             Change role
//           </Link>
//         </div>
//       </>
//     );
//   }

//   const {
//     baseline: b,
//     gaps = [],
//     skills = [],
//     materials = [],
//     radar = [],
//     trend = [],
//     role = "Your target role",
//     overview: o = {},
//   } = data;

//   const q = encodeURIComponent(role);

//   const retestSkill =
//     skill ||
//     skills.find((item) => item.state !== "Demonstrated")?.key ||
//     skills[0]?.key ||
//     "";

//   const practice = o.practice || {};
//   const interviews = o.interviews || {};
//   const learning = o.learning || {};
//   const jobs = o.jobs || {};

//   const recommendations = o.recommendations || [];
//   const activity = o.activity || [];

//   return (
//     <>
//       <p className="eyebrow">
//         First session · Evidence baseline
//       </p>

//       <h1>Start with what you want to prove.</h1>

//       <div className="row" style={{ margin: "12px 0 18px" }}>
//         <span className="pill on">01 Target role</span>
//         <span className="pill on">02 Evidence questions</span>
//         <span className="pill on">03 Gap + next actions</span>
//       </div>

//       <div className="row" style={{ marginBottom: 20 }}>
//         <Link className="btn" href="/competencies">
//           <Target size={16} aria-hidden="true" />
//           Competencies
//         </Link>

//         <Link className="btn" href="/evidence">
//           <History size={16} aria-hidden="true" />
//           Evidence
//         </Link>

//         <Link className="btn" href="/resume-analysis/">
//           <FileSearch size={16} aria-hidden="true" />
//           Resume analysis
//         </Link>
//       </div>

//       <div className="kpis">
//         <div className="card kpi">
//           <p className="eyebrow">Overall competency baseline</p>

//           <div className="num">
//             <CountUp to={b?.pct ?? 0} suffix="%" />
//           </div>

//           <p className="cap">
//             {b?.correct ?? 0} of {b?.total ?? 0} applied questions
//             answered correctly. This measures the assessment only.
//           </p>

//           <p className="cap" style={{ marginTop: 4 }}>
//             {(b?.attempts ?? 0) > 1
//               ? `${b.delta >= 0 ? "+" : ""}${b.delta} points since your first attempt`
//               : "Your first baseline"}
//           </p>
//         </div>

//         <div className="card kpi">
//           <p className="eyebrow">Gaps detected</p>
//           <div className="num">
//             <CountUp to={gaps.length} />
//           </div>
//           <p className="cap">
//             Competency areas needing more evidence
//           </p>
//         </div>

//         <div className="card kpi">
//           <p className="eyebrow">Target</p>
//           <div className="num" style={{ fontSize: "1.7rem" }}>
//             {role}
//           </div>
//           <p className="cap">
//             Your roadmap is anchored to this role
//           </p>
//         </div>
//       </div>

//       <div className="grid g2" style={{ marginTop: 16 }}>
//         <div className="card">
//           <p className="eyebrow">Competency radar</p>
//           <h3>Eleven dimensions</h3>
//           <Radar items={radar} />
//         </div>

//         <div className="card">
//           <p className="eyebrow">Skill evidence</p>
//           <h3>Skills for {role}</h3>
//           <SkillBars skills={skills} />
//         </div>
//       </div>

//       <div className="card" style={{ marginTop: 16 }}>
//         <p className="eyebrow">Progress</p>
//         <h3>Baseline across attempts</h3>
//         <TrendLine points={trend} />
//       </div>

//       <div className="grid g2" style={{ marginTop: 16 }}>
//         <div className="card">
//           <p className="eyebrow">Gap map</p>
//           <h2 style={{ fontSize: "1.5rem" }}>
//             What to strengthen next
//           </h2>

//           {gaps.length === 0 ? (
//             <Empty title="No gaps detected">
//               Re-test to confirm your results.
//             </Empty>
//           ) : (
//             gaps.map((gap) => (
//               <div className="item" key={gap.key}>
//                 <div
//                   className="row"
//                   style={{ justifyContent: "space-between" }}
//                 >
//                   <strong>{gap.key}</strong>
//                   <Badge state={gap.state} />
//                 </div>
//                 <p className="small muted">{gap.action}</p>
//               </div>
//             ))
//           )}
//         </div>

//         <div className="card">
//           <p className="eyebrow">Learning materials</p>
//           <h2 style={{ fontSize: "1.5rem" }}>
//             Start closing the gap
//           </h2>

//           <p className="small muted">
//             Use these alongside projects and re-tests so learning
//             produces evidence.
//           </p>

//           {materials.length === 0 ? (
//             <Empty title="Nothing to study yet">
//               Materials appear when gaps are found.
//             </Empty>
//           ) : (
//             materials.map((material) => (
//               <div className="item" key={material.url}>
//                 <span className="badge none">{material.for}</span>
//                 <p>
//                   <a
//                     href={material.url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                   >
//                     <strong>{material.title}</strong>
//                   </a>{" "}
//                   <span className="small muted">
//                     ({material.type})
//                   </span>
//                 </p>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       <div className="card" style={{ marginTop: 16 }}>
//         <p className="eyebrow">Your next loop</p>

//         <h2 style={{ fontSize: "1.6rem" }}>
//           Claim → practice → prove → re-test
//         </h2>

//         <p className="muted">
//           Learn something, claim it, then re-test. Your dashboard
//           updates from the new evidence.
//         </p>

//         <div className="row">
//           <Link className="btn primary" href={`/assessment?role=${q}`}>
//             Re-test this role
//           </Link>

//           <Link className="btn" href="/onboarding">
//             Try a different role
//           </Link>

//           <Link className="btn" href="/roadmap">
//             Open roadmap
//           </Link>
//         </div>

//         <div className="row" style={{ marginTop: 16 }}>
//           <div style={{ minWidth: 200 }}>
//             <label htmlFor="rs" style={{ marginTop: 0 }}>
//               Re-test one skill
//             </label>

//             <select
//               id="rs"
//               value={retestSkill}
//               onChange={(event) => setSkill(event.target.value)}
//               disabled={skills.length === 0}
//             >
//               {skills.map((item) => (
//                 <option key={item.key} value={item.key}>
//                   {item.key}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <Link
//             className="btn"
//             style={{ alignSelf: "flex-end" }}
//             href={
//               retestSkill
//                 ? `/assessment?role=${q}&skill=${encodeURIComponent(retestSkill)}`
//                 : `/assessment?role=${q}`
//             }
//           >
//             Start skill re-test
//           </Link>
//         </div>

//         <ClaimForm
//           role={role}
//           skills={skills.map((item) => item.key)}
//           onDone={refresh}
//         />
//       </div>

//       <div className="card" style={{ marginTop: 16 }}>
//         <p className="eyebrow">Across SkillSetra</p>
//         <h2 style={{ fontSize: "1.5rem" }}>
//           Your progress at a glance
//         </h2>

//         <div
//           className="kpis"
//           style={{
//             gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
//           }}
//         >
//           <div className="stat">
//             <b>{practice.attempts ?? 0}</b>
//             <p className="small muted" style={{ margin: 0 }}>
//               Practice attempts
//               {practice.last ? ` · last: ${practice.last}` : ""}
//             </p>
//           </div>

//           <div className="stat">
//             <b>{interviews.count ?? 0}</b>
//             <p className="small muted" style={{ margin: 0 }}>
//               Interviews
//               {interviews.last ? ` · last: ${interviews.last}` : ""}
//             </p>
//           </div>

//           <div className="stat">
//             <b>{learning.pct ?? 0}%</b>
//             <p className="small muted" style={{ margin: 0 }}>
//               Learning items done ({learning.done ?? 0}/
//               {learning.total ?? 0})
//             </p>
//           </div>

//           <div className="stat">
//             <b>{jobs.saved ?? 0}</b>
//             <p className="small muted" style={{ margin: 0 }}>
//               Saved opportunities
//             </p>
//           </div>
//         </div>

//         <div className="grid g2" style={{ marginTop: 14 }}>
//           <div>
//             <h3>Suggested next steps</h3>

//             {recommendations.length === 0 ? (
//               <p className="muted small">You are up to date.</p>
//             ) : (
//               <ul>
//                 {recommendations.map((recommendation, index) => (
//                   <li key={`${recommendation}-${index}`}>
//                     {recommendation}
//                   </li>
//                 ))}
//               </ul>
//             )}

//             <p className="small muted">
//               Suggested from your own data, not AI-generated.
//             </p>
//           </div>

//           <div>
//             <h3>Recent activity</h3>

//             {activity.length === 0 ? (
//               <p className="muted small">No activity yet.</p>
//             ) : (
//               activity.map((item, index) => (
//                 <p
//                   key={`${item.when}-${index}`}
//                   className="small"
//                   style={{ margin: "0 0 6px" }}
//                 >
//                   {new Date(item.when).toLocaleDateString()} · {item.text}
//                 </p>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }




"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  History,
  FileSearch,
  BriefcaseBusiness,
} from "lucide-react";

import useApi from "@/hooks/useApi";
import Radar from "@/components/Radar";
import { SkillBars, TrendLine } from "@/components/Charts";
import ClaimForm from "@/components/ClaimForm";
import { Badge, Empty, ErrorBox } from "@/components/Status";
import BrandLoader from "@/components/BrandLoader";
import CountUp from "@/components/CountUp";

/* =======================================================
   Previous role assessment history
======================================================= */

function RoleHistory({ currentRole, history = [] }) {
  const grouped = new Map();

  for (const attempt of history) {
    if (!attempt.role || attempt.role === currentRole) continue;

    if (!grouped.has(attempt.role)) {
      grouped.set(attempt.role, []);
    }

    grouped.get(attempt.role).push(attempt);
  }

  return (
    <section className="role-history-card">
      <p className="role-history-kicker">Career history</p>

      <h2 className="role-history-title">Previous roles</h2>

      <p className="role-history-description">
        Review your previous roles and saved assessment results.
      </p>

      <h3 className="role-history-subheading">
        Previous assessment results
      </h3>

      {grouped.size === 0 ? (
        <div className="role-history-empty">
          <BriefcaseBusiness size={23} />
          <strong>No previous assessment results</strong>
          <p>
            Saved assessments for previous roles will appear here.
          </p>
        </div>
      ) : (
        <div className="role-history-list">
          {[...grouped.entries()].map(([role, attempts]) => (
            <details className="role-history-item" key={role}>
              <summary>
                <span
                  className="role-history-chevron"
                  aria-hidden="true"
                >
                  ›
                </span>

                <span className="role-history-summary-title">
                  {role}
                </span>

                <span className="role-history-attempt-count">
                  {attempts.length}{" "}
                  {attempts.length === 1 ? "attempt" : "attempts"}
                </span>
              </summary>

              <div className="role-history-attempts">
                {attempts.map((attempt, index) => {
                  const total = Number(attempt.total || 0);
                  const correct = Number(attempt.correct || 0);

                  const percentage =
                    attempt.pct !== undefined && attempt.pct !== null
                      ? Number(attempt.pct)
                      : total > 0
                        ? Math.round((correct / total) * 100)
                        : 0;

                  return (
                    <div
                      className="role-history-attempt"
                      key={
                        attempt.session_id ||
                        attempt.id ||
                        `${role}-${index}`
                      }
                    >
                      <div className="role-history-attempt-info">
                        <strong>
                          {attempt.created_at
                            ? new Date(
                                attempt.created_at
                              ).toLocaleDateString()
                            : `Attempt ${index + 1}`}
                        </strong>

                        <span>
                          {correct} of {total} correct
                        </span>
                      </div>

                      <span className="role-history-score">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      )}

      <RoleHistoryStyles />
    </section>
  );
}

/* =======================================================
   Career history styling
======================================================= */

function RoleHistoryStyles() {
  return (
    <style jsx global>{`
      .role-history-card {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        margin-top: 22px;
        padding: 26px;
        border: 1px solid #d6e6da;
        border-radius: 23px;
        background: #fff;
        color: #12251a;

        /* Prevent accidental selection in role history. */
        -webkit-user-select: none;
        user-select: none;
      }

      .role-history-card * {
        -webkit-user-select: none;
        user-select: none;
      }

      .role-history-kicker {
        margin: 0 0 18px;
        color: #536b5b;
        font-size: 1rem;
      }

      .role-history-title {
        margin: 0;
        font-size: clamp(1.4rem, 2vw, 1.75rem);
        line-height: 1.3;
        letter-spacing: -0.025em;
      }

      .role-history-description {
        max-width: 800px;
        margin: 12px 0 24px;
        color: #5a7061;
        font-size: 1rem;
        line-height: 1.7;
      }

      .role-history-subheading {
        margin: 0 0 18px;
        color: #14291c;
        font-size: 1.2rem;
        font-weight: 700;
      }

      .role-history-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        width: 100%;
      }

      .role-history-item {
        min-width: 0;
        overflow: hidden;
        border: 1px solid #d6e6da;
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 2px 8px rgba(28, 75, 43, 0.035);
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease;
      }

      .role-history-item:hover,
      .role-history-item[open] {
        border-color: #a9d4b6;
        box-shadow: 0 5px 16px rgba(28, 75, 43, 0.07);
      }

      .role-history-item summary {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 90px;
        padding: 20px;
        cursor: pointer;
        list-style: none;
        outline-offset: -4px;
      }

      /* Remove the browser's default disclosure arrow. */
      .role-history-item summary::-webkit-details-marker {
        display: none;
      }

      .role-history-item summary::marker {
        content: "";
      }

      /* Prevent any additional arrow injected by other CSS. */
      .role-history-item summary::before,
      .role-history-item summary::after {
        content: none !important;
        display: none !important;
      }

      /* This custom arrow is the only arrow shown. */
      .role-history-chevron {
        display: flex;
        flex: 0 0 36px;
        width: 36px;
        height: 36px;
        align-items: center;
        justify-content: center;
        border: 1px solid #d7eadc;
        border-radius: 12px;
        background: #f2f8f3;
        color: #218347;
        font-size: 1.7rem;
        line-height: 1;
        transition: transform 160ms ease;
      }

      .role-history-item[open] .role-history-chevron {
        transform: rotate(90deg);
      }

      .role-history-summary-title {
        flex: 1;
        min-width: 0;
        color: #172a1d;
        font-size: 1.05rem;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .role-history-attempt-count {
        flex-shrink: 0;
        padding: 8px 12px;
        border: 1px solid #dcebe0;
        border-radius: 999px;
        background: #f5faf6;
        color: #54715d;
        font-size: 0.85rem;
        font-weight: 600;
        text-align: center;
        white-space: nowrap;
      }

      .role-history-attempts {
        padding: 0 20px 20px;
        border-top: 1px solid #edf3ee;
      }

      .role-history-attempt {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 17px 0;
        border-bottom: 1px solid #edf3ee;
      }

      .role-history-attempt:last-child {
        border-bottom: none;
      }

      .role-history-attempt-info {
        display: grid;
        gap: 6px;
        min-width: 0;
      }

      .role-history-attempt-info strong {
        color: #203728;
        font-size: 0.95rem;
      }

      .role-history-attempt-info span {
        color: #718174;
        font-size: 0.88rem;
      }

      .role-history-score {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 60px;
        min-height: 42px;
        padding: 0 10px;
        border: 1px solid #d6e9dc;
        border-radius: 13px;
        background: #f0f8f2;
        color: #218347;
        font-size: 0.95rem;
        font-weight: 750;
        white-space: nowrap;
      }

      .role-history-empty {
        display: grid;
        justify-items: start;
        gap: 9px;
        padding: 24px;
        border: 1px dashed #cfe2d3;
        border-radius: 16px;
        background: #f8fbf8;
      }

      .role-history-empty svg {
        color: #247d45;
      }

      .role-history-empty p {
        margin: 0;
        color: #627568;
        line-height: 1.6;
      }

      @media (max-width: 760px) {
        .role-history-list {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      @media (max-width: 480px) {
        .role-history-card {
          padding: 18px;
          border-radius: 18px;
        }

        .role-history-item summary {
          min-height: 80px;
          gap: 10px;
          padding: 14px;
        }

        .role-history-chevron {
          flex-basis: 30px;
          width: 30px;
          height: 30px;
        }

        .role-history-summary-title {
          font-size: 0.95rem;
        }

        .role-history-attempt-count {
          padding: 7px 9px;
          font-size: 0.75rem;
        }

        .role-history-attempts {
          padding: 0 14px 16px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .role-history-item,
        .role-history-chevron {
          transition: none;
        }
      }
    `}</style>
  );
}

/* =======================================================
   Main dashboard
======================================================= */

export default function Dashboard() {
  const router = useRouter();
  const { data, error, loading, reload, refresh } = useApi("/dashboard");
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

  const role = data.role || "Your target role";
  const roleHistory = Array.isArray(data.role_history)
    ? data.role_history
    : [];

  if (data.stage === "take_exam") {
    return (
      <>
        <p className="eyebrow">First session · Evidence baseline</p>
        <h1>Start with what you want to prove.</h1>

        <p className="muted" style={{ fontSize: "1.05rem" }}>
          Answer applied questions for <strong>{role}</strong>, then see
          your baseline, gaps and next actions.
        </p>

        <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
          <Link
            className="btn primary"
            href={`/assessment?role=${encodeURIComponent(role)}`}
          >
            Start the {role} assessment
          </Link>

          <Link className="btn" href="/onboarding">
            Change role
          </Link>
        </div>

        <RoleHistory currentRole={role} history={roleHistory} />
      </>
    );
  }

  const {
    baseline: b = {},
    gaps = [],
    skills = [],
    materials = [],
    radar = [],
    trend = [],
    overview: o = {},
  } = data;

  const practice = o.practice || {};
  const interviews = o.interviews || {};
  const learning = o.learning || {};
  const jobs = o.jobs || {};
  const recommendations = o.recommendations || [];
  const activity = o.activity || [];
  const roleQuery = encodeURIComponent(role);

  const retestSkill =
    skill ||
    skills.find((item) => item.state !== "Demonstrated")?.key ||
    skills[0]?.key ||
    "";

  return (
    <>
      <p className="eyebrow">First session · Evidence baseline</p>
      <h1>Start with what you want to prove.</h1>

      <div className="row" style={{ margin: "12px 0 18px", flexWrap: "wrap" }}>
        <span className="pill on">01 Target role</span>
        <span className="pill on">02 Evidence questions</span>
        <span className="pill on">03 Gap + next actions</span>
      </div>

      <div className="row" style={{ marginBottom: 20, flexWrap: "wrap" }}>
        <Link className="btn" href="/competencies">
          <Target size={16} /> Competencies
        </Link>

        <Link className="btn" href="/evidence">
          <History size={16} /> Evidence
        </Link>

        <Link className="btn" href="/resume-analysis">
          <FileSearch size={16} /> Resume analysis
        </Link>
      </div>

      <div className="kpis">
        <div className="card kpi">
          <p className="eyebrow">Overall competency baseline</p>
          <div className="num">
            <CountUp to={b.pct ?? 0} suffix="%" />
          </div>
          <p className="cap">
            {b.correct ?? 0} of {b.total ?? 0} applied questions answered
            correctly.
          </p>
          <p className="cap" style={{ marginTop: 4 }}>
            {(b.attempts ?? 0) > 1
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
          <p className="eyebrow">Target role</p>
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
                  style={{ justifyContent: "space-between", gap: 10 }}
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
            Use learning resources alongside projects and re-tests.
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
          Learn something, claim it, then re-test. Your dashboard updates
          from new evidence.
        </p>

        <div className="row" style={{ flexWrap: "wrap" }}>
          <Link
            className="btn primary"
            href={`/assessment?role=${roleQuery}`}
          >
            Re-test this role
          </Link>

          <Link className="btn" href="/onboarding">
            Try a different role
          </Link>

          <Link className="btn" href="/roadmap">
            Open roadmap
          </Link>
        </div>

        <div
          className="row"
          style={{
            marginTop: 16,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ minWidth: 200 }}>
            <label htmlFor="dashboard-retest-skill">
              Re-test one skill
            </label>
            <select
              id="dashboard-retest-skill"
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
            href={
              retestSkill
                ? `/assessment?role=${roleQuery}&skill=${encodeURIComponent(retestSkill)}`
                : `/assessment?role=${roleQuery}`
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
              Learning items done ({learning.done ?? 0}/{learning.total ?? 0})
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
                {recommendations.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            )}
            <p className="small muted">
              Suggested from your recorded activity.
            </p>
          </div>

          <div>
            <h3>Recent activity</h3>
            {activity.length === 0 ? (
              <p className="muted small">No activity yet.</p>
            ) : (
              activity.map((item, index) => (
                <p
                  className="small"
                  key={`${item.when}-${index}`}
                  style={{ margin: "0 0 7px" }}
                >
                  {item.when
                    ? new Date(item.when).toLocaleDateString()
                    : "Date unavailable"}{" "}
                  · {item.text}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Career history is always the last section */}
      <RoleHistory currentRole={role} history={roleHistory} />
    </>
  );
}

