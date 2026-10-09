const LABEL = { ai: "Live AI analysis", puter: "Live AI · Puter (browser)" };
export default function AiTag({ source }) {
  const live = source in LABEL;
  return <span className={`tag ${live ? "live" : "demo"}`}>{live ? LABEL[source] : "Demo fallback · not AI"}</span>;
}