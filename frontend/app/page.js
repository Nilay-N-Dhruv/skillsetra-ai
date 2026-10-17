
import Link from "next/link";
import {
  ClipboardCheck,
  BarChart3,
  RefreshCw,
  History,
  Map,
  ShieldCheck,
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import Logo from "@/components/Logo";

const FEATURES = [
  [
    ClipboardCheck,
    "Role assessment",
    "Choose a role and answer applied questions that test reasoning, debugging and transfer, not just definitions.",
  ],
  [
    BarChart3,
    "Evidence dashboard",
    "See your baseline, gaps and skills in graphs. Every state is explained and backed by evidence.",
  ],
  [
    RefreshCw,
    "Re-test and grow",
    "Re-test the same role, one skill, or a different role. New evidence updates your dashboard.",
  ],
  [
    History,
    "Evidence timeline",
    "Every result is saved with its date, source and confidence, so you can track your progress.",
  ],
  [
    Map,
    "Personal roadmap",
    "Find learning resources for each gap, along with project tasks and evidence to build.",
  ],
  [
    ShieldCheck,
    "Private by design",
    "Sign in to protect your data. You can manage and delete it from Settings.",
  ],
];

const DIMENSIONS = [
  { name: "Knowledge", value: 3.0, x: 260, y: 66, anchor: "middle" },
  { name: "Application", value: 2.5, x: 354, y: 105, anchor: "start" },
  { name: "Problem Solving", value: 2.2, x: 400, y: 176, anchor: "start" },
  { name: "Debugging", value: 1.5, x: 400, y: 258, anchor: "start" },
  { name: "Reasoning", value: 2.1, x: 354, y: 330, anchor: "start" },
  { name: "Adaptation", value: 0.7, x: 260, y: 370, anchor: "middle" },
  { name: "Transfer", value: 0.8, x: 166, y: 330, anchor: "end" },
  { name: "Testing", value: 1.2, x: 120, y: 258, anchor: "end" },
  { name: "Engineering", value: 2.0, x: 120, y: 176, anchor: "end" },
  { name: "Deployment", value: 1.0, x: 166, y: 105, anchor: "end" },
  { name: "Security", value: 1.6, x: 213, y: 78, anchor: "end" },
];

function DemoGraph() {
  const cx = 260;
  const cy = 215;
  const radius = 125;
  const count = DIMENSIONS.length;

  function point(index, distance) {
    // Start at the top and spread dimensions evenly around the circle.
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;

    return {
      x: cx + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance,
    };
  }

  function polygonForLevel(level) {
    return DIMENSIONS.map((_, index) => {
      const p = point(index, (radius * level) / 3);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  const profilePoints = DIMENSIONS.map((dimension, index) => {
    const p = point(index, (radius * dimension.value) / 3);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg
      className="homepage-demo-graph"
      viewBox="0 0 520 410"
      role="img"
      aria-label="Illustrative competency radar showing example scores across eleven skill dimensions"
    >
      {/* Radar grid */}
      {[1, 2, 3].map((level) => (
        <polygon
          key={level}
          points={polygonForLevel(level)}
          className="demo-grid-ring"
        />
      ))}

      {/* Axis lines */}
      {DIMENSIONS.map((dimension, index) => {
        const p = point(index, radius);

        return (
          <line
            key={dimension.name}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            className="demo-grid-axis"
          />
        );
      })}

      {/* Example competency profile */}
      <polygon points={profilePoints} className="demo-profile-area" />

      <polygon
        points={profilePoints}
        className="demo-profile-line"
      />

      {/* Data points */}
      {DIMENSIONS.map((dimension, index) => {
        const p = point(index, (radius * dimension.value) / 3);

        return (
          <circle
            key={dimension.name}
            cx={p.x}
            cy={p.y}
            r="4.5"
            className="demo-profile-point"
          />
        );
      })}

      {/* Labels */}
      {DIMENSIONS.map((dimension) => (
        <text
          key={dimension.name}
          x={dimension.x}
          y={dimension.y}
          textAnchor={dimension.anchor}
          className="demo-graph-label"
        >
          {dimension.name}
        </text>
      ))}
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <PublicNav />

      <main>
        <section className="hero homepage-hero">
          <div className="container homepage-hero-container">
            <div className="homepage-hero-grid">
              <div className="homepage-hero-copy">
                <p className="eyebrow">Competency intelligence</p>

                <h1>
                  Know It. Apply It.
                  <br />
                  Prove It.
                </h1>

                <p className="homepage-hero-description">
                  SkillSetra finds out what you know, analyses what you build,
                  tests what you can actually do, and shows you what to learn
                  and build next.
                </p>

                <div className="homepage-hero-actions">
                  <Link className="btn primary" href="/signup">
                    Discover my competencies
                  </Link>

                  {/* <a className="btn" href="#features">
                    See how it works
                  </a> */}
                </div>
              </div>

              <div className="homepage-graph-wrap">
                <DemoGraph />
                <p className="homepage-graph-caption">
                  Illustrative profile. The centre means “no evidence yet,”
                  not “weak.”
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="block">
          <div className="container">
            <h2>Finished the course. Can you apply it?</h2>

            <div className="strip">
              {["Certificates", "Courses", "Grades", "Projects", "GitHub"].map(
                (item) => (
                  <span className="chip" key={item}>
                    {item}
                  </span>
                )
              )}
            </div>

            <p>
              These show activity. They rarely show whether you can solve an
              unfamiliar problem, fix broken code or defend a decision. That is
              the knowledge-to-competency gap, and SkillSetra is built to close
              it.
            </p>
          </div>
        </section>

        <section className="block" id="features">
          <div className="container">
            <h2>What you get</h2>

            <div className="grid g3">
              {FEATURES.map(([Icon, title, description]) => (
                <div className="card" key={title}>
                  <Icon size={22} color="var(--teal)" aria-hidden="true" />

                  <h3 style={{ marginTop: 10 }}>{title}</h3>

                  <p className="muted" style={{ margin: 0 }}>
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="block alt" id="privacy">
          <div className="container">
            <h2>Your journey is private</h2>

            <p>
              Browsing this site needs no account. Your dashboard, assessments
              and roadmap require you to sign in, and are only visible to you.
              Your answers are graded on the server, and self-reported skills
              are always labelled as unverified. You can delete your learning
              data from Settings.
            </p>

            <Link className="btn primary" href="/signup">
              Start with SkillSetra
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div>
            <Logo height={26} />
            <p className="small muted" style={{ margin: "6px 0 0" }}>
              Know It. Apply It. Prove It.
            </p>
          </div>

          <nav className="row small" aria-label="Footer">
            <a href="#features">How it works</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
