const COLOR = { demonstrated: "var(--ok-t)", "self-reported": "var(--warn-t)", insufficient: "var(--muted)", outdated: "var(--gap-t)" };

// skills: [{ key, klass, evidence: [...] }], already filtered. selected: a skill key or null.
export default function EvidenceGraph({ skills, selected, onSelect }) {
  const sources = new Map();
  const edges = [];
  for (const s of skills) {
    const by = new Map();
    for (const e of s.evidence) {
      sources.set(e.source, e.source_label);
      by.set(e.source, (by.get(e.source) || 0) + 1);
    }
    for (const [src, n] of by) edges.push({ skill: s.key, src, n });
  }
  const srcList = [...sources.entries()];
  const ROW = 36, TOP = 16;
  const H = TOP * 2 + Math.max(srcList.length, skills.length) * ROW;
  const yAt = (i) => TOP + i * ROW + ROW / 2;
  const sy = new Map(srcList.map(([k], i) => [k, yAt(i)]));
  const ky = new Map(skills.map((s, i) => [s.key, yAt(i)]));
  const press = (key) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(key); } };

  return (
    <svg viewBox={`0 0 680 ${H}`} className="egraph" role="group" aria-label="Skill evidence graph. A list version is available in the List tab.">
      {edges.map((e) => {
        const y1 = sy.get(e.src), y2 = ky.get(e.skill);
        return <path key={e.skill + e.src} className={`edge ${selected === e.skill ? "on" : ""}`} strokeWidth={1 + Math.min(e.n, 4) * 0.6}
          d={`M158 ${y1} C 314 ${y1}, 314 ${y2}, 470 ${y2}`} />;
      })}
      {srcList.map(([k, label]) => (
        <g key={k} className="node"><rect x="8" y={sy.get(k) - 13} width="150" height="26" rx="8" />
          <text x="18" y={sy.get(k)} dominantBaseline="central">{label}</text></g>))}
      {skills.map((s) => (
        <g key={s.key} className={`node ${selected === s.key ? "sel" : ""}`} role="button" tabIndex={0} aria-pressed={selected === s.key}
           aria-label={`${s.key}: ${s.klass}, ${s.evidence.length} results`} onClick={() => onSelect(s.key)} onKeyDown={press(s.key)}>
          <rect x="470" y={ky.get(s.key) - 13} width="200" height="26" rx="8" />
          <circle cx="484" cy={ky.get(s.key)} r="4.5" fill={COLOR[s.klass]} />
          <text x="496" y={ky.get(s.key)} dominantBaseline="central">{s.key} ({s.evidence.length})</text>
        </g>))}
    </svg>
  );
}