import Link from "next/link";
import Logo from "./Logo";

export default function AuthShell({ children, wide = false, footer }) {
  return (
    <div className="authpage">
      <Link href="/" className="authlogo" aria-label="SkillSetra home"><Logo height={64} /></Link>
      <div className={`card authbox ${wide ? "wide" : ""}`}>{children}</div>
      {footer && <p className="small muted authfoot">{footer}</p>}
    </div>
  );
}