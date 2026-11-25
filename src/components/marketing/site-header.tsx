"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

import { BrandLogo } from "./brand-logo";
import { HeroLink } from "./hero-link";

const marketingNav = [
  { title: "Platform", href: "#platform" },
  { title: "Grading", href: "#grading" },
  { title: "Modules", href: "#modules" },
  { title: "Who it's for", href: "#personas" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-shell/90 sticky top-0 z-50 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="rounded-full">
          <BrandLogo />
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:bg-soft rounded-full px-4 py-2 text-[15px] font-medium transition-colors"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="bg-soft grid size-11 place-items-center rounded-full">
            <ThemeToggle />
          </div>
          <Link
            href="/login"
            className="border-ink hover:bg-soft hidden h-11 items-center rounded-full border-[1.5px] px-5 text-sm font-semibold transition-colors sm:flex"
          >
            Sign in
          </Link>
          <HeroLink href="/dashboard" className="hidden sm:inline-flex">
            Open the app
          </HeroLink>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="bg-soft grid size-11 place-items-center rounded-full lg:hidden"
          >
            {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </button>
        </div>
      </div>

      <div className={cn("px-4 pb-4 lg:hidden", open ? "block" : "hidden")}>
        <nav aria-label="Sections" className="bg-main flex flex-col gap-1 rounded-3xl p-3">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="hover:bg-card rounded-full px-4 py-3 text-[15px] font-medium"
            >
              {item.title}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 sm:hidden">
            <Link
              href="/login"
              className="border-ink flex h-11 items-center justify-center rounded-full border-[1.5px] text-sm font-semibold"
            >
              Sign in
            </Link>
            <HeroLink href="/dashboard" className="justify-center">
              Open the app
            </HeroLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
