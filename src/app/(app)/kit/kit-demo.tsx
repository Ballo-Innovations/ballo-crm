"use client";

import { useState } from "react";
import { Briefcase, Download, Handshake, Plus, Target, Wallet } from "lucide-react";

import { notify } from "@/components/feedback/notify";
import { AppButton } from "@/components/shared/app-button";
import { DataTable, type Column } from "@/components/shared/data-table";
import { DockedDrawer, DockedSplit, useOpenParam } from "@/components/shared/docked-drawer";
import { AvatarStack, EntityAvatar } from "@/components/shared/entity-avatar";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  EmptyState,
  ErrorState,
  GhostRows,
  LoadingVeil,
  NoResults,
} from "@/components/shared/page-states";
import { GradeBadge, Pill, type Grade } from "@/components/shared/pills";
import { formatZMW, formatZMWCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

// Sample data: fictional companies only.
type Deal = {
  id: string;
  name: string;
  account: string;
  stage: string;
  value: number; // ngwee
  grade: Grade;
  score: number;
  owner: string;
};
const DEALS: Deal[] = [
  {
    id: "d1",
    name: "Data-centre colocation",
    account: "Zedcell Networks",
    stage: "Negotiate",
    value: 890_000_000,
    grade: "PLATINUM",
    score: 81,
    owner: "Ruth Phiri",
  },
  {
    id: "d2",
    name: "Fibre backbone Lusaka–Ndola",
    account: "Kariba Power Co.",
    stage: "Negotiate",
    value: 640_000_000,
    grade: "GOLD",
    score: 58,
    owner: "Chanda Mulenga",
  },
  {
    id: "d3",
    name: "Tower lease — 40 sites",
    account: "Nyali Mobile",
    stage: "Propose",
    value: 315_000_000,
    grade: "SILVER",
    score: 47,
    owner: "George M.",
  },
  {
    id: "d4",
    name: "Smart metering backhaul",
    account: "Copperline Power",
    stage: "Qualify",
    value: 260_000_000,
    grade: "SILVER",
    score: 44,
    owner: "Natasha L.",
  },
  {
    id: "d5",
    name: "Cold-chain IoT pilot",
    account: "Kafue Valley Foods",
    stage: "Qualify",
    value: 45_000_000,
    grade: "BRONZE",
    score: 22,
    owner: "Joseph Tembo",
  },
];

const COLUMNS: Column<Deal>[] = [
  { key: "name", header: "Opportunity", cell: (d) => d.name },
  {
    key: "account",
    header: "Account",
    cell: (d) => (
      <span className="flex items-center gap-2.5">
        <EntityAvatar name={d.account} size={24} className="bg-card" />
        {d.account}
      </span>
    ),
  },
  { key: "stage", header: "Stage", cell: (d) => <Pill>{d.stage}</Pill>, lowPriority: true },
  { key: "owner", header: "Owner", cell: (d) => d.owner, lowPriority: true },
  { key: "grade", header: "Grade", cell: (d) => <GradeBadge grade={d.grade} score={d.score} /> },
  { key: "value", header: "Value", cell: (d) => formatZMW(d.value), numeric: true },
];

const STATES = ["Loaded", "Loading", "Empty", "No results", "Error"] as const;

export function KitDemo() {
  const [openId, setOpenId] = useOpenParam();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, setState] = useState<(typeof STATES)[number]>("Loaded");
  const open = DEALS.find((d) => d.id === openId) ?? null;
  const total = DEALS.reduce((s, d) => s + d.value, 0);

  return (
    <>
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">Component kit</h1>
        <p className="text-mute text-[15px]">
          Shared components (E0-08) with sample data. Press ⌘K for the command palette.
        </p>
      </div>

      <Section title="KPI cards">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <KpiCard
            icon={Wallet}
            value={formatZMWCompact(total)}
            label="Open pipeline"
            highlight
            href="/pipeline"
          />
          <KpiCard icon={Briefcase} value="5" label="Open opportunities" />
          <KpiCard icon={Handshake} value="38%" label="Win rate, last 90 days" />
          <KpiCard icon={Target} value="12" label="Target accounts" />
        </div>
      </Section>

      <Section title="Buttons, pills and grades">
        <div className="flex flex-wrap items-center gap-2.5">
          <AppButton variant="hero" icon={Plus}>
            Add lead
          </AppButton>
          <AppButton icon={Download}>Export</AppButton>
          <AppButton variant="secondary">Cancel</AppButton>
          <AppButton variant="tertiary">Filters</AppButton>
          <AppButton variant="ghost">Skip</AppButton>
          <AppButton variant="destructive">Mark as lost</AppButton>
          <AppButton loading>Saving</AppButton>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <GradeBadge grade="PLATINUM" score={81} />
          <GradeBadge grade="GOLD" score={58} />
          <GradeBadge grade="SILVER" score={47} />
          <GradeBadge grade="BRONZE" score={22} />
          <Pill>Negotiate</Pill>
          <Pill strong>Won</Pill>
        </div>
      </Section>

      <Section title="Avatars">
        <div className="flex flex-wrap items-center gap-3">
          <EntityAvatar name="Ruth Phiri" size={24} />
          <EntityAvatar name="Ruth Phiri" size={32} online />
          <EntityAvatar name="Ruth Phiri" online />
          <EntityAvatar name="Kariba Power Co." size={56} />
          <AvatarStack
            names={["Ruth Phiri", "Chanda Mulenga", "George M.", "Natasha L.", "Joseph Tembo"]}
          />
        </div>
      </Section>

      <Section title="Toasts">
        <div className="flex flex-wrap gap-2.5">
          <AppButton variant="tertiary" onClick={() => notify.success("Lead saved")}>
            Success
          </AppButton>
          <AppButton
            variant="tertiary"
            onClick={() => notify.undoable("Moved to Negotiate", () => {})}
          >
            With undo
          </AppButton>
          <AppButton
            variant="tertiary"
            onClick={() =>
              notify.error("Couldn’t save changes", {
                action: { label: "Retry", onClick: () => notify.success("Lead saved") },
              })
            }
          >
            Error
          </AppButton>
          <AppButton
            variant="tertiary"
            onClick={() => {
              const id = notify.loading("Exporting 5 opportunities…");
              setTimeout(
                () =>
                  notify.success("Export ready", {
                    id,
                    action: { label: "Download", onClick: () => {} },
                  }),
                1800,
              );
            }}
          >
            Loading → done
          </AppButton>
        </div>
      </Section>

      <Section title="Data table, drawer and page states">
        <div
          role="tablist"
          aria-label="Page state"
          className="bg-soft mb-4 inline-flex flex-wrap gap-1 rounded-full p-1"
        >
          {STATES.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={state === s}
              onClick={() => setState(s)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                state === s ? "bg-ink text-shell" : "hover:bg-line",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {state === "Loaded" && (
          <DockedSplit>
            <div className="min-w-0 flex-1">
              <DataTable
                label="Opportunities"
                rows={DEALS}
                columns={COLUMNS}
                getRowId={(d) => d.id}
                selected={selected}
                onSelectedChange={setSelected}
                openId={openId}
                onRowClick={(d) => setOpenId(d.id)}
                compact={!!open}
                rowActions={[
                  { label: "Open", onSelect: (d) => setOpenId(d.id) },
                  {
                    label: "Advance stage",
                    onSelect: (d) => notify.undoable(`${d.name} advanced`, () => {}),
                  },
                  {
                    label: "Mark as lost",
                    danger: true,
                    onSelect: () => notify.info("Confirm dialog comes with the pipeline"),
                  },
                ]}
              />
            </div>
            <DockedDrawer
              open={!!open}
              onClose={() => setOpenId(null)}
              title={open?.name ?? ""}
              subtitle={open ? `${open.account} · ${open.stage}` : undefined}
              avatar={open && <EntityAvatar name={open.account} />}
              footer={
                <>
                  <AppButton variant="secondary" size="sm">
                    Edit
                  </AppButton>
                  <AppButton variant="hero" size="sm" icon={Plus}>
                    Advance stage
                  </AppButton>
                </>
              }
            >
              {open && (
                <>
                  <div className="flex items-center gap-2">
                    <GradeBadge grade={open.grade} score={open.score} />
                    <Pill>{open.stage}</Pill>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-mute text-xs">Value</dt>
                      <dd className="font-semibold tabular-nums">{formatZMW(open.value)}</dd>
                    </div>
                    <div>
                      <dt className="text-mute text-xs">Owner</dt>
                      <dd className="flex items-center gap-2">
                        <EntityAvatar name={open.owner} size={24} />
                        {open.owner}
                      </dd>
                    </div>
                  </dl>
                  <GhostRows count={3} />
                </>
              )}
            </DockedDrawer>
          </DockedSplit>
        )}
        {state === "Loading" && (
          <LoadingVeil loading label="Loading opportunities…">
            <GhostRows count={5} />
          </LoadingVeil>
        )}
        {state === "Empty" && (
          <EmptyState
            title="Your opportunities will appear here"
            text="Create one from a qualified lead, or import your pipeline from a spreadsheet."
            actions={
              <>
                <AppButton variant="hero" icon={Plus}>
                  Add opportunity
                </AppButton>
                <AppButton variant="secondary">Import CSV</AppButton>
              </>
            }
          />
        )}
        {state === "No results" && (
          <NoResults
            title="No opportunities match “Kafue Gorge”"
            onClear={() => setState("Loaded")}
          />
        )}
        {state === "Error" && (
          <ErrorState
            title="Couldn’t load opportunities"
            onRetry={() => setState("Loaded")}
            onSupport={() => {}}
          />
        )}
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-card p-[18px] md:p-[26px]">
      <h2 className="mb-5 text-[22px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}
