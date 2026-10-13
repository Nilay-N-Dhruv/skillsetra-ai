"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { searchPages } from "@/lib/search";

const GROUPS = { skills: "Skills", interviews: "Interview sessions", assessments: "Assessments", jobs: "Saved job analyses", careers: "Career paths" };

export default function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [found, setFound] = useState({});
  const [active, setActive] = useState(0);
  const box = useRef(null);
  const input = useRef(null);

  const items = useMemo(() => {
    const list = searchPages(q).map((p) => ({ group: "Pages", label: p.label, hint: p.group, href: p.href }));
    for (const [key, title] of Object.entries(GROUPS)) for (const r of found[key] || []) list.push({ group: title, ...r });
    return list;
  }, [q, found]);

  useEffect(() => setActive(0), [q, found]);

  useEffect(() => {                                      // debounced request to the backend
    const term = q.trim();
    if (term.length < 2 || !/^[\w .+#/-]+$/.test(term)) { setFound({}); return; }
    let live = true;
    const t = setTimeout(() => {
      api(`/search?q=${encodeURIComponent(term)}`).then((d) => live && setFound(d)).catch(() => live && setFound({}));
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  useEffect(() => {
    const onKey = (e) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); setOpen(true); }
      else if (e.key === "/" && !typing) { e.preventDefault(); input.current?.focus(); setOpen(true); }
    };
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, []);

  function go(item) {
    router.push(item.href);
    setQ(""); setFound({}); setOpen(false); input.current?.blur();
  }
  function onKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && open && items[active]) { e.preventDefault(); go(items[active]); }
    else if (e.key === "Escape") { if (open) setOpen(false); else setQ(""); }
  }

  let last = null;
  return (
    <div className="hsearch" ref={box} role="search">
      <Search size={16} className="hs-icon" aria-hidden />
      <input ref={input} value={q} maxLength={40} placeholder="Search…  (Ctrl K)" aria-label="Search SkillSetra"
        role="combobox" aria-expanded={open} aria-controls="hs-list" aria-autocomplete="list"
        aria-activedescendant={open && items[active] ? `hs-${active}` : undefined}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} />
      {q && <button type="button" className="hs-clear" aria-label="Clear search" onClick={() => { setQ(""); input.current?.focus(); }}><X size={14} aria-hidden /></button>}
      {open && (
        <ul id="hs-list" role="listbox" className="hs-list" aria-label="Search results">
          {items.length === 0 && <li className="hs-empty">No matches</li>}
          {items.map((it, n) => {
            const header = it.group !== last;
            last = it.group;
            return (
              <Fragment key={n}>
                {header && <li role="presentation" className="hs-group">{it.group}</li>}
                <li id={`hs-${n}`} role="option" aria-selected={n === active} className="hs-opt"
                    onMouseDown={(e) => { e.preventDefault(); go(it); }} onMouseEnter={() => setActive(n)}>
                  <span>{it.label}</span><small>{it.hint}</small>
                </li>
              </Fragment>
            );
          })}
        </ul>)}
    </div>
  );
}