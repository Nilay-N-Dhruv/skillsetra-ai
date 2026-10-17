// "use client";
// import Link from "next/link";
// import useApi from "@/hooks/useApi";
// import Radar from "@/components/Radar";
// import { Badge, ErrorBox, Loading } from "@/components/Status";

// const ORDER = ["Demonstrated", "Developing", "Limited", "Transfer Gap", "Needs Evidence"];

// export default function Competencies() {
//   const { data, error, loading, reload } = useApi("/competencies");
//   if (loading) return <Loading label="Loading your competencies" />;
//   if (error) return <ErrorBox message={error} onRetry={reload} />;
//   const dims = data.items.filter((i) => i.kind === "dimension");
//   return (
//     <>
//       <Link href="/dashboard" className="small">← Back to dashboard</Link>
//       <p className="eyebrow" style={{ marginTop: 14 }}>Competencies</p>
//       <h1>What your evidence shows</h1>
//       <p className="muted">"Needs Evidence" means unknown, not failed. Self-reported skills never replace verified evidence.</p>
//       <div className="row" style={{ marginBottom: 16 }}>{ORDER.map((s) => <span key={s} className="row" style={{ gap: 6 }}><Badge state={s} /> <strong>{data.counts[s] || 0}</strong></span>)}</div>
//       <div className="grid g2">
//         <div className="card"><h3>Dimensions</h3><Radar items={dims} /></div>
//         <div className="card"><h3>All competencies</h3>
//           {[...data.items].sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state)).map((i) => (
//             <div className="item" key={i.key}>
//               <div className="row" style={{ justifyContent: "space-between" }}><strong>{i.key}</strong><Badge state={i.state} /></div>
//               <p className="small muted">{i.explain}{i.claimed ? " Includes a self-reported claim (unverified)." : ""}</p>
//             </div>))}</div>
//       </div>
//     </>
//   );
// }


"use client";

import Link from "next/link";
import useApi from "@/hooks/useApi";
import Radar from "@/components/Radar";
import { Badge, ErrorBox, Loading } from "@/components/Status";

const ORDER = [
  "Demonstrated",
  "Developing",
  "Limited",
  "Transfer Gap",
  "Needs Evidence",
];

const STATE_INFO = {
  Demonstrated: {
    title: "Demonstrated",
    description: "You have evidence showing that you can use this skill.",
    color: "#168047",
    background: "#e0f7eb",
  },
  Developing: {
    title: "Developing",
    description: "You are improving and need more practice to become consistent.",
    color: "#1673c9",
    background: "#e5f0ff",
  },
  Limited: {
    title: "Limited",
    description: "Your current evidence suggests you need more practice.",
    color: "#b45309",
    background: "#fff3d6",
  },
  "Transfer Gap": {
    title: "Transfer Gap",
    description:
      "You need to show that you can apply this skill in a different situation.",
    color: "#c2410c",
    background: "#ffeadf",
  },
  "Needs Evidence": {
    title: "Needs Evidence",
    description:
      "There is not enough evidence to judge this skill yet. It does not mean you failed.",
    color: "#64796d",
    background: "#edf4ef",
  },
};

function stateValue(state) {
  switch (state) {
    case "Demonstrated":
      return 100;
    case "Developing":
      return 65;
    case "Limited":
      return 35;
    case "Transfer Gap":
      return 20;
    default:
      return 5;
  }
}

function countFor(data, state, items) {
  if (typeof data.counts?.[state] === "number") {
    return data.counts[state];
  }

  return items.filter((item) => item.state === state).length;
}

export default function Competencies() {
  const { data, error, loading, reload } = useApi("/competencies");

  if (loading) {
    return <Loading label="Loading your competencies" />;
  }

  if (error) {
    return <ErrorBox message={error} onRetry={reload} />;
  }

  if (!data || !Array.isArray(data.items)) {
    return (
      <ErrorBox
        message="Competency data is unavailable."
        onRetry={reload}
      />
    );
  }

  const items = data.items;
  const dimensions = items.filter((item) => item.kind === "dimension");
  const skills = items.filter((item) => item.kind !== "dimension");

  return (
    <>
      <style jsx>{`
        .page-intro {
          margin-bottom: 24px;
        }

        .intro-copy {
          max-width: 760px;
          line-height: 1.7;
        }

        .status-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 20px 0 24px;
        }

        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 12px;
          border: 1px solid #dce9df;
          border-radius: 12px;
          background: #fff;
        }

        .status-count {
          min-width: 20px;
          color: #173225;
          font-size: 1rem;
          font-weight: 750;
          text-align: center;
        }

        .explanation-card {
          margin: 0 0 24px;
          padding: 22px;
          border: 1px solid #d8e8dc;
          border-radius: 20px;
          background: #fff;
        }

        .explanation-heading {
          margin: 0;
          font-size: 1.15rem;
        }

        .explanation-copy {
          margin: 8px 0 18px;
          line-height: 1.65;
        }

        .meaning-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .meaning-item {
          min-width: 0;
          padding: 16px;
          border: 1px solid #e2ece5;
          border-radius: 14px;
          background: #fbfdfb;
        }

        .meaning-item p {
          margin: 10px 0 0;
          color: #607468;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .chart-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: stretch;
          gap: 20px;
        }

        .panel {
          min-width: 0;
          padding: 22px;
          border: 1px solid #d8e8dc;
          border-radius: 20px;
          background: #fff;
        }

        .panel-title {
          margin: 0 0 8px;
          font-size: 1.1rem;
        }

        .panel-description {
          margin: 0 0 18px;
          color: #718276;
          font-size: 0.88rem;
          line-height: 1.6;
        }

        .skill-item {
          padding: 14px 0;
          border-bottom: 1px solid #eaf0eb;
        }

        .skill-item:first-of-type {
          padding-top: 4px;
        }

        .skill-item:last-of-type {
          border-bottom: 0;
        }

        .skill-name {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .skill-track {
          height: 9px;
          margin-top: 11px;
          overflow: hidden;
          border-radius: 99px;
          background: #e8f0e9;
        }

        .skill-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #168047, #5fc78a);
          transition: width 200ms ease;
        }

        .section-card {
          margin-top: 22px;
          padding: 22px;
          border: 1px solid #d8e8dc;
          border-radius: 20px;
          background: #fff;
        }

        .section-description {
          margin: 6px 0 18px;
          color: #718276;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .competency-item {
          padding: 16px 0;
          border-bottom: 1px solid #eaf0eb;
        }

        .competency-item:first-of-type {
          padding-top: 8px;
        }

        .competency-item:last-child {
          border-bottom: 0;
        }

        .competency-explanation {
          margin: 8px 0 0;
          color: #687d70;
          font-size: 0.9rem;
          line-height: 1.65;
        }

        .claim-note {
          display: inline-block;
          margin-top: 7px;
          color: #9a6700;
          font-size: 0.8rem;
        }

        @media (max-width: 760px) {
          .chart-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .meaning-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .panel,
          .section-card,
          .explanation-card {
            padding: 17px;
            border-radius: 16px;
          }
        }
      `}</style>

      <Link href="/dashboard" className="small">
        ← Back to dashboard
      </Link>

      <header className="page-intro">
        <p className="eyebrow" style={{ marginTop: 14 }}>
          Competencies
        </p>

        <h1>What your evidence shows</h1>

        <p className="muted intro-copy">
          Understand your current skills through assessments, practice, and
          recorded evidence. These labels help you identify strengths and
          decide what to practise next.
        </p>
      </header>

      {/* Status counts */}
      <div className="status-summary" aria-label="Competency status counts">
        {ORDER.map((state) => (
          <div className="status-chip" key={state}>
            <Badge state={state} />
            <span className="status-count">
              {countFor(data, state, items)}
            </span>
          </div>
        ))}
      </div>

      

      {/* Graphs */}
      <div className="chart-grid">
        <section className="panel">
          <h2 className="panel-title">Competency dimensions</h2>

          <p className="panel-description">
            See how your evidence is distributed across the main areas of
            competence.
          </p>

          {dimensions.length ? (
            <Radar items={dimensions} />
          ) : (
            <p className="small muted">
              Dimension data will appear when evidence is available.
            </p>
          )}
        </section>

        <section className="panel">
          <h2 className="panel-title">Skill evidence graph</h2>

          <p className="panel-description">
            These bars summarize each skill&apos;s current evidence state.
            They are not percentages of correct assessment answers.
          </p>

          {!skills.length ? (
            <p className="small muted">
              Skill evidence will appear when skills are assessed.
            </p>
          ) : (
            skills.map((item) => {
              const percentage = stateValue(item.state);
              const info =
                STATE_INFO[item.state] || STATE_INFO["Needs Evidence"];

              return (
                <div className="skill-item" key={item.key}>
                  <div
                    className="row"
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <strong className="skill-name">{item.key}</strong>
                    <Badge state={item.state} />
                  </div>

                  <div
                    className="skill-track"
                    role="progressbar"
                    aria-label={`${item.key} evidence state`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <span
                      className="skill-fill"
                      style={{
                        width: `${percentage}%`,
                        background: info.color,
                      }}
                    />
                  </div>

                  <p className="small muted" style={{ margin: "7px 0 0" }}>
                    {info.description}
                  </p>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* All competencies */}
      <section className="section-card">
        <h2 className="panel-title">All competencies</h2>

        <p className="section-description">
          Review each competency, its current status, and what the recorded
          evidence means.
        </p>

        {!items.length ? (
          <p className="small muted">
            No competencies are available yet. Complete an assessment or
            practice activity to start building evidence.
          </p>
        ) : (
          [...items]
            .sort((a, b) => {
              const left = ORDER.indexOf(a.state);
              const right = ORDER.indexOf(b.state);

              return (
                (left < 0 ? ORDER.length : left) -
                (right < 0 ? ORDER.length : right)
              );
            })
            .map((item) => {
              const info =
                STATE_INFO[item.state] || STATE_INFO["Needs Evidence"];

              return (
                <article className="competency-item" key={item.key}>
                  <div
                    className="row"
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <strong>{item.key}</strong>
                    <Badge state={item.state} />
                  </div>

                  <p className="competency-explanation">
                    {item.explain || info.description}
                  </p>

                  {item.claimed && (
                    <span className="claim-note">
                      Self-reported claim: not yet verified by evidence.
                    </span>
                  )}
                </article>
              );
            })
        )}
      </section>
      {/* Simple explanations for new users */}
      <section className="explanation-card">
        <h2 className="explanation-heading">
          What do these levels mean?
        </h2>

        <p className="muted explanation-copy">
          Each label describes what SkillSetra can currently tell from your
          recorded evidence. A missing score does not automatically mean you
          lack the skill.
        </p>

        <div className="meaning-grid">
          {ORDER.map((state) => {
            const info = STATE_INFO[state];

            return (
              <div className="meaning-item" key={state}>
                <Badge state={state} />
                <p>{info.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
