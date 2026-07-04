"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

import { BrandLogo } from "./brand-logo";

const marketingNav = [
  { title: "Platform", href: "#platform" },
  { title: "Modules", href: "#modules" },
  { title: "Brutus AI", href: "#brutus-ai" },
  { title: "Who it's for", href: "#personas" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="focus-visible:ring-ring/50 rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {marketingNav.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.title}</Link>
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">
              Get started
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <div className={cn("border-t md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-4">
          {marketingNav.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className="justify-start"
              onClick={() => setOpen(false)}
            >
              <Link href={item.href}>{item.title}</Link>
            </Button>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/dashboard">
                Get started
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
