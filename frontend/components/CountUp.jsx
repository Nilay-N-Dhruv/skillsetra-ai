"use client";
import { useEffect, useState } from "react";

export default function CountUp({ to, duration = 900, suffix = "" }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    let raf, start;
    const tick = (t) => {
      start = start ?? t;
      const p = Math.min((t - start) / duration, 1);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));      // slows down toward the end
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{v}{suffix}</>;
}