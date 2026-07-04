import Link from "next/link";

import { siteConfig } from "@/config/site";

import { BrandLogo } from "./brand-logo";

const footerNav: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Platform",
    links: [
      { label: "Accounts & contacts", href: "#modules" },
      { label: "Pipelines", href: "#modules" },
      { label: "Contracts", href: "#modules" },
      { label: "Analytics", href: "#modules" },
    ],
  },
  {
    heading: "Intelligence",
    links: [
      { label: "Brutus AI", href: "#brutus-ai" },
      { label: "Account health", href: "#platform" },
      { label: "Cross-sell signals", href: "#platform" },
      { label: "BalloAds integration", href: "#platform" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Vision", href: "#platform" },
      { label: "Who it's for", href: "#personas" },
      { label: "Sign in", href: "/login" },
      { label: "Get started", href: "/dashboard" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <BrandLogo />
          <p className="text-muted-foreground max-w-xs text-sm">{siteConfig.tagline}.</p>
        </div>

        {footerNav.map((group) => (
          <div key={group.heading} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">{group.heading}</h3>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs sm:flex-row">
          <p>
            © 2026 {siteConfig.name}. Built for the iHub Innovation Hackathon - Commercial
            Operations Automation.
          </p>
          <p>A native BalloAds &amp; Brutus AI platform.</p>
        </div>
      </div>
    </footer>
  );
}
