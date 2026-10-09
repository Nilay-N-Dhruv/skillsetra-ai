"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

export default function NotificationBell() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let on = true;
    const load = () => api("/notifications").then((d) => on && setN(d.unread)).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => { on = false; clearInterval(t); };
  }, []);
  return (
    <Link className="btn icon" href="/notifications" aria-label={`Notifications, ${n} unread`}>
      <Bell size={18} aria-hidden />{n > 0 && <span className="dotbadge">{n > 9 ? "9+" : n}</span>}
    </Link>
  );
}