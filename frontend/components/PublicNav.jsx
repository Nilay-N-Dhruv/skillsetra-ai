"use client";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function PublicNav() {
  const { user, loading } = useAuth();
  return (
    <header className="topbar"><div className="container">
      <Link href="/" aria-label="SkillSetra home"><Logo /></Link>
      <nav aria-label="Public navigation">
        <a href="#how">How it works</a><a href="#features">Features</a><a href="#privacy">Privacy</a>
        <ThemeToggle />
        {!loading && user
          ? <Link className="btn primary" href="/dashboard">Open dashboard</Link>
          : <><Link className="btn" href="/login">Sign in</Link><Link className="btn primary" href="/signup">Get started</Link></>}
      </nav>
    </div></header>
  );
}