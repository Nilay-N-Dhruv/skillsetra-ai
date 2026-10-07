"use client";
import { useState } from "react";

export default function Logo({ height = 34 }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <span className="wordmark">SkillSetra</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="SkillSetra" style={{ height, width: "auto" }} onError={() => setBroken(true)} />;
}