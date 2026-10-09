import Logo from "./Logo";

export default function BrandLoader({ label = "Loading SkillSetra" }) {
  return (
    <div className="loader-screen" role="status" aria-live="polite" aria-label={label}>
      <div className="loader-inner">
        <div className="loader-stage">
          <span className="loader-glow" aria-hidden />
          <span className="loader-orbit o1" aria-hidden><i /></span>
          <span className="loader-orbit o2" aria-hidden><i /></span>
          <span className="loader-ring" aria-hidden />
          <div className="loader-mark"><div className="loader-float"><Logo height={76} /></div></div>
        </div>
        <div className="loader-bar" aria-hidden><i /></div>
        <p className="loader-text">{label}<span className="dots" aria-hidden><b>.</b><b>.</b><b>.</b></span></p>
      </div>
    </div>
  );
}