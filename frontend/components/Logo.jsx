export default function Logo({ height = 34 }) {
  return (
    <span
      className="wordmark"
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: height,
        fontSize: height >= 40 ? "1.35rem" : "1.15rem",
        fontWeight: 800,
        letterSpacing: "-0.035em",
        color: "var(--text, #123126)",
        whiteSpace: "nowrap",
      }}
    >
      SkillSetra
    </span>
  );
}
