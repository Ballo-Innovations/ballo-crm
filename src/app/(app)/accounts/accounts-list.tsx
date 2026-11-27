"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { DataTable, type Column } from "@/components/shared/data-table";
import { DockedSplit } from "@/components/shared/docked-drawer";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { FilterBar, type FilterGroup } from "@/components/shared/filter-bar";
import { EmptyState, LoadingVeil, NoResults } from "@/components/shared/page-states";
import { Pagination } from "@/components/shared/pagination";
import { Pill } from "@/components/shared/pills";
import { formatZMW, formatZMWCompact } from "@/lib/money";
import { listParamsToQuery, toggleSort } from "@/modules/accounts/service";
import {
  LIFECYCLE_LABEL,
  LIFECYCLES,
  SECTOR_LABEL,
  SECTORS,
  TIER_LABEL,
  TIERS,
  type AccountListParams,
  type AccountListResult,
  type AccountRow,
  type AccountSortKey,
} from "@/modules/accounts/types";

import { AccountDrawer, type OverviewState } from "./account-drawer";

const GROUPS: FilterGroup[] = [
  {
    key: "sector",
    label: "Sector",
    options: SECTORS.map((v) => ({ value: v, label: SECTOR_LABEL[v] })),
  },
  { key: "tier", label: "Tier", options: TIERS.map((v) => ({ value: v, label: TIER_LABEL[v] })) },
  {
    key: "lifecycle",
    label: "Lifecycle",
    options: LIFECYCLES.map((v) => ({ value: v, label: LIFECYCLE_LABEL[v] })),
  },
];

/** Phones have no column headers, so sorting is a menu there. */
const PHONE_SORTS: { value: string; label: string }[] = [
  { value: "-arr", label: "ARR, highest first" },
  { value: "arr", label: "ARR, lowest first" },
  { value: "name", label: "Name, A to Z" },
  { value: "-name", label: "Name, Z to A" },
  { value: "-pipeline", label: "Open pipeline, highest first" },
  { value: "-engagement", label: "Engagement, highest first" },
  { value: "tier", label: "Tier" },
  { value: "lifecycle", label: "Lifecycle" },
];

function Money({ ngwee }: { ngwee: number }) {
  return <span title={formatZMW(ngwee)}>{formatZMWCompact(ngwee)}</span>;
}

const COLUMNS: Column<AccountRow>[] = [
  {
    key: "name",
    header: "Account",
    sortKey: "name",
    cell: (r) => (
      <span className="flex min-w-0 items-center gap-3">
        <EntityAvatar name={r.name} size={32} className="hidden md:inline-grid" />
        <span className="min-w-0 leading-tight">
          <span data-account-name className="block truncate">
            {r.name}
          </span>
          {r.city && <span className="text-mute block text-xs font-normal">{r.city}</span>}
        </span>
      </span>
    ),
  },
  { key: "sector", header: "Sector", sortKey: "sector", cell: (r) => SECTOR_LABEL[r.sector] },
  { key: "tier", header: "Tier", sortKey: "tier", cell: (r) => TIER_LABEL[r.tier] },
  {
    key: "lifecycle",
    header: "Lifecycle",
    sortKey: "lifecycle",
    cell: (r) => <Pill strong={r.lifecycle === "AT_RISK"}>{LIFECYCLE_LABEL[r.lifecycle]}</Pill>,
  },
  { key: "owner", header: "Owner", sortKey: "owner", lowPriority: true, cell: (r) => r.owner },
  {
    key: "arr",
    header: "ARR",
    sortKey: "arr",
    numeric: true,
    cell: (r) => <Money ngwee={r.arr} />,
  },
  {
    key: "pipeline",
    header: "Open pipeline",
    sortKey: "pipeline",
    numeric: true,
    cell: (r) => <Money ngwee={r.pipeline} />,
  },
  {
    key: "engagement",
    header: "Engagement",
    sortKey: "engagement",
    numeric: true,
    lowPriority: true,
    cell: (r) => r.engagementScore,
  },
];

/**
 * The accounts list (E2-01) with the account drawer (E2-02). All state lives in the URL;
 * the server filters, sorts, pages and loads the open account.
 */
export function AccountsList({
  params,
  result,
  openId,
  overview,
}: {
  params: AccountListParams;
  result: AccountListResult;
  openId: string | null;
  overview: OverviewState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [drawerPending, startDrawer] = useTransition();
  // What the user just asked for, before the server answers: quick clicks build on each other
  // instead of on the URL from before the first one landed.
  const [view, setView] = useOptimistic(params);
  const [openView, setOpenView] = useOptimistic(openId);

  function href(list: AccountListParams, open: string | null) {
    const query = listParamsToQuery(list);
    if (open) query.open = open;
    const qs = new URLSearchParams(query).toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function go(next: Partial<AccountListParams>, keepPage = false) {
    const merged = { ...view, ...next, page: keepPage ? (next.page ?? view.page) : 1 };
    startTransition(() => {
      setView(merged);
      router.replace(href(merged, openView), { scroll: false });
    });
  }

  function setOpen(id: string | null) {
    startDrawer(() => {
      setOpenView(id);
      router.replace(href(view, id), { scroll: false });
    });
  }

  const clearAll = () => go({ q: "", sector: [], tier: [], lifecycle: [] });

  return (
    <DockedSplit>
      <section className="bg-card rounded-card min-w-0 flex-1 p-4 md:p-[26px]">
        {result.grandTotal === 0 ? (
          <EmptyState
            title="No accounts yet"
            text="Accounts you or your team own will show here."
            actions={null}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <FilterBar
              searchLabel="Search accounts"
              searchPlaceholder="Search accounts or contacts"
              search={view.q}
              onSearchChange={(q) => go({ q })}
              groups={GROUPS}
              selected={{ sector: view.sector, tier: view.tier, lifecycle: view.lifecycle }}
              onSelectedChange={(key, values) => go({ [key]: values })}
              shown={result.total}
              total={result.grandTotal}
              onClearAll={clearAll}
            >
              <label className="bg-soft flex h-10 items-center gap-1.5 rounded-full pr-2 pl-3.5 text-sm md:hidden">
                <span className="text-mute">Sort</span>
                <select
                  aria-label="Sort by"
                  value={`${view.dir === "desc" ? "-" : ""}${view.sort}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    const desc = v.startsWith("-");
                    go({
                      sort: (desc ? v.slice(1) : v) as AccountSortKey,
                      dir: desc ? "desc" : "asc",
                    });
                  }}
                  className="max-w-[44vw] truncate bg-transparent font-semibold outline-none"
                >
                  {PHONE_SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </FilterBar>

            <LoadingVeil loading={pending} label="Loading accounts">
              {result.total === 0 ? (
                <NoResults
                  title="No accounts match"
                  text={
                    params.q
                      ? `Nothing matches "${params.q}" with these filters. Check the spelling or try a company or contact name.`
                      : "No account matches these filters."
                  }
                  onClear={clearAll}
                />
              ) : (
                <DataTable
                  label="Accounts"
                  rows={result.rows}
                  columns={COLUMNS}
                  getRowId={(r) => r.id}
                  openId={openView}
                  onRowClick={(r) => setOpen(r.id)}
                  compact={!!openView}
                  sort={{ key: view.sort, dir: view.dir }}
                  onSortChange={(key) => go(toggleSort(view, key as AccountSortKey))}
                />
              )}
            </LoadingVeil>

            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              onPageChange={(page) => go({ page }, true)}
            />
          </div>
        )}
      </section>

      <AccountDrawer
        open={!!openView}
        loading={drawerPending && openView !== openId}
        overview={overview}
        onClose={() => setOpen(null)}
        onRetry={() => router.refresh()}
      />
    </DockedSplit>
  );
}
