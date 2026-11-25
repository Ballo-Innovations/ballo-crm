import Link from "next/link";

import { siteConfig } from "@/lib/site";

import { BrandLogo } from "./brand-logo";

const links = [
  { label: "Platform", href: "#platform" },
  { label: "Grading", href: "#grading" },
  { label: "Modules", href: "#modules" },
  { label: "Who it's for", href: "#personas" },
  { label: "Sign in", href: "/login" },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-[1400px] px-4 pt-10 pb-8 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <BrandLogo />
          <p className="text-mute max-w-sm text-sm">{siteConfig.tagline}.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-1">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-mute hover:bg-soft hover:text-ink rounded-full px-3.5 py-2 text-sm transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="text-mute border-line mt-8 border-t pt-6 text-xs">
        © 2026 {siteConfig.name}. Built for the iHub Hackathon 2026.
      </p>
    </footer>
  );
}
