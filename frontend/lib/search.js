// Pages and features that the header search can jump to.
export const PAGES = [
  { label: "Dashboard", href: "/dashboard", group: "Workspace", words: "home overview progress baseline gaps" },
  { label: "Assessment", href: "/assessment", group: "Test", words: "exam test questions quiz baseline retest" },
  { label: "Challenges", href: "/challenges", group: "Test", words: "practice coding debugging problems hint" },
  { label: "Reasoning Lab", href: "/reasoning", group: "Test", words: "thinking causes trade-offs assumptions" },
  { label: "Project Defense", href: "/defense", group: "Test", words: "explain decisions architecture" },
  { label: "AI Interviewer", href: "/interviewer", group: "Test", words: "interview mock questions practice" },
  { label: "What-If Machine", href: "/whatif", group: "Test", words: "scenario change adapt scale outage" },
  { label: "Skill DNA", href: "/skill-dna", group: "Insights", words: "fingerprint patterns strengths debugging testing" },
  { label: "Proof of Growth", href: "/growth", group: "Insights", words: "improvement before after report progress" },
  { label: "Evidence Graph", href: "/evidence-graph", group: "Insights", words: "skills evidence sources outdated" },
  { label: "Proof Passport", href: "/passport", group: "Insights", words: "share public portfolio link publish" },
  { label: "Opportunity Radar", href: "/opportunity-radar", group: "Career", words: "recommend roles expert strongest backend frontend data devops" },
  { label: "Job Reality Check", href: "/job-check", group: "Career", words: "job description compare requirements match" },
  { label: "Career Intelligence", href: "/career", group: "Career", words: "role skills evidence groups" },
  { label: "Career Time Machine", href: "/time-machine", group: "Career", words: "change role compare switch" },
  { label: "Jobs / Opportunities", href: "/jobs", group: "Career", words: "listings openings remote saved" },
  { label: "Interpretation", href: "/interpret", group: "Build", words: "requirements errors notes explain" },
  { label: "GitHub Intelligence", href: "/github", group: "Build", words: "repository repo analyze code" },
  { label: "Resources", href: "/resources", group: "Learn", words: "docs links courses videos" },
  { label: "Roadmap", href: "/roadmap", group: "Learn", words: "learning path steps progress" },
  { label: "Competencies", href: "/competencies", group: "Workspace", words: "skills states" },
  { label: "Evidence timeline", href: "/evidence", group: "Workspace", words: "history results dates" },
  { label: "Profile", href: "/profile", group: "Account", words: "photo resume bio skills" },
  { label: "Notifications", href: "/notifications", group: "Account", words: "alerts unread preferences" },
  { label: "Settings", href: "/settings", group: "Account", words: "theme privacy delete account puter ai" },
];

export function searchPages(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return PAGES.slice(0, 6);
  const scored = [];
  for (const p of PAGES) {
    const label = p.label.toLowerCase();
    const parts = label.split(/[\s/]+/);
    const words = p.words.split(" ");
    let s = 0;
    if (label === q) s = 6;
    else if (label.startsWith(q)) s = 5;
    else if (parts.some((w) => w.startsWith(q))) s = 4;
    else if (label.includes(q)) s = 3;
    else if (words.some((w) => w.startsWith(q))) s = 2;
    else if (p.words.includes(q)) s = 1;
    if (s) scored.push([s, p]);
  }
  return scored.sort((a, b) => b[0] - a[0] || a[1].label.localeCompare(b[1].label)).slice(0, 6).map((x) => x[1]);
}