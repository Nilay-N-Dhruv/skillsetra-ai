"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, ClipboardCheck, Map, Briefcase, Settings, LogOut, Menu, X, Lock } from "lucide-react";
import { useAuth } from "./AuthProvider";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { Loading } from "./Status";

// Part 3 adds more items here (Challenges, GitHub, Project Defense...). Only pages that exist are listed.
const GROUPS = [
  { label: "Workspace", items: [{ href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard }] },
  { label: "Test / Prove", items: [{ href: "/assessment", label: "Assessment", Icon: ClipboardCheck }] },
  { label: "Learn", items: [{ href: "/roadmap", label: "Roadmap", Icon: Map }] },
  { label: "Career", items: [{ href: "/career", label: "Career Intelligence", Icon: Briefcase }] },
  { label: "Account", items: [{ href: "/settings", label: "Settings", Icon: Settings }] },
];

export default function Shell({ children }) {
  const { user, loading, signOut } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) return <Loading label="Checking your session" />;
  if (!user) {
    return (
      <div className="authwrap"><div className="card authcard" style={{ textAlign: "center" }}>
        <Lock aria-hidden size={28} color="var(--teal)" />
        <h2 style={{ marginTop: 10 }}>Sign in to unlock SkillSetra</h2>
        <p style={{ margin: "0 auto 18px" }}>Your competency journey is private to your account. Sign in or create your free account to continue.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn primary" href="/login">Sign in</Link>
          <Link className="btn" href="/signup">Create account</Link>
        </div>
      </div></div>
    );
  }

  const out = async () => { await signOut(); router.push("/"); };
  const label = user.demo ? "Demo Learner" : user.email;
  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`side ${open ? "open" : ""}`} aria-label="Main navigation">
        <div style={{ padding: "6px 8px 8px" }}><Logo /></div>
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="sgroup">{g.label}</div>
            {g.items.map(({ href, label: l, Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className={path === href ? "active" : ""} aria-current={path === href ? "page" : undefined}>
                <Icon size={18} aria-hidden /> {l}
              </Link>
            ))}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <button className="nav" onClick={out}><LogOut size={18} aria-hidden /> Sign out</button>
      </aside>
      <div className="content">
        <header className="apptop">
          <button className="btn icon menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
          <div className="spacer" />
          <ThemeToggle />
          <div className="row" style={{ gap: 10 }}>
            <div className="avatar" aria-hidden>{label[0].toUpperCase()}</div>
            <div className="who"><strong>{label}</strong><br /><small>{user.demo ? "Demo mode · local data" : "Signed in"}</small></div>
          </div>
        </header>
        <main className="main">
          {user.demo && <div className="demo-banner" role="note"><strong>Demo mode:</strong> data lives in memory on the server and resets when it restarts. Nothing is saved to a real account.</div>}
          {children}
        </main>
      </div>
    </div>
  );
}