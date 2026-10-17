
// "use client";

// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import {
//   LayoutDashboard,
//   ClipboardCheck,
//   Puzzle,
//   Brain,
//   ShieldCheck,
//   Mic,
//   Github,
//   Library,
//   Map,
//   Building2,
//   User,
//   Settings,
//   LogOut,
//   Menu,
//   X,
//   Lock,
//   PanelLeftClose,
//   PanelLeftOpen,
//   Network,
//   Radar,
//   FileSearch,
//   ChartNoAxesCombined,
// } from "lucide-react";
// import { useAuth } from "./AuthProvider";
// import Logo from "./Logo";
// import ThemeToggle from "./ThemeToggle";
// import BrandLoader from "./BrandLoader";
// import NotificationBell from "./NotificationBell";
// import CoachButton from "./CoachButton";
// import { api } from "@/lib/api";
// import { signedUrl } from "@/lib/storage";
// import HeaderSearch from "./HeaderSearch";

// const GROUPS = [
//   {
//     label: "Workspace",
//     items: [
//       { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
//     ],
//   },
//   {
//     label: "Test / Prove",
//     items: [
//       { href: "/assessment", label: "Assessment", Icon: ClipboardCheck },
//       { href: "/challenges", label: "Challenges", Icon: Puzzle },
//       { href: "/reasoning", label: "Reasoning Lab", Icon: Brain },
//       { href: "/defense", label: "Project Defense", Icon: ShieldCheck },
//       { href: "/interviewer", label: "AI Interviewer", Icon: Mic },
//     ],
//   },
//   {
//     label: "Build",
//     items: [
//       { href: "/github", label: "GitHub Intelligence", Icon: Github },
//     ],
//   },
//   {
//     label: "Learn",
//     items: [
//       { href: "/resources", label: "Resources", Icon: Library },
//       { href: "/roadmap", label: "Roadmap", Icon: Map },
//     ],
//   },
//   {
//     label: "Insights",
//     items: [
//       { href: "/analytics", label: "Analytics", Icon: ChartNoAxesCombined },
//       { href: "/evidence-graph", label: "Evidence Graph", Icon: Network },
//     ],
//   },
//   {
//     label: "Career",
//     items: [
//       { href: "/jobs", label: "Jobs / Opportunities", Icon: Building2 },
//       { href: "/opportunity-radar", label: "Opportunity Radar", Icon: Radar },
//       { href: "/job-check", label: "Job Reality Check", Icon: FileSearch },
//     ],
//   },
//   {
//     label: "Account",
//     items: [
//       { href: "/profile", label: "Profile", Icon: User },
//       { href: "/settings", label: "Settings", Icon: Settings },
//     ],
//   },
// ];

// export default function Shell({ children }) {
//   const { user, loading, signOut } = useAuth();
//   const path = usePathname();
//   const router = useRouter();

//   const [open, setOpen] = useState(false);
//   const [collapsed, setCollapsed] = useState(false);
//   const [profile, setProfile] = useState(null);
//   const [avatarUrl, setAvatarUrl] = useState(null);

//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === "Escape") setOpen(false);
//     };

//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, []);

//   useEffect(() => {
//     try {
//       setCollapsed(localStorage.getItem("sidebar") === "closed");
//     } catch {}
//   }, []);

//   function toggleSidebar() {
//     setCollapsed((c) => {
//       const next = !c;

//       try {
//         localStorage.setItem("sidebar", next ? "closed" : "open");
//       } catch {}

//       return next;
//     });
//   }

//   useEffect(() => {
//     if (!user || user.demo) {
//       setProfile(null);
//       setAvatarUrl(null);
//       return;
//     }

//     let on = true;

//     const load = async () => {
//       try {
//         const details = await api("/profile/details");
//         if (!on) return;

//         setProfile(details);

//         if (details.avatar_path) {
//           try {
//             setAvatarUrl(
//               await signedUrl("avatars", details.avatar_path)
//             );
//           } catch {
//             setAvatarUrl(null);
//           }
//         } else {
//           setAvatarUrl(null);
//         }
//       } catch {}
//     };

//     load();
//     window.addEventListener("profile-updated", load);

//     return () => {
//       on = false;
//       window.removeEventListener("profile-updated", load);
//     };
//   }, [user]);

//   if (loading) {
//     return <BrandLoader label="Checking your session" />;
//   }

//   if (!user) {
//     return (
//       <div className="authwrap">
//         <div
//           className="card authcard"
//           style={{ textAlign: "center" }}
//         >
//           <Lock aria-hidden size={28} color="var(--teal)" />

//           <h2 style={{ marginTop: 10 }}>
//             Sign in to unlock SkillSetra
//           </h2>

//           <p style={{ margin: "0 auto 18px" }}>
//             Your competency journey is private to your account. Sign in
//             or create your free account to continue.
//           </p>

//           <div className="row" style={{ justifyContent: "center" }}>
//             <Link className="btn primary" href="/login">
//               Sign in
//             </Link>

//             <Link className="btn" href="/signup">
//               Create account
//             </Link>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const out = async () => {
//     await signOut();
//     router.push("/");
//   };

//   const display = user.demo
//     ? "Demo Learner"
//     : profile?.name?.trim() ||
//       user.meta?.name ||
//       (user.email || "").split("@")[0] ||
//       "Learner";

//   const role = user.demo ? null : profile?.target_role;

//   return (
//     <div className={`shell ${collapsed ? "collapsed" : ""}`}>
//       {open && (
//         <div className="scrim" onClick={() => setOpen(false)} />
//       )}

//       <aside
//         className={`side ${open ? "open" : ""}`}
//         aria-label="Main navigation"
//       >
//         <div style={{ padding: "8px 8px 12px" }}>
//           <Logo />
//         </div>

//         {GROUPS.map((g) => (
//           <div key={g.label}>
//             <div className="sgroup">{g.label}</div>

//             {g.items.map(({ href, label: l, Icon }) => {
//               const isActive =
//                 path === href || path.startsWith(`${href}/`);

//               return (
//                 <Link
//                   key={href}
//                   href={href}
//                   onClick={() => setOpen(false)}
//                   className={isActive ? "active" : ""}
//                   aria-current={isActive ? "page" : undefined}
//                   title={collapsed ? l : undefined}
//                 >
//                   <Icon size={18} aria-hidden />
//                   {l}
//                 </Link>
//               );
//             })}
//           </div>
//         ))}

//         <div style={{ flex: 1 }} />

//         <button className="nav" onClick={out}>
//           <LogOut size={18} aria-hidden />
//           Sign out
//         </button>
//       </aside>

//       <div className="content">
//         <header className="apptop">
//           <button
//             className="btn icon collapse-btn"
//             onClick={toggleSidebar}
//             aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
//             aria-expanded={!collapsed}
//             title={collapsed ? "Show sidebar" : "Hide sidebar"}
//           >
//             {collapsed ? (
//               <PanelLeftOpen size={18} aria-hidden />
//             ) : (
//               <PanelLeftClose size={18} aria-hidden />
//             )}
//           </button>

//           {collapsed && <Logo height={40} />}

//           <button
//             className="btn icon menu-btn"
//             aria-label={open ? "Close menu" : "Open menu"}
//             aria-expanded={open}
//             onClick={() => setOpen(!open)}
//           >
//             {open ? <X size={18} /> : <Menu size={18} />}
//           </button>

//           <div className="spacer" />

//           <HeaderSearch />
//           <NotificationBell />
//           <ThemeToggle />

//           <div className="row" style={{ gap: 10 }}>
//             <div
//               className="userchip"
//               title={user.email || "Demo account"}
//             >
//               <div className="avatar-ring" aria-hidden>
//                 {avatarUrl ? (
//                   <img
//                     className="avatar"
//                     src={avatarUrl}
//                     alt=""
//                     loading="lazy"
//                     onError={() => setAvatarUrl(null)}
//                     style={{ objectFit: "cover" }}
//                   />
//                 ) : (
//                   <div className="avatar">
//                     {display[0].toUpperCase()}
//                   </div>
//                 )}

//                 <span className="online-dot" />
//               </div>

//               <div className="who">
//                 <strong>{display}</strong>
//                 <span className="rolepill">
//                   {user.demo ? "Demo mode" : role || "Signed in"}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </header>

//         <main className="main">
//           {user.demo && (
//             <div className="demo-banner" role="note">
//               <strong>Demo mode:</strong> data lives in memory on the
//               server and resets when it restarts. Nothing is saved to a
//               real account.
//             </div>
//           )}

//           {children}
//         </main>
//       </div>

//       <CoachButton />
//     </div>
//   );
// }



"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ClipboardCheck,
  Puzzle,
  Brain,
  ShieldCheck,
  Mic,
  Github,
  Library,
  Map,
  Building2,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Network,
  Radar,
  FileSearch,
  ChartNoAxesCombined,
} from "lucide-react";

import { useAuth } from "./AuthProvider";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import BrandLoader from "./BrandLoader";
import NotificationBell from "./NotificationBell";
import CoachButton from "./CoachButton";
import { api } from "@/lib/api";
import { signedUrl } from "@/lib/storage";
import HeaderSearch from "./HeaderSearch";

const GROUPS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    ],
  },
  {
    label: "Test / Prove",
    items: [
      { href: "/assessment", label: "Assessment", Icon: ClipboardCheck },
      { href: "/challenges", label: "Challenges", Icon: Puzzle },
      { href: "/reasoning", label: "Reasoning Lab", Icon: Brain },
      { href: "/defense", label: "Project Defense", Icon: ShieldCheck },
      { href: "/interviewer", label: "AI Interviewer", Icon: Mic },
    ],
  },
  {
    label: "Build",
    items: [
      { href: "/github", label: "GitHub Intelligence", Icon: Github },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/resources", label: "Resources", Icon: Library },
      { href: "/roadmap", label: "Roadmap", Icon: Map },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/analytics",label: "Analytics",Icon: ChartNoAxesCombined},
      { href: "/evidence-graph", label: "Evidence Graph", Icon: Network },
    ],
  },
  {
    label: "Career",
    items: [
      { href: "/jobs", label: "Jobs / Opportunities", Icon: Building2 },
      { href: "/opportunity-radar", label: "Opportunity Radar", Icon: Radar },
      { href: "/job-check", label: "Job Reality Check", Icon: FileSearch },
    ],
  },
  {
    label: "other",
    items: [
      // { href: "/profile", label: "Profile", Icon: User },
      { href: "/settings", label: "Settings", Icon: Settings },
    ],
  },
];

export default function Shell({ children }) {
  const { user, loading, signOut } = useAuth();
  const path = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar") === "closed");
    } catch {}
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;

      try {
        localStorage.setItem("sidebar", next ? "closed" : "open");
      } catch {}

      return next;
    });
  }

  useEffect(() => {
    if (!user || user.demo) {
      setProfile(null);
      setAvatarUrl(null);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const details = await api("/profile/details");

        if (!active) return;

        setProfile(details);

        if (details.avatar_path) {
          try {
            const url = await signedUrl(
              "avatars",
              details.avatar_path
            );

            if (active) setAvatarUrl(url);
          } catch {
            if (active) setAvatarUrl(null);
          }
        } else {
          setAvatarUrl(null);
        }
      } catch {}
    };

    load();

    window.addEventListener("profile-updated", load);

    return () => {
      active = false;
      window.removeEventListener("profile-updated", load);
    };
  }, [user]);

  if (loading) {
    return <BrandLoader label="Checking your session" />;
  }

  if (!user) {
    return (
      <div className="authwrap">
        <div
          className="card authcard"
          style={{ textAlign: "center" }}
        >
          <Lock aria-hidden size={28} color="var(--teal)" />

          <h2 style={{ marginTop: 10 }}>
            Sign in to unlock SkillSetra
          </h2>

          <p style={{ margin: "0 auto 18px" }}>
            Your competency journey is private to your account. Sign in
            or create your free account to continue.
          </p>

          <div className="row" style={{ justifyContent: "center" }}>
            <Link className="btn primary" href="/login">
              Sign in
            </Link>

            <Link className="btn" href="/signup">
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const out = async () => {
    await signOut();
    router.push("/");
  };

  const display = user.demo
    ? "Demo Learner"
    : profile?.name?.trim() ||
      user.meta?.name ||
      (user.email || "").split("@")[0] ||
      "Learner";

  const role = user.demo ? null : profile?.target_role;

  return (
    <div className={`shell ${collapsed ? "collapsed" : ""}`}>
      {open && (
        <div
          className="scrim"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`side ${open ? "open" : ""}`}
        aria-label="Main navigation"
      >
        <div style={{ padding: "8px 8px 12px" }}>
          <Logo />
        </div>

        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="sgroup">{group.label}</div>

            {group.items.map(({ href, label, Icon }) => {
              const isActive =
                path === href || path.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={isActive ? "active" : ""}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        <button className="nav" onClick={out} type="button">
          <LogOut size={18} aria-hidden />
          Sign out
        </button>
      </aside>

      <div className="content">
        <header className="apptop">
          <button
            className="btn icon collapse-btn"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Show sidebar" : "Hide sidebar"}
            type="button"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} aria-hidden />
            ) : (
              <PanelLeftClose size={18} aria-hidden />
            )}
          </button>

          {collapsed && <Logo height={40} />}

          <button
            className="btn icon menu-btn"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            {open ? (
              <X size={18} aria-hidden />
            ) : (
              <Menu size={18} aria-hidden />
            )}
          </button>

          <div className="spacer" />

          <HeaderSearch />
          <NotificationBell />
          <ThemeToggle />

          <div className="row" style={{ gap: 10 }}>
            <Link
              href="/profile"
              className="userchip profile-link"
              title="View your profile"
              aria-label={`View profile for ${display}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <div className="avatar-ring" aria-hidden>
                {avatarUrl ? (
                  <img
                    className="avatar"
                    src={avatarUrl}
                    alt=""
                    loading="lazy"
                    onError={() => setAvatarUrl(null)}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="avatar">
                    {display[0].toUpperCase()}
                  </div>
                )}

                <span className="online-dot" />
              </div>

              <div className="who">
                <strong>{display}</strong>

                <span className="rolepill">
                  {user.demo ? "Demo mode" : role || "Signed in"}
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main className="main">
          {user.demo && (
            <div className="demo-banner" role="note">
              <strong>Demo mode:</strong> data lives in memory on the
              server and resets when it restarts. Nothing is saved to a
              real account.
            </div>
          )}

          {children}
        </main>
      </div>

      <CoachButton />

      <style jsx>{`
        .profile-link {
          border-radius: 12px;
          transition:
            background-color 0.2s ease,
            opacity 0.2s ease;
        }

        .profile-link:hover {
          background: var(--line, rgba(13, 148, 136, 0.08));
        }

        .profile-link:focus-visible {
          outline: 2px solid var(--teal);
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
}
