import Link from "next/link";
import { ClipboardCheck, BarChart3, RefreshCw, History, Map, ShieldCheck } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import Logo from "@/components/Logo";
import Radar from "@/components/Radar";

const SAMPLE = [["Knowledge", 3], ["Application", 2.5], ["Problem Solving", 2], ["Debugging", 1.5], ["Reasoning", 2], ["Adaptation", 0.4],
  ["Transfer", 0.6], ["Testing", 1], ["Engineering", 2], ["Deployment", 1], ["Security", 1.4]].map(([key, avg_level]) => ({ key, avg_level }));
const LOOP = ["Assess", "Analyze", "Identify", "Improve", "Build", "Prove", "Update"];
const FEATURES = [
  [ClipboardCheck, "Role assessment", "Choose a role and answer applied questions that test reasoning, debugging and transfer, not just definitions."],
  [BarChart3, "Evidence dashboard", "See your baseline, gaps and skills in graphs. Every state is explained and backed by evidence."],
  [RefreshCw, "Re-test and grow", "Re-test the same role, one skill, or a different role. New evidence updates your dashboard."],
  [History, "Evidence timeline", "Every result is saved with its date, source and confidence, so you can see why a conclusion was made."],
  [Map, "Personal roadmap", "Verified documentation and courses for each gap, with a project task and the evidence you need."],
  [ShieldCheck, "Private by design", "Sign-in protects your data. You can delete it any time from Settings."],
];

export default function Home() {
  return (
    <>
      <PublicNav />
      <main>
        <section className="hero"><div className="container">
          <div className="hero-in">
            <p className="eyebrow">Competency intelligence</p>
            <h1>Know It. Apply It. Prove It.</h1>
            <p style={{ fontSize: "1.15rem" }}>SkillSetra discovers what you know, analyzes what you build, tests what you can actually do, and creates the next path to grow your real-world competency.</p>
            <div className="row">
              <Link className="btn primary" href="/signup">Discover my competencies</Link>
              <a className="btn" href="#how">See how it works</a>
            </div>
          </div>
          <div><Radar items={SAMPLE} /><p className="small muted" style={{ textAlign: "center" }}>Illustrative profile. The centre means "no evidence yet", not "weak".</p></div>
        </div></section>

        <section className="block"><div className="container">
          <h2>Finished the course. Can you apply it?</h2>
          <div className="strip">{["Certificates", "Courses", "Grades", "Projects", "GitHub"].map((c) => <span className="chip" key={c}>{c}</span>)}</div>
          <p>These show activity. They rarely show whether you can solve an unfamiliar problem, fix broken code or defend a decision. That is the knowledge-to-competency gap, and SkillSetra is built to close it.</p>
        </div></section>

        <section className="block alt" id="how"><div className="container">
          <h2>One loop, always moving forward</h2>
          <ol className="loop">{LOOP.map((s) => <li key={s}>{s}</li>)}</ol>
          <p style={{ marginTop: 16 }}>Each new piece of evidence changes your profile and what you should do next.</p>
        </div></section>

        <section className="block" id="features"><div className="container">
          <h2>What you get</h2>
          <div className="grid g3">{FEATURES.map(([Icon, t, d]) => (
            <div className="card" key={t}><Icon size={22} color="var(--teal)" aria-hidden /><h3 style={{ marginTop: 10 }}>{t}</h3><p className="muted" style={{ margin: 0 }}>{d}</p></div>
          ))}</div>
        </div></section>

        <section className="block alt" id="privacy"><div className="container">
          <h2>Your journey is private</h2>
          <p>Browsing this site needs no account. Your dashboard, assessments and roadmap require you to sign in, and are only visible to you. Your answers are graded on the server, and self-reported skills are always labelled as unverified. You can delete your learning data any time from Settings.</p>
          <Link className="btn primary" href="/signup">Start with SkillSetra</Link>
        </div></section>
      </main>
      <footer className="footer"><div className="container">
        <div><Logo height={26} /><p className="small muted" style={{ margin: "6px 0 0" }}>Know It. Apply It. Prove It.</p></div>
        <nav className="row small" aria-label="Footer">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div></footer>
    </>
  );
}