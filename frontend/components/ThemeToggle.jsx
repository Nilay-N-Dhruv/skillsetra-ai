// "use client";
// import { useEffect, useState } from "react";
// import { Moon, Sun } from "lucide-react";

// export default function ThemeToggle() {
//   const [theme, setTheme] = useState("dark");
//   useEffect(() => setTheme(document.documentElement.dataset.theme || "dark"), []);
//   function toggle() {
//     const t = theme === "dark" ? "light" : "dark";
//     document.documentElement.dataset.theme = t;
//     try { localStorage.setItem("theme", t); } catch {}
//     setTheme(t);
//   }
//   return (
//     <button className="btn icon" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
//       {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
//     </button>
//   );
// }

"use client";

import { useEffect } from "react";

export default function ThemeToggle() {
  useEffect(() => {
    // Always use the light theme.
    document.documentElement.dataset.theme = "light";

    try {
      localStorage.setItem("theme", "light");
    } catch {
      // Continue even when localStorage is unavailable.
    }
  }, []);

  // No toggle button is rendered.
  return null;
}