"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ClipboardCheck, Puzzle, Brain, ShieldCheck, Mic, ScanSearch, Github,
  Library, Map, Briefcase, Building2, User, Bell, Settings, LogOut, Menu, X, Lock,
  PanelLeftClose, PanelLeftOpen, Fingerprint, TrendingUp,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import BrandLoader from "./BrandLoader";
import NotificationBell from "./NotificationBell";
import CoachButton from "./CoachButton";
import { api } from "@/lib/api";

const GROUPS = [
  { label: "Workspace", items: [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  ] },
  { label: "Test / Prove", items: [
    { href: "/assessment", label: "Assessment", Icon: ClipboardCheck },
    { href: "/challenges", label: "Challenges", Icon: Puzzle },
    { href: "/reasoning", label: "Reasoning Lab", Icon: Brain },
    { href: "/defense", label: "Project Defense", Icon: ShieldCheck },
    { href: "/interviewer", label: "AI Interviewer", Icon: Mic },
  ] },
  { label: "Build", items: [
    { href: "/interpret", label: "Interpretation", Icon: ScanSearch },
    { href: "/github", label: "GitHub Intelligence", Icon: Github },
  ] },
  { label: "Learn", items: [
    { href: "/resources", label: "Resources", Icon: Library },
    { href: "/roadmap", label: "Roadmap", Icon: Map },
  ] },
  { label: "Career", items: [
    { href: "/career", label: "Career Intelligence", Icon: Briefcase },
    { href: "/jobs", label: "Jobs / Opportunities", Icon: Building2 },
  ] },
    { label: "Insights", items: [
    { href: "/skill-dna", label: "Skill DNA", Icon: Fingerprint },
    { href: "/growth", label: "Proof of Growth", Icon: TrendingUp },
  ] },
  { label: "Account", items: [
    { href: "/profile", label: "Profile", Icon: User },
    // { href: "/notifications", label: "Notifications", Icon: Bell },
    { href: "/settings", label: "Settings", Icon: Settings },
  ] },
];

export default function Shell({ children }) {
  const { user, loading, signOut } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);            // mobile drawer
  const [collapsed, setCollapsed] = useState(false);  // desktop sidebar hidden

  // Hooks must stay above every early return below.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("sidebar") === "closed"); } catch {}
  }, []);

  function toggleSidebar() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem("sidebar", next ? "closed" : "open"); } catch {}
      return next;
    });
  }

    const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user || user.demo) { setProfile(null); return; }
    let on = true;
    const load = () => api("/profile").then((p) => on && setProfile(p)).catch(() => {});
    load();
    window.addEventListener("profile-updated", load);     // refresh when the Profile page saves
    return () => { on = false; window.removeEventListener("profile-updated", load); };
  }, [user]);

  if (loading) return <BrandLoader label="Checking your session" />;

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
  // const label = user.demo ? "Demo Learner" : user.email;
  const display = user.demo
  ? "Demo Learner"
  : (profile?.name?.trim() || user.meta?.name || (user.email || "").split("@")[0] || "Learner");
  const role = user.demo ? null : profile?.target_role;

  return (
    <div className={`shell ${collapsed ? "collapsed" : ""}`}>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <aside className={`side ${open ? "open" : ""}`} aria-label="Main navigation">
        <div style={{ padding: "8px 8px 12px" }}><Logo /></div>
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="sgroup">{g.label}</div>
            {g.items.map(({ href, label: l, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={path === href ? "active" : ""}
                aria-current={path === href ? "page" : undefined}
              >
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
          <button
            className="btn icon collapse-btn"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
          </button>
          {collapsed && <Logo height={40} />}

          <button
            className="btn icon menu-btn"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="spacer" />
          <NotificationBell />
          <ThemeToggle />
          <div className="row" style={{ gap: 10 }}>
            {/* <div className="avatar" aria-hidden>{label[0].toUpperCase()}</div>
            <div className="who">
              <strong>{label}</strong><br />
              <small>{user.demo ? "Demo mode · local data" : "Signed in"}</small>
            </div> */}
            <div className="userchip" title={user.email || "Demo account"}>
            <div className="avatar-ring" aria-hidden>
              <div className="avatar">{display[0].toUpperCase()}</div>
              <span className="online-dot" />
            </div>
            <div className="who">
              <strong>{display}</strong>
              <span className="rolepill">{user.demo ? "Demo mode" : role || "Signed in"}</span>
            </div>
          </div>
          </div>
        </header>

        <main className="main">
          {user.demo && (
            <div className="demo-banner" role="note">
              <strong>Demo mode:</strong> data lives in memory on the server and resets when it restarts. Nothing is saved to a real account.
            </div>
          )}
          {children}
        </main>
      </div>

      <CoachButton />
    </div>
  );
}