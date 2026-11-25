import Link from "next/link";
import {
  Building2,
  Check,
  Coins,
  Search,
  Sparkles,
  Star,
  Target,
  TriangleAlert,
} from "lucide-react";

import { EntityAvatar } from "@/components/shared/entity-avatar";
import { KpiCard } from "@/components/shared/kpi-card";
import { GradeBadge, type Grade } from "@/components/shared/pills";

import { HeroLink } from "./hero-link";

export function HeroSection() {
  return (
    <section className="bg-main md:rounded-panel overflow-hidden rounded-3xl px-4 pt-10 md:px-10 md:pt-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <span className="bg-card inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-[13px] font-semibold">
          <span className="bg-ink text-shell grid size-6 place-items-center rounded-full">
            <Sparkles className="size-3.5" />
          </span>
          Explainable grading, built in
        </span>
        <h1 className="text-[40px] leading-[1.05] font-bold tracking-tight text-balance md:text-[64px]">
          Every account, deal and contract in one calm place
        </h1>
        <p className="text-mute max-w-2xl text-[17px] text-pretty md:text-lg">
          BalloCRM is the commercial operating system for B2B teams: pipeline, accounts, engagement
          and contracts in one record, with deal grades you can explain and cross-sell ideas you can
          act on.
        </p>
        <div className="mt-1 flex flex-col items-center gap-3 sm:flex-row">
          <HeroLink href="/dashboard" className="h-[52px] text-[15px]">
            Open the app
          </HeroLink>
          <Link
            href="#platform"
            className="bg-card hover:bg-soft flex h-[52px] items-center rounded-full px-[26px] text-[15px] font-semibold transition-colors"
          >
            See how it works
          </Link>
        </div>
      </div>

      <ProductPreview />
    </section>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Won vs weighted pipeline, as % of the chart height. Fixed numbers: this renders on the server.
const BARS: [number, number][] = [
  [40, 24],
  [95, 44],
  [44, 64],
  [62, 70],
  [58, 47],
  [95, 62],
  [44, 24],
  [58, 82],
  [40, 24],
  [95, 44],
  [44, 64],
  [62, 70],
];

const ACTIONS: { name: string; deal: string; action: string; grade: Grade; score: number }[] = [
  {
    name: "Kariba Power Co.",
    deal: "Fibre backbone",
    action: "Book exec meeting · Negotiate",
    grade: "GOLD",
    score: 58,
  },
  {
    name: "Nyali Mobile",
    deal: "Tower lease",
    action: "Send revised quote · Propose",
    grade: "SILVER",
    score: 47,
  },
  {
    name: "Mutual Bank of Lusaka",
    deal: "SD-WAN",
    action: "Identify champion · Discover",
    grade: "BRONZE",
    score: 28,
  },
  {
    name: "Zedcell",
    deal: "Colocation renewal",
    action: "Confirm budget · Negotiate",
    grade: "PLATINUM",
    score: 81,
  },
];

/** A static slice of the dashboard, built from the app's own components. */
function ProductPreview() {
  return (
    <div
      aria-label="Preview of the BalloCRM dashboard"
      role="img"
      className="bg-shell mx-auto mt-12 max-w-[1180px] rounded-t-[28px] p-3 pb-0 md:mt-16 md:p-4 md:pb-0"
    >
      <div className="bg-main rounded-t-[22px] p-3 md:p-5" aria-hidden>
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-card text-mute flex h-11 flex-1 items-center gap-2.5 rounded-2xl px-3.5 text-sm md:max-w-[420px]">
            <Search className="size-4" />
            <span className="truncate">Search accounts, leads, opportunities…</span>
          </div>
          <span className="bg-ink text-shell ml-auto hidden h-11 items-center rounded-full px-5 text-sm font-semibold sm:flex">
            Quick add
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
          <KpiCard icon={Target} value="142" label="Open opportunities" />
          <KpiCard icon={Building2} value="68" label="Active accounts" />
          <KpiCard icon={Coins} value="K48.2M" label="Weighted pipeline" highlight />
          <div className="hidden sm:contents">
            <KpiCard icon={Check} value="K12.6M" label="Won this quarter" />
          </div>
          <div className="hidden lg:contents">
            <KpiCard icon={Star} value="23" label="Gold & Platinum" />
            <KpiCard icon={TriangleAlert} value="9" label="At-risk deals" />
          </div>
        </div>

        <div className="mt-2.5 grid gap-2.5 md:mt-4 md:gap-4 lg:grid-cols-[1.25fr_1fr]">
          <div className="bg-card rounded-card p-[18px] md:p-[26px]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-semibold md:text-[22px]">Revenue</p>
              <div className="text-mute flex gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="bg-ink size-2 rounded-full" />
                  Won
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="bg-bar2 size-2 rounded-full" />
                  Pipeline
                </span>
              </div>
            </div>
            <div className="border-line mt-5 flex h-40 items-end gap-1 border-b border-dashed md:h-48 md:gap-2">
              {BARS.map(([won, pipe], i) => (
                <div
                  key={MONTHS[i]}
                  className="flex h-full flex-1 items-end justify-center gap-[3px]"
                >
                  <span
                    className="bg-ink w-1.5 rounded-full md:w-2"
                    style={{ height: `${won}%` }}
                  />
                  <span
                    className="bg-bar2 w-1.5 rounded-full md:w-2"
                    style={{ height: `${pipe}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="text-mute mt-2 flex gap-1 text-[10px] md:gap-2 md:text-xs">
              {MONTHS.map((m) => (
                <span key={m} className="flex-1 text-center">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-card p-[18px] md:p-[26px]">
            <p className="mb-4 text-lg font-semibold md:text-[22px]">Next best actions</p>
            <ul className="flex flex-col gap-4">
              {ACTIONS.map((a) => (
                <li key={a.name} className="flex items-center gap-3">
                  <EntityAvatar name={a.name} />
                  <span className="min-w-0 flex-1 text-left leading-tight">
                    <span className="block truncate text-[15px] font-semibold">
                      {a.name} - {a.deal}
                    </span>
                    <span className="text-mute block truncate text-[13px]">{a.action}</span>
                  </span>
                  <GradeBadge grade={a.grade} score={a.score} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
