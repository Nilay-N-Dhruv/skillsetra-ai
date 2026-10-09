import Link from "next/link";
import PublicNav from "@/components/PublicNav";

export default function Privacy() {
  return (
    <>
      <PublicNav />
      <main className="container" style={{ padding: "48px 20px", maxWidth: 760 }}>
        <p className="eyebrow">Privacy</p><h1>Your data, in plain words</h1>
        <h3>What we store</h3><p className="muted">Your name, email, date of birth, role and goals from sign-up, plus your assessment answers, challenge submissions and the evidence created from them.</p>
        <h3>Who can see it</h3><p className="muted">Only you. Every request is checked against your sign-in, and the database also enforces that you can read only your own rows.</p>
        <h3>How AI is used</h3><p className="muted">Your written answers are sent to the AI model configured on the server to produce feedback. Every AI result is labelled, and AI feedback is one input to your profile, never the final word. If the AI is offline, a clearly labelled fallback is shown instead.</p>
        <h3>Self-reported skills</h3><p className="muted">A skill you claim is stored as limited, unverified evidence. It cannot replace verified results.</p>
        <h3>Deleting your data</h3><p className="muted">Open Settings and choose "Delete my learning data" to remove your assessments, results and evidence.</p>
        <Link className="btn primary" href="/signup">Create an account</Link>
      </main>
    </>
  );
}