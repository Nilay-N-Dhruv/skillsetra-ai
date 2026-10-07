const DIMS = ["Knowledge", "Application", "Problem Solving", "Debugging", "Reasoning", "Adaptation",
  "Transfer", "Testing", "Engineering", "Deployment", "Security"];

// items: [{ key, avg_level (0 to 3) }]
export default function Radar({ items }) {
  const size = 360, c = size / 2, R = 108;
  const val = (k) => items.find((i) => i.key === k)?.avg_level ?? 0;
  const pt = (i, r) => { const a = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };
  const poly = DIMS.map((k, i) => pt(i, (val(k) / 3) * R).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Competency radar across eleven dimensions" className="radar">
      {[1, 2, 3].map((l) => <polygon key={l} points={DIMS.map((_, i) => pt(i, (l / 3) * R).join(",")).join(" ")} className="ring" />)}
      {DIMS.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, R)[0]} y2={pt(i, R)[1]} className="ring" />)}
      <polygon points={poly} className="shape" />
      {DIMS.map((k, i) => { const [x, y] = pt(i, R + 24); return <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="rlabel">{k}</text>; })}
    </svg>
  );
}