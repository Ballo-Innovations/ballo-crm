import { BarChart3, Building2, FileText, LayoutDashboard, Target, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Building2, label: "Accounts" },
  { icon: Users, label: "Contacts" },
  { icon: Target, label: "Opportunities" },
  { icon: FileText, label: "Contracts" },
  { icon: BarChart3, label: "Analytics" },
];

const kpis = [
  { label: "Pipeline value", value: "$4.82M", delta: "+12.4%" },
  { label: "Win rate", value: "31.6%", delta: "+2.1%" },
  { label: "At-risk accounts", value: "7", delta: "−3" },
];

// Deterministic pipeline stages (no randomness - server-rendered).
const pipeline = [
  { stage: "Prospect", height: 40 },
  { stage: "Qualify", height: 66 },
  { stage: "Propose", height: 52 },
  { stage: "Negotiate", height: 78 },
  { stage: "Commit", height: 34 },
];

const accounts = [
  { name: "Northwind Logistics", health: "Healthy", tone: "good", score: 92 },
  { name: "Meridian Foods", health: "Watch", tone: "warn", score: 61 },
  { name: "Atlas Manufacturing", health: "At risk", tone: "bad", score: 38 },
];

export function DashboardPreview() {
  return (
    <div className="relative w-full max-w-5xl">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(50%_60%_at_30%_0%,var(--brand-muted),transparent_70%)] blur-2xl"
      />
      <div className="bg-card ring-border/70 overflow-hidden rounded-xl border shadow-2xl ring-1">
        {/* Window chrome */}
        <div className="bg-muted/50 flex items-center gap-2 border-b px-4 py-3">
          <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
          <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
          <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
          <div className="bg-background text-muted-foreground mx-auto hidden rounded-md px-3 py-1 text-xs sm:block">
            app.ballocrm.io/dashboard
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
          {/* Sidebar */}
          <aside className="hidden flex-col gap-1 border-r p-3 sm:flex">
            {sidebarItems.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </div>
            ))}
          </aside>

          {/* Main panel */}
          <div className="flex flex-col gap-4 p-4 text-left sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Commercial overview</p>
                <p className="text-muted-foreground text-xs">Q3 · All verticals</p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Live
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="bg-background rounded-lg border p-3">
                  <p className="text-muted-foreground truncate text-[11px]">{kpi.label}</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight">{kpi.value}</p>
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {kpi.delta}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
              {/* Pipeline chart */}
              <div className="bg-background rounded-lg border p-3">
                <p className="text-xs font-medium">Pipeline by stage</p>
                <div className="mt-3 flex h-28 items-end gap-2">
                  {pipeline.map((p) => (
                    <div key={p.stage} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className="from-primary to-brand w-full rounded-t-sm bg-gradient-to-t"
                        style={{ height: `${p.height}%` }}
                      />
                      <span className="text-muted-foreground truncate text-[9px]">{p.stage}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account health */}
              <div className="bg-background rounded-lg border p-3">
                <p className="text-xs font-medium">Account health</p>
                <div className="mt-3 flex flex-col gap-2.5">
                  {accounts.map((a) => (
                    <div key={a.name} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          a.tone === "good" && "bg-emerald-500",
                          a.tone === "warn" && "bg-amber-500",
                          a.tone === "bad" && "bg-red-500",
                        )}
                      />
                      <span className="truncate text-xs">{a.name}</span>
                      <span className="text-muted-foreground ml-auto text-[11px]">{a.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
