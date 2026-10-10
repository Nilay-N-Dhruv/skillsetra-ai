
"use client";

import Link from "next/link";
import { useState } from "react";
import useApi from "@/hooks/useApi";
import Fingerprint from "@/components/Fingerprint";
import { Badge, Empty, ErrorBox, Loading } from "@/components/Status";

const SRC = {
  exam: "Assessment",
  challenge: "Challenge",
  github: "GitHub analysis",
  interview: "AI interview",
  defense: "Defense",
  project: "Project",
  whatif: "What-If",
  disagreement: "AI Disagreement",
  seed: "Demo data",
};

const fmt = (n) => {
  const value = Number(n);
  return Number.isInteger(value) ? value : value.toFixed(1);
};

export default function SkillDna() {
  const { data, error, loading, reload } = useApi("/skill-dna");
  const [open, setOpen] = useState(null);

  if (loading) {
    return <Loading label="Building your Skill DNA" />;
  }

  if (error) {
    return <ErrorBox message={error} onRetry={reload} />;
  }

  if (!data) {
    return <Empty title="No data available">Your Skill DNA could not be loaded.</Empty>;
  }

  return (
    <>
      <p className="eyebrow">Skill DNA</p>

      <h1>Your ability fingerprint</h1>

      <p className="muted" style={{ fontSize: "1.05rem" }}>
        How you work, not just what you know. Every point below links to the
        activities behind it.
      </p>

      <p className="small muted">{data.disclaimer}</p>

      {data.total_evidence === 0 ? (
        <Empty title="No evidence yet">
          Complete an assessment or a challenge to start your fingerprint.{" "}
          <Link href="/assessment">Start assessment</Link>
        </Empty>
      ) : (
        <>
          {/* Fingerprint chart and observations */}
          <div className="grid g2" style={{ marginTop: 16 }}>
            <div className="card">
              <h3>Fingerprint</h3>

              <Fingerprint items={data.indicators} />

              <p className="small muted">
                The centre means "not enough evidence yet", not "weak".
              </p>
            </div>

            <div className="card">
              <h3>What the evidence suggests</h3>

              <ul>
                {data.observations.map((observation, index) => (
                  <li key={`${index}-${observation}`}>
                    {observation}
                  </li>
                ))}
              </ul>

              <p className="small muted">
                These sentences come from fixed rules over your saved results.
                They are not AI-generated.
              </p>
            </div>
          </div>

          {/* Evidence indicator cards */}
          <h3 className="evidence-heading">
            The evidence behind each indicator
          </h3>

          <div className="evidence-list evidence-columns">
            {data.indicators.map((indicator) => {
              const isOpen = open === indicator.key;

              return (
                <section className="evidence-card" key={indicator.key}>
                  <button
                    type="button"
                    className="evidence-toggle"
                    aria-expanded={isOpen}
                    aria-controls={`evidence-details-${indicator.key}`}
                    onClick={() =>
                      setOpen(isOpen ? null : indicator.key)
                    }
                  >
                    <span className="evidence-info">
                      <strong className="evidence-title">
                        {indicator.label}
                      </strong>

                      <span className="evidence-description">
                        {indicator.blurb}
                      </span>
                    </span>

                    <span className="evidence-meta">
                      {indicator.trend && (
                        <span className="badge none">
                          {indicator.trend}
                        </span>
                      )}

                      {indicator.consistency && (
                        <span className="badge none">
                          {indicator.consistency}
                        </span>
                      )}

                      <span className="evidence-count">
                        {indicator.count}{" "}
                        {indicator.count === 1 ? "result" : "results"}
                      </span>

                      <Badge state={indicator.state} />
                    </span>

                    <span className="evidence-chevron" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`evidence-details-${indicator.key}`}
                      className="evidence-details"
                    >
                      {indicator.evidence.length === 0 ? (
                        <p className="small muted">
                          Nothing recorded yet.
                        </p>
                      ) : (
                        <div className="evidence-table-wrap">
                          <table className="sheet">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Source</th>
                                <th>Level</th>
                                <th>What was recorded</th>
                              </tr>
                            </thead>

                            <tbody>
                              {indicator.evidence.map((record, index) => (
                                <tr
                                  key={`${indicator.key}-${record.when}-${index}`}
                                >
                                  <td>
                                    {record.when
                                      ? new Date(
                                          record.when
                                        ).toLocaleDateString()
                                      : "—"}
                                  </td>

                                  <td>
                                    {SRC[record.source] || record.source || "—"}
                                  </td>

                                  <td>{fmt(record.level)} of 3</td>

                                  <td>{record.summary || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
