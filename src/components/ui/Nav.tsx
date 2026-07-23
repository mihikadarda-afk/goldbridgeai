"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { ButtonLink } from "./Button";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#inspiration", label: "Inspiration" },
  { href: "/analyze", label: "Analysis" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "no-print sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-navy-100/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-navy-950/70"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="GoldBridge AI home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-charcoal-500 transition hover:text-navy-900 dark:text-navy-200 dark:hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ButtonLink href="/analyze" variant="gold" size="sm" className="hidden sm:inline-flex">
            Start Analysis
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
