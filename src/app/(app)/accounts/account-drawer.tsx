"use client";

import { DockedDrawer } from "@/components/shared/docked-drawer";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { EmptyState, ErrorState, GhostRows } from "@/components/shared/page-states";
import { Pill } from "@/components/shared/pills";
import { formatZMW } from "@/lib/money";
import { formatHealth } from "@/modules/accounts/service";
import {
  LIFECYCLE_LABEL,
  SECTOR_LABEL,
  TIER_LABEL,
  type AccountOverview,
} from "@/modules/accounts/types";

/** What the page loaded for `?open=`: the account, null (missing or not visible), or an error. */
export type OverviewState = AccountOverview | null | "error";

/**
 * Account 360 in the docked drawer (E2-02): header (name, sector, tier, lifecycle, owner) and
 * the Overview tab. The other tabs arrive with their tickets (E2-03 to E2-05 and on).
 */
export function AccountDrawer({
  open,
  loading,
  overview,
  onClose,
  onRetry,
}: {
  open: boolean;
  /** Another account was picked and is on its way. */
  loading: boolean;
  overview: OverviewState;
  onClose: () => void;
  onRetry: () => void;
}) {
  const account = overview && overview !== "error" && !loading ? overview : null;

  return (
    <DockedDrawer
      open={open}
      onClose={onClose}
      title={account?.name ?? "Account"}
      subtitle={
        account ? `${SECTOR_LABEL[account.sector]} · ${TIER_LABEL[account.tier]}` : undefined
      }
      avatar={account && <EntityAvatar name={account.name} />}
      tabs={
        account && (
          <div role="tablist" aria-label="Account sections" className="flex gap-1.5">
            <button
              type="button"
              role="tab"
              aria-selected="true"
              className="bg-ink text-shell h-9 rounded-full px-4 text-sm font-semibold"
            >
              Overview
            </button>
          </div>
        )
      }
    >
      {loading ? (
        <GhostRows count={4} />
      ) : overview === "error" ? (
        <ErrorState
          title="This account didn't load"
          text="Something went wrong on our side. Try again in a moment."
          onRetry={onRetry}
        />
      ) : !account ? (
        <EmptyState
          title="Account not available"
          text="It may have been removed, or it belongs to another team."
          actions={null}
        />
      ) : (
        <div role="tabpanel" aria-label="Overview" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Pill strong={account.lifecycle === "AT_RISK"}>
              {LIFECYCLE_LABEL[account.lifecycle]}
            </Pill>
            <span className="text-mute">Owner</span>
            <span className="flex items-center gap-2 font-medium">
              <EntityAvatar name={account.owner} size={24} />
              {account.owner}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-2.5">
            <Stat label="ARR" testId="overview-arr" value={formatZMW(account.arr)} />
            <Stat
              label={`Open pipeline · ${account.openDeals} ${account.openDeals === 1 ? "deal" : "deals"}`}
              testId="overview-pipeline"
              value={formatZMW(account.pipeline)}
            />
            <Stat
              label="Weighted pipeline"
              testId="overview-weighted"
              value={formatZMW(account.weightedPipeline)}
            />
            <Stat
              label="Engagement score"
              testId="overview-engagement"
              value={`${account.engagementScore} / 100`}
            />
            <Stat
              label="Health score"
              testId="overview-health"
              value={formatHealth(account.healthScore)}
            />
            {account.city && <Stat label="City" value={account.city} />}
          </dl>
        </div>
      )}
    </DockedDrawer>
  );
}

function Stat({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="bg-soft rounded-2xl px-3.5 py-3">
      <dt className="text-mute text-xs">{label}</dt>
      <dd data-testid={testId} className="mt-0.5 text-lg font-bold tabular-nums">
        {value}
      </dd>
    </div>
  );
}
