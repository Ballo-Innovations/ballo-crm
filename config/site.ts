export const siteConfig = {
  name: "BalloCRM",
  tagline: "Commercial Operations & B2B CRM Intelligence Platform",
  description:
    "Centralized commercial intelligence for enterprise accounts, pipelines, contracts, and AI-driven cross-sell/upsell signals.",
} as const;

export type NavItem = {
  title: string;
  href: string;
  icon?: string;
};

export const primaryNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Accounts", href: "/accounts" },
  { title: "Contacts", href: "/contacts" },
  { title: "Opportunities", href: "/opportunities" },
  { title: "Contracts", href: "/contracts" },
  { title: "Campaigns", href: "/campaigns" },
  { title: "Analytics", href: "/analytics" },
  { title: "Settings", href: "/settings" },
];
