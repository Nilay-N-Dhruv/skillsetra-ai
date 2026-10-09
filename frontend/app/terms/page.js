import Link from "next/link";
import PublicNav from "@/components/PublicNav";

const SECTIONS = [
  ["Using SkillSetra", "SkillSetra is a learning and skills-evidence tool. You agree to use it lawfully and not to attack, overload or reverse-engineer it, and not to submit content you have no right to share."],
  ["Your content", "You keep ownership of what you submit. You allow SkillSetra to process it to give you feedback, build your evidence timeline and show it to you. Delete it any time from Settings."],
  ["AI-generated feedback", "Feedback is produced by AI models and automatic checks and can be wrong. It is guidance, not a certification, a grade or a hiring recommendation. Results labelled as browser AI or demo fallback carry lower trust."],
  ["Self-reported information", "Skills you claim are stored as unverified evidence and are shown as such."],
  ["Third-party services", "SkillSetra relies on services such as Supabase (accounts and data), Puter (AI), GitHub (public repository data) and Remotive (job listings). Their own terms and privacy policies apply to their parts of the service."],
  ["Job listings", "Listings come from a third party. SkillSetra does not guarantee that a listing is accurate, current or available, and does not take part in any application."],
  ["Availability and changes", "The service is provided as is, may change or pause, and these terms may be updated. Continued use means you accept the updated terms."],
  ["Contact", "[Add your contact email here before publishing.]"],
];

export default function Terms() {
  return (
    <>
      <PublicNav />
      <main className="container" style={{ padding: "48px 20px", maxWidth: 760 }}>
        <p className="eyebrow">Terms</p><h1>Terms of use</h1>
        <div className="demo-banner" role="note">Draft for legal review. These terms describe how the app works; they are not legal advice and have not been reviewed by a lawyer.</div>
        {SECTIONS.map(([t, d]) => <section key={t}><h3>{t}</h3><p className="muted">{d}</p></section>)}
        <p className="small muted">See also our <Link href="/privacy">privacy notice</Link>.</p>
      </main>
    </>
  );
}