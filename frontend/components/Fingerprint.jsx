// items: [{ key, label, avg_level (0 to 3, or null when there is not enough evidence) }]
export default function Fingerprint({ items }) {
  const size = 360, c = size / 2, R = 104, n = items.length;
  const pt = (i, r) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };
  const poly = items.map((d, i) => pt(i, ((d.avg_level ?? 0) / 3) * R).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Skill DNA fingerprint" className="radar">
      {[1, 2, 3].map((l) => <polygon key={l} points={items.map((_, i) => pt(i, (l / 3) * R).join(",")).join(" ")} className="ring" />)}
      {items.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, R)[0]} y2={pt(i, R)[1]} className="ring" />)}
      <polygon points={poly} className="shape" />
      {items.map((d, i) => {
        const [x, y] = pt(i, R + 26);
        return <text key={d.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="rlabel">{d.label}{d.avg_level === null ? " (?)" : ""}</text>;
      })}
    </svg>
  );
}