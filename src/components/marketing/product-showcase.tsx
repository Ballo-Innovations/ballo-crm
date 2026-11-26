"use client";

import { useState } from "react";
import { Coins, Layers, Search, Sparkles, Target, TriangleAlert } from "lucide-react";

import { EntityAvatar } from "@/components/shared/entity-avatar";
import { KpiCard } from "@/components/shared/kpi-card";
import { GradeBadge, Pill, type Grade } from "@/components/shared/pills";
import { NAV_ICONS } from "@/components/shell/nav-icons";
import { formatZMWCompact } from "@/lib/money";
import { primaryNav } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * The landing page's product preview: a static slice of the app in its own components,
 * with tabs to switch screens (design system, "Landing page"). Sample companies are fictional.
 */

const SCREENS = ["Dashboard", "Pipeline", "Accounts"] as const;
type Screen = (typeof SCREENS)[number];

const K = (kwacha: number) => formatZMWCompact(kwacha * 100);

export function ProductShowcase() {
  const [screen, setScreen] = useState<Screen>("Dashboard");

  return (
    <div className="bg-main md:rounded-t-panel relative mx-auto mt-14 max-w-[1180px] rounded-t-3xl px-2.5 pt-5 md:mt-16 md:px-10 md:pt-10">
      <div
        role="tablist"
        aria-label="Product preview"
        className="mb-5 flex flex-wrap justify-center gap-1.5 md:mb-7"
      >
        {SCREENS.map((s) => {
          const Icon = NAV_ICONS[`/${s.toLowerCase()}`];
          const on = s === screen;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              id={`preview-tab-${s}`}
              aria-selected={on}
              aria-controls="preview-panel"
              onClick={() => setScreen(s)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
                on ? "bg-ink text-shell" : "bg-card text-mute hover:text-ink",
              )}
            >
              {Icon && <Icon className="size-4" aria-hidden />}
              {s}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="preview-panel"
        aria-labelledby={`preview-tab-${screen}`}
        className="bg-shell grid gap-3 rounded-t-[26px] p-2 pb-0 text-left shadow-[0_0_0_1px_var(--line)] md:grid-cols-[196px_1fr] md:p-3 md:pb-0"
      >
        <PreviewSidebar active={screen} />
        <div className="bg-main flex min-w-0 flex-col gap-3 rounded-t-[22px] p-3 md:p-5">
          {screen === "Dashboard" && <DashboardScreen />}
          {screen === "Pipeline" && <PipelineScreen />}
          {screen === "Accounts" && <AccountsScreen />}
        </div>
      </div>
    </div>
  );
}

function PreviewSidebar({ active }: { active: Screen }) {
  return (
    <div aria-hidden className="hidden flex-col gap-0.5 px-1.5 py-2.5 md:flex">
      {primaryNav.map((item) => {
        const Icon = NAV_ICONS[item.href];
        const on = item.title === active;
        return (
          <span
            key={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-full px-3 py-2.5 text-[13px] font-semibold",
              on ? "bg-ink text-shell" : "text-mute",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {item.title}
          </span>
        );
      })}
    </div>
  );
}

function ScreenHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xl font-bold tracking-tight md:text-[22px]">{title}</p>
        <p className="text-mute truncate text-[13px]">{sub}</p>
      </div>
      {right ?? (
        <span className="bg-card text-mute hidden h-10 items-center gap-2 rounded-full px-4 text-[13px] sm:flex">
          <Search className="size-4" aria-hidden />
          Search or ask Brutus
        </span>
      )}
    </div>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-card min-w-0 rounded-[22px] p-4 md:p-[18px]", className)}>
      {children}
    </div>
  );
}

function CardTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-mute text-[13px]">{sub}</p>
    </div>
  );
}

/* ---------- Dashboard ---------- */

const FORECAST = [
  ["Jun", 42],
  ["Jul", 55],
  ["Aug", 48],
  ["Sep", 66],
  ["Oct", 72],
  ["Nov", 88],
  ["Dec", 60],
] as const;

const FOCUS: { name: string; stage: string; grade: Grade; score: number }[] = [
  { name: "Kariba Power Co.", stage: "Negotiate", grade: "PLATINUM", score: 82 },
  { name: "Mutual Bank of Lusaka", stage: "Negotiate", grade: "GOLD", score: 58 },
  { name: "Zedcell Networks", stage: "Propose", grade: "GOLD", score: 66 },
];

function DashboardScreen() {
  return (
    <>
      <ScreenHeader title="Commercial overview" sub="Infratel, November" />
      <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:grid-cols-4">
        <KpiCard icon={Coins} value={K(48_600_000)} label="Open pipeline" highlight />
        <KpiCard icon={Layers} value={K(21_300_000)} label="Weighted pipeline" />
        <KpiCard icon={Target} value="34%" label="Win rate" />
        <KpiCard icon={TriangleAlert} value="6" label="At-risk deals" />
      </div>
      <div className="grid gap-2.5 md:gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle title="Forecast" sub="Committed, K millions" />
          <div className="flex h-36 items-end gap-2 md:h-40">
            {FORECAST.map(([m, v]) => (
              <span
                key={m}
                className={cn(
                  "mx-auto w-full max-w-11 rounded-xl",
                  m === "Nov" ? "bg-ink" : "bg-bar2",
                )}
                style={{ height: `${v}%` }}
              />
            ))}
          </div>
          <div className="text-mute mt-2 flex gap-2 text-[11px] font-semibold">
            {FORECAST.map(([m]) => (
              <span key={m} className="flex-1 text-center">
                {m}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle title="Focus list" sub="Ranked by score" />
          <ul className="flex flex-col gap-3">
            {FOCUS.map((d) => (
              <li key={d.name} className="flex items-center gap-3">
                <EntityAvatar name={d.name} size={32} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-semibold">{d.name}</span>
                  <span className="text-mute block text-xs">{d.stage}</span>
                </span>
                <GradeBadge grade={d.grade} score={d.score} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

/* ---------- Pipeline ---------- */

const PIPELINE: Record<
  string,
  { name: string; product: string; value: number; grade: Grade; score: number }[]
> = {
  Qualify: [
    {
      name: "Kalulu Retail",
      product: "Fleet tracking",
      value: 420_000,
      grade: "BRONZE",
      score: 28,
    },
    {
      name: "Mwezi Fibre",
      product: "Dark fibre lease",
      value: 1_100_000,
      grade: "SILVER",
      score: 41,
    },
  ],
  Discover: [
    {
      name: "Kafue Valley Foods",
      product: "SD-WAN, 14 sites",
      value: 860_000,
      grade: "SILVER",
      score: 44,
    },
    {
      name: "Lusaka Medical Trust",
      product: "Cloud backup",
      value: 310_000,
      grade: "BRONZE",
      score: 31,
    },
  ],
  Propose: [
    {
      name: "Zedcell Networks",
      product: "Tower co-location",
      value: 2_400_000,
      grade: "GOLD",
      score: 66,
    },
    {
      name: "Copperbelt Haulage",
      product: "IoT telematics",
      value: 690_000,
      grade: "SILVER",
      score: 47,
    },
  ],
  Negotiate: [
    {
      name: "Mutual Bank of Lusaka",
      product: "Managed security",
      value: 3_200_000,
      grade: "GOLD",
      score: 58,
    },
    {
      name: "Kariba Power Co.",
      product: "Grid comms backbone",
      value: 5_800_000,
      grade: "PLATINUM",
      score: 82,
    },
  ],
};

function PipelineScreen() {
  return (
    <>
      <ScreenHeader title="Pipeline" sub={`${K(48_600_000)} open · 8 deals shown`} />
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PIPELINE).map(([stage, deals], i) => (
          <div
            key={stage}
            className={cn(
              "bg-card flex min-w-0 flex-col gap-2 rounded-[20px] p-2.5",
              i > 1 && "hidden sm:flex",
            )}
          >
            <p className="flex justify-between px-1.5 pt-1 text-xs font-bold">
              {stage}
              <span className="text-mute">{deals.length}</span>
            </p>
            {deals.map((d) => (
              <div key={d.name} className="bg-soft flex flex-col gap-2 rounded-2xl p-2.5">
                <span className="leading-tight">
                  <span className="block truncate text-[13px] font-semibold">{d.name}</span>
                  <span className="text-mute block truncate text-xs">{d.product}</span>
                </span>
                <span className="flex items-center justify-between gap-2 text-xs font-bold">
                  {K(d.value)}
                  <GradeBadge grade={d.grade} score={d.score} />
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Accounts ---------- */

const COMMITTEE = [
  { name: "Natasha Mwale", role: "Economic buyer" },
  { name: "Joseph Phiri", role: "Champion" },
  { name: "Lombe Tembo", role: "Technical evaluator" },
];

function AccountsScreen() {
  return (
    <>
      <ScreenHeader
        title="Mutual Bank of Lusaka"
        sub="Banking · Key account · Owner: Chanda B."
        right={<Pill strong>Health 82</Pill>}
      />
      <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:grid-cols-4">
        <KpiCard icon={Coins} value={K(7_400_000)} label="Under contract" highlight />
        <KpiCard icon={Target} value="3" label="Open deals" />
        <KpiCard icon={Layers} value="4 of 9" label="Products bought" />
        <KpiCard icon={Sparkles} value="2" label="Cross-sell ideas" />
      </div>
      <div className="grid gap-2.5 md:gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle title="Buying committee" sub="Coverage 0.7" />
          <ul className="flex flex-col gap-3">
            {COMMITTEE.map((c) => (
              <li key={c.name} className="flex items-center gap-3">
                <EntityAvatar name={c.name} size={32} />
                <span className="leading-tight">
                  <span className="block text-sm font-semibold">{c.name}</span>
                  <span className="text-mute block text-xs">{c.role}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle title="Brutus suggests" sub="From the rules, explained" />
          <p className="bg-soft flex gap-3 rounded-2xl p-3.5 text-sm leading-snug">
            <span className="bg-card grid size-8 shrink-0 place-items-center rounded-full">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <span>
              <b className="font-semibold">Cross-sell: SD-WAN.</b> 3 of 4 banks this size bought it
              within a year of managed security.
            </span>
          </p>
        </Card>
      </div>
    </>
  );
}
