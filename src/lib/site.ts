export const siteConfig = {
  name: "BalloCRM",
  tagline: "Commercial Operations & B2B CRM Intelligence Platform",
  description:
    "One commercial operating system: every account, deal, contract and engagement in one place, with explainable grading, a Vertical Sales Index and cross-sell recommendations.",
} as const;

export type NavItem = {
  title: string;
  href: string;
  /** Kit epic(s) that build this module - see docs/04-delivery/03-tickets.csv. */
  epic: string;
  /** Primary spec for the module, relative to the repo root. */
  spec: string;
  summary: string;
};

/**
 * Module names mirror the challenge's own vocabulary on purpose
 * (docs/00-executive/02-judging-strategy-platinum.md, tactic 1).
 */
export const primaryNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    epic: "E6",
    spec: "docs/01-product/03-vsi-and-dashboards-spec.md",
    summary: "Executive KPIs, forecast, VSI table, top accounts and the insights feed.",
  },
  {
    title: "Pipeline",
    href: "/pipeline",
    epic: "E1, E4",
    spec: "docs/03-design/02-wireframes.md",
    summary: "Leads, opportunity Kanban with weighted totals, score drawer and Focus List.",
  },
  {
    title: "Accounts",
    href: "/accounts",
    epic: "E2",
    spec: "docs/03-design/02-wireframes.md",
    summary: "Account list and Account 360: contacts, services, timeline, contracts.",
  },
  {
    title: "ABM",
    href: "/abm",
    epic: "E3",
    spec: "docs/03-design/02-wireframes.md",
    summary: "Strategic accounts, buying committee map, account plan and playbook.",
  },
  {
    title: "VSI",
    href: "/vsi",
    epic: "E5, E6",
    spec: "docs/01-product/03-vsi-and-dashboards-spec.md",
    summary: "Vertical Sales Index: sectors ranked by ARR and growth, drilldown, whitespace.",
  },
  {
    title: "Engagement",
    href: "/engagement",
    epic: "E3",
    spec: "docs/03-design/02-wireframes.md",
    summary: "DC tours, demos and events, with engagement analytics.",
  },
  {
    title: "Contracts",
    href: "/contracts",
    epic: "E7",
    spec: "docs/03-design/02-wireframes.md",
    summary: "Templates, PDF generation, e-signature and renewals.",
  },
  {
    title: "Insights",
    href: "/insights",
    epic: "E5",
    spec: "docs/01-product/04-cross-sell-recommender-spec.md",
    summary: "Automated insights feed and cross-sell recommendations.",
  },
  {
    title: "CIMS / Admin",
    href: "/admin",
    epic: "E8, E9",
    spec: "docs/02-architecture/05-security-rbac-audit.md",
    summary: "Users and roles, audit log, API keys, integrations log, data protection.",
  },
];
