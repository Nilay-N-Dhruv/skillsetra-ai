
"use client";

import { useMemo, useState } from "react";

const DIMS = [
  "Knowledge",
  "Application",
  "Problem Solving",
  "Debugging",
  "Reasoning",
  "Adaptation",
  "Transfer",
  "Testing",
  "Engineering",
  "Deployment",
  "Security",
];

const MAX_LEVEL = 3;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function Radar({ items = [] }) {
  const [showScores, setShowScores] = useState(true);

  const size = 440;
  const center = size / 2;
  const radius = 132;
  const labelRadius = 165;
  const levels = [1, 2, 3];

  const values = useMemo(() => {
    const byKey = new Map(
      items.map((item) => [item.key, item])
    );

    return DIMS.map((key) => {
      const item = byKey.get(key);
      const raw = Number(item?.avg_level ?? 0);
      const value = Number.isFinite(raw)
        ? clamp(raw, 0, MAX_LEVEL)
        : 0;

      return {
        key,
        value,
        percentage: Math.round((value / MAX_LEVEL) * 100),
        state: item?.state || "",
      };
    });
  }, [items]);

  function point(index, distance) {
    const angle =
      (Math.PI * 2 * index) / DIMS.length - Math.PI / 2;

    return [
      center + distance * Math.cos(angle),
      center + distance * Math.sin(angle),
    ];
  }

  function polygonPoints(distanceForIndex) {
    return DIMS.map((_, index) => {
      const [x, y] = point(index, distanceForIndex(index));
      return `${x},${y}`;
    }).join(" ");
  }

  const shapePoints = polygonPoints(
    (index) => (values[index].value / MAX_LEVEL) * radius
  );

  const averagePercentage = Math.round(
    values.reduce((sum, item) => sum + item.percentage, 0) /
      values.length
  );

  const demonstrated = values.filter(
    (item) => item.state === "Demonstrated"
  ).length;

  const hasEvidence = values.filter(
    (item) => item.value > 0
  ).length;

  return (
    <section className="radar-card">
      <div className="radar-header">
        <div>
          <p className="radar-eyebrow">COMPETENCY PROFILE</p>
          <h3 className="radar-title">Eleven dimensions</h3>
          <p className="radar-description">
            Your current evidence across key skill dimensions.
          </p>
        </div>

        <button
          type="button"
          className={`radar-toggle ${showScores ? "active" : ""}`}
          onClick={() => setShowScores((value) => !value)}
          aria-pressed={showScores}
        >
          {showScores ? "Hide scores" : "Show scores"}
        </button>
      </div>

      <div className="radar-summary">
        <div className="radar-stat">
          <span className="radar-stat-label">Average level</span>
          <strong>{averagePercentage}%</strong>
        </div>

        <div className="radar-stat">
          <span className="radar-stat-label">Evidence recorded</span>
          <strong>{hasEvidence} / {DIMS.length}</strong>
        </div>

        <div className="radar-stat">
          <span className="radar-stat-label">Demonstrated</span>
          <strong>{demonstrated}</strong>
        </div>
      </div>

      {showScores && (
        <div className="radar-scores">
          <div className="radar-scores-heading">
            <h4>Dimension scores</h4>
            <span>Level out of 3</span>
          </div>

          <div className="radar-score-grid">
            {values.map((item) => (
              <div className="radar-score-item" key={item.key}>
                <div className="radar-score-top">
                  <span className="radar-score-name">{item.key}</span>
                  <strong>{item.percentage}%</strong>
                </div>

                <div
                  className="radar-score-track"
                  role="progressbar"
                  aria-label={`${item.key} competency level`}
                  aria-valuemin={0}
                  aria-valuemax={3}
                  aria-valuenow={item.value}
                >
                  <span
                    className="radar-score-fill"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <span className="radar-score-level">
                  {item.value.toFixed(1)} / 3
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="radar-note">
        Scores reflect recorded evidence, not a hiring prediction.
        Missing evidence is shown as zero until assessed.
      </p>

      <style jsx>{`
        .radar-card {
          width: 100%;
          min-width: 0;
          padding: 24px;
          overflow: hidden;
          border: 1px solid #d8e8dc;
          border-radius: 22px;
          background: #ffffff;
          color: #173225;
          box-sizing: border-box;
        }

        .radar-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .radar-eyebrow {
          margin: 0 0 8px;
          color: #20834b;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .radar-title {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 750;
          letter-spacing: -0.025em;
        }

        .radar-description {
          margin: 8px 0 0;
          color: #6a8073;
          font-size: 0.92rem;
          line-height: 1.55;
        }

        .radar-toggle {
          flex-shrink: 0;
          padding: 9px 12px;
          border: 1px solid #d8e8dc;
          border-radius: 11px;
          background: #ffffff;
          color: #315c41;
          font-size: 0.8rem;
          font-weight: 650;
          cursor: pointer;
        }

        .radar-toggle:hover,
        .radar-toggle.active {
          background: #eff8f1;
          border-color: #b8d9c1;
        }

        .radar-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .radar-stat {
          display: grid;
          gap: 7px;
          min-width: 0;
          padding: 14px;
          border: 1px solid #e3eee5;
          border-radius: 14px;
          background: #f8fbf8;
        }

        .radar-stat-label {
          color: #708276;
          font-size: 0.77rem;
          line-height: 1.4;
        }

        .radar-stat strong {
          color: #173d28;
          font-size: 1.45rem;
          line-height: 1.2;
        }

        .radar-chart-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          margin: 12px auto 0;
        }

        .radar-svg {
          display: block;
          width: 100%;
          max-width: 490px;
          height: auto;
          overflow: visible;
        }

        .radar-grid {
          fill: none;
          stroke: #dce9df;
          stroke-width: 1.3;
          vector-effect: non-scaling-stroke;
        }

        .radar-axis {
          stroke: #e1ebe4;
          stroke-width: 1.1;
          vector-effect: non-scaling-stroke;
        }

        .radar-label {
          fill: #5d7565;
          font-size: 10.5px;
          font-weight: 550;
        }

        .radar-scores {
          margin-top: 14px;
          padding-top: 20px;
          border-top: 1px solid #e7efe9;
        }

        .radar-scores-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .radar-scores-heading h4 {
          margin: 0;
          font-size: 1rem;
        }

        .radar-scores-heading > span {
          color: #738579;
          font-size: 0.78rem;
        }

        .radar-score-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px 22px;
        }

        .radar-score-item {
          min-width: 0;
        }

        .radar-score-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 7px;
        }

        .radar-score-name {
          overflow-wrap: anywhere;
          color: #314c3a;
          font-size: 0.86rem;
          font-weight: 600;
        }

        .radar-score-top strong {
          flex-shrink: 0;
          color: #21834b;
          font-size: 0.84rem;
        }

        .radar-score-track {
          height: 7px;
          overflow: hidden;
          border-radius: 99px;
          background: #e8f0e9;
        }

        .radar-score-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #168047, #45b77b);
          transition: width 250ms ease;
        }

        .radar-score-level {
          display: block;
          margin-top: 5px;
          color: #839186;
          font-size: 0.73rem;
        }

        .radar-note {
          margin: 20px 0 0;
          padding-top: 14px;
          border-top: 1px solid #edf2ee;
          color: #7a8c7f;
          font-size: 0.78rem;
          line-height: 1.6;
        }

        @media (max-width: 560px) {
          .radar-card {
            padding: 17px;
            border-radius: 18px;
          }

          .radar-header {
            flex-direction: column;
          }

          .radar-summary {
            gap: 8px;
          }

          .radar-stat {
            padding: 10px;
          }

          .radar-stat-label {
            font-size: 0.7rem;
          }

          .radar-stat strong {
            font-size: 1.2rem;
          }

          .radar-label {
            font-size: 10px;
          }

          .radar-score-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .radar-score-fill,
          .radar-toggle {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
