export function Loading({ label = "Loading" }) {
  return <div className="loading" role="status" aria-live="polite"><span className="spinner" />{label}…</div>;
}
export function ErrorBox({ message, onRetry }) {
  return (
    <div className="card error" role="alert">
      <strong>That didn't work</strong>
      <p>{message}</p>
      {onRetry && <button className="btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}
export function Empty({ title, children }) {
  return <div className="card empty"><strong>{title}</strong><p style={{ margin: "6px auto 0" }}>{children}</p></div>;
}
const CLS = { Demonstrated: "ok", "Strong Evidence": "ok", Developing: "dev", "Developing Evidence": "dev",
  Limited: "lim", "Limited Evidence": "lim", "Needs Evidence": "none", "Not Yet Demonstrated": "none", "Transfer Gap": "gap" };
export function Badge({ state }) { return <span className={`badge ${CLS[state] || "none"}`}>{state}</span>; }