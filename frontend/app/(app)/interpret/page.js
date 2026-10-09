import LabPage from "@/components/LabPage";
export default function Interpret() {
  return <LabPage mode="interpretation" eyebrow="Interpretation engine" title="Turn dense technical material into a decision map."
    blurb="Paste requirements, an error message or architecture notes. SkillSetra separates facts from inference and uncertainty. This tool needs the live AI."
    label="Technical material" placeholder="Paste technical material here…" button="Interpret" />;
}