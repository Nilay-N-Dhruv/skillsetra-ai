const WIDTH = { Demonstrated: 100, Developing: 66, Limited: 33, "Needs Evidence": 4, "Transfer Gap": 4 };
const COLOR = { Demonstrated: "var(--ok-t)", Developing: "var(--blue)", Limited: "var(--warn-t)", "Needs Evidence": "var(--muted)", "Transfer Gap": "var(--gap-t)" };

// Bar length shows the evidence STATE (not a score).
export function SkillBars({ skills }) {
  return (
    <div>{skills.map((s) => (
      <div key={s.key} className="barrow">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>{s.key}</strong>
          <span className="small muted">{s.total ? `${s.correct}/${s.total} correct · ` : ""}{s.state}{s.claimed ? " · self-reported" : ""}</span>
        </div>
        <div className="strength"><i style={{ width: `${WIDTH[s.state]}%`, background: COLOR[s.state] }} /></div>
      </div>))}
    </div>
  );
}

// points: [{ date, pct }], one per full assessment
export function TrendLine({ points }) {
  const w = 560, h = 170, px = 40, py = 18;
  const x = (i) => (points.length === 1 ? w / 2 : px + (i * (w - 2 * px)) / (points.length - 1));
  const y = (v) => h - py - (v / 100) * (h - 2 * py);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.pct)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Baseline percentage across assessment attempts" className="trend">
      {[0, 50, 100].map((v) => (
        <g key={v}><line x1={px} x2={w - px} y1={y(v)} y2={y(v)} className="ring" /><text x={4} y={y(v) + 4} className="rlabel">{v}%</text></g>
      ))}
      {points.length > 1 && <path d={path} className="trendline" />}
      {points.map((p, i) => (
        <g key={i}><circle cx={x(i)} cy={y(p.pct)} r="5" className="dot" />
          <text x={x(i)} y={y(p.pct) - 10} textAnchor="middle" className="rlabel">{p.pct}%</text></g>
      ))}
    </svg>
  );
}